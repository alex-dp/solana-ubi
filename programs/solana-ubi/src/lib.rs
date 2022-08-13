use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{self, Mint, MintTo, TokenAccount};

const MINTER: &str = "minter";
const UBI_INFO: &str = "ubi_info5";
const STATE: &str = "state";
const TRUST_COEFF: u8 = 3;
const INITIAL_CAP: u128 = 20__000_000_000__000_000_000;
const PRODUCTION: bool = false;

declare_id!("EcFTDXxknt3vRBi1pVZYN7SjZLcbHjJRAmCmjZ7Js3fd");

//mint 4jzEiVCdX5DbcadqChrrvWaYJT7YHGy3cnH4peN3fc54
//tokacc HfNY5k4T4xQVeYASUvDZE12MRyCj4hqGNJ6yuZGPshAx
//pda Bd4vag5JXn2RrGFw8VySP93QYouw5J8D3f1KCy3iUXRN

pub fn rate(cap_left: u128) -> u64 {
    (10_i32.pow(9) + ((19*10_i32.pow(9)) as f32 * (2.73_f32.powf((cap_left / INITIAL_CAP) as f32))) as i32).try_into().unwrap()
}

#[program]
pub mod solana_ubi {
    use super::*;

    pub fn mint_token(
        ctx: Context<MintUBI>
    ) -> Result<u8> {
        let now_ts = Clock::get().unwrap().unix_timestamp;
        //TODO urgent fix this. and other time checks. can it go in the constraints?
        // if now_ts < ctx.accounts.ubi_info.last_issuance + 23 * 60 * 60 {
        //     Err(1)
        // } else {
            // variable rate starts at 20 tok per day (9 decimal places)
            let current_rate: u64 = ctx.accounts.state.rate;
            let amount: u64 = (current_rate * (now_ts - ctx.accounts.ubi_info.last_issuance) as u64 / 86400) as u64;
            // Mint Redeemable to user Redeemable account.
            let seeds = &[
                MINTER.as_bytes(),
                &[255]
            ];
            let signer = &[&seeds[..]];
            let cpi_accounts = MintTo {
                mint: ctx.accounts.ubi_mint.to_account_info(),
                to: ctx.accounts.ubi_token_account.to_account_info(),
                authority: ctx.accounts.mint_signer.clone(),
            };
            let cpi_program = ctx.accounts.token_program.clone();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
            token::mint_to(cpi_ctx, amount)?;
            ctx.accounts.ubi_info.last_issuance = now_ts;
            ctx.accounts.state.cap_left = ctx.accounts.state.cap_left - amount as u128;
            ctx.accounts.state.rate = rate(ctx.accounts.state.cap_left);
            Ok(0) //Ok(Ok(0))
        // }.expect("")
    }

    pub fn trust(ctx: Context<TrustUser>) -> Result<u8> {
        let now_ts: i64 = Clock::get().unwrap().unix_timestamp;
        if now_ts < ctx.accounts.truster_ubi_info.last_trust_given + 24 * 60 * 60 {
            Err(3)
        } else {
            ctx.accounts.trustee_ubi_info.trusters.push(*ctx.accounts.truster_authority.key);

            if ctx.accounts.trustee_ubi_info.trusters.len() >= TRUST_COEFF as usize {
                ctx.accounts.trustee_ubi_info.is_trusted = true;
            }
            ctx.accounts.truster_ubi_info.last_trust_given = now_ts;
            Ok(Ok(0))
        }.expect("")
    }

    pub fn initialize_account(ctx: Context<InitializeAccount>) -> Result<u8> {
        let now_ts: i64 = Clock::get().unwrap().unix_timestamp;
        let acc = &mut ctx.accounts.ubi_info;

        acc.authority = *ctx.accounts.user_authority.key;
        acc.trusters = Vec::new();
        acc.last_trust_given = now_ts - 24 * 60 * 60;
        acc.is_trusted = !PRODUCTION;
        acc.last_issuance = now_ts - 24 * 60 * 60;

        Ok(0)
    }

    pub fn initialize_mint(ctx: Context<InitializeMint>) -> Result<u8> {
        let acc = &mut ctx.accounts.state;

        acc.rate = rate(INITIAL_CAP);
        acc.cap_left = INITIAL_CAP;

        Ok(0)
    }
}

#[derive(Accounts)]
pub struct MintUBI<'info> {
    /// CHECK: x
    #[account(seeds = [MINTER.as_bytes()], bump)]
    mint_signer: AccountInfo<'info>,
    #[account(mut, constraint = ubi_mint.mint_authority == COption::Some(* mint_signer.key))]
    pub ubi_mint: Account<'info, Mint>,
    /// CHECK: x
    #[account(signer, mut)]
    pub user_authority: AccountInfo<'info>,
    #[account(
        mut,
        token::mint = ubi_mint,
        token::authority = user_authority
    )]
    pub ubi_token_account: Account<'info, TokenAccount>,
    // is program account. NOTE been initialized
    #[account(
        mut,
        constraint = ubi_info.authority == *user_authority.key && Clock::get().unwrap().unix_timestamp > ubi_info.last_issuance + 23 * 60 * 60,
        seeds = [UBI_INFO.as_bytes(), &user_authority.key.to_bytes()],
        bump
    )]
    pub ubi_info: Account<'info, UBIInfo>,

    #[account(
        init,
        payer = user_authority,
        space = 8 + 64,
        seeds = [STATE.as_bytes()],
        bump
    )]
    pub state: Account<'info, State>,
    /// CHECK: x
    #[account(constraint = token_program.key == & token::ID)]
    pub token_program: AccountInfo<'info>,

    pub system_program: Program<'info, System>,

    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct TrustUser<'info> {
    #[account(
        mut,
        constraint = trustee_ubi_info.is_trusted
    )]
    pub trustee_ubi_info: Account<'info, UBIInfo>,
    #[account(mut, constraint = truster_ubi_info.authority == *truster_authority.key)]
    pub truster_ubi_info: Account<'info, UBIInfo>,
    /// CHECK: x
    #[account(
        signer,
        mut,
        constraint = truster_authority.key.as_ref() != trustee_ubi_info.authority.as_ref()
    )]
    pub truster_authority: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct InitializeAccount<'info> {
    #[account(
        init,
        payer = user_authority,
        space = 8 + UBIInfo::MAX_SIZE,
        seeds = [UBI_INFO.as_bytes(), &user_authority.key.to_bytes()],
        bump
    )]
    pub ubi_info: Account<'info, UBIInfo>,
    /// CHECK: x
    #[account(signer, mut)]
    pub user_authority: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeMint<'info> {
    #[account(
        init,
        payer = user_authority,
        space = 8 + 64 + 128,
        seeds = [STATE.as_bytes()],
        bump
    )]
    pub state: Account<'info, State>,
    /// CHECK: x
    #[account(signer, mut)]
    pub user_authority: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct UBIInfo {
    // [u8; 32]
    authority: Pubkey,
    last_issuance: i64,
    last_trust_given: i64,
    // [u8; 32] * 10 (constant, only fills up to TRUST_COEFF)
    trusters: Vec<Pubkey>,
    is_trusted: bool,
}

impl UBIInfo {
    // in bytes
    pub const MAX_SIZE: usize = 32 + 8 + 8 + (4 + 32 * 10) + 1;
}

#[account]
pub struct State {
    rate: u64,
    cap_left: u128
}