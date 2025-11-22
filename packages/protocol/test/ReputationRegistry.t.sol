// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {IdentityRegistry} from "../contracts/IdentityRegistry.sol";
import {ReputationRegistry} from "../contracts/ReputationRegistry.sol";
import {IReputationRegistry} from "../contracts/interfaces/IReputationRegistry.sol";
import {IIdentityRegistry} from "../contracts/interfaces/IIdentityRegistry.sol";
import {MockEvvm} from "./mocks/MockEvvm.sol";
import {TestBase} from "./helpers/TestHelpers.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title ReputationRegistryTest
 * @dev Comprehensive test suite for ReputationRegistry contract
 */
contract ReputationRegistryTest is TestBase {
    IdentityRegistry public identityRegistry;
    ReputationRegistry public reputationRegistry;
    MockEvvm public mockEvvm;
    
    uint256 constant EVVM_ID = 1;
    uint256 constant REGISTRATION_FEE = 0.005 ether;
    
    address public client;
    address public clientAgentAddress;
    address public serverAgentAddress;
    uint256 public clientPrivateKey;
    uint256 public clientAgentPrivateKey;
    uint256 public serverAgentPrivateKey;
    
    uint256 public clientAgentId;
    uint256 public serverAgentId;
    
    string public constant CLIENT_DOMAIN = "client-agent.example.com";
    string public constant SERVER_DOMAIN = "server-agent.example.com";
    
    event AuthFeedback(
        uint256 indexed agentClientId,
        uint256 indexed agentServerId,
        bytes32 indexed feedbackAuthId
    );

    function setUp() public {
        // Setup accounts
        clientPrivateKey = 0x1;
        clientAgentPrivateKey = 0x2;
        serverAgentPrivateKey = 0x3;
        client = vm.addr(clientPrivateKey);
        clientAgentAddress = vm.addr(clientAgentPrivateKey);
        serverAgentAddress = vm.addr(serverAgentPrivateKey);
        
        // Deploy mock EVVM
        mockEvvm = new MockEvvm(EVVM_ID);
        
        // Deploy IdentityRegistry
        identityRegistry = new IdentityRegistry(address(mockEvvm));
        
        // Deploy ReputationRegistry
        reputationRegistry = new ReputationRegistry(address(identityRegistry), address(mockEvvm));
        
        // Give client some ETH
        vm.deal(client, 100 ether);
        
        // Register client agent
        uint256 nonce1 = 1;
        string memory message1 = string.concat(
            CLIENT_DOMAIN,
            ",",
            Strings.toHexString(uint160(clientAgentAddress), 20),
            ",",
            Strings.toString(nonce1)
        );
        bytes memory signature1 = generateSignature(EVVM_ID, "newAgent", message1, clientPrivateKey);
        
        vm.prank(client);
        clientAgentId = identityRegistry.newAgent{value: REGISTRATION_FEE}(
            client,
            CLIENT_DOMAIN,
            clientAgentAddress,
            nonce1,
            signature1
        );
        
        // Register server agent
        uint256 nonce2 = 2;
        string memory message2 = string.concat(
            SERVER_DOMAIN,
            ",",
            Strings.toHexString(uint160(serverAgentAddress), 20),
            ",",
            Strings.toString(nonce2)
        );
        bytes memory signature2 = generateSignature(EVVM_ID, "newAgent", message2, clientPrivateKey);
        
        vm.prank(client);
        serverAgentId = identityRegistry.newAgent{value: REGISTRATION_FEE}(
            client,
            SERVER_DOMAIN,
            serverAgentAddress,
            nonce2,
            signature2
        );
    }

    // ============ acceptFeedback Tests ============

    function test_AcceptFeedback_Success() public {
        uint256 nonce = 1;
        string memory message = string.concat(
            Strings.toString(clientAgentId),
            ",",
            Strings.toString(serverAgentId),
            ",",
            Strings.toString(nonce)
        );
        bytes memory signature = generateSignature(EVVM_ID, "updateAgent", message, clientPrivateKey);
        
        vm.prank(serverAgentAddress);
        
        reputationRegistry.acceptFeedback(
            client,
            clientAgentId,
            serverAgentId,
            nonce,
            signature
        );
        
        (bool isAuthorized, bytes32 feedbackAuthId) = reputationRegistry.isFeedbackAuthorized(
            clientAgentId,
            serverAgentId
        );
        
        assertTrue(isAuthorized, "Feedback should be authorized");
        assertNotEq(feedbackAuthId, bytes32(0), "Feedback auth ID should not be zero");
    }

    function test_AcceptFeedback_AgentNotFound_Client() public {
        uint256 nonce = 1;
        string memory message = string.concat(
            Strings.toString(999),
            ",",
            Strings.toString(serverAgentId),
            ",",
            Strings.toString(nonce)
        );
        bytes memory signature = generateSignature(EVVM_ID, "updateAgent", message, clientPrivateKey);
        
        vm.prank(serverAgentAddress);
        vm.expectRevert(IReputationRegistry.AgentNotFound.selector);
        reputationRegistry.acceptFeedback(
            client,
            999,
            serverAgentId,
            nonce,
            signature
        );
    }

    function test_AcceptFeedback_AgentNotFound_Server() public {
        uint256 nonce = 1;
        string memory message = string.concat(
            Strings.toString(clientAgentId),
            ",",
            Strings.toString(999),
            ",",
            Strings.toString(nonce)
        );
        bytes memory signature = generateSignature(EVVM_ID, "updateAgent", message, clientPrivateKey);
        
        vm.prank(serverAgentAddress);
        vm.expectRevert(IReputationRegistry.AgentNotFound.selector);
        reputationRegistry.acceptFeedback(
            client,
            clientAgentId,
            999,
            nonce,
            signature
        );
    }

    function test_AcceptFeedback_InvalidSignature() public {
        uint256 nonce = 1;
        string memory message = string.concat(
            Strings.toString(clientAgentId),
            ",",
            Strings.toString(serverAgentId),
            ",",
            Strings.toString(nonce)
        );
        // Use wrong private key
        bytes memory signature = generateSignature(EVVM_ID, "updateAgent", message, 0x999);
        
        vm.prank(serverAgentAddress);
        vm.expectRevert(IReputationRegistry.InvalidSignature.selector);
        reputationRegistry.acceptFeedback(
            client,
            clientAgentId,
            serverAgentId,
            nonce,
            signature
        );
    }

    function test_AcceptFeedback_NonceAlreadyUsed() public {
        uint256 nonce = 1;
        string memory message = string.concat(
            Strings.toString(clientAgentId),
            ",",
            Strings.toString(serverAgentId),
            ",",
            Strings.toString(nonce)
        );
        bytes memory signature = generateSignature(EVVM_ID, "updateAgent", message, clientPrivateKey);
        
        vm.prank(serverAgentAddress);
        reputationRegistry.acceptFeedback(
            client,
            clientAgentId,
            serverAgentId,
            nonce,
            signature
        );
        
        // Try to use the same nonce again
        vm.prank(serverAgentAddress);
        vm.expectRevert(IReputationRegistry.NonceAlreadyUsed.selector);
        reputationRegistry.acceptFeedback(
            client,
            clientAgentId,
            serverAgentId,
            nonce,
            signature
        );
    }

    function test_AcceptFeedback_UnauthorizedFeedback() public {
        uint256 nonce = 1;
        string memory message = string.concat(
            Strings.toString(clientAgentId),
            ",",
            Strings.toString(serverAgentId),
            ",",
            Strings.toString(nonce)
        );
        bytes memory signature = generateSignature(EVVM_ID, "updateAgent", message, clientPrivateKey);
        
        // Try to accept feedback from wrong address (client agent instead of server agent)
        vm.prank(clientAgentAddress);
        vm.expectRevert(IReputationRegistry.UnauthorizedFeedback.selector);
        reputationRegistry.acceptFeedback(
            client,
            clientAgentId,
            serverAgentId,
            nonce,
            signature
        );
    }

    function test_AcceptFeedback_FeedbackAlreadyAuthorized() public {
        uint256 nonce1 = 1;
        string memory message1 = string.concat(
            Strings.toString(clientAgentId),
            ",",
            Strings.toString(serverAgentId),
            ",",
            Strings.toString(nonce1)
        );
        bytes memory signature1 = generateSignature(EVVM_ID, "updateAgent", message1, clientPrivateKey);
        
        vm.prank(serverAgentAddress);
        reputationRegistry.acceptFeedback(
            client,
            clientAgentId,
            serverAgentId,
            nonce1,
            signature1
        );
        
        // Try to authorize again
        uint256 nonce2 = 2;
        string memory message2 = string.concat(
            Strings.toString(clientAgentId),
            ",",
            Strings.toString(serverAgentId),
            ",",
            Strings.toString(nonce2)
        );
        bytes memory signature2 = generateSignature(EVVM_ID, "updateAgent", message2, clientPrivateKey);
        
        vm.prank(serverAgentAddress);
        vm.expectRevert(IReputationRegistry.FeedbackAlreadyAuthorized.selector);
        reputationRegistry.acceptFeedback(
            client,
            clientAgentId,
            serverAgentId,
            nonce2,
            signature2
        );
    }

    // ============ Read Functions Tests ============

    function test_IsFeedbackAuthorized_NotAuthorized() public {
        (bool isAuthorized, bytes32 feedbackAuthId) = reputationRegistry.isFeedbackAuthorized(
            clientAgentId,
            serverAgentId
        );
        
        assertFalse(isAuthorized, "Feedback should not be authorized");
        assertEq(feedbackAuthId, bytes32(0), "Feedback auth ID should be zero");
    }

    function test_IsFeedbackAuthorized_Authorized() public {
        uint256 nonce = 1;
        string memory message = string.concat(
            Strings.toString(clientAgentId),
            ",",
            Strings.toString(serverAgentId),
            ",",
            Strings.toString(nonce)
        );
        bytes memory signature = generateSignature(EVVM_ID, "updateAgent", message, clientPrivateKey);
        
        vm.prank(serverAgentAddress);
        reputationRegistry.acceptFeedback(
            client,
            clientAgentId,
            serverAgentId,
            nonce,
            signature
        );
        
        (bool isAuthorized, bytes32 feedbackAuthId) = reputationRegistry.isFeedbackAuthorized(
            clientAgentId,
            serverAgentId
        );
        
        assertTrue(isAuthorized, "Feedback should be authorized");
        assertNotEq(feedbackAuthId, bytes32(0), "Feedback auth ID should not be zero");
    }

    function test_GetFeedbackAuthId_NotAuthorized() public {
        bytes32 feedbackAuthId = reputationRegistry.getFeedbackAuthId(
            clientAgentId,
            serverAgentId
        );
        
        assertEq(feedbackAuthId, bytes32(0), "Feedback auth ID should be zero");
    }

    function test_GetFeedbackAuthId_Authorized() public {
        uint256 nonce = 1;
        string memory message = string.concat(
            Strings.toString(clientAgentId),
            ",",
            Strings.toString(serverAgentId),
            ",",
            Strings.toString(nonce)
        );
        bytes memory signature = generateSignature(EVVM_ID, "updateAgent", message, clientPrivateKey);
        
        vm.prank(serverAgentAddress);
        reputationRegistry.acceptFeedback(
            client,
            clientAgentId,
            serverAgentId,
            nonce,
            signature
        );
        
        bytes32 feedbackAuthId = reputationRegistry.getFeedbackAuthId(
            clientAgentId,
            serverAgentId
        );
        
        assertNotEq(feedbackAuthId, bytes32(0), "Feedback auth ID should not be zero");
        
        // Verify it matches the one from isFeedbackAuthorized
        (, bytes32 authIdFromCheck) = reputationRegistry.isFeedbackAuthorized(
            clientAgentId,
            serverAgentId
        );
        assertEq(feedbackAuthId, authIdFromCheck, "Auth IDs should match");
    }

    function test_MultipleFeedbackAuthorizations() public {
        // Register a third agent
        address thirdAgentAddress = vm.addr(0x4);
        uint256 thirdAgentPrivateKey = 0x4;
        string memory THIRD_DOMAIN = "third-agent.example.com";
        
        uint256 nonce3 = 3;
        string memory message3 = string.concat(
            THIRD_DOMAIN,
            ",",
            Strings.toHexString(uint160(thirdAgentAddress), 20),
            ",",
            Strings.toString(nonce3)
        );
        bytes memory signature3 = generateSignature(EVVM_ID, "newAgent", message3, clientPrivateKey);
        
        vm.prank(client);
        uint256 thirdAgentId = identityRegistry.newAgent{value: REGISTRATION_FEE}(
            client,
            THIRD_DOMAIN,
            thirdAgentAddress,
            nonce3,
            signature3
        );
        
        // Authorize feedback between client and server
        uint256 nonce1 = 1;
        string memory message1 = string.concat(
            Strings.toString(clientAgentId),
            ",",
            Strings.toString(serverAgentId),
            ",",
            Strings.toString(nonce1)
        );
        bytes memory signature1 = generateSignature(EVVM_ID, "updateAgent", message1, clientPrivateKey);
        
        vm.prank(serverAgentAddress);
        reputationRegistry.acceptFeedback(
            client,
            clientAgentId,
            serverAgentId,
            nonce1,
            signature1
        );
        
        // Authorize feedback between client and third agent
        uint256 nonce2 = 2;
        string memory message2 = string.concat(
            Strings.toString(clientAgentId),
            ",",
            Strings.toString(thirdAgentId),
            ",",
            Strings.toString(nonce2)
        );
        bytes memory signature2 = generateSignature(EVVM_ID, "updateAgent", message2, clientPrivateKey);
        
        vm.prank(thirdAgentAddress);
        reputationRegistry.acceptFeedback(
            client,
            clientAgentId,
            thirdAgentId,
            nonce2,
            signature2
        );
        
        // Verify both authorizations exist
        (bool isAuthorized1, ) = reputationRegistry.isFeedbackAuthorized(
            clientAgentId,
            serverAgentId
        );
        assertTrue(isAuthorized1, "First feedback should be authorized");
        
        (bool isAuthorized2, ) = reputationRegistry.isFeedbackAuthorized(
            clientAgentId,
            thirdAgentId
        );
        assertTrue(isAuthorized2, "Second feedback should be authorized");
        
        // Verify they have different auth IDs
        bytes32 authId1 = reputationRegistry.getFeedbackAuthId(
            clientAgentId,
            serverAgentId
        );
        bytes32 authId2 = reputationRegistry.getFeedbackAuthId(
            clientAgentId,
            thirdAgentId
        );
        assertNotEq(authId1, authId2, "Auth IDs should be different");
    }
}

