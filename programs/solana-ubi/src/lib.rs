use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{self, Mint, MintTo, TokenAccount};

const MINTER:&str = "minter";

declare_id!("EcFTDXxknt3vRBi1pVZYN7SjZLcbHjJRAmCmjZ7Js3fd");

//mint 4jzEiVCdX5DbcadqChrrvWaYJT7YHGy3cnH4peN3fc54
//tokacc HfNY5k4T4xQVeYASUvDZE12MRyCj4hqGNJ6yuZGPshAx
//pda Bd4vag5JXn2RrGFw8VySP93QYouw5J8D3f1KCy3iUXRN

#[program]
pub mod ido_pool {
    use super::*;

    pub fn mint_token(
        ctx: Context<MintUBI>
    ) -> Result<()> {
        // Mint Redeemable to user Redeemable account.
        let seeds = &[
            MINTER.as_bytes(),
            //&[BUMP]
        ];
        let signer = &[&seeds[..]];
        let cpi_accounts = MintTo {
            mint: ctx.accounts.redeemable_mint.to_account_info(),
            to: ctx.accounts.user_redeemable.to_account_info(),
            authority: ctx.accounts.pool_signer.clone(),
        };
        let cpi_program = ctx.accounts.token_program.clone();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::mint_to(cpi_ctx, 10_000_000_000)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct MintUBI<'info> {
    /// CHECK: x
    #[account(seeds = [MINTER.as_bytes()], bump)]
    pool_signer: AccountInfo<'info>,
    #[account(mut, constraint = redeemable_mint.mint_authority == COption::Some(*pool_signer.key))]
    pub redeemable_mint: Account<'info, Mint>,
    /// CHECK: x
    #[account(signer)]
    pub user_authority: AccountInfo<'info>,
    #[account(mut)]
    pub user_redeemable: Account<'info, TokenAccount>,
    /// CHECK: x
    #[account(constraint = token_program.key == &token::ID)]
    pub token_program: AccountInfo<'info>
}