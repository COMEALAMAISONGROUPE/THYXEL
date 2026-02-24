import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("ThyxelToken", function () {
  async function deployFixture() {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    const ThyxelToken = await ethers.getContractFactory("ThyxelToken");
    const thyxel = await ThyxelToken.deploy();
    return { thyxel, owner, addr1, addr2, addr3 };
  }

  describe("Deployment", function () {
    it("Should set correct name and symbol", async function () {
      const { thyxel } = await deployFixture();
      expect(await thyxel.name()).to.equal("Thyxel");
      expect(await thyxel.symbol()).to.equal("THYX");
    });

    it("Should mint total supply to deployer", async function () {
      const { thyxel, owner } = await deployFixture();
      expect(await thyxel.balanceOf(owner.address)).to.equal(await thyxel.TOTAL_SUPPLY());
    });

    it("Should exclude owner and contract", async function () {
      const { thyxel, owner } = await deployFixture();
      expect(await thyxel.isExcluded(owner.address)).to.be.true;
      expect(await thyxel.isExcluded(await thyxel.getAddress())).to.be.true;
    });
  });

  describe("Transfers and DNA", function () {
    it("Should apply burn and redist taxes", async function () {
      const { thyxel, owner, addr1, addr2 } = await deployFixture();
      const amount = ethers.parseEther("1000000");
      await thyxel.transfer(addr1.address, amount);
      await thyxel.connect(addr1).transfer(addr2.address, amount / 2n);
      const balance = await thyxel.balanceOf(addr2.address);
      expect(balance).to.be.lt(amount / 2n);
    });

    it("Should update wallet DNA on transfer", async function () {
      const { thyxel, owner, addr1 } = await deployFixture();
      await thyxel.transfer(addr1.address, ethers.parseEther("1000"));
      const dna = await thyxel.getWalletDNA(addr1.address);
      expect(dna.txCount).to.equal(1);
    });

    it("Should enforce max wallet", async function () {
      const { thyxel, owner, addr1 } = await deployFixture();
      const tooMuch = await thyxel.TOTAL_SUPPLY();
      await expect(thyxel.transfer(addr1.address, tooMuch)).to.be.revertedWith("THYX: Exceeds max wallet");
    });
  });

  describe("Mutation Engine", function () {
    it("Should reject mutation before epoch ends", async function () {
      const { thyxel } = await deployFixture();
      await expect(thyxel.triggerMutation()).to.be.revertedWith("THYX: Epoch not ended");
    });

    it("Should trigger mutation after 7 days", async function () {
      const { thyxel, owner, addr1 } = await deployFixture();
      await thyxel.transfer(addr1.address, ethers.parseEther("1000"));
      await time.increase(7 * 24 * 60 * 60);
      await expect(thyxel.triggerMutation()).to.emit(thyxel, "Mutation");
    });

    it("Should create fossil record", async function () {
      const { thyxel } = await deployFixture();
      await time.increase(7 * 24 * 60 * 60);
      await thyxel.triggerMutation();
      const fossil = await thyxel.getFossil(0);
      expect(fossil.genomeHash).to.not.equal(ethers.ZeroHash);
    });
  });

  describe("Admin", function () {
    it("Should release to the wild", async function () {
      const { thyxel } = await deployFixture();
      await thyxel.releaseToTheWild();
      expect(await thyxel.isWild()).to.be.true;
      expect(await thyxel.owner()).to.equal(ethers.ZeroAddress);
    });

    it("Should reject setExcluded after wild", async function () {
      const { thyxel, addr1 } = await deployFixture();
      await thyxel.releaseToTheWild();
      await expect(thyxel.setExcluded(addr1.address, true)).to.be.reverted;
    });
  });
});
