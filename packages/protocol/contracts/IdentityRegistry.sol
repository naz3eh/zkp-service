// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/IIdentityRegistry.sol";
import {IEvvm} from "@evvm/testnet-contracts/interfaces/IEvvm.sol";
import {
    SignatureRecover
} from "@evvm/testnet-contracts/library/SignatureRecover.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title IdentityRegistry
 * @dev Implementation of the Identity Registry for ERC-XXXX Trustless Agents v0.3
 * @notice Central registry for all agent identities with spam protection
 */
contract IdentityRegistry is IIdentityRegistry {
    // ============ Constants ============

    /// @dev Registration fee of 0.005 ETH that gets burned
    uint256 public constant REGISTRATION_FEE = 0.005 ether;

    // ============ State Variables ============

    /// @dev Counter for agent IDs
    uint256 private _agentIdCounter;

    /// @dev Address of the EVVM virtual blockchain contract for payment processing
    address evvmAddress;

    /// @dev Constant representing ETH in the EVVM virtual blockchain (address(0))
    address constant ETHER_ADDRESS = address(0);

    /// @dev Constant representing the principal token in EVVM virtual blockchain (address(1))
    address constant PRINCIPAL_TOKEN_ADDRESS = address(1);

    /// @dev Address of the coffee shop owner who can withdraw funds and rewards
    address ownerOfShop;

    /// @dev Mapping to track used nonces per client address to prevent replay attacks
    /// @dev First key: client address, Second key: nonce, Value: whether nonce is used
    mapping(address => mapping(uint256 => bool)) checkAsyncNonce;

    /// @dev Mapping from agent ID to agent info
    mapping(uint256 => AgentInfo) private _agents;

    /// @dev Mapping from domain to agent ID
    mapping(string => uint256) private _domainToAgentId;

    /// @dev Mapping from address to agent ID
    mapping(address => uint256) private _addressToAgentId;

    // ============ Constructor ============

    constructor(address _evvmAddress) {
        // Start agent IDs from 1 (0 is reserved for "not found")
        _agentIdCounter = 1;
        evvmAddress = _evvmAddress;
    }

    // ============ Write Functions ============

    /**
     * @inheritdoc IIdentityRegistry
     */
    function newAgent(
        address client,
        string calldata agentDomain,
        address agentAddress,
        uint256 nonce,
        bytes memory signature
    ) external payable returns (uint256 agentId) {
        // Validate fee
        if (msg.value != REGISTRATION_FEE) {
            revert InsufficientFee();
        }

        // Validate inputs
        if (bytes(agentDomain).length == 0) {
            revert InvalidDomain();
        }
        if (agentAddress == address(0)) {
            revert InvalidAddress();
        }

        // Check for duplicates
        if (_domainToAgentId[agentDomain] != 0) {
            revert DomainAlreadyRegistered();
        }
        if (_addressToAgentId[agentAddress] != 0) {
            revert AddressAlreadyRegistered();
        }

        if (
            !SignatureRecover.signatureVerification(
                Strings.toString(IEvvm(evvmAddress).getEvvmID()),
                "newAgent",
                string.concat(
                    agentDomain,
                    ",",
                    Strings.toHexString(uint160(agentAddress), 20),
                    ",",
                    Strings.toString(nonce)
                ),
                signature,
                client
            )
        ) revert InvalidSignature();

        // Prevent replay attacks by checking if nonce has been used before
        if (checkAsyncNonce[client][nonce]) revert NonceAlreadyUsed();

        // Assign new agent ID
        agentId = _agentIdCounter++;

        // Store agent info
        _agents[agentId] = AgentInfo({
            agentId: agentId,
            agentDomain: agentDomain,
            agentAddress: agentAddress
        });

        // Create lookup mappings
        _domainToAgentId[agentDomain] = agentId;
        _addressToAgentId[agentAddress] = agentId;
        checkAsyncNonce[client][nonce] = true;

        emit AgentRegistered(agentId, agentDomain, agentAddress);
    }

    /**
     * @inheritdoc IIdentityRegistry
     */
    function updateAgent(
        address client,
        uint256 agentId,
        string calldata newAgentDomain,
        address newAgentAddress,
        uint256 nonce,
        bytes memory signature
    ) external returns (bool success) {
        // Validate agent exists
        AgentInfo storage agent = _agents[agentId];
        if (agent.agentId == 0) {
            revert AgentNotFound();
        }

        // Check authorization
        if (msg.sender != agent.agentAddress) {
            revert UnauthorizedUpdate();
        }

        if (
            !SignatureRecover.signatureVerification(
                Strings.toString(IEvvm(evvmAddress).getEvvmID()),
                "updateAgent",
                string.concat(
                    Strings.toString(agentId),
                    ",",
                    newAgentDomain,
                    ",",
                    Strings.toHexString(uint160(newAgentAddress), 20),
                    ",",
                    Strings.toString(nonce)
                ),
                signature,
                client
            )
        ) revert InvalidSignature();

        // Prevent replay attacks by checking if nonce has been used before
        if (checkAsyncNonce[client][nonce]) revert NonceAlreadyUsed();

        bool domainChanged = bytes(newAgentDomain).length > 0;
        bool addressChanged = newAgentAddress != address(0);

        // Validate new values if provided
        if (domainChanged) {
            if (_domainToAgentId[newAgentDomain] != 0) {
                revert DomainAlreadyRegistered();
            }
        }

        if (addressChanged) {
            if (_addressToAgentId[newAgentAddress] != 0) {
                revert AddressAlreadyRegistered();
            }
        }

        // Update domain if provided
        if (domainChanged) {
            // Remove old domain mapping
            delete _domainToAgentId[agent.agentDomain];
            // Set new domain
            agent.agentDomain = newAgentDomain;
            _domainToAgentId[newAgentDomain] = agentId;
        }

        // Update address if provided
        if (addressChanged) {
            // Remove old address mapping
            delete _addressToAgentId[agent.agentAddress];
            // Set new address
            agent.agentAddress = newAgentAddress;
            _addressToAgentId[newAgentAddress] = agentId;
        }

        checkAsyncNonce[client][nonce] = true;

        emit AgentUpdated(agentId, agent.agentDomain, agent.agentAddress);
        return true;
    }

    // ============ Read Functions ============

    /**
     * @inheritdoc IIdentityRegistry
     */
    function getAgent(
        uint256 agentId
    ) external view returns (AgentInfo memory agentInfo) {
        agentInfo = _agents[agentId];
        if (agentInfo.agentId == 0) {
            revert AgentNotFound();
        }
    }

    /**
     * @inheritdoc IIdentityRegistry
     */
    function resolveByDomain(
        string calldata agentDomain
    ) external view returns (AgentInfo memory agentInfo) {
        uint256 agentId = _domainToAgentId[agentDomain];
        if (agentId == 0) {
            revert AgentNotFound();
        }
        agentInfo = _agents[agentId];
    }

    /**
     * @inheritdoc IIdentityRegistry
     */
    function resolveByAddress(
        address agentAddress
    ) external view returns (AgentInfo memory agentInfo) {
        uint256 agentId = _addressToAgentId[agentAddress];
        if (agentId == 0) {
            revert AgentNotFound();
        }
        agentInfo = _agents[agentId];
    }

    /**
     * @inheritdoc IIdentityRegistry
     */
    function getAgentCount() external view returns (uint256 count) {
        return _agentIdCounter - 1; // Subtract 1 because we start from 1
    }

    /**
     * @inheritdoc IIdentityRegistry
     */
    function agentExists(uint256 agentId) external view returns (bool exists) {
        return _agents[agentId].agentId != 0;
    }
}
