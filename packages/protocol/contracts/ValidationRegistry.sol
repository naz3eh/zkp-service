// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/IValidationRegistry.sol";
import "./interfaces/IIdentityRegistry.sol";
import {IEvvm} from "@evvm/testnet-contracts/interfaces/IEvvm.sol";
import {
    SignatureRecover
} from "@evvm/testnet-contracts/library/SignatureRecover.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title ValidationRegistry
 * @dev Implementation of the Validation Registry for ERC-XXXX Trustless Agents v0.3
 * @notice Provides hooks for requesting and recording independent validation
 */
contract ValidationRegistry is IValidationRegistry {
    // ============ Constants ============

    /// @dev Number of storage slots a validation request remains valid (default: 1000 blocks)
    uint256 public constant EXPIRATION_SLOTS = 1000;

    // ============ State Variables ============

    /// @dev Reference to the IdentityRegistry for agent validation
    IIdentityRegistry public immutable identityRegistry;

    /// @dev Address of the EVVM virtual blockchain contract for payment processing
    address evvmAddress;

    /// @dev Mapping to track used nonces per client address to prevent replay attacks
    /// @dev First key: client address, Second key: nonce, Value: whether nonce is used
    mapping(address => mapping(uint256 => bool)) checkAsyncNonce;

    /// @dev Mapping from data hash to validation request
    mapping(bytes32 => IValidationRegistry.Request) private _validationRequests;

    /// @dev Mapping from data hash to validation response
    mapping(bytes32 => uint8) private _validationResponses;

    /// @dev Mapping from data hash to whether a response exists
    mapping(bytes32 => bool) private _hasResponse;

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
     * @inheritdoc IValidationRegistry
     */
    function validationRequest(
        address client,
        uint256 agentValidatorId,
        uint256 agentServerId,
        bytes32 dataHash,
        uint256 nonce,
        bytes memory signature
    ) external {
        // Validate inputs
        if (dataHash == bytes32(0)) {
            revert InvalidDataHash();
        }

        // Validate that both agents exist
        if (!identityRegistry.agentExists(agentValidatorId)) {
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
                    Strings.toString(agentValidatorId),
                    ",",
                    Strings.toString(agentServerId),
                    ",",
                    Strings.toHexString(uint256(dataHash), 32),
                    ",",
                    Strings.toString(nonce)
                ),
                signature,
                client
            )
        ) revert InvalidSignature();

        // Prevent replay attacks by checking if nonce has been used before
        if (checkAsyncNonce[client][nonce]) revert NonceAlreadyUsed();

        // Check if request already exists and is still valid
        IValidationRegistry.Request
            storage existingRequest = _validationRequests[dataHash];
        if (existingRequest.dataHash != bytes32(0)) {
            if (block.number <= existingRequest.timestamp + EXPIRATION_SLOTS) {
                // Request still exists and is valid, just emit the event again
                emit ValidationRequestEvent(
                    agentValidatorId,
                    agentServerId,
                    dataHash
                );
                return;
            }
        }

        // Create new validation request
        _validationRequests[dataHash] = IValidationRegistry.Request({
            agentValidatorId: agentValidatorId,
            agentServerId: agentServerId,
            dataHash: dataHash,
            timestamp: block.number,
            responded: false
        });

        checkAsyncNonce[client][nonce] = true;

        emit ValidationRequestEvent(agentValidatorId, agentServerId, dataHash);
    }

    /**
     * @inheritdoc IValidationRegistry
     */
    function validationResponse(
        address client,
        bytes32 dataHash,
        uint8 response,
        uint256 nonce,
        bytes memory signature
    ) external {
        // Validate response range (0-100)
        if (response > 100) {
            revert InvalidResponse();
        }

        // Get the validation request
        IValidationRegistry.Request storage request = _validationRequests[
            dataHash
        ];

        // Check if request exists
        if (request.dataHash == bytes32(0)) {
            revert ValidationRequestNotFound();
        }

        // Check if request has expired
        if (block.number > request.timestamp + EXPIRATION_SLOTS) {
            revert RequestExpired();
        }

        // Check if already responded
        if (request.responded) {
            revert ValidationAlreadyResponded();
        }

        if (
            !SignatureRecover.signatureVerification(
                Strings.toString(IEvvm(evvmAddress).getEvvmID()),
                "updateAgent",
                string.concat(
                    Strings.toHexString(uint256(dataHash), 32),
                    ",",
                    Strings.toString(response),
                    ",",
                    Strings.toString(nonce)
                ),
                signature,
                client
            )
        ) revert InvalidSignature();

        // Prevent replay attacks by checking if nonce has been used before
        if (checkAsyncNonce[client][nonce]) revert NonceAlreadyUsed();

        // Get validator agent info to check authorization
        IIdentityRegistry.AgentInfo memory validatorAgent = identityRegistry
            .getAgent(request.agentValidatorId);

        // Only the designated validator can respond
        if (msg.sender != validatorAgent.agentAddress) {
            revert UnauthorizedValidator();
        }

        // Mark as responded and store the response
        request.responded = true;
        _validationResponses[dataHash] = response;
        _hasResponse[dataHash] = true;
        checkAsyncNonce[client][nonce] = true;

        emit ValidationResponseEvent(
            request.agentValidatorId,
            request.agentServerId,
            dataHash,
            response
        );
    }

    // ============ Read Functions ============

    /**
     * @inheritdoc IValidationRegistry
     */
    function getValidationRequest(
        bytes32 dataHash
    ) external view returns (IValidationRegistry.Request memory request) {
        request = _validationRequests[dataHash];
        if (request.dataHash == bytes32(0)) {
            revert ValidationRequestNotFound();
        }
    }

    /**
     * @inheritdoc IValidationRegistry
     */
    function isValidationPending(
        bytes32 dataHash
    ) external view returns (bool exists, bool pending) {
        IValidationRegistry.Request storage request = _validationRequests[
            dataHash
        ];
        exists = request.dataHash != bytes32(0);

        if (exists) {
            // Check if not expired and not responded
            bool expired = block.number > request.timestamp + EXPIRATION_SLOTS;
            pending = !expired && !request.responded;
        }
    }

    /**
     * @inheritdoc IValidationRegistry
     */
    function getValidationResponse(
        bytes32 dataHash
    ) external view returns (bool hasResponse, uint8 response) {
        hasResponse = _hasResponse[dataHash];
        if (hasResponse) {
            response = _validationResponses[dataHash];
        }
    }

    /**
     * @inheritdoc IValidationRegistry
     */
    function getExpirationSlots() external pure returns (uint256 slots) {
        return EXPIRATION_SLOTS;
    }
}
