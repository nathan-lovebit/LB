const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("Escrow", function () {
  let Escrow, escrow, Token, token, owner, beneficiary, other;
  const amount = ethers.parseEther("1");
  const lockupPeriod = 60 * 60 * 24; // 1 day in seconds

  beforeEach(async () => {
    [owner, beneficiary, other] = await ethers.getSigners();
    Token = await ethers.getContractFactory("LoveBit");
    token = await Token.deploy(owner.address);
    await token.waitForDeployment();

    Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy(token.target);
    await escrow.waitForDeployment();

    await token.approve(escrow.target, amount);
  });

  async function lockTokensAndMoveTime(signer, time) {
    await escrow.connect(signer).lockTokens(beneficiary.address, amount, lockupPeriod);
    await ethers.provider.send("evm_increaseTime", [time]);
  }

  it("should lock tokens correctly", async () => {
    await lockTokensAndMoveTime(owner, 0);
    const lockInfo = await escrow.getLockInfo(beneficiary.address);
    expect(lockInfo.amount).to.equal(amount);
    expect(lockInfo.releaseTime).to.gt(0);
  });

  it("should not allow non-owners to lock tokens", async () => {
    await expect(
      escrow.connect(other).lockTokens(beneficiary.address, amount, lockupPeriod)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("should not release tokens before release time", async () => {
    await lockTokensAndMoveTime(owner, lockupPeriod - 1000);
    await expect(escrow.connect(beneficiary).releaseTokens()).to.be.revertedWith("Tokens are locked");
  });

  it("should release tokens after release time", async () => {
    await lockTokensAndMoveTime(owner, lockupPeriod);
    await escrow.connect(beneficiary).releaseTokens();
    const balance = await token.balanceOf(beneficiary.address);
    expect(balance).to.equal(amount);
  });

  it("should delete lock info after tokens are released", async () => {
    await lockTokensAndMoveTime(owner, lockupPeriod);
    await escrow.connect(beneficiary).releaseTokens();
    const lockInfo = await escrow.getLockInfo(beneficiary.address);
    expect(lockInfo.amount).to.equal(0);
    expect(lockInfo.releaseTime).to.equal(0);
  });

  it("should allow owner to release tokens for beneficiary", async () => {
    await lockTokensAndMoveTime(owner, lockupPeriod)
    await escrow.connect(owner).releaseTokensForBeneficiary(beneficiary.address)
    const balance = await token.balanceOf(beneficiary.address)
    expect(balance).to.equal(amount)
  })

  it("should not allow non-owners to release tokens for beneficiary", async () => {
    await lockTokensAndMoveTime(owner, lockupPeriod)
    await expect(
      escrow.connect(other).releaseTokensForBeneficiary(beneficiary.address)
    ).to.be.revertedWith("Ownable: caller is not the owner")
  })
});