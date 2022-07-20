use anchor_lang::prelude::*;
use anchor_spl::token;
use anchor_spl::token::{Token, MintTo};

declare_id!("EcFTDXxknt3vRBi1pVZYN7SjZLcbHjJRAmCmjZ7Js3fd");
//token HKTPz1skkSNAC8TXJiYvPyYtMCQDHtAheCL4FrBArCDJ
//program EcFTDXxknt3vRBi1pVZYN7SjZLcbHjJRAmCmjZ7Js3fd
//account GHQMHrt4j8i6bBaVhpMCLP8uoFfWUrLZsQtWCWqSJKA6
#[program]
pub mod solana_ubi {
    use super::*;

    pub fn mint_token(ctx: Context<MintToken>,) -> Result<()> {
        // Create the MintTo struct for our context
        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        };

        //need to make pda. see cookbook: sign a transaction with a pda.

        let cpi_program = ctx.accounts.token_program.to_account_info();
        // Create the CpiContext we need for the request
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        // Execute anchor's helper function to mint tokens
        token::mint_to(cpi_ctx, 10_000_000_000)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct MintToken<'info> {
    /// CHECK: This is the token that we want to mint
    #[account()]
    pub mint: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
    /// CHECK: This is the token account that we want to mint tokens to
    #[account(mut)]
    pub token_account: UncheckedAccount<'info>,
    /// CHECK: ugh
    #[account(signer)]
    pub owner: AccountInfo<'info>,
}
