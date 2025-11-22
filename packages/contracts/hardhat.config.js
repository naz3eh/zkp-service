import { defineConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-network-helpers";
import "@nomicfoundation/hardhat-verify";

/** @type import('hardhat/config').HardhatUserConfig */
export default defineConfig({
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      type: "edr-simulated",
      chainId: 1337
    },
    localhost: {
      type: "http",
      url: "http://127.0.0.1:8545"
    },
    // EVVM network configuration
    ...(process.env.EVVM_RPC_URL ? {
      evvm: {
        type: "http",
        url: process.env.EVVM_RPC_URL,
        accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        chainId: parseInt(process.env.EVVM_CHAIN_ID || "0")
      }
    } : {}),
    // Oasis Sapphire for ZKP computation
    sapphire: {
      type: "http",
      url: "https://sapphire.oasis.io",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 23294
    },
    "sapphire-testnet": {
      type: "http",
      url: "https://testnet.sapphire.oasis.io",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 23295
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  etherscan: {
    apiKey: {
      sapphire: process.env.OASIS_API_KEY || "",
      evvm: process.env.EVVM_API_KEY || ""
    }
  }
});
