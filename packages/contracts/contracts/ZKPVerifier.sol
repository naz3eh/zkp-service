// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ZKPVerifier
 * @dev Zero-Knowledge Proof Verifier contract for Oasis Sapphire
 * This contract provides the foundation for ZKP verification services
 */
contract ZKPVerifier {
    struct Proof {
        bytes32 proofHash;
        address verifier;
        uint256 timestamp;
        bool isVerified;
    }

    mapping(bytes32 => Proof) public proofs;
    mapping(address => uint256) public verificationCount;

    event ProofSubmitted(bytes32 indexed proofId, address indexed submitter);
    event ProofVerified(bytes32 indexed proofId, address indexed verifier);

    /**
     * @dev Submit a zero-knowledge proof for verification
     * @param proofId Unique identifier for the proof
     * @param proofHash Hash of the proof data
     */
    function submitProof(bytes32 proofId, bytes32 proofHash) external {
        require(proofs[proofId].timestamp == 0, "Proof already exists");
        
        proofs[proofId] = Proof({
            proofHash: proofHash,
            verifier: address(0),
            timestamp: block.timestamp,
            isVerified: false
        });

        emit ProofSubmitted(proofId, msg.sender);
    }

    /**
     * @dev Verify a submitted proof
     * @param proofId Unique identifier for the proof
     */
    function verifyProof(bytes32 proofId) external {
        require(proofs[proofId].timestamp != 0, "Proof does not exist");
        require(!proofs[proofId].isVerified, "Proof already verified");

        proofs[proofId].isVerified = true;
        proofs[proofId].verifier = msg.sender;
        verificationCount[msg.sender]++;

        emit ProofVerified(proofId, msg.sender);
    }

    /**
     * @dev Get proof details
     * @param proofId Unique identifier for the proof
     */
    function getProof(bytes32 proofId) external view returns (Proof memory) {
        return proofs[proofId];
    }

    /**
     * @dev Check if a proof is verified
     * @param proofId Unique identifier for the proof
     */
    function isProofVerified(bytes32 proofId) external view returns (bool) {
        return proofs[proofId].isVerified;
    }
}
