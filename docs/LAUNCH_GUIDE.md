# THYXEL ($THYX) - Launch Guide

## Complete step-by-step guide to deploy and launch $THYX on Solana

---

## Prerequisites

1. **Solana CLI** (v1.17+): `sh -c "$(curl -sSfL https://release.solana.com/stable/install)"`
2. **Anchor CLI** (v0.29+): `cargo install --git https://github.com/coral-xyz/anchor avm && avm install latest && avm use latest`
3. **Rust** (latest stable): `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
4. **Node.js** (v18+) and **Yarn**
5. **SOL for deployment**: ~2-3 SOL for devnet, ~5-10 SOL for mainnet

---

## Step 1: Setup

```bash
# Clone the repo
git clone https://github.com/COMEALAMAISONGROUPE/THYXEL.git
cd THYXEL

# Install JS dependencies
yarn install

# Configure Solana CLI
solana config set --url devnet  # or mainnet-beta
solana-keygen new -o ~/.config/solana/id.json  # if you don't have a keypair
solana airdrop 2  # devnet only
```

---

## Step 2: Build the Program

```bash
# Build the Anchor program
anchor build

# The program ID will be generated - update it:
# 1. Get the program ID
solana address -k target/deploy/thyxel_hook-keypair.json

# 2. Update these files with the real program ID:
#    - Anchor.toml (all [programs.*] sections)
#    - programs/thyxel-hook/src/lib.rs (declare_id! macro)

# 3. Rebuild after updating
anchor build
```

---

## Step 3: Deploy the Program

```bash
# Deploy to devnet
anchor deploy --provider.cluster devnet

# Or deploy to mainnet
anchor deploy --provider.cluster mainnet-beta

# Verify deployment
solana program show <PROGRAM_ID>
```

---

## Step 4: Create the $THYX Token

```bash
# Set environment variables
export CLUSTER=devnet  # or mainnet-beta
export HOOK_PROGRAM_ID=<your_deployed_program_id>

# Run token creation script
yarn create-token

# This will:
# 1. Create a Token-2022 mint with Transfer Hook
# 2. Create your token account
# 3. Mint 1 billion $THYX
# 4. Save token-info.json
```

---

## Step 5: Initialize the Program

```bash
# Run the deploy/init script
yarn deploy-program

# This will:
# 1. Initialize ThyxelConfig PDA
# 2. Initialize EpochState PDA
# 3. Set initial burn rate (100 bps = 1%)
# 4. Set initial max wallet (500 bps = 5%)
# 5. Set epoch duration (7 days)
# 6. Save deployment.json
```

---

## Step 6: Verify Everything

```bash
# Run the test suite
anchor test

# Check your token
spl-token display <MINT_ADDRESS> --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb

# Check program accounts
solana account <CONFIG_PDA>
solana account <EPOCH_PDA>
```

---

## Step 7: Add Liquidity (Mainnet Launch)

### Option A: Raydium
1. Go to https://raydium.io/liquidity/create-pool/
2. Select Token-2022
3. Pair $THYX with SOL
4. Set initial price and add liquidity
5. Create the pool

### Option B: Jupiter
1. Jupiter auto-indexes new pools
2. Once Raydium pool is live, Jupiter will list $THYX
3. Share the Jupiter swap link

### Option C: Pump.fun / Moonshot
1. These platforms may support Token-2022 in the future
2. Monitor for compatibility updates

---

## Step 8: Marketing Checklist

- [ ] Twitter/X account created (@ThyxelToken)
- [ ] Telegram group created
- [ ] Discord server with DNA-themed channels
- [ ] Landing page live (enable GitHub Pages on /docs)
- [ ] Whitepaper shared
- [ ] DexScreener listing (automatic after pool)
- [ ] BirdEye listing
- [ ] Solscan verified
- [ ] CoinGecko application submitted
- [ ] First epoch countdown announced

---

## Step 9: Enable GitHub Pages (Landing Page)

1. Go to repo Settings > Pages
2. Source: Deploy from branch
3. Branch: main, folder: /docs
4. Save
5. Your landing page will be at: `https://comealamaisongroupe.github.io/THYXEL/`

---

## Step 10: Post-Launch Operations

### Triggering Epoch Mutations
Anyone can trigger a mutation after 7 days:
```bash
# The triggerMutation instruction is permissionless
yarn ts-node -e "
const anchor = require('@coral-xyz/anchor');
// ... trigger mutation code
"
```

### Monitoring
- Track DNA updates via program events
- Monitor burn rates each epoch
- Watch for fossil NFTs from extinct wallets

### Community
- Share DNA profiles
- Celebrate epoch mutations
- Trade/showcase fossils

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Account not found" | Make sure PDAs are initialized |
| "Insufficient funds" | Get more SOL (airdrop on devnet) |
| Build fails | Check Rust/Anchor versions match |
| Token not showing | Use Token-2022 program ID in explorers |
| Transfer Hook not firing | Verify hook program ID matches mint config |

---

## Key Addresses (fill after deployment)

```
Program ID:     <FILL_AFTER_DEPLOY>
Token Mint:     <FILL_AFTER_CREATE>
Config PDA:     <FILL_AFTER_INIT>
Epoch PDA:      <FILL_AFTER_INIT>
Authority:      <YOUR_WALLET>
```

---

*The organism is ready. Give it life.*
