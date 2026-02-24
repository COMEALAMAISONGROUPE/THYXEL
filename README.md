# $THYX - Thyxel: The Living Token

> You don't hold $THYX. You ARE $THYX.

## What is Thyxel?

Thyxel is the first **self-mutating memecoin** on Base. Its parameters (burn rate, redistribution, max wallet) evolve autonomously every 7 days based on the collective behavior of all holders.

Every wallet generates **behavioral DNA**. Every epoch creates a unique **fossil record**. The organism lives, breathes, and mutates on-chain.

## Core Mechanics

### Behavioral DNA
Each wallet builds a DNA profile from on-chain activity:
- **Loyalty Gene** - How long you hold
- **Activity Gene** - How often you transact
- **Appetite Gene** - How much volume you generate

### Epoch Mutations (every 7 days)
The contract reads aggregate behavior and mutates:
- **Burn Rate**: 0.1% - 3%
- **Redistribution Rate**: 0% - 2%
- **Max Wallet**: 0.5% - 2%

### Emotional States
Based on activity, the organism enters states: `DORMANT`, `CALM`, `ACTIVE`, `FRENZY`

### Fossil Record
Each epoch state is stored immutably on-chain with a unique genome hash - an archaeological record of the organism's evolution.

## Tokenomics

| Parameter | Value |
|---|---|
| Name | Thyxel |
| Symbol | THYX |
| Total Supply | 404,000,000,000 |
| Initial Burn | 1% |
| Initial Redist | 0.5% |
| Max Wallet | 1.5% |
| Chain | Base |

## Quick Start

```bash
git clone https://github.com/COMEALAMAISONGROUPE/THYXEL.git
cd THYXEL
npm install
cp .env.example .env  # add your keys
npx hardhat compile
npx hardhat test
```

## Deploy

```bash
npx hardhat run scripts/deploy.ts --network baseSepolia
```

## Project Structure

```
contracts/
  ThyxelToken.sol    # Main token + DNA + mutation engine
scripts/
  deploy.ts          # Deployment script
test/
  ThyxelToken.test.ts # Test suite (9 tests)
```

## Security

- Ownership can be permanently renounced via `releaseToTheWild()`
- All mutation parameters have hard-coded min/max boundaries
- Anti-whale protection via dynamic max wallet
- Open source and auditable

## License

MIT
