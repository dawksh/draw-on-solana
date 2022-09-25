use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod draw {
    use super::*;

    pub fn create_pixel(ctx: Context<CreatePixel>, pos_x:u8, pos_y: u8, init_col_r: u8, init_col_g: u8, init_col_b: u8) -> Result<()> {
        let pixel = &mut ctx.accounts.pixel;
        pixel.pos_x = pos_x;
        pixel.pos_y = pos_y;
        pixel.col_r = init_col_r;
        pixel.col_g = init_col_g;
        pixel.col_b = init_col_b;
 
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

#[derive(Accounts)]
pub struct CreatePixel<'info> {
    #[account(init, payer=user, space=Pixel::LEN)]
    pub pixel: Account<'info, Pixel>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Pixel {
    pub pos_x: u8,
    pub pos_y: u8,
    pub col_r: u8,
    pub col_g: u8,
    pub col_b: u8,
}

const DISCRIMINATOR_LENGTH: usize = 8;
const POS_LENGTH: usize = 1;
const COL_LENGTH: usize = 1;

impl Pixel {
    const LEN: usize = DISCRIMINATOR_LENGTH + (2 * POS_LENGTH) + (3 * COL_LENGTH);
}
