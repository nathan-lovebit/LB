// const { expect } = require("chai")
// const { ethers } = require("hardhat")

// describe("MultiBeneficiaryVestingWallet", function () {
//   let VestingWallet, vestingWallet, Token, token, owner, beneficiary

//   beforeEach(async () => {
//     ;[owner, beneficiary, _] = await ethers.getSigners()
    
//     Token = await ethers.getContractFactory("LoveBit")
//     token = await Token.deploy()
//     await token.waitForDeployment()

//     VestingWallet = await ethers.getContractFactory(
//       "MultiBeneficiaryVestingWallet"
//     )
//     vestingWallet = await VestingWallet.deploy(token.target)
//     await vestingWallet.waitForDeployment()

//     await token.transfer(vestingWallet.target, ethers.parseEther("1000"))
//   })

//   it("should add a beneficiary correctly", async () => {
//     await vestingWallet
//       .connect(owner)
//       .addBeneficiary(
//         beneficiary.address,
//         1627776000,
//         86400,
//         86400,
//         ethers.parseEther("10")
//       )
//     const { start, duration, period, releaseAmount, released, status } =
//       await vestingWallet.getBeneficiaryDetails(beneficiary.address)
//     expect(start).to.equal(1627776000)
//     expect(duration).to.equal(86400)
//     expect(period).to.equal(86400)
//     expect(releaseAmount).to.equal(ethers.parseEther("10"))
//     expect(released).to.equal(0)
//     expect(status).to.equal(0)
//   })

//   it("should not allow non-owner to add a beneficiary", async () => {
//     await expect(
//       vestingWallet
//         .connect(beneficiary)
//         .addBeneficiary(
//           beneficiary.address,
//           1627776000,
//           86400,
//           86400,
//           ethers.parseEther("10")
//         )
//     ).to.be.revertedWith("Ownable: caller is not the owner")
//   })

//   it("should release tokens correctly", async () => {
//     await vestingWallet
//       .connect(owner)
//       .addBeneficiary(
//         beneficiary.address,
//         Math.floor(Date.now() / 1000),
//         86400,
//         86400,
//         ethers.parseEther("10")
//       )
//     await vestingWallet.connect(owner).startVesting(beneficiary.address)
//     await ethers.provider.send("evm_increaseTime", [86400]) // Increase time by 1 day
//     await ethers.provider.send("evm_mine") // Mine the next block
//     await vestingWallet["release"](beneficiary.address)
//     const balance = await token.balanceOf(beneficiary.address)
//     expect(balance).to.equal(ethers.parseEther("10"))
//   })

//   it("should release tokens correctly with different durations and periods", async () => {
//     const testCases = [
//       {
//         duration: 86400,
//         period: 86400,
//         expectedRelease: ethers.parseEther("10"),
//       },
//       {
//         duration: 86400 * 2,
//         period: 86400,
//         expectedRelease: ethers.parseEther("5"),
//       },
//       {
//         duration: 86400,
//         period: 86400 / 2,
//         expectedRelease: ethers.parseEther("5"),
//       },
//     ]

//     for (const testCase of testCases) {
//       const start = Math.floor(Date.now() / 1000)
//       await vestingWallet
//         .connect(owner)
//         .addBeneficiary(
//           beneficiary.address,
//           start,
//           testCase.duration,
//           testCase.period,
//           ethers.parseEther("10")
//         )
//       await vestingWallet.connect(owner).startVesting(beneficiary.address)
//       await ethers.provider.send("evm_increaseTime", [testCase.period]) // Increase time by period
//       await ethers.provider.send("evm_mine") // Mine the next block
//       await vestingWallet["release"](beneficiary.address)
//       const balance = await token.balanceOf(beneficiary.address)
//       expect(balance).to.equal(testCase.expectedRelease)

//       // Reset beneficiary for the next test case
//       await vestingWallet.connect(owner).removeBeneficiary(beneficiary.address)
//     }
//   })
// })
