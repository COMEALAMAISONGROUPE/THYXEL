import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  clusterApiUrl,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  createInitializeMintInstruction,
  createInitializeTransferHookInstruction,
  getMintLen,
  createMintToInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import * as fs from "fs";

const THYXEL_DECIMALS = 9;
const THYXEL_SUPPLY = 1_000_000_000; // 1 billion $THYX

async function main() {
  console.log("=== Creating $THYX Token (Token-2022 + Transfer Hook) ===\n");

  // Load keypair
  const walletPath = process.env.WALLET_PATH || "~/.config/solana/id.json";
  const rawKey = JSON.parse(fs.readFileSync(walletPath.replace("~", process.env.HOME || ""), "utf-8"));
  const payer = Keypair.fromSecretKey(new Uint8Array(rawKey));

  // Connect
  const cluster = process.env.CLUSTER || "devnet";
  const connection = new Connection(
    cluster === "mainnet-beta"
      ? process.env.RPC_URL || clusterApiUrl("mainnet-beta")
      : clusterApiUrl(cluster as any),
    "confirmed"
  );

  console.log("Payer:", payer.publicKey.toBase58());
  console.log("Cluster:", cluster);

  const balance = await connection.getBalance(payer.publicKey);
  console.log("Balance:", balance / 1e9, "SOL\n");

  // Generate mint keypair
  const mintKeypair = Keypair.generate();
  const mint = mintKeypair.publicKey;

  // Transfer Hook Program ID (replace with your deployed program)
  const HOOK_PROGRAM_ID = process.env.HOOK_PROGRAM_ID
    ? new (require("@solana/web3.js").PublicKey)(process.env.HOOK_PROGRAM_ID)
    : mintKeypair.publicKey; // placeholder

  // Calculate space for mint with Transfer Hook extension
  const extensions = [ExtensionType.TransferHook];
  const mintLen = getMintLen(extensions);
  const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

  console.log("Mint:", mint.toBase58());
  console.log("Mint size:", mintLen, "bytes");
  console.log("Rent:", lamports / 1e9, "SOL\n");

  // Build transaction
  const tx = new Transaction().add(
    // Create account
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mint,
      space: mintLen,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    // Initialize Transfer Hook
    createInitializeTransferHookInstruction(
      mint,
      payer.publicKey,
      HOOK_PROGRAM_ID,
      TOKEN_2022_PROGRAM_ID
    ),
    // Initialize Mint
    createInitializeMintInstruction(
      mint,
      THYXEL_DECIMALS,
      payer.publicKey,
      null, // no freeze authority
      TOKEN_2022_PROGRAM_ID
    )
  );

  console.log("--- Creating $THYX Mint ---");
  const sig1 = await sendAndConfirmTransaction(connection, tx, [payer, mintKeypair]);
  console.log("Mint created:", sig1);

  // Create ATA for payer
  const ata = getAssociatedTokenAddressSync(
    mint,
    payer.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const tx2 = new Transaction().add(
    createAssociatedTokenAccountInstruction(
      payer.publicKey,
      ata,
      payer.publicKey,
      mint,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    )
  );

  console.log("\n--- Creating Token Account ---");
  const sig2 = await sendAndConfirmTransaction(connection, tx2, [payer]);
  console.log("ATA created:", sig2);

  // Mint initial supply
  const tx3 = new Transaction().add(
    createMintToInstruction(
      mint,
      ata,
      payer.publicKey,
      BigInt(THYXEL_SUPPLY) * BigInt(10 ** THYXEL_DECIMALS),
      [],
      TOKEN_2022_PROGRAM_ID
    )
  );

  console.log("\n--- Minting Supply ---");
  const sig3 = await sendAndConfirmTransaction(connection, tx3, [payer]);
  console.log("Minted:", sig3);

  // Save token info
  const tokenInfo = {
    mint: mint.toBase58(),
    decimals: THYXEL_DECIMALS,
    supply: THYXEL_SUPPLY,
    ata: ata.toBase58(),
    authority: payer.publicKey.toBase58(),
    hookProgramId: HOOK_PROGRAM_ID.toBase58(),
    cluster,
    createdAt: new Date().toISOString(),
  };

  fs.writeFileSync("token-info.json", JSON.stringify(tokenInfo, null, 2));

  console.log("\n=== $THYX TOKEN CREATED ===");
  console.log("Mint:", mint.toBase58());
  console.log("Supply:", THYXEL_SUPPLY.toLocaleString(), "$THYX");
  console.log("Token info saved to token-info.json");
}

main().catch((err) => {
  console.error("Token creation failed:", err);
  process.exit(1);
});
