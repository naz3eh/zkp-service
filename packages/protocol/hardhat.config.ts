import { defineConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ignition";
import "@nomicfoundation/hardhat-ethers";

export default defineConfig({
  solidity: {
    version: "0.8.28",
  },
  networks: {
    sepolia: {
      type: "http",
      url: "https://gateway.tenderly.co/public/sepolia",
      accounts: ["pvt_key"],
    },
  },
});
