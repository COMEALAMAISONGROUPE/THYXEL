use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};
use spl_tlv_account_resolution::{
    account::ExtraAccountMeta, seeds::Seed, state::ExtraAccountMetaList,
};
use spl_transfer_hook_interface::instruction::{ExecuteInstruction, TransferHookInstruction};

declare_id!("THYXhook1111111111111111111111111111111111");

const EPOCH_DURATION: i64 = 7 * 24 * 60 * 60;

#[program]
pub mod thyxel_hook {
    use super::*;

    pub fn initialize_extra_account_meta_list(
        ctx: Context<InitializeExtraAccountMetaList>,
    ) -> Result<()> {
        let account_metas = vec![
            ExtraAccountMeta::new_with_seeds(
                &[Seed::Literal { bytes: b"epoch".to_vec() }, Seed::AccountKey { index: 1 }],
                false, true,
            )?,
        ];
        let account_size = ExtraAccountMetaList::size_of(account_metas.len())? as u64;
        let lamports = Rent::get()?.minimum_balance(account_size as usize);
        let mint = ctx.accounts.mint.key();
        let signer_seeds: &[&[&[u8]]] = &[&[
            b"extra-account-metas", mint.as_ref(), &[ctx.bumps.extra_account_meta_list],
        ]];
        anchor_lang::system_program::create_account(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::CreateAccount {
                    from: ctx.accounts.payer.to_account_info(),
                    to: ctx.accounts.extra_account_meta_list.to_account_info(),
                },
            ).with_signer(signer_seeds),
            lamports, account_size, ctx.program_id,
        )?;
        ExtraAccountMetaList::init::<ExecuteInstruction>(
            &mut ctx.accounts.extra_account_meta_list.try_borrow_mut_data()?,
            &account_metas,
        )?;
        Ok(())
    }

    pub fn initialize_epoch(ctx: Context<InitializeEpoch>) -> Result<()> {
        let e = &mut ctx.accounts.epoch_state;
        e.mint = ctx.accounts.mint.key();
        e.epoch_id = 0;
        e.start_time = Clock::get()?.unix_timestamp;
        e.tx_count = 0;
        e.total_volume = 0;
        e.emotional_state = 0;
        e.burn_rate_bps = 100;
        e.max_wallet_bps = 150;
        Ok(())
    }

    #[interface(spl_transfer_hook_interface::execute)]
    pub fn transfer_hook(ctx: Context<TransferHookCtx>, amount: u64) -> Result<()> {
        let e = &mut ctx.accounts.epoch_state;
        e.tx_count = e.tx_count.saturating_add(1);
        e.total_volume = e.total_volume.saturating_add(amount);
        msg!("THYX | Epoch {} | TX #{} | Vol: {}", e.epoch_id, e.tx_count, e.total_volume);
        Ok(())
    }

    pub fn update_dna(ctx: Context<UpdateDna>, amount: u64) -> Result<()> {
        let d = &mut ctx.accounts.wallet_dna;
        let clock = Clock::get()?;
        if d.first_interaction == 0 {
            d.first_interaction = clock.unix_timestamp;
            d.wallet = ctx.accounts.wallet.key();
            d.mint = ctx.accounts.mint.key();
        }
        d.last_interaction = clock.unix_timestamp;
        d.tx_count = d.tx_count.saturating_add(1);
        d.total_volume = d.total_volume.saturating_add(amount);
        let hold_days = ((clock.unix_timestamp - d.first_interaction) / 86400) as u64;
        d.loyalty_gene = hold_days.min(100) as u8;
        d.activity_gene = (d.tx_count.min(100)) as u8;
        d.appetite_gene = (d.total_volume / 10_000_000_000u64).min(100) as u8;
        emit!(DnaUpdated {
            wallet: d.wallet, loyalty: d.loyalty_gene,
            activity: d.activity_gene, appetite: d.appetite_gene,
        });
        Ok(())
    }

    pub fn trigger_mutation(ctx: Context<TriggerMutation>) -> Result<()> {
        let e = &mut ctx.accounts.epoch_state;
        let f = &mut ctx.accounts.fossil;
        let clock = Clock::get()?;
        require!(clock.unix_timestamp >= e.start_time + EPOCH_DURATION, ThyxelError::EpochNotEnded);
        let new_state: u8 = if e.tx_count > 1000 { 3 }
            else if e.tx_count > 500 { 2 }
            else if e.tx_count > 100 { 1 }
            else { 0 };
        match new_state {
            3 => {
                e.burn_rate_bps = e.burn_rate_bps.saturating_add(20).min(300);
                e.max_wallet_bps = e.max_wallet_bps.saturating_sub(10).max(50);
            }
            2 => { e.burn_rate_bps = e.burn_rate_bps.saturating_sub(10).max(10); }
            1 => {
                e.burn_rate_bps = e.burn_rate_bps.saturating_sub(20).max(10);
                e.max_wallet_bps = e.max_wallet_bps.saturating_add(10).min(200);
            }
            _ => {
                e.burn_rate_bps = e.burn_rate_bps.saturating_sub(30).max(10);
                e.max_wallet_bps = e.max_wallet_bps.saturating_add(20).min(200);
            }
        }
        f.epoch_id = e.epoch_id;
        f.mint = e.mint;
        f.start_time = e.start_time;
        f.end_time = clock.unix_timestamp;
        f.tx_count = e.tx_count;
        f.total_volume = e.total_volume;
        f.emotional_state = new_state;
        f.burn_rate_bps = e.burn_rate_bps;
        f.max_wallet_bps = e.max_wallet_bps;
        f.genome_hash = anchor_lang::solana_program::hash::hash(
            &[
                e.epoch_id.to_le_bytes().as_ref(),
                e.tx_count.to_le_bytes().as_ref(),
                e.total_volume.to_le_bytes().as_ref(),
                &[new_state],
                clock.unix_timestamp.to_le_bytes().as_ref(),
            ].concat()
        ).to_bytes();
        emit!(MutationTriggered {
            epoch_id: e.epoch_id, emotional_state: new_state,
            burn_rate_bps: e.burn_rate_bps, max_wallet_bps: e.max_wallet_bps,
            genome_hash: f.genome_hash,
        });
        e.epoch_id = e.epoch_id.saturating_add(1);
        e.start_time = clock.unix_timestamp;
        e.tx_count = 0;
        e.total_volume = 0;
        e.emotional_state = new_state;
        Ok(())
    }

    pub fn fallback<'info>(
        program_id: &Pubkey,
        accounts: &'info [AccountInfo<'info>],
        data: &[u8],
    ) -> Result<()> {
        let instruction = TransferHookInstruction::unpack(data)?;
        match instruction {
            TransferHookInstruction::Execute { amount } => {
                __private::__global::transfer_hook(program_id, accounts, &amount.to_le_bytes())
            }
            _ => Err(ProgramError::InvalidInstructionData.into()),
        }
    }
}

