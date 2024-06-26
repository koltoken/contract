import * as dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-insight";
import "hardhat-gas-reporter";
import "hardhat-contract-sizer";
import "@nomicfoundation/hardhat-ledger";

dotenv.config();

const DEFAULT_COMPILER = {
  version: "0.8.20",
  settings: {
    viaIR: false,
    optimizer: {
      enabled: true,
      runs: 800,
    },
    metadata: {
      // do not include the metadata hash, since this is machine dependent
      // and we want all generated code to be deterministic
      // https://docs.soliditylang.org/en/v0.8.20/metadata.html
      bytecodeHash: "none",
    },
  },
};

const config: HardhatUserConfig = {
  solidity: {
    compilers: [DEFAULT_COMPILER],
  },
  networks: {
    hardhat: {
      accounts: {
        accountsBalance: "10000000001000000000000000000",
      },
    },
    sepolia: {
      url: `${process.env.SEPOLIA_RPC_URL}`,
      accounts: process.env.SEPOLIA_PRIVATE_KEY !== undefined ? [process.env.SEPOLIA_PRIVATE_KEY] : [],
    },
    "base-sepolia": {
      url: `${process.env.BASE_SEPOLIA_RPC_URL}`,
      // ledgerAccounts: process.env.LEDGER_DEPLOY_ADDRESS !== undefined ? [process.env.LEDGER_DEPLOY_ADDRESS] : [],
      accounts: process.env.BASE_SEPOLIA_PRIVATE_KEY !== undefined && process.env.SIGN_PRIVATE_KEY !== undefined ? [process.env.BASE_SEPOLIA_PRIVATE_KEY, process.env.SIGN_PRIVATE_KEY] : [],
    },
    "arbitrum-sepolia": {
      url: `${process.env.ARBITRUM_SEPOLIA_RPC_URL}`,
      // ledgerAccounts: process.env.LEDGER_DEPLOY_ADDRESS !== undefined ? [process.env.LEDGER_DEPLOY_ADDRESS] : [],
      accounts: process.env.ARBITRUM_SEPOLIA_PRIVATE_KEY !== undefined ? [process.env.ARBITRUM_SEPOLIA_PRIVATE_KEY] : [],
    },
    arbitrum: {
      url: `${process.env.ARBITRUM_MAINNET_RPC_URL}`,
      // ledgerAccounts: process.env.LEDGER_DEPLOY_ADDRESS !== undefined ? [process.env.LEDGER_DEPLOY_ADDRESS] : [],
      accounts: process.env.ARBITRUM_MAINNET_PRIVATE_KEY !== undefined ? [process.env.ARBITRUM_MAINNET_PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: process.env.ARBITRUM_MAINNET_SCAN_API_KEY,
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
  },
  gasReporter: {
    enabled: true,
  },
};

export default config;
