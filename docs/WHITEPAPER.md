# THYXEL ($THYX) - Whitepaper v2.0
## The First Self-Mutating Organism on Solana

> "You don't hold $THYX. You ARE $THYX."

---

## Abstract

Thyxel is a living on-chain organism built on Solana using SPL Token-2022 with Transfer Hook extensions. Its economic parameters evolve autonomously based on collective holder behavior. Every wallet generates behavioral DNA, every epoch triggers mutations, and extinct wallets leave behind fossil NFTs. This is not a static token - it is a self-mutating digital lifeform.

---

## 1. Architecture

### 1.1 Solana + Token-2022
THYXEL leverages Solana's Token-2022 program with the Transfer Hook extension. Every transfer triggers our custom Anchor program which:
- Updates the sender and receiver's behavioral DNA
- Calculates and applies dynamic burn rates
- Enforces whale protection (max wallet caps)
- Checks epoch boundaries for mutations

### 1.2 Program Design
The core program (`thyxel-hook`) is built with the Anchor framework and implements:
- **ThyxelConfig**: Global configuration PDA storing burn rates, max wallet caps, and epoch parameters
- **WalletDna**: Per-wallet PDA storing loyalty, activity, and appetite scores (u8 each)
- **EpochState**: Global PDA tracking current epoch, mutation history, and genome hashes
- **FossilRecord**: Per-wallet PDA for extinct wallet NFT metadata

### 1.3 PDA Architecture
All state is stored in Program Derived Addresses:
- `[b"thyxel-config"]` -> ThyxelConfig
- `[b"epoch-state"]` -> EpochState
- `[b"wallet-dna", wallet_pubkey]` -> WalletDna
- `[b"fossil", wallet_pubkey]` -> FossilRecord

---

## 2. Behavioral DNA

### 2.1 DNA Components
Each wallet maintains three on-chain DNA metrics (0-255):

| Gene | Measures | Increases When | Decreases When |
|------|----------|----------------|----------------|
| Loyalty | Hold duration | Holding longer | Selling |
| Activity | Transfer frequency | More transfers | Inactivity |
| Appetite | Volume per transfer | Larger transfers | Small transfers |

### 2.2 DNA Computation
DNA updates occur on every transfer via the Transfer Hook:
- Loyalty: Based on time since last transfer
- Activity: Incremented on each transfer, decayed over time
- Appetite: Proportional to transfer amount relative to balance

---

## 3. Epoch Mutation Engine

### 3.1 Epoch Cycle
Every 7 days, THYXEL undergoes a mutation:
1. Aggregate all active wallet DNAs
2. Compute emotional state hash from collective behavior
3. Derive new burn rate (bounded: 10-500 bps)
4. Derive new max wallet cap (bounded: 100-1000 bps)
5. Generate genome hash (keccak256 of epoch data)
6. Emit MutationTriggered event with full details
7. Increment epoch counter

### 3.2 Mutation Bounds
- Burn rate: 0.1% minimum, 5% maximum
- Max wallet: 1% minimum, 10% maximum
- These bounds ensure the organism never self-destructs

### 3.3 Genome Hash
Each epoch produces a unique genome hash from:
- Previous epoch's genome
- Current burn rate
- Current max wallet
- Aggregate DNA scores
- Solana slot number

---

## 4. Fossil System

When a wallet's balance reaches zero, it becomes "extinct" and its DNA is preserved forever as a Fossil Record PDA. Fossils serve as:
- Historical record of the organism's evolution
- Collectible proof of participation
- Input data for future mutation calculations

---

## 5. Tokenomics

| Parameter | Value |
|-----------|-------|
| Name | Thyxel |
| Ticker | $THYX |
| Total Supply | 1,000,000,000 |
| Decimals | 9 |
| Chain | Solana |
| Token Standard | SPL Token-2022 |
| Burn | Dynamic (10-500 bps) |
| Max Wallet | Dynamic (100-1000 bps) |
| Epoch Duration | 7 days |
| Freeze Authority | None (renounced) |

---

## 6. Security

- All PDAs use deterministic seeds - no admin override on DNA
- Epoch mutations are permissionless (anyone can trigger after duration)
- Burn rate and max wallet have hard-coded bounds in the program
- Authority can only initialize; cannot modify post-deployment
- Open-source Anchor program, fully auditable
- No proxy pattern, no upgradability

---

## 7. Roadmap

### Phase 1: Genesis
- Deploy Transfer Hook program to devnet
- Create $THYX Token-2022 mint
- Test epoch mutations and DNA tracking

### Phase 2: Mainnet Birth
- Deploy to Solana mainnet-beta
- Launch on Raydium / Jupiter
- First epoch begins

### Phase 3: Evolution
- Fossil NFT viewer dApp
- DNA explorer dashboard
- Epoch history visualizer
- Community governance for epoch parameters

### Phase 4: Symbiosis
- Cross-program composability
- Fossil marketplace
- DNA-gated experiences
- Partner integrations

---

## 8. Conclusion

THYXEL is not another memecoin. It is the first token that is truly alive on Solana. Its behavior emerges from its holders. Its identity evolves every epoch. Its history is preserved in fossils. You don't trade $THYX - you shape it.

The organism awaits its first breath.

---

*THYXEL Team - 2025*
