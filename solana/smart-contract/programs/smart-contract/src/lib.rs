use anchor_lang::prelude::*;

declare_id!("7FM2ia6Q4E2RQpDEtafeuVLc8BTK1FRRUzSQpHpU7VDb");


#[program]
pub mod smart_contract {
    use super::*;

    pub fn log_post(
        ctx: Context<LogPost>,
        display_name: String,
        post_hash: Vec<u8>,
        timestamp: i64,
        action_type: u8,
    ) -> Result<()> {
        let signer = ctx.accounts.signer.key();

        emit!(PostLogged {
            wallet_address: signer,
            display_name,
            post_hash,
            timestamp,
            action_type,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct LogPost<'info> {
    /// CHECK: This is the signer wallet, no data access or mutation required
    // #[account(mut)]
    pub signer: Signer<'info>,
}

#[event]
pub struct PostLogged {
    pub wallet_address: Pubkey,
    pub display_name: String,
    pub post_hash: Vec<u8>,
    pub timestamp: i64,
    pub action_type: u8, // 0=create, 1=edit, 2=soft_delete
}
