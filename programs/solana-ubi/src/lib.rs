use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{self, Mint, MintTo, TokenAccount};

const MINTER: &str = "minter";
const UBI_INFO: &str = "ubi_info7";
const STATE: &str = "state1";
const TRUST_COEFF: u8 = 3;
const INITIAL_CAP: u128 = 20__000_000_000__000_000_000;
const PRODUCTION: bool = false;

declare_id!("EcFTDXxknt3vRBi1pVZYN7SjZLcbHjJRAmCmjZ7Js3fd");

//mint   4jzEiVCdX5DbcadqChrrvWaYJT7YHGy3cnH4peN3fc54
//tokacc HfNY5k4T4xQVeYASUvDZE12MRyCj4hqGNJ6yuZGPshAx
//pda    Bd4vag5JXn2RrGFw8VySP93QYouw5J8D3f1KCy3iUXRN

pub fn rate(cap_left: u128) -> u64 {
    if cap_left == 0 { return 20_000_000_000 }
    // 1B    + 19B        e^ (c_left/c_i)
    // 10**9 + 19*10**9 * e**(fraction_cap_left)
    1_000_000_000_u64 + ((19_000_000_000_f64) * (2.73_f64.powf((cap_left as f64/INITIAL_CAP as f64)as f64))) as u64
}

#[program]
pub mod solana_ubi {
    use super::*;

    pub fn mint_token(
        ctx: Context<MintUBI>
    ) -> Result<u8> {
        let now_ts = Clock::get().unwrap().unix_timestamp;

        // variable rate starts at 20 tok per day (9 decimal places)
        let state = &mut ctx.accounts.state;
        let ubi_info = &mut ctx.accounts.ubi_info;
        let cap_left = state.cap_left;
        let current_rate: u64 = rate(cap_left);
        let seconds_elapsed: u64 = (now_ts - ubi_info.last_issuance) as u64;
        let amount: u64 = (current_rate * seconds_elapsed / 86400) as u64;
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
        ubi_info.last_issuance = now_ts;
        state.cap_left = if amount as u128 > cap_left { 0 } else { cap_left - amount as u128};
        Ok(0)
    }

    pub fn trust(ctx: Context<TrustUser>) -> Result<u8> {

        let trustee = &mut ctx.accounts.trustee_ubi_info;
        let truster = &mut ctx.accounts.truster_ubi_info;

        trustee.trusters.push(*ctx.accounts.truster_authority.key);

        if trustee.trusters.len() >= TRUST_COEFF as usize {
            trustee.is_trusted = true;
        }
        truster.last_trust_given = Clock::get().unwrap().unix_timestamp;
        Ok(0)
    }

    pub fn initialize_account(ctx: Context<InitializeAccount>) -> Result<u8> {
        let now_ts: i64 = Clock::get().unwrap().unix_timestamp;
        let acc = &mut ctx.accounts.ubi_info;

        acc.authority = *ctx.accounts.user_authority.key;
        acc.trusters = Vec::with_capacity(10);
        acc.last_trust_given = now_ts - 24 * 60 * 60;
        acc.is_trusted = !PRODUCTION;
        acc.last_issuance = now_ts - 24 * 60 * 60;

        Ok(0)
    }

    pub fn initialize_mint(ctx: Context<InitializeMint>) -> Result<u8> {
        let acc = &mut ctx.accounts.state;

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
    // is program account. NOTE is initialized
    // TODO bump: different user_authority will produce a bump, most often 255 but might be any 0 <= bump <= 255
    #[account(
        mut,
        constraint = ubi_info.authority == *user_authority.key && Clock::get().unwrap().unix_timestamp.gt(&(ubi_info.last_issuance + 23*3600)),
        seeds = [UBI_INFO.as_bytes(), &user_authority.key.to_bytes()],
        bump
    )]
    pub ubi_info: Account<'info, UBIInfo>,

    // unique program account, is already initialized, will set STATE so that bump = 255
    #[account(mut, seeds = [STATE.as_bytes()], bump)]
    pub state: Account<'info, State>,
    /// CHECK: x
    #[account(constraint = token_program.key == & token::ID)]
    pub token_program: AccountInfo<'info>,

    pub system_program: Program<'info, System>,

    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct TrustUser<'info> {
    #[account(mut)]
    pub trustee_ubi_info: Account<'info, UBIInfo>,
    #[account(
        mut,
        constraint =
                truster_ubi_info.authority == *truster_authority.key
                && Clock::get().unwrap().unix_timestamp > truster_ubi_info.last_trust_given + 5 * 60
                && truster_ubi_info.is_trusted
    )]
    pub truster_ubi_info: Account<'info, UBIInfo>,
    /// CHECK: x
    #[account(
        signer,
        mut,
        constraint = *truster_authority.key != trustee_ubi_info.authority
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
        space = 8 + State::MAX_SIZE,
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
    cap_left: u128
}

impl State {
    //in bytes
    pub const MAX_SIZE: usize = 128;
}