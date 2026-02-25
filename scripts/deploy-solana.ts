import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ThyxelHook } from "../target/types/thyxel_hook";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import * as fs from "fs";

async function main() {
  console.log("=== THYXEL ($THYX) Solana Deployment ===\n");

  // Configure provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ThyxelHook as Program<ThyxelHook>;
  const authority = provider.wallet as anchor.Wallet;

  console.log("Program ID:", program.programId.toBase58());
  console.log("Authority:", authority.publicKey.toBase58());
  console.log("Cluster:", provider.connection.rpcEndpoint);

  // Derive PDAs
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("thyxel-config")],
    program.programId
  );
  const [epochPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("epoch-state")],
    program.programId
  );

  console.log("\nConfig PDA:", configPda.toBase58());
  console.log("Epoch PDA:", epochPda.toBase58());

  // Initialize THYXEL
  console.log("\n--- Initializing THYXEL ---");
  const tx = await program.methods
    .initialize(
      100,  // initial burn rate: 1% (100 bps)
      500,  // max wallet: 5% (500 bps)
      7     // epoch duration: 7 days
    )
    .accounts({
      authority: authority.publicKey,
      config: configPda,
      epochState: epochPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log("Init TX:", tx);

  // Verify deployment
  const config = await program.account.thyxelConfig.fetch(configPda);
  console.log("\n=== Deployment Verified ===");
  console.log("Burn Rate:", config.burnRateBps, "bps");
  console.log("Max Wallet:", config.maxWalletBps, "bps");
  console.log("Epoch Duration:", config.epochDurationDays, "days");
  console.log("Authority:", config.authority.toBase58());

  // Save deployment info
  const deployInfo = {
    network: provider.connection.rpcEndpoint,
    programId: program.programId.toBase58(),
    configPda: configPda.toBase58(),
    epochPda: epochPda.toBase58(),
    authority: authority.publicKey.toBase58(),
    burnRateBps: config.burnRateBps,
    maxWalletBps: config.maxWalletBps,
    epochDurationDays: config.epochDurationDays,
    deployedAt: new Date().toISOString(),
    txSignature: tx,
  };

  fs.writeFileSync(
    "deployment.json",
    JSON.stringify(deployInfo, null, 2)
  );
  console.log("\nDeployment info saved to deployment.json");
  console.log("\n=== THYXEL IS ALIVE ===");
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
