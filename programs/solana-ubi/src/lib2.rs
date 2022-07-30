use anchor_lang::prelude::*;
use anchor_spl::token;
use anchor_spl::token::{Token, MintTo, TokenAccount, Mint};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("EcFTDXxknt3vRBi1pVZYN7SjZLcbHjJRAmCmjZ7Js3fd");

const MINTER:&str = "minter";
const BUMP:u8 = 255;

//token D2H9VF2wsSPdhdVfVQPTmxzEq4JiWvYajhw6YVwbpduH
//account B8iH9jZwQEDDfuPmVDnQbjfoT77jnQ9KxHTgyiyJkEbQ
//pda Bd4vag5JXn2RrGFw8VySP93QYouw5J8D3f1KCy3iUXRN

#[program]
pub mod token_mint_pda {
    use super::*;

    pub fn mint_token(ctx: Context<MintToken>) -> Result<()> {
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.destination.to_account_info(),
                    authority: ctx.accounts.mint.to_account_info(),
                },
                &[&[
                    MINTER.as_bytes(),
                    &[BUMP]
                ]],
            ),
            10_000_000_000,
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct MintToken<'info> {
    #[account(
    init_if_needed,
    payer = payer,
    seeds = [MINTER.as_ref()],
    bump,
    mint::decimals = 9,
    mint::authority = mint
    )]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(init_if_needed,
    payer = payer,
    associated_token::mint = mint,
    associated_token::authority = payer
    )]
    pub destination: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>
}
