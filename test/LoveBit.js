const { ethers } = require("hardhat")
const { expect } = require("chai")

describe("LoveBit", function () {
  let LoveBit, loveBit, owner, addr1, addr2

  beforeEach(async () => {
    LoveBit = await ethers.getContractFactory("LoveBit")
    ;[deployer, owner, addr1, addr2, _] = await ethers.getSigners()
    loveBit = await LoveBit.connect(deployer).deploy(owner.address) // owner 주소를 인수로 전달합니다.
    await loveBit.waitForDeployment()
  })

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await loveBit.owner()).to.equal(owner.address)
    })

    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await loveBit.balanceOf(owner.address)
      expect(await loveBit.totalSupply()).to.equal(ownerBalance)
    })
  })

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      await loveBit.connect(owner).transfer(addr1.address, 50)
      const addr1Balance = await loveBit.balanceOf(addr1.address)
      expect(addr1Balance).to.equal(50)

      await loveBit.connect(addr1).transfer(addr2.address, 50)
      const addr2Balance = await loveBit.balanceOf(addr2.address)
      expect(addr2Balance).to.equal(50)
    })

    it("Should fail if sender doesn’t have enough tokens", async function () {
      // owner가 addr1에게 토큰을 전송합니다.
      await loveBit.connect(owner).transfer(addr1.address, 50)
      const initialOwnerBalance = await loveBit.balanceOf(owner.address)

      // 이제 addr1이 owner에게 토큰을 전송하려고 시도합니다.
      // addr1의 잔액이 50이므로, 51개의 토큰을 전송하려고 시도하면 실패해야 합니다.
      await expect(loveBit.connect(addr1).transfer(owner.address, 51)).to.be
        .reverted

      expect(await loveBit.balanceOf(owner.address)).to.equal(
        initialOwnerBalance
      )
    })

    it("Should correctly approve tokens for a third party", async function () {
      // owner가 addr1에게 100개의 토큰을 전송합니다.
      await loveBit.connect(owner).transfer(addr1.address, 100)

      // addr1이 addr2에게 자신의 토큰 50개를 전송할 수 있도록 승인합니다.
      await loveBit.connect(addr1).approve(addr2.address, 50)

      // addr2가 addr1의 토큰을 전송할 수 있는 양을 확인합니다.
      // 이 값은 addr1이 addr2에게 승인한 양과 같아야 합니다.
      expect(await loveBit.allowance(addr1.address, addr2.address)).to.equal(50)
    })

    it("Should burn the specified amount of tokens", async function () {
      // owner가 addr1에게 100개의 토큰을 전송합니다.
      await loveBit.connect(owner).transfer(addr1.address, 100)

      // addr1이 토큰 50개를 소각합니다.
      await loveBit.connect(addr1).burn(50)

      // addr1의 잔액이 50이 되었는지 확인합니다.
      expect(await loveBit.balanceOf(addr1.address)).to.equal(50)
    })

    it("Should manage the blacklist correctly", async function () {
      // owner가 addr1을 블랙리스트에 추가합니다.
      await loveBit.connect(owner).addToBlackList(addr1.address)

      // addr1이 블랙리스트에 있는지 확인합니다.
      expect(await loveBit.blackList(addr1.address)).to.equal(true)

      // owner가 addr1을 블랙리스트에서 제거합니다.
      await loveBit.connect(owner).removeFromBlackList(addr1.address)

      // addr1이 블랙리스트에서 제거되었는지 확인합니다.
      expect(await loveBit.blackList(addr1.address)).to.equal(false)
    })

    it("Should prevent transfers to and from blacklisted addresses", async function () {
      // owner가 addr1을 블랙리스트에 추가합니다.
      await loveBit.connect(owner).addToBlackList(addr1.address)

      // addr1로의 전송이 차단되는지 확인합니다.
      await expect(
        loveBit.connect(owner).transfer(addr1.address, 100)
      ).to.be.revertedWith("Blacklisted address")

      // addr1에서의 전송이 차단되는지 확인합니다.
      await expect(
        loveBit.connect(addr1).transfer(owner.address, 100)
      ).to.be.revertedWith("Blacklisted address")
    })
  })
})
