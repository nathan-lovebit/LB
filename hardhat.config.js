require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();
const { task } = require("hardhat/config");
const csv = require("csv-parser")
const fs = require("fs")
const readline = require("readline")

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  networks: {
    hardhat: {},
    testnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      chainId: 97,
      gasPrice: 20000000000,
      accounts: [process.env.PRIVATE_KEY_TEST],
      tokenAddress: "0x1B9e41185D4FC851B70297925428C3979e5bfaeF",
    },
    mainnet: {
      url: "https://bsc-dataseed.binance.org/",
      chainId: 56,
      gasPrice: 20000000000,
      accounts:  [process.env.PRIVATE_KEY],
      tokenAddress: "0x8613d52D74a48883A51bAdF8b25ab066714087Da",
      gasPrice: 3000000000, // 3 gwei
    },
    quicknode: {
      url: "https://serene-green-vineyard.bsc.quiknode.pro/e5d1ad430efa995971ff3a59e62f94c13cf03a58/",
      chainId: 56,
      gasPrice: 20000000000,
      accounts:  [process.env.PRIVATE_KEY],
      tokenAddress: "0x8613d52D74a48883A51bAdF8b25ab066714087Da",
      gasPrice: 3000000000, // 3 gwei
    },
  },
  solidity: "0.8.19",
};

task("airdrop", "Run the airdrop script")
  .addParam("csv", "The path to the CSV file")
  .setAction(async (taskArgs, hre) => {
    const tokenAddress = hre.network.config.tokenAddress;
    const TokenContract = await hre.ethers.getContractFactory("ERC20");
    const token = TokenContract.attach(tokenAddress);    
    const wallet = new ethers.Wallet(hre.network.config.accounts[0]);

    const csvFile = taskArgs.csv;
    let recipients = await loadCsvFile(csvFile)

    console.log("RPC:", hre.network.config.url)
    console.log("token:", tokenAddress)
    console.log("sender:", wallet.address)
    console.log("gas price:", hre.network.config.gasPrice)
    console.log("first recipients:", recipients[0].recipient, recipients[0].value)
    console.log("last  recipients:", recipients[recipients.length-1].recipient, recipients[recipients.length-1].value)
    console.log("total recipients:", recipients.length)

    const question = (query) => new Promise(resolve => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
    
      rl.question(query, (answer) => {
        rl.close();
        resolve(answer);
      });
    });

    const answer = await question("Continue? (y/n)");
    if (answer !== "y") {
      console.log("Aborted");
      return;
    }
    
    console.log("Starting transfer...")
    
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i].recipient;
      const value = recipients[i].value;
      const amount = hre.ethers.parseEther(value.toString());
      const tx = await token.transfer(recipient, amount);
      const receipt = await tx.wait();

      const log = `[${i + 1}]${recipients[i].recipient},${recipients[i].value}`;
      console.log(log)
      fs.appendFile(csvFile + ".log", log + "\n", (err) => {
        if (err) {
          console.error(err)
        }
      })
    }
    
    async function loadCsvFile(csvFile) {
      return new Promise((resolve, reject) => {
        let transfers = []
        fs.createReadStream(csvFile)
          .pipe(csv({ headers: false }))
          .on("data", (row) => {
            transfers.push({
              recipient: hre.ethers.getAddress(row[0]),
              value: parseFloat(row[1]),
            })
          })
          .on("end", () => {
            resolve(transfers)
          })
          .on("error", reject)
      });
    }
  });
