// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ThyxelToken ($THYX)
 * @notice The Living Token - Self-mutating memecoin.
 *         You don't hold $THYX. You ARE $THYX.
 */
contract ThyxelToken is ERC20, Ownable {

    struct WalletDNA {
        uint256 firstInteraction;
        uint256 lastInteraction;
        uint256 txCount;
        uint256 totalVolume;
        uint8 loyaltyGene;
        uint8 activityGene;
        uint8 appetiteGene;
    }

    struct Epoch {
        uint256 startTime;
        uint256 endTime;
        uint256 totalTxCount;
        uint256 totalVolume;
        uint256 uniqueTraders;
        uint16 burnRate;
        uint16 redistRate;
        uint16 maxWalletRate;
        string emotionalState;
        bytes32 genomeHash;
    }

    uint256 public constant TOTAL_SUPPLY = 404_000_000_000 * 1e18;
    uint256 public constant EPOCH_DURATION = 7 days;

    uint16 public constant MIN_BURN = 10;
    uint16 public constant MAX_BURN = 300;
    uint16 public constant MIN_REDIST = 0;
    uint16 public constant MAX_REDIST = 200;
    uint16 public constant MIN_MAX_WALLET = 50;
    uint16 public constant MAX_MAX_WALLET = 200;

    uint16 public currentBurnRate = 100;
    uint16 public currentRedistRate = 50;
    uint16 public currentMaxWallet = 150;

    uint256 public currentEpochId;
    uint256 public epochStartTime;
    uint256 public epochTxCount;
    uint256 public epochVolume;
    uint256 public epochUniqueTraders;

    mapping(address => WalletDNA) public walletDNA;
    mapping(uint256 => Epoch) public fossilRecord;
    mapping(uint256 => mapping(address => bool)) public epochTraderTracked;

    uint256 public redistPool;
    mapping(address => bool) public isExcluded;
    bool public isWild;

    event Mutation(uint256 indexed epochId, uint16 newBurnRate, uint16 newRedistRate, uint16 newMaxWallet, string emotionalState, bytes32 genomeHash);
    event DNAUpdated(address indexed wallet, uint8 loyalty, uint8 activity, uint8 appetite);
    event FossilCreated(uint256 indexed epochId, bytes32 genomeHash);
    event ReleasedToTheWild();
    event RedistClaimed(address indexed wallet, uint256 amount);

    constructor() ERC20("Thyxel", "THYX") Ownable(msg.sender) {
        _mint(msg.sender, TOTAL_SUPPLY);
        epochStartTime = block.timestamp;
        isExcluded[msg.sender] = true;
        isExcluded[address(this)] = true;
    }

    function _update(address from, address to, uint256 amount) internal override {
        if (from == address(0) || to == address(0)) {
            super._update(from, to, amount);
            return;
        }

        if (!isExcluded[to]) {
            uint256 maxAmt = (TOTAL_SUPPLY * currentMaxWallet) / 10000;
            require(balanceOf(to) + amount <= maxAmt, "THYX: Exceeds max wallet");
        }

        uint256 burnAmt = 0;
        uint256 redistAmt = 0;

        if (!isExcluded[from] && !isExcluded[to]) {
            burnAmt = (amount * currentBurnRate) / 10000;
            redistAmt = (amount * currentRedistRate) / 10000;
        }

        uint256 transferAmt = amount - burnAmt - redistAmt;

        if (burnAmt > 0) super._update(from, address(0), burnAmt);
        if (redistAmt > 0) {
            super._update(from, address(this), redistAmt);
            redistPool += redistAmt;
        }
        super._update(from, to, transferAmt);

        _updateDNA(from, amount);
        _updateDNA(to, amount);

        epochTxCount++;
        epochVolume += amount;
        if (!epochTraderTracked[currentEpochId][from]) {
            epochTraderTracked[currentEpochId][from] = true;
            epochUniqueTraders++;
        }
        if (!epochTraderTracked[currentEpochId][to]) {
            epochTraderTracked[currentEpochId][to] = true;
            epochUniqueTraders++;
        }
    }

    function _updateDNA(address wallet, uint256 amount) internal {
        WalletDNA storage dna = walletDNA[wallet];
        if (dna.firstInteraction == 0) dna.firstInteraction = block.timestamp;
        dna.lastInteraction = block.timestamp;
        dna.txCount++;
        dna.totalVolume += amount;

        uint256 holdDuration = block.timestamp - dna.firstInteraction;
        dna.loyaltyGene = uint8(_min((holdDuration / 1 days), 100));
        dna.activityGene = uint8(_min(dna.txCount, 100));
        dna.appetiteGene = uint8(_min(dna.totalVolume / (TOTAL_SUPPLY / 10000), 100));

        emit DNAUpdated(wallet, dna.loyaltyGene, dna.activityGene, dna.appetiteGene);
    }

    function triggerMutation() external {
        require(block.timestamp >= epochStartTime + EPOCH_DURATION, "THYX: Epoch not ended");

        string memory emotion = _calculateEmotion();
        _mutateParameters();

        bytes32 genomeHash = keccak256(abi.encodePacked(currentEpochId, currentBurnRate, currentRedistRate, currentMaxWallet, epochTxCount, epochVolume, block.timestamp));

        fossilRecord[currentEpochId] = Epoch(epochStartTime, block.timestamp, epochTxCount, epochVolume, epochUniqueTraders, currentBurnRate, currentRedistRate, currentMaxWallet, emotion, genomeHash);

        emit FossilCreated(currentEpochId, genomeHash);
        emit Mutation(currentEpochId, currentBurnRate, currentRedistRate, currentMaxWallet, emotion, genomeHash);

        currentEpochId++;
        epochStartTime = block.timestamp;
        epochTxCount = 0;
        epochVolume = 0;
        epochUniqueTraders = 0;
    }

    function _calculateEmotion() internal view returns (string memory) {
        if (epochTxCount == 0) return "DORMANT";
        uint256 avgVol = epochVolume / epochTxCount;
        uint256 threshold = TOTAL_SUPPLY / 100000;
        if (epochTxCount > 1000 && avgVol > threshold) return "FRENZY";
        if (epochTxCount > 500) return "ACTIVE";
        if (epochTxCount > 100) return "CALM";
        return "DORMANT";
    }

    function _mutateParameters() internal {
        if (epochTxCount > 500) {
            currentBurnRate = uint16(_min(currentBurnRate + 20, MAX_BURN));
            currentRedistRate = uint16(_min(currentRedistRate + 10, MAX_REDIST));
        } else if (epochTxCount > 100) {
            if (currentBurnRate > 50) currentBurnRate -= 10;
            if (currentRedistRate > 20) currentRedistRate -= 5;
        } else {
            currentBurnRate = uint16(_max(currentBurnRate - 30, MIN_BURN));
            currentRedistRate = uint16(_max(currentRedistRate - 15, MIN_REDIST));
        }

        if (epochUniqueTraders < 50 && epochVolume > TOTAL_SUPPLY / 100) {
            currentMaxWallet = uint16(_max(currentMaxWallet - 10, MIN_MAX_WALLET));
        } else if (epochUniqueTraders > 200) {
            currentMaxWallet = uint16(_min(currentMaxWallet + 10, MAX_MAX_WALLET));
        }
    }

    function claimRedist() external {
        require(balanceOf(msg.sender) > 0, "THYX: No balance");
        uint256 share = (redistPool * balanceOf(msg.sender)) / totalSupply();
        require(share > 0, "THYX: Nothing to claim");
        redistPool -= share;
        super._update(address(this), msg.sender, share);
        emit RedistClaimed(msg.sender, share);
    }

    function setExcluded(address account, bool excluded) external onlyOwner {
        require(!isWild, "THYX: Already wild");
        isExcluded[account] = excluded;
    }

    function releaseToTheWild() external onlyOwner {
        isWild = true;
        renounceOwnership();
        emit ReleasedToTheWild();
    }

    function getWalletDNA(address wallet) external view returns (WalletDNA memory) {
        return walletDNA[wallet];
    }

    function getFossil(uint256 epochId) external view returns (Epoch memory) {
        return fossilRecord[epochId];
    }

    function getCurrentGenome() external view returns (uint16, uint16, uint16, uint256, uint256, uint256, uint256) {
        return (currentBurnRate, currentRedistRate, currentMaxWallet, epochTxCount, epochVolume, epochUniqueTraders, epochStartTime + EPOCH_DURATION);
    }

    function maxWalletAmount() external view returns (uint256) {
        return (TOTAL_SUPPLY * currentMaxWallet) / 10000;
    }

    function timeUntilMutation() external view returns (uint256) {
        if (block.timestamp >= epochStartTime + EPOCH_DURATION) return 0;
        return (epochStartTime + EPOCH_DURATION) - block.timestamp;
    }

    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    function _max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? a : b;
    }
}
