// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {IdentityRegistry} from "../contracts/IdentityRegistry.sol";
import {ValidationRegistry} from "../contracts/ValidationRegistry.sol";
import {IValidationRegistry} from "../contracts/interfaces/IValidationRegistry.sol";
import {IIdentityRegistry} from "../contracts/interfaces/IIdentityRegistry.sol";
import {MockEvvm} from "./mocks/MockEvvm.sol";
import {TestBase} from "./helpers/TestHelpers.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title ValidationRegistryTest
 * @dev Comprehensive test suite for ValidationRegistry contract
 */
contract ValidationRegistryTest is TestBase {
    IdentityRegistry public identityRegistry;
    ValidationRegistry public validationRegistry;
    MockEvvm public mockEvvm;
    
    uint256 constant EVVM_ID = 1;
    uint256 constant REGISTRATION_FEE = 0.005 ether;
    uint256 constant EXPIRATION_SLOTS = 1000;
    
    address public client;
    address public validatorAgentAddress;
    address public serverAgentAddress;
    uint256 public clientPrivateKey;
    uint256 public validatorAgentPrivateKey;
    uint256 public serverAgentPrivateKey;
    
    uint256 public validatorAgentId;
    uint256 public serverAgentId;
    
    string public constant VALIDATOR_DOMAIN = "validator-agent.example.com";
    string public constant SERVER_DOMAIN = "server-agent.example.com";
    
    bytes32 public constant TEST_DATA_HASH = keccak256("test-data");
    bytes32 public constant TEST_DATA_HASH_2 = keccak256("test-data-2");
    
    event ValidationRequestEvent(
        uint256 indexed agentValidatorId,
        uint256 indexed agentServerId,
        bytes32 indexed dataHash
    );
    
    event ValidationResponseEvent(
        uint256 indexed agentValidatorId,
        uint256 indexed agentServerId,
        bytes32 indexed dataHash,
        uint8 response
    );

    function setUp() public {
        // Setup accounts
        clientPrivateKey = 0x1;
        validatorAgentPrivateKey = 0x2;
        serverAgentPrivateKey = 0x3;
        client = vm.addr(clientPrivateKey);
        validatorAgentAddress = vm.addr(validatorAgentPrivateKey);
        serverAgentAddress = vm.addr(serverAgentPrivateKey);
        
        // Deploy mock EVVM
        mockEvvm = new MockEvvm(EVVM_ID);
        
        // Deploy IdentityRegistry
        identityRegistry = new IdentityRegistry(address(mockEvvm));
        
        // Deploy ValidationRegistry
        validationRegistry = new ValidationRegistry(address(identityRegistry), address(mockEvvm));
        
        // Give client some ETH
        vm.deal(client, 100 ether);
        
        // Register validator agent
        uint256 nonce1 = 1;
        string memory message1 = string.concat(
            VALIDATOR_DOMAIN,
            ",",
            Strings.toHexString(uint160(validatorAgentAddress), 20),
            ",",
            Strings.toString(nonce1)
        );
        bytes memory signature1 = generateSignature(EVVM_ID, "newAgent", message1, clientPrivateKey);
        
        vm.prank(client);
        validatorAgentId = identityRegistry.newAgent{value: REGISTRATION_FEE}(
            client,
            VALIDATOR_DOMAIN,
            validatorAgentAddress,
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

    // ============ validationRequest Tests ============

    function test_ValidationRequest_Success() public {
        uint256 nonce = 1;
        string memory message = string.concat(
            Strings.toString(validatorAgentId),
            ",",
            Strings.toString(serverAgentId),
            ",",
            Strings.toHexString(uint256(TEST_DATA_HASH), 32),
            ",",
            Strings.toString(nonce)
        );
        bytes memory signature = generateSignature(EVVM_ID, "updateAgent", message, clientPrivateKey);
        
        validationRegistry.validationRequest(
            client,
            validatorAgentId,
            serverAgentId,
            TEST_DATA_HASH,
            nonce,
            signature
        );
        
        IValidationRegistry.Request memory request = validationRegistry.getValidationRequest(TEST_DATA_HASH);
        assertEq(request.agentValidatorId, validatorAgentId, "Validator ID mismatch");
        assertEq(request.agentServerId, serverAgentId, "Server ID mismatch");
        assertEq(request.dataHash, TEST_DATA_HASH, "Data hash mismatch");
        assertEq(request.timestamp, block.number, "Timestamp should be current block");
        assertFalse(request.responded, "Request should not be responded");
    }

    function test_ValidationRequest_InvalidDataHash() public {
        uint256 nonce = 1;
        string memory message = string.concat(
            Strings.toString(validatorAgentId),
            ",",
            Strings.toString(serverAgentId),
            ",",
            Strings.toHexString(uint256(bytes32(0)), 32),
            ",",
            Strings.toString(nonce)
        );
        bytes memory signature = generateSignature(EVVM_ID, "updateAgent", message, clientPrivateKey);
        
        vm.expectRevert(IValidationRegistry.InvalidDataHash.selector);
        validationRegistry.validationRequest(
            client,
            validatorAgentId,
            serverAgentId,
            bytes32(0),
            nonce,
            signature
        );
    }

    function test_ValidationRequest_AgentNotFound_Validator() public {
        uint256 nonce = 1;
        string memory message = string.concat(
            Strings.toString(999),
            ",",
            Strings.toString(serverAgentId),
            ",",
            Strings.toHexString(uint256(TEST_DATA_HASH), 32),
            ",",
            Strings.toString(nonce)
        );
        bytes memory signature = generateSignature(EVVM_ID, "updateAgent", message, clientPrivateKey);
        
        vm.expectRevert(IValidationRegistry.AgentNotFound.selector);
        validationRegistry.validationRequest(
            client,
            999,
            serverAgentId,
            TEST_DATA_HASH,
            nonce,
            signature
        );
    }

    function test_ValidationRequest_AgentNotFound_Server() public {
        uint256 nonce = 1;
        string memory message = string.concat(
            Strings.toString(validatorAgentId),
            ",",
            Strings.toString(999),
            ",",
            Strings.toHexString(uint256(TEST_DATA_HASH), 32),
            ",",
            Strings.toString(nonce)
        );
        bytes memory signature = generateSignature(EVVM_ID, "updateAgent", message, clientPrivateKey);
        
        vm.expectRevert(IValidationRegistry.AgentNotFound.selector);
        validationRegistry.validationRequest(
            client,
            validatorAgentId,
            999,
            TEST_DATA_HASH,
            nonce,
            signature
        );
    }

    function test_ValidationRequest_InvalidSignature() public {
        uint256 nonce = 1;
        string memory message = string.concat(
            Strings.toString(validatorAgentId),
            ",",
            Strings.toString(serverAgentId),
            ",",
            Strings.toHexString(uint256(TEST_DATA_HASH), 32),
            ",",
            Strings.toString(nonce)
        );
        // Use wrong private key
        bytes memory signature = generateSignature(EVVM_ID, "updateAgent", message, 0x999);
        
        vm.expectRevert(IValidationRegistry.InvalidSignature.selector);
        validationRegistry.validationRequest(
            client,
            validatorAgentId,
            serverAgentId,
            TEST_DATA_HASH,
            nonce,
            signature
        );
    }

    function test_ValidationRequest_NonceAlreadyUsed() public {
        uint256 nonce = 1;
        string memory message = string.concat(
            Strings.toString(validatorAgentId),
            ",",
            Strings.toString(serverAgentId),
            ",",
            Strings.toHexString(uint256(TEST_DATA_HASH), 32),
            ",",
            Strings.toString(nonce)
        );
        bytes memory signature = generateSignature(EVVM_ID, "updateAgent", message, clientPrivateKey);
        
        validationRegistry.validationRequest(
            client,
            validatorAgentId,
            serverAgentId,
            TEST_DATA_HASH,
            nonce,
            signature
        );
        
        // Try to use the same nonce again
        vm.expectRevert(IValidationRegistry.NonceAlreadyUsed.selector);
        validationRegistry.validationRequest(
            client,
            validatorAgentId,
            serverAgentId,
            TEST_DATA_HASH_2,
            nonce,
            signature
        );
    }

    function test_ValidationRequest_ReusesExistingRequest() public {
        uint256 nonce1 = 1;
        string memory message1 = string.concat(
            Strings.toString(validatorAgentId),
            ",",
            Strings.toString(serverAgentId),
            ",",
            Strings.toHexString(uint256(TEST_DATA_HASH), 32),
            ",",
            Strings.toString(nonce1)
        );
        bytes memory signature1 = generateSignature(EVVM_ID, "updateAgent", message1, clientPrivateKey);
        
        validationRegistry.validationRequest(
            client,
            validatorAgentId,
            serverAgentId,
            TEST_DATA_HASH,
            nonce1,
            signature1
        );
        
        // Request again with different nonce (should reuse existing request)
        uint256 nonce2 = 2;
        string memory message2 = string.concat(
            Strings.toString(validatorAgentId),
            ",",
            Strings.toString(serverAgentId),
            ",",
            Strings.toHexString(uint256(TEST_DATA_HASH), 32),
            ",",
            Strings.toString(nonce2)
        );
        bytes memory signature2 = generateSignature(EVVM_ID, "updateAgent", message2, clientPrivateKey);
        
        validationRegistry.validationRequest(
            client,
            validatorAgentId,
            serverAgentId,
            TEST_DATA_HASH,
            nonce2,
            signature2
        );
        
        // Verify the request still exists and hasn't been replaced
        IValidationRegistry.Request memory request = validationRegistry.getValidationRequest(TEST_DATA_HASH);
        assertEq(request.timestamp, block.number - 1, "Timestamp should be from first request");
    }

    // ============ validationResponse Tests ============

    function test_ValidationResponse_Success() public {
        // First create a request
        uint256 nonce1 = 1;
        string memory message1 = string.concat(
            Strings.toString(validatorAgentId),
            ",",
            Strings.toString(serverAgentId),
            ",",
            Strings.toHexString(uint256(TEST_DATA_HASH), 32),
            ",",
            Strings.toString(nonce1)
        );
        bytes memory signature1 = generateSignature(EVVM_ID, "updateAgent", message1, clientPrivateKey);
        
        validationRegistry.validationRequest(
            client,
            validatorAgentId,
            serverAgentId,
            TEST_DATA_HASH,
            nonce1,
            signature1
        );
        
        // Now respond
        uint8 response = 85;
        uint256 nonce2 = 2;
        string memory message2 = string.concat(
            Strings.toHexString(uint256(TEST_DATA_HASH), 32),
            ",",
            Strings.toString(response),
            ",",
            Strings.toString(nonce2)
        );
        bytes memory signature2 = generateSignature(EVVM_ID, "updateAgent", message2, clientPrivateKey);
        
        vm.prank(validatorAgentAddress);
        
        validationRegistry.validationResponse(
            client,
            TEST_DATA_HASH,
            response,
            nonce2,
            signature2
        );
        
        // Verify response
        (bool hasResponse, uint8 storedResponse) = validationRegistry.getValidationResponse(TEST_DATA_HASH);
        assertTrue(hasResponse, "Response should exist");
        assertEq(storedResponse, response, "Response value mismatch");
        
        // Verify request is marked as responded
        IValidationRegistry.Request memory request = validationRegistry.getValidationRequest(TEST_DATA_HASH);
        assertTrue(request.responded, "Request should be marked as responded");
    }

    function test_ValidationResponse_InvalidResponse() public {
        // First create a request
        uint256 nonce1 = 1;
        string memory message1 = string.concat(
            Strings.toString(validatorAgentId),
            ",",
            Strings.toString(serverAgentId),
            ",",
            Strings.toHexString(uint256(TEST_DATA_HASH), 32),
            ",",
            Strings.toString(nonce1)
        );
        bytes memory signature1 = generateSignature(EVVM_ID, "updateAgent", message1, clientPrivateKey);
        
        validationRegistry.validationRequest(
            client,
            validatorAgentId,
            serverAgentId,
            TEST_DATA_HASH,
            nonce1,
            signature1
        );
        
        // Try to respond with invalid value (> 100)
        uint8 invalidResponse = 101;
        uint256 nonce2 = 2;
        string memory message2 = string.concat(
            Strings.toHexString(uint256(TEST_DATA_HASH), 32),
            ",",
            Strings.toString(invalidResponse),
            ",",
            Strings.toString(nonce2)
        );
        bytes memory signature2 = generateSignature(EVVM_ID, "updateAgent", message2, clientPrivateKey);
        
        vm.prank(validatorAgentAddress);
        vm.expectRevert(IValidationRegistry.InvalidResponse.selector);
        validationRegistry.validationResponse(
            client,
            TEST_DATA_HASH,
            invalidResponse,
            nonce2,
            signature2
        );
    }

    function test_ValidationResponse_RequestNotFound() public {
        uint8 response = 85;
        uint256 nonce = 1;
        string memory message = string.concat(
            Strings.toHexString(uint256(TEST_DATA_HASH), 32),
            ",",
            Strings.toString(response),
            ",",
            Strings.toString(nonce)
        );
        bytes memory signature = generateSignature(EVVM_ID, "updateAgent", message, clientPrivateKey);
        
        vm.prank(validatorAgentAddress);
        vm.expectRevert(IValidationRegistry.ValidationRequestNotFound.selector);
        validationRegistry.validationResponse(
            client,
            TEST_DATA_HASH,
            response,
            nonce,
            signature
        );
    }

    function test_ValidationResponse_RequestExpired() public {
        // First create a request
        uint256 nonce1 = 1;
        string memory message1 = string.concat(
            Strings.toString(validatorAgentId),
            ",",
            Strings.toString(serverAgentId),
            ",",
            Strings.toHexString(uint256(TEST_DATA_HASH), 32),
            ",",
            Strings.toString(nonce1)
        );
        bytes memory signature1 = generateSignature(EVVM_ID, "updateAgent", message1, clientPrivateKey);
        
        validationRegistry.validationRequest(
            client,
            validatorAgentId,
            serverAgentId,
            TEST_DATA_HASH,
            nonce1,
            signature1
        );
        
        // Fast forward past expiration
        vm.roll(block.number + EXPIRATION_SLOTS + 1);
        
        uint8 response = 85;
        uint256 nonce2 = 2;
        string memory message2 = string.concat(
            Strings.toHexString(uint256(TEST_DATA_HASH), 32),
            ",",
            Strings.toString(response),
            ",",
            Strings.toString(nonce2)
        );
        bytes memory signature2 = generateSignature(EVVM_ID, "updateAgent", message2, clientPrivateKey);
        
        vm.prank(validatorAgentAddress);
        vm.expectRevert(IValidationRegistry.RequestExpired.selector);
        validationRegistry.validationResponse(
            client,
            TEST_DATA_HASH,
            response,
            nonce2,
            signature2
        );
    }

    function test_ValidationResponse_AlreadyResponded() public {
        // First create a request
        uint256 nonce1 = 1;
        string memory message1 = string.concat(
            Strings.toString(validatorAgentId),
            ",",
            Strings.toString(serverAgentId),
            ",",
            Strings.toHexString(uint256(TEST_DATA_HASH), 32),
            ",",
            Strings.toString(nonce1)
        );
        bytes memory signature1 = generateSignature(EVVM_ID, "updateAgent", message1, clientPrivateKey);
        
        validationRegistry.validationRequest(
            client,
            validatorAgentId,
            serverAgentId,
            TEST_DATA_HASH,
            nonce1,
            signature1
        );
        
        // Respond first time
        uint8 response1 = 85;
        uint256 nonce2 = 2;
        string memory message2 = string.concat(
            Strings.toHexString(uint256(TEST_DATA_HASH), 32),
            ",",
            Strings.toString(response1),
            ",",
            Strings.toString(nonce2)
        );
        bytes memory signature2 = generateSignature(EVVM_ID, "updateAgent", message2, clientPrivateKey);
        
        vm.prank(validatorAgentAddress);
        validationRegistry.validationResponse(
            client,
            TEST_DATA_HASH,
            response1,
            nonce2,
            signature2
        );
        
        // Try to respond again
        uint8 response2 = 90;
        uint256 nonce3 = 3;
        string memory message3 = string.concat(
            Strings.toHexString(uint256(TEST_DATA_HASH), 32),
            ",",
            Strings.toString(response2),
            ",",
            Strings.toString(nonce3)
        );
        bytes memory signature3 = generateSignature(EVVM_ID, "updateAgent", message3, clientPrivateKey);
        
        vm.prank(validatorAgentAddress);
        vm.expectRevert(IValidationRegistry.ValidationAlreadyResponded.selector);
        validationRegistry.validationResponse(
            client,
            TEST_DATA_HASH,
            response2,
            nonce3,
            signature3
        );
    }

    function test_ValidationResponse_InvalidSignature() public {
        // First create a request
        uint256 nonce1 = 1;
        string memory message1 = string.concat(
            Strings.toString(validatorAgentId),
            ",",
            Strings.toString(serverAgentId),
            ",",
            Strings.toHexString(uint256(TEST_DATA_HASH), 32),
            ",",
            Strings.toString(nonce1)
        );
        bytes memory signature1 = generateSignature(EVVM_ID, "updateAgent", message1, clientPrivateKey);
        
        validationRegistry.validationRequest(
            client,
            validatorAgentId,
            serverAgentId,
            TEST_DATA_HASH,
            nonce1,
            signature1
        );
        
        uint8 response = 85;
        uint256 nonce2 = 2;
        string memory message2 = string.concat(
            Strings.toHexString(uint256(TEST_DATA_HASH), 32),
            ",",
            Strings.toString(response),
            ",",
            Strings.toString(nonce2)
        );
        // Use wrong private key
        bytes memory signature2 = generateSignature(EVVM_ID, "updateAgent", message2, 0x999);
        
        vm.prank(validatorAgentAddress);
        vm.expectRevert(IValidationRegistry.InvalidSignature.selector);
        validationRegistry.validationResponse(
            client,
            TEST_DATA_HASH,
            response,
            nonce2,
            signature2
        );
    }

    function test_ValidationResponse_UnauthorizedValidator() public {
        // First create a request
        uint256 nonce1 = 1;
        string memory message1 = string.concat(
            Strings.toString(validatorAgentId),
            ",",
            Strings.toString(serverAgentId),
            ",",
            Strings.toHexString(uint256(TEST_DATA_HASH), 32),
            ",",
            Strings.toString(nonce1)
        );
        bytes memory signature1 = generateSignature(EVVM_ID, "updateAgent", message1, clientPrivateKey);
        
        validationRegistry.validationRequest(
            client,
            validatorAgentId,
            serverAgentId,
            TEST_DATA_HASH,
            nonce1,
            signature1
        );
        
        // Try to respond from wrong address
        uint8 response = 85;
        uint256 nonce2 = 2;
        string memory message2 = string.concat(
            Strings.toHexString(uint256(TEST_DATA_HASH), 32),
            ",",
            Strings.toString(response),
            ",",
            Strings.toString(nonce2)
        );
        bytes memory signature2 = generateSignature(EVVM_ID, "updateAgent", message2, clientPrivateKey);
        
        vm.prank(serverAgentAddress); // Wrong address
        vm.expectRevert(IValidationRegistry.UnauthorizedValidator.selector);
        validationRegistry.validationResponse(
            client,
            TEST_DATA_HASH,
            response,
            nonce2,
            signature2
        );
    }

    function test_ValidationResponse_NonceAlreadyUsed() public {
        // First create a request
        uint256 nonce1 = 1;
        string memory message1 = string.concat(
            Strings.toString(validatorAgentId),
            ",",
            Strings.toString(serverAgentId),
            ",",
            Strings.toHexString(uint256(TEST_DATA_HASH), 32),
            ",",
            Strings.toString(nonce1)
        );
        bytes memory signature1 = generateSignature(EVVM_ID, "updateAgent", message1, clientPrivateKey);
        
        validationRegistry.validationRequest(
            client,
            validatorAgentId,
            serverAgentId,
            TEST_DATA_HASH,
            nonce1,
            signature1
        );
        
        uint8 response = 85;
        uint256 nonce2 = 2;
        string memory message2 = string.concat(
            Strings.toHexString(uint256(TEST_DATA_HASH), 32),
            ",",
            Strings.toString(response),
            ",",
            Strings.toString(nonce2)
        );
        bytes memory signature2 = generateSignature(EVVM_ID, "updateAgent", message2, clientPrivateKey);
        
        vm.prank(validatorAgentAddress);
        validationRegistry.validationResponse(
            client,
            TEST_DATA_HASH,
            response,
            nonce2,
            signature2
        );
        
        // Try to use the same nonce again
        vm.prank(validatorAgentAddress);
        vm.expectRevert(IValidationRegistry.NonceAlreadyUsed.selector);
        validationRegistry.validationResponse(
            client,
            TEST_DATA_HASH_2,
            response,
            nonce2,
            signature2
        );
    }

    // ============ Read Functions Tests ============

    function test_GetValidationRequest_Success() public {
        uint256 nonce = 1;
        string memory message = string.concat(
            Strings.toString(validatorAgentId),
            ",",
            Strings.toString(serverAgentId),
            ",",
            Strings.toHexString(uint256(TEST_DATA_HASH), 32),
            ",",
            Strings.toString(nonce)
        );
        bytes memory signature = generateSignature(EVVM_ID, "updateAgent", message, clientPrivateKey);
        
        validationRegistry.validationRequest(
            client,
            validatorAgentId,
            serverAgentId,
            TEST_DATA_HASH,
            nonce,
            signature
        );
        
        IValidationRegistry.Request memory request = validationRegistry.getValidationRequest(TEST_DATA_HASH);
        assertEq(request.agentValidatorId, validatorAgentId);
        assertEq(request.agentServerId, serverAgentId);
        assertEq(request.dataHash, TEST_DATA_HASH);
        assertEq(request.timestamp, block.number);
        assertFalse(request.responded);
    }

    function test_GetValidationRequest_NotFound() public {
        vm.expectRevert(IValidationRegistry.ValidationRequestNotFound.selector);
        validationRegistry.getValidationRequest(TEST_DATA_HASH);
    }

    function test_IsValidationPending_NotExists() public {
        (bool exists, bool pending) = validationRegistry.isValidationPending(TEST_DATA_HASH);
        assertFalse(exists);
        assertFalse(pending);
    }

    function test_IsValidationPending_ExistsAndPending() public {
        uint256 nonce = 1;
        string memory message = string.concat(
            Strings.toString(validatorAgentId),
            ",",
            Strings.toString(serverAgentId),
            ",",
            Strings.toHexString(uint256(TEST_DATA_HASH), 32),
            ",",
            Strings.toString(nonce)
        );
        bytes memory signature = generateSignature(EVVM_ID, "updateAgent", message, clientPrivateKey);
        
        validationRegistry.validationRequest(
            client,
            validatorAgentId,
            serverAgentId,
            TEST_DATA_HASH,
            nonce,
            signature
        );
        
        (bool exists, bool pending) = validationRegistry.isValidationPending(TEST_DATA_HASH);
        assertTrue(exists);
        assertTrue(pending);
    }

    function test_IsValidationPending_ExistsButResponded() public {
        // Create request
        uint256 nonce1 = 1;
        string memory message1 = string.concat(
            Strings.toString(validatorAgentId),
            ",",
            Strings.toString(serverAgentId),
            ",",
            Strings.toHexString(uint256(TEST_DATA_HASH), 32),
            ",",
            Strings.toString(nonce1)
        );
        bytes memory signature1 = generateSignature(EVVM_ID, "updateAgent", message1, clientPrivateKey);
        
        validationRegistry.validationRequest(
            client,
            validatorAgentId,
            serverAgentId,
            TEST_DATA_HASH,
            nonce1,
            signature1
        );
        
        // Respond
        uint8 response = 85;
        uint256 nonce2 = 2;
        string memory message2 = string.concat(
            Strings.toHexString(uint256(TEST_DATA_HASH), 32),
            ",",
            Strings.toString(response),
            ",",
            Strings.toString(nonce2)
        );
        bytes memory signature2 = generateSignature(EVVM_ID, "updateAgent", message2, clientPrivateKey);
        
        vm.prank(validatorAgentAddress);
        validationRegistry.validationResponse(
            client,
            TEST_DATA_HASH,
            response,
            nonce2,
            signature2
        );
        
        (bool exists, bool pending) = validationRegistry.isValidationPending(TEST_DATA_HASH);
        assertTrue(exists);
        assertFalse(pending);
    }

    function test_IsValidationPending_ExistsButExpired() public {
        uint256 nonce = 1;
        string memory message = string.concat(
            Strings.toString(validatorAgentId),
            ",",
            Strings.toString(serverAgentId),
            ",",
            Strings.toHexString(uint256(TEST_DATA_HASH), 32),
            ",",
            Strings.toString(nonce)
        );
        bytes memory signature = generateSignature(EVVM_ID, "updateAgent", message, clientPrivateKey);
        
        validationRegistry.validationRequest(
            client,
            validatorAgentId,
            serverAgentId,
            TEST_DATA_HASH,
            nonce,
            signature
        );
        
        // Fast forward past expiration
        vm.roll(block.number + EXPIRATION_SLOTS + 1);
        
        (bool exists, bool pending) = validationRegistry.isValidationPending(TEST_DATA_HASH);
        assertTrue(exists);
        assertFalse(pending);
    }

    function test_GetValidationResponse_NoResponse() public {
        (bool hasResponse, uint8 response) = validationRegistry.getValidationResponse(TEST_DATA_HASH);
        assertFalse(hasResponse);
        assertEq(response, 0);
    }

    function test_GetValidationResponse_HasResponse() public {
        // Create request
        uint256 nonce1 = 1;
        string memory message1 = string.concat(
            Strings.toString(validatorAgentId),
            ",",
            Strings.toString(serverAgentId),
            ",",
            Strings.toHexString(uint256(TEST_DATA_HASH), 32),
            ",",
            Strings.toString(nonce1)
        );
        bytes memory signature1 = generateSignature(EVVM_ID, "updateAgent", message1, clientPrivateKey);
        
        validationRegistry.validationRequest(
            client,
            validatorAgentId,
            serverAgentId,
            TEST_DATA_HASH,
            nonce1,
            signature1
        );
        
        // Respond
        uint8 expectedResponse = 85;
        uint256 nonce2 = 2;
        string memory message2 = string.concat(
            Strings.toHexString(uint256(TEST_DATA_HASH), 32),
            ",",
            Strings.toString(expectedResponse),
            ",",
            Strings.toString(nonce2)
        );
        bytes memory signature2 = generateSignature(EVVM_ID, "updateAgent", message2, clientPrivateKey);
        
        vm.prank(validatorAgentAddress);
        validationRegistry.validationResponse(
            client,
            TEST_DATA_HASH,
            expectedResponse,
            nonce2,
            signature2
        );
        
        (bool hasResponse, uint8 response) = validationRegistry.getValidationResponse(TEST_DATA_HASH);
        assertTrue(hasResponse);
        assertEq(response, expectedResponse);
    }

    function test_GetExpirationSlots() public {
        assertEq(validationRegistry.getExpirationSlots(), EXPIRATION_SLOTS);
    }

    function test_ResponseBoundaryValues() public {
        // Create request
        uint256 nonce1 = 1;
        string memory message1 = string.concat(
            Strings.toString(validatorAgentId),
            ",",
            Strings.toString(serverAgentId),
            ",",
            Strings.toHexString(uint256(TEST_DATA_HASH), 32),
            ",",
            Strings.toString(nonce1)
        );
        bytes memory signature1 = generateSignature(EVVM_ID, "updateAgent", message1, clientPrivateKey);
        
        validationRegistry.validationRequest(
            client,
            validatorAgentId,
            serverAgentId,
            TEST_DATA_HASH,
            nonce1,
            signature1
        );
        
        // Test minimum value (0)
        uint8 response0 = 0;
        uint256 nonce2 = 2;
        string memory message2 = string.concat(
            Strings.toHexString(uint256(TEST_DATA_HASH), 32),
            ",",
            Strings.toString(response0),
            ",",
            Strings.toString(nonce2)
        );
        bytes memory signature2 = generateSignature(EVVM_ID, "updateAgent", message2, clientPrivateKey);
        
        vm.prank(validatorAgentAddress);
        validationRegistry.validationResponse(
            client,
            TEST_DATA_HASH,
            response0,
            nonce2,
            signature2
        );
        
        (, uint8 storedResponse) = validationRegistry.getValidationResponse(TEST_DATA_HASH);
        assertEq(storedResponse, response0);
        
        // Test maximum value (100)
        uint256 nonce3 = 3;
        string memory message3 = string.concat(
            Strings.toString(validatorAgentId),
            ",",
            Strings.toString(serverAgentId),
            ",",
            Strings.toHexString(uint256(TEST_DATA_HASH_2), 32),
            ",",
            Strings.toString(nonce3)
        );
        bytes memory signature3 = generateSignature(EVVM_ID, "updateAgent", message3, clientPrivateKey);
        
        validationRegistry.validationRequest(
            client,
            validatorAgentId,
            serverAgentId,
            TEST_DATA_HASH_2,
            nonce3,
            signature3
        );
        
        uint8 response100 = 100;
        uint256 nonce4 = 4;
        string memory message4 = string.concat(
            Strings.toHexString(uint256(TEST_DATA_HASH_2), 32),
            ",",
            Strings.toString(response100),
            ",",
            Strings.toString(nonce4)
        );
        bytes memory signature4 = generateSignature(EVVM_ID, "updateAgent", message4, clientPrivateKey);
        
        vm.prank(validatorAgentAddress);
        validationRegistry.validationResponse(
            client,
            TEST_DATA_HASH_2,
            response100,
            nonce4,
            signature4
        );
        
        (, uint8 storedResponse2) = validationRegistry.getValidationResponse(TEST_DATA_HASH_2);
        assertEq(storedResponse2, response100);
    }
}

