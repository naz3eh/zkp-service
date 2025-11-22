// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/IReputationRegistry.sol";
import "./interfaces/IIdentityRegistry.sol";
import {IEvvm} from "@evvm/testnet-contracts/interfaces/IEvvm.sol";
import {
    SignatureRecover
} from "@evvm/testnet-contracts/library/SignatureRecover.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title ReputationRegistry
 * @dev Implementation of the Reputation Registry for ERC-XXXX Trustless Agents v0.3
 * @notice Lightweight entry point for task feedback between agents
 */
contract ReputationRegistry is IReputationRegistry {
    // ============ State Variables ============

    /// @dev Reference to the IdentityRegistry for agent validation
    IIdentityRegistry public immutable identityRegistry;

    /// @dev Address of the EVVM virtual blockchain contract for payment processing
    address evvmAddress;

    /// @dev Mapping to track used nonces per client address to prevent replay attacks
    /// @dev First key: client address, Second key: nonce, Value: whether nonce is used
    mapping(address => mapping(uint256 => bool)) checkAsyncNonce;

    /// @dev Mapping from feedback auth ID to whether it exists
    mapping(bytes32 => bool) private _feedbackAuthorizations;

    /// @dev Mapping from client-server pair to feedback auth ID
    mapping(uint256 => mapping(uint256 => bytes32))
        private _clientServerToAuthId;

    // ============ Constructor ============

    /**
     * @dev Constructor sets the identity registry reference
     * @param _identityRegistry Address of the IdentityRegistry contract
     */
    constructor(address _identityRegistry, address _evvmAddress) {
        identityRegistry = IIdentityRegistry(_identityRegistry);
        evvmAddress = _evvmAddress;
    }

    // ============ Write Functions ============

    /**
     * @inheritdoc IReputationRegistry
     */
    function acceptFeedback(
        address client,
        uint256 agentClientId,
        uint256 agentServerId,
        uint256 nonce,
        bytes memory signature
    ) external {
        // Validate that both agents exist
        if (!identityRegistry.agentExists(agentClientId)) {
            revert AgentNotFound();
        }
        if (!identityRegistry.agentExists(agentServerId)) {
            revert AgentNotFound();
        }

        if (
            !SignatureRecover.signatureVerification(
                Strings.toString(IEvvm(evvmAddress).getEvvmID()),
                "updateAgent",
                string.concat(
                    Strings.toString(agentClientId),
                    ",",
                    Strings.toString(agentServerId),
                    ",",
                    Strings.toString(nonce)
                ),
                signature,
                client
            )
        ) revert InvalidSignature();

        // Prevent replay attacks by checking if nonce has been used before
        if (checkAsyncNonce[client][nonce]) revert NonceAlreadyUsed();

        // Get server agent info to check authorization
        IIdentityRegistry.AgentInfo memory serverAgent = identityRegistry
            .getAgent(agentServerId);

        // Only the server agent can authorize feedback
        if (msg.sender != serverAgent.agentAddress) {
            revert UnauthorizedFeedback();
        }

        // Check if feedback is already authorized
        bytes32 existingAuthId = _clientServerToAuthId[agentClientId][
            agentServerId
        ];
        if (existingAuthId != bytes32(0)) {
            revert FeedbackAlreadyAuthorized();
        }

        // Generate unique feedback authorization ID
        bytes32 feedbackAuthId = _generateFeedbackAuthId(
            agentClientId,
            agentServerId
        );

        // Store the authorization
        _feedbackAuthorizations[feedbackAuthId] = true;
        _clientServerToAuthId[agentClientId][agentServerId] = feedbackAuthId;
        checkAsyncNonce[client][nonce] = true;

        emit AuthFeedback(agentClientId, agentServerId, feedbackAuthId);
    }

    // ============ Read Functions ============

    /**
     * @inheritdoc IReputationRegistry
     */
    function isFeedbackAuthorized(
        uint256 agentClientId,
        uint256 agentServerId
    ) external view returns (bool isAuthorized, bytes32 feedbackAuthId) {
        feedbackAuthId = _clientServerToAuthId[agentClientId][agentServerId];
        isAuthorized =
            feedbackAuthId != bytes32(0) &&
            _feedbackAuthorizations[feedbackAuthId];
    }

    /**
     * @inheritdoc IReputationRegistry
     */
    function getFeedbackAuthId(
        uint256 agentClientId,
        uint256 agentServerId
    ) external view returns (bytes32 feedbackAuthId) {
        feedbackAuthId = _clientServerToAuthId[agentClientId][agentServerId];
    }

    // ============ Internal Functions ============

    /**
     * @dev Generates a unique feedback authorization ID
     * @param agentClientId The client agent ID
     * @param agentServerId The server agent ID
     * @return feedbackAuthId The unique authorization ID
     */
    function _generateFeedbackAuthId(
        uint256 agentClientId,
        uint256 agentServerId
    ) private view returns (bytes32 feedbackAuthId) {
        // Include block timestamp and transaction hash for uniqueness
        feedbackAuthId = keccak256(
            abi.encodePacked(
                agentClientId,
                agentServerId,
                block.timestamp,
                block.difficulty, // Use block.difficulty for additional entropy
                tx.origin
            )
        );
    }
}
