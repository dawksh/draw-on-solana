use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod draw {
    use super::*;

    const MIN_POS: u8 = 0;
    const MAX_POS: u8 = 99;
    const MIN_COL: u8 = 0;
    const MAX_COL: u8 = 255;

    pub fn create_pixel(ctx: Context<CreatePixel>, pos_x:u8, pos_y: u8, init_col_r: u8, init_col_g: u8, init_col_b: u8) -> Result<()> {
        
        if pos_x < MIN_POS || pos_x > MAX_POS {
            return Err(error!(ErrorCode::InvalidXCoordinate));
        }
        if pos_y < MIN_POS || pos_y > MAX_POS {
            return Err(error!(ErrorCode::InvalidYCoordinate));
        }
        if init_col_g < MIN_COL || init_col_g > MAX_COL {
            return Err(error!(ErrorCode::InvalidGColor));
        }
        if init_col_r < MIN_COL || init_col_r > MAX_COL {
            return Err(error!(ErrorCode::InvalidRColor));
        }
        if init_col_b < MIN_COL || init_col_b > MAX_COL {
            return Err(error!(ErrorCode::InvalidBColor));
        }
        
        let pixel = &mut ctx.accounts.pixel;
        pixel.pos_x = pos_x;
        pixel.pos_y = pos_y;
        pixel.col_r = init_col_r;
        pixel.col_g = init_col_g;
        pixel.col_b = init_col_b;
        pixel.bump = *ctx.bumps.get("pixel").unwrap();

        emit!(PixelChanged{
            pos_x,
            pos_y,
            col_r: init_col_r,
            col_g: init_col_g,
            col_b: init_col_b
        });

        Ok(())
    }

    pub fn update_pixel(ctx: Context<UpdatePixel>, new_col_r: u8, new_col_g: u8, new_col_b: u8) -> Result<()> {
        if new_col_r < MIN_COL || new_col_r > MAX_COL {
            return Err(error!(ErrorCode::InvalidRColor));
        }
        if new_col_g < MIN_COL || new_col_g > MAX_COL {
            return Err(error!(ErrorCode::InvalidGColor));
        }
        if new_col_b < MIN_COL || new_col_b > MAX_COL {
            return Err(error!(ErrorCode::InvalidBColor));
        }

        let pixel = &mut ctx.accounts.pixel;
        pixel.col_r = new_col_r;
        pixel.col_g = new_col_g;
        pixel.col_b = new_col_b;  

        emit!(PixelChanged{
            pos_x: ctx.accounts.pixel.pos_x,
            pos_y: ctx.accounts.pixel.pos_y,
            col_r: new_col_r,
            col_g: new_col_g,
            col_b: new_col_b
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

#[derive(Accounts)]
#[instruction(pos_x: u8, pos_y: u8)]
pub struct CreatePixel<'info> {
      #[account(
        init,
        payer = user,
        space = Pixel::LEN,
        seeds = [b"pixel".as_ref(), [pos_x, pos_y].as_ref()],
        bump
    )]
    pub pixel: Account<'info, Pixel>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdatePixel<'info> {
    #[account(
        mut,
        seeds = [b"pixel".as_ref(), [pixel.pos_x, pixel.pos_y].as_ref()],
        bump = pixel.bump
    )]
    pub pixel: Account<'info, Pixel>
}


#[account]
pub struct Pixel {
    pub pos_x: u8,
    pub pos_y: u8,
    pub col_r: u8,
    pub col_g: u8,
    pub col_b: u8,
    pub bump: u8
}

#[error_code]
pub enum ErrorCode{
     #[msg("The given X co-ordinate is not between 0-99")]
    InvalidXCoordinate,
    #[msg("The given Y co-ordinate is not between 0-99")]
    InvalidYCoordinate,
    #[msg("The given R color is not between 0-255")]
    InvalidRColor,
    #[msg("The given G color is not between 0-255")]
    InvalidGColor,
    #[msg("The given B color is not between 0-255")]
    InvalidBColor,
}

const DISCRIMINATOR_LENGTH: usize = 8;
const POS_LENGTH: usize = 1;
const COL_LENGTH: usize = 1;
const BUMP_LENGTH: usize = 1;

impl Pixel {
    const LEN: usize = DISCRIMINATOR_LENGTH + (2 * POS_LENGTH) + (3 * COL_LENGTH) + BUMP_LENGTH;
}


#[event]
pub struct PixelChanged {
    pub pos_x: u8,
    pub pos_y: u8,
    pub col_r: u8,
    pub col_g: u8,
    pub col_b: u8
}