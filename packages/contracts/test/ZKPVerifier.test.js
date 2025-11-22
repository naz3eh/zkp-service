const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ZKPVerifier", function () {
  let zkpVerifier;
  let owner;
  let verifier;

  beforeEach(async function () {
    [owner, verifier] = await ethers.getSigners();
    const ZKPVerifier = await ethers.getContractFactory("ZKPVerifier");
    zkpVerifier = await ZKPVerifier.deploy();
    await zkpVerifier.waitForDeployment();
  });

  describe("Proof Submission", function () {
    it("Should submit a proof successfully", async function () {
      const proofId = ethers.id("proof1");
      const proofHash = ethers.id("hash1");

      await expect(zkpVerifier.submitProof(proofId, proofHash))
        .to.emit(zkpVerifier, "ProofSubmitted")
        .withArgs(proofId, owner.address);

      const proof = await zkpVerifier.getProof(proofId);
      expect(proof.proofHash).to.equal(proofHash);
      expect(proof.isVerified).to.equal(false);
    });

    it("Should not allow duplicate proof submission", async function () {
      const proofId = ethers.id("proof1");
      const proofHash = ethers.id("hash1");

      await zkpVerifier.submitProof(proofId, proofHash);
      
      await expect(
        zkpVerifier.submitProof(proofId, proofHash)
      ).to.be.revertedWith("Proof already exists");
    });
  });

  describe("Proof Verification", function () {
    it("Should verify a submitted proof", async function () {
      const proofId = ethers.id("proof1");
      const proofHash = ethers.id("hash1");

      await zkpVerifier.submitProof(proofId, proofHash);

      await expect(zkpVerifier.connect(verifier).verifyProof(proofId))
        .to.emit(zkpVerifier, "ProofVerified")
        .withArgs(proofId, verifier.address);

      const isVerified = await zkpVerifier.isProofVerified(proofId);
      expect(isVerified).to.equal(true);

      const count = await zkpVerifier.verificationCount(verifier.address);
      expect(count).to.equal(1);
    });

    it("Should not verify non-existent proof", async function () {
      const proofId = ethers.id("nonexistent");

      await expect(
        zkpVerifier.verifyProof(proofId)
      ).to.be.revertedWith("Proof does not exist");
    });

    it("Should not verify already verified proof", async function () {
      const proofId = ethers.id("proof1");
      const proofHash = ethers.id("hash1");

      await zkpVerifier.submitProof(proofId, proofHash);
      await zkpVerifier.verifyProof(proofId);

      await expect(
        zkpVerifier.verifyProof(proofId)
      ).to.be.revertedWith("Proof already verified");
    });
  });
});
