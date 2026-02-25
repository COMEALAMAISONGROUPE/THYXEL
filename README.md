# $THYX - Thyxel: The Living Token

> You don't hold $THYX. You ARE $THYX.

## What is Thyxel?

Thyxel is the first **self-mutating memecoin** on **Solana**. Built with Token-2022 Transfer Hooks, its parameters (burn rate, max wallet) evolve autonomously every 7 days based on the collective behavior of all holders.

Every wallet generates **behavioral DNA**. Every epoch creates a unique **fossil record**. The organism lives, breathes, and mutates on-chain.

## Architecture (Solana)

- **Runtime**: Solana + Anchor Framework
- **Token Standard**: SPL Token-2022 with Transfer Hook Extension
- **Program**: `programs/thyxel-hook/src/lib.rs` (Rust/Anchor)
- **Key Features**:
  - Behavioral DNA (loyalty, activity, appetite) per wallet
  - Epoch-based mutation engine (7-day cycles)
  - Dynamic burn rate (10-500 bps, mutates each epoch)
  - Whale protection (max wallet cap, mutates each epoch)
  - Fossil NFT system for extinct wallets
  - Full on-chain event logging

## Project Structure

```
THYXEL/
  Anchor.toml          # Anchor project config
  Cargo.toml           # Rust workspace
  package.json         # Node dependencies
  programs/
    thyxel-hook/
      Cargo.toml       # Program dependencies
      src/
        lib.rs         # Core Transfer Hook program
  tests/
    thyxel-hook.ts     # Anchor test suite
  scripts/
    create-token.ts    # Token-2022 mint creation
    deploy-solana.ts   # Program deployment
  docs/
    WHITEPAPER.md      # Technical whitepaper
```

## Tokenomics

| Parameter | Value |
|-----------|-------|
| Name | Thyxel |
| Ticker | $THYX |
| Supply | 1,000,000,000 |
| Decimals | 9 |
| Chain | Solana |
| Standard | SPL Token-2022 |
| Burn | Dynamic (1-5%, mutates) |
| Max Wallet | Dynamic (mutates) |
| Epoch | 7 days |

## Behavioral DNA

Every wallet has a DNA profile:
- **Loyalty** (0-255): How long you hold
- **Activity** (0-255): Transfer frequency
- **Appetite** (0-255): Volume per transfer

DNA influences burn rates, mutation outcomes, and fossil rarity.

## Epoch Mutations

Every 7 days, THYXEL mutates:
1. Aggregate all wallet DNAs
2. Compute new burn rate (10-500 bps)
3. Compute new max wallet cap
4. Generate genome hash for the epoch
5. Emit `MutationTriggered` event
6. Previous epoch becomes a fossil record

## Quick Start

```bash
# Install dependencies
yarn install

# Build the program
anchor build

# Run tests
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Create the $THYX token
yarn create-token

# Deploy program + initialize
yarn deploy-program
```

## Links

- Whitepaper: [docs/WHITEPAPER.md](docs/WHITEPAPER.md)
- Program: [programs/thyxel-hook/src/lib.rs](programs/thyxel-hook/src/lib.rs)

## License

MIT
