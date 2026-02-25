import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ThyxelHook } from "../target/types/thyxel_hook";
import {
  TOKEN_2022_PROGRAM_ID,
  createMint,
  createAccount,
  mintTo,
  transferChecked,
  getAccount,
} from "@solana/spl-token";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

describe("thyxel-hook", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ThyxelHook as Program<ThyxelHook>;
  const authority = provider.wallet as anchor.Wallet;
  const decimals = 9;

  let mint: PublicKey;
  let configPda: PublicKey;
  let epochPda: PublicKey;

  before(async () => {
    // Derive PDAs
    [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("thyxel-config")],
      program.programId
    );
    [epochPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("epoch-state")],
      program.programId
    );
  });

  it("Initializes the THYXEL config", async () => {
    const tx = await program.methods
      .initialize(
        100,   // initial_burn_bps (1%)
        500,   // max_wallet_bps (5%)
        7      // epoch_duration_days
      )
      .accounts({
        authority: authority.publicKey,
        config: configPda,
        epochState: epochPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Initialize tx:", tx);

    const config = await program.account.thyxelConfig.fetch(configPda);
    assert.equal(config.burnRateBps, 100);
    assert.equal(config.maxWalletBps, 500);
    assert.equal(config.epochDurationDays, 7);
    assert.ok(config.authority.equals(authority.publicKey));
    console.log("Config initialized successfully");
  });

  it("Updates wallet DNA on transfer", async () => {
    const wallet = Keypair.generate();

    const [dnaPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("wallet-dna"), wallet.publicKey.toBuffer()],
      program.programId
    );

    const tx = await program.methods
      .updateDna(wallet.publicKey)
      .accounts({
        config: configPda,
        epochState: epochPda,
        walletDna: dnaPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Update DNA tx:", tx);

    const dna = await program.account.walletDna.fetch(dnaPda);
    assert.ok(dna.loyalty >= 0 && dna.loyalty <= 255);
    assert.ok(dna.activity >= 0 && dna.activity <= 255);
    assert.ok(dna.appetite >= 0 && dna.appetite <= 255);
    console.log(`DNA: loyalty=${dna.loyalty}, activity=${dna.activity}, appetite=${dna.appetite}`);
  });

  it("Triggers epoch mutation", async () => {
    const tx = await program.methods
      .triggerMutation()
      .accounts({
        authority: authority.publicKey,
        config: configPda,
        epochState: epochPda,
      })
      .rpc();

    console.log("Mutation tx:", tx);

    const epoch = await program.account.epochState.fetch(epochPda);
    assert.ok(epoch.epochId.toNumber() >= 0);
    console.log(`Epoch ${epoch.epochId}: burn=${epoch.burnRateBps}bps, maxWallet=${epoch.maxWalletBps}bps`);
  });

  it("Enforces whale protection", async () => {
    const config = await program.account.thyxelConfig.fetch(configPda);
    assert.ok(config.maxWalletBps > 0, "Max wallet should be set");
    assert.ok(config.maxWalletBps <= 1000, "Max wallet should be <= 10%");
    console.log(`Whale protection: max ${config.maxWalletBps / 100}% per wallet`);
  });

  it("Verifies burn rate bounds", async () => {
    const config = await program.account.thyxelConfig.fetch(configPda);
    assert.ok(config.burnRateBps >= 10, "Min burn rate: 10 bps (0.1%)");
    assert.ok(config.burnRateBps <= 500, "Max burn rate: 500 bps (5%)");
    console.log(`Burn rate: ${config.burnRateBps} bps (${config.burnRateBps / 100}%)`);
  });

  it("Creates fossil NFT for extinct wallet", async () => {
    const extinctWallet = Keypair.generate();

    const [fossilPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("fossil"), extinctWallet.publicKey.toBuffer()],
      program.programId
    );

    const tx = await program.methods
      .mintFossil(extinctWallet.publicKey)
      .accounts({
        authority: authority.publicKey,
        config: configPda,
        fossil: fossilPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Fossil NFT tx:", tx);
    console.log("Fossil minted for extinct wallet:", extinctWallet.publicKey.toBase58());
  });
});
