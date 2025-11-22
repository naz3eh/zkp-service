// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {SignatureRecover} from "@evvm/testnet-contracts/library/SignatureRecover.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title TestBase
 * @dev Base test contract with helper functions for signature generation
 */
contract TestBase is Test {
    /**
     * @dev Generate a signature for testing using EIP-191 format
     * @param evvmId The EVVM ID
     * @param functionName The function name
     * @param message The message to sign
     * @param signerPrivateKey The private key of the signer
     * @return signature The signature bytes
     */
    function generateSignature(
        uint256 evvmId,
        string memory functionName,
        string memory message,
        uint256 signerPrivateKey
    ) internal returns (bytes memory signature) {
        // Create the message hash following EIP-191 format
        // Format: evvmId + functionName + message
        string memory fullMessage = string.concat(
            Strings.toString(evvmId),
            functionName,
            message
        );
        
        bytes32 messageHash = keccak256(abi.encodePacked(fullMessage));
        
        // Generate signature using the signer's private key
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerPrivateKey, messageHash);
        signature = abi.encodePacked(r, s, v);
    }

    /**
     * @dev Verify a signature using SignatureRecover
     * @param evvmId The EVVM ID
     * @param functionName The function name
     * @param message The message
     * @param signature The signature to verify
     * @param expectedSigner The expected signer address
     * @return isValid Whether the signature is valid
     */
    function verifySignature(
        uint256 evvmId,
        string memory functionName,
        string memory message,
        bytes memory signature,
        address expectedSigner
    ) internal view returns (bool isValid) {
        return SignatureRecover.signatureVerification(
            Strings.toString(evvmId),
            functionName,
            message,
            signature,
            expectedSigner
        );
    }
}