// ===== ACCOUNTS =====

#[derive(Accounts)]
pub struct InitializeExtraAccountMetaList<'info> {
    #[account(mut)]
    payer: Signer<'info>,
    /// CHECK: ExtraAccountMetaList PDA
    #[account(mut, seeds = [b"extra-account-metas", mint.key().as_ref()], bump)]
    pub extra_account_meta_list: AccountInfo<'info>,
    pub mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeEpoch<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init, payer = payer,
        space = 8 + EpochState::INIT_SPACE,
        seeds = [b"epoch", mint.key().as_ref()], bump
    )]
    pub epoch_state: Account<'info, EpochState>,
    pub mint: InterfaceAccount<'info, Mint>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TransferHookCtx<'info> {
    #[account(token::mint = mint, token::authority = owner)]
    pub source_token: InterfaceAccount<'info, TokenAccount>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(token::mint = mint)]
    pub destination_token: InterfaceAccount<'info, TokenAccount>,
    /// CHECK: source token account owner
    pub owner: UncheckedAccount<'info>,
    /// CHECK: ExtraAccountMetaList
    #[account(seeds = [b"extra-account-metas", mint.key().as_ref()], bump)]
    pub extra_account_meta_list: UncheckedAccount<'info>,
    #[account(mut, seeds = [b"epoch", mint.key().as_ref()], bump)]
    pub epoch_state: Account<'info, EpochState>,
}

#[derive(Accounts)]
pub struct UpdateDna<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: wallet whose DNA we update
    pub wallet: UncheckedAccount<'info>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(
        init_if_needed, payer = payer,
        space = 8 + WalletDna::INIT_SPACE,
        seeds = [b"dna", mint.key().as_ref(), wallet.key().as_ref()], bump
    )]
    pub wallet_dna: Account<'info, WalletDna>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TriggerMutation<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut, seeds = [b"epoch", mint.key().as_ref()], bump)]
    pub epoch_state: Account<'info, EpochState>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(
        init, payer = payer,
        space = 8 + Fossil::INIT_SPACE,
        seeds = [b"fossil", mint.key().as_ref(), &epoch_state.epoch_id.to_le_bytes()], bump
    )]
    pub fossil: Account<'info, Fossil>,
    pub system_program: Program<'info, System>,
}

// ===== STATE =====

#[account]
#[derive(InitSpace)]
pub struct EpochState {
    pub mint: Pubkey,
    pub epoch_id: u64,
    pub start_time: i64,
    pub tx_count: u64,
    pub total_volume: u64,
    pub emotional_state: u8,
    pub burn_rate_bps: u16,
    pub max_wallet_bps: u16,
}

#[account]
#[derive(InitSpace)]
pub struct WalletDna {
    pub wallet: Pubkey,
    pub mint: Pubkey,
    pub first_interaction: i64,
    pub last_interaction: i64,
    pub tx_count: u64,
    pub total_volume: u64,
    pub loyalty_gene: u8,
    pub activity_gene: u8,
    pub appetite_gene: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Fossil {
    pub epoch_id: u64,
    pub mint: Pubkey,
    pub start_time: i64,
    pub end_time: i64,
    pub tx_count: u64,
    pub total_volume: u64,
    pub emotional_state: u8,
    pub burn_rate_bps: u16,
    pub max_wallet_bps: u16,
    pub genome_hash: [u8; 32],
}

// ===== EVENTS =====

#[event]
pub struct DnaUpdated {
    pub wallet: Pubkey,
    pub loyalty: u8,
    pub activity: u8,
    pub appetite: u8,
}

#[event]
pub struct MutationTriggered {
    pub epoch_id: u64,
    pub emotional_state: u8,
    pub burn_rate_bps: u16,
    pub max_wallet_bps: u16,
    pub genome_hash: [u8; 32],
}

// ===== ERRORS =====

#[error_code]
pub enum ThyxelError {
    #[msg("Epoch has not ended yet. Wait 7 days.")]
    EpochNotEnded,
    #[msg("Not currently transferring.")]
    IsNotCurrentlyTransferring,
}
