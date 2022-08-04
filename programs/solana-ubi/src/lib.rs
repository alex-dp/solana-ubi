use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::UnixTimestamp;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{self, Mint, MintTo, TokenAccount};

const MINTER: &str = "minter";
const TRUST_COEFF: u8 = 0;

declare_id!("EcFTDXxknt3vRBi1pVZYN7SjZLcbHjJRAmCmjZ7Js3fd");

//mint 4jzEiVCdX5DbcadqChrrvWaYJT7YHGy3cnH4peN3fc54
//tokacc HfNY5k4T4xQVeYASUvDZE12MRyCj4hqGNJ6yuZGPshAx
//pda Bd4vag5JXn2RrGFw8VySP93QYouw5J8D3f1KCy3iUXRN

#[program]
pub mod ido_pool {
    use super::*;

    pub fn mint_token(
        ctx: Context<MintUBI>
    ) -> Result<u8> {
        let now_ts = Clock::get().unwrap().unix_timestamp;
        if !ctx.accounts.ubi_info.trusted {
            Err(0)
        } else if now_ts < ctx.accounts.ubi_info.last_issuance + 23 * 60 * 60 {
            Err(1)
        } else {
            // approx rate of 10 tok per day (9 decimal places)
            let amount: u64 = (115_740 * (now_ts - ctx.accounts.ubi_info.last_issuance)) as u64;
            // Mint Redeemable to user Redeemable account.
            let seeds = &[
                MINTER.as_bytes(),
                &[255]//&[BUMP]
            ];
            let signer = &[&seeds[..]];
            let cpi_accounts = MintTo {
                mint: ctx.accounts.redeemable_mint.to_account_info(),
                to: ctx.accounts.user_redeemable.to_account_info(),
                authority: ctx.accounts.pool_signer.clone(),
            };
            let cpi_program = ctx.accounts.token_program.clone();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
            token::mint_to(cpi_ctx, amount)?;
            ctx.accounts.ubi_info.last_issuance = now_ts;
            Ok(Ok(0))
        }.expect("")
    }

    // TODO user can't trust themselves
    pub fn trust(ctx: Context<TrustUser>) -> Result<u8> {
        let now_ts: UnixTimestamp = Clock::get().unwrap().unix_timestamp;
        if ctx.accounts.trustee_ubi_info.trusted {
            Err(0)
        } else if ctx.accounts.trustee_ubi_info.trusters.contains(ctx.accounts.truster_authority.key) {
            Err(1)
        } else if now_ts < ctx.accounts.truster_ubi_info.last_trust_given + 24 * 60 * 60 {
            Err(2)
        } else {
            ctx.accounts.trustee_ubi_info.trusters.push(*ctx.accounts.truster_authority.key);

            if ctx.accounts.trustee_ubi_info.trusters.len() >= TRUST_COEFF as usize {
                ctx.accounts.trustee_ubi_info.trusted = true;
            }
            ctx.accounts.truster_ubi_info.last_trust_given = now_ts;
            Ok(Ok(0))
        }.expect("")
    }

    pub fn initialize(ctx: Context<Initialize>) -> Result<u8> {
        let now_ts: UnixTimestamp = Clock::get().unwrap().unix_timestamp;
        let acc = &mut ctx.accounts.ubi_info;

        acc.trusters = Vec::new();
        acc.last_trust_given = now_ts - 24 * 60 * 60;
        acc.trusted = true; //TODO change to false for production
        acc.last_issuance = now_ts;
        acc.bump = 255; //TODO check this

        Ok(0)
    }
}

#[derive(Accounts)]
pub struct MintUBI<'info> {
    /// CHECK: x
    #[account(seeds = [MINTER.as_bytes()], bump)]
    pool_signer: AccountInfo<'info>,
    #[account(mut, constraint = redeemable_mint.mint_authority == COption::Some(* pool_signer.key))]
    pub redeemable_mint: Account<'info, Mint>,
    /// CHECK: x
    #[account(signer, mut)]
    pub user_authority: AccountInfo<'info>,
    #[account(mut)]
    pub user_redeemable: Account<'info, TokenAccount>,
    // is program account. TODO SET SEEDS!
    #[account(mut, seeds = ["ubi_info".as_bytes()], bump)]
    pub ubi_info: Account<'info, UBIInfo>,
    /// CHECK: x
    #[account(constraint = token_program.key == & token::ID)]
    pub token_program: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TrustUser<'info> {
    #[account(mut)]
    pub trustee_ubi_info: Account<'info, UBIInfo>,
    #[account(mut)]
    pub truster_ubi_info: Account<'info, UBIInfo>,
    /// CHECK: x
    #[account(signer, mut)]
    pub truster_authority: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user_authority, space = 8 + UBIInfo::MAX_SIZE, seeds = ["ubi_info".as_bytes()], bump)]
    pub ubi_info: Account<'info, UBIInfo>,
    /// CHECK: x
    #[account(signer, mut)]
    pub user_authority: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct UBIInfo {
    // i64
    last_issuance: UnixTimestamp,
    // i64
    last_trust_given: UnixTimestamp,
    // [u8; 32] * TRUST_COEFF
    trusters: Vec<Pubkey>,
    trusted: bool,
    bump: u8,
}

impl UBIInfo {
    // in bytes
    pub const MAX_SIZE: usize = 8 + 8 + (4 + 32 * TRUST_COEFF as usize) + 1 + 1;
}