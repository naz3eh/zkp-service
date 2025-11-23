// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {IdentityRegistry} from "../contracts/IdentityRegistry.sol";
import {IIdentityRegistry} from "../contracts/interfaces/IIdentityRegistry.sol";
import {TestBase} from "./helpers/TestHelpers.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title IdentityRegistryTest
 */
contract IdentityRegistryTest is TestBase {
    IdentityRegistry public identityRegistry;

    uint256 constant REGISTRATION_FEE = 0.005 ether;
    uint256 constant EVVM_ID = 2;

    address public client;
    address public agentAddress;
    uint256 public clientPrivateKey;
    uint256 public agentPrivateKey;

    string public constant TEST_DOMAIN = "test-agent.example.com";
    string public constant TEST_DOMAIN_2 = "test-agent-2.example.com";

    event AgentRegistered(
        uint256 indexed agentId,
        string agentDomain,
        address agentAddress
    );
    event AgentUpdated(
        uint256 indexed agentId,
        string agentDomain,
        address agentAddress
    );

    function setUp() public {
        vm.createSelectFork("https://gateway.tenderly.co/public/sepolia");

        // Setup accounts
        clientPrivateKey = 0x1;
        agentPrivateKey = 0x2;
        client = vm.addr(clientPrivateKey);
        agentAddress = vm.addr(agentPrivateKey);

        address eevm = 0x9902984d86059234c3B6e11D5eAEC55f9627dD0f;

        identityRegistry = new IdentityRegistry(eevm);

        vm.deal(client, 100 ether);
    }

    function test_NewAgent() public {
        uint256 nonce = 1;
        string memory message = string.concat(
            TEST_DOMAIN,
            ",",
            Strings.toHexString(uint160(agentAddress), 20),
            ",",
            Strings.toString(nonce)
        );
        bytes memory signature = generateSignature(
            EVVM_ID,
            "newAgent",
            message,
            clientPrivateKey
        );

        // vm.prank(client);
        uint256 agentId = identityRegistry.newAgent{value: REGISTRATION_FEE}(
            client,
            TEST_DOMAIN,
            agentAddress,
            nonce,
            signature
        );

        assertEq(agentId, 1, "Agent ID should be 1");

        IIdentityRegistry.AgentInfo memory agent = identityRegistry.getAgent(
            agentId
        );
        assertEq(agent.agentId, agentId, "Agent ID mismatch");
        assertEq(agent.agentDomain, TEST_DOMAIN, "Agent domain mismatch");
        assertEq(agent.agentAddress, agentAddress, "Agent address mismatch");

        assertEq(
            identityRegistry.getAgentCount(),
            1,
            "Agent count should be 1"
        );
        assertTrue(identityRegistry.agentExists(agentId), "Agent should exist");
    }

    function test_NewAgent_InsufficientFee() public {
        uint256 nonce = 1;
        string memory message = string.concat(
            TEST_DOMAIN,
            ",",
            Strings.toHexString(uint160(agentAddress), 20),
            ",",
            Strings.toString(nonce)
        );
        bytes memory signature = generateSignature(
            EVVM_ID,
            "newAgent",
            message,
            clientPrivateKey
        );

        vm.prank(client);
        vm.expectRevert(IIdentityRegistry.InsufficientFee.selector);
        identityRegistry.newAgent{value: REGISTRATION_FEE - 1}(
            client,
            TEST_DOMAIN,
            agentAddress,
            nonce,
            signature
        );
    }

    function test_NewAgent_InvalidDomain() public {
        uint256 nonce = 1;
        string memory message = string.concat(
            "",
            ",",
            Strings.toHexString(uint160(agentAddress), 20),
            ",",
            Strings.toString(nonce)
        );
        bytes memory signature = generateSignature(
            EVVM_ID,
            "newAgent",
            message,
            clientPrivateKey
        );

        vm.prank(client);
        vm.expectRevert(IIdentityRegistry.InvalidDomain.selector);
        identityRegistry.newAgent{value: REGISTRATION_FEE}(
            client,
            "",
            agentAddress,
            nonce,
            signature
        );
    }

    function test_NewAgent_InvalidAddress() public {
        uint256 nonce = 1;
        string memory message = string.concat(
            TEST_DOMAIN,
            ",",
            Strings.toHexString(uint160(address(0)), 20),
            ",",
            Strings.toString(nonce)
        );
        bytes memory signature = generateSignature(
            EVVM_ID,
            "newAgent",
            message,
            clientPrivateKey
        );

        vm.prank(client);
        vm.expectRevert(IIdentityRegistry.InvalidAddress.selector);
        identityRegistry.newAgent{value: REGISTRATION_FEE}(
            client,
            TEST_DOMAIN,
            address(0),
            nonce,
            signature
        );
    }

    function test_NewAgent_DomainAlreadyRegistered() public {
        uint256 nonce1 = 1;
        string memory message1 = string.concat(
            TEST_DOMAIN,
            ",",
            Strings.toHexString(uint160(agentAddress), 20),
            ",",
            Strings.toString(nonce1)
        );
        bytes memory signature1 = generateSignature(
            EVVM_ID,
            "newAgent",
            message1,
            clientPrivateKey
        );

        vm.prank(client);
        identityRegistry.newAgent{value: REGISTRATION_FEE}(
            client,
            TEST_DOMAIN,
            agentAddress,
            nonce1,
            signature1
        );

        address agentAddress2 = vm.addr(0x3);
        uint256 nonce2 = 2;
        string memory message2 = string.concat(
            TEST_DOMAIN,
            ",",
            Strings.toHexString(uint160(agentAddress2), 20),
            ",",
            Strings.toString(nonce2)
        );
        bytes memory signature2 = generateSignature(
            EVVM_ID,
            "newAgent",
            message2,
            clientPrivateKey
        );

        vm.prank(client);
        vm.expectRevert(IIdentityRegistry.DomainAlreadyRegistered.selector);
        identityRegistry.newAgent{value: REGISTRATION_FEE}(
            client,
            TEST_DOMAIN,
            agentAddress2,
            nonce2,
            signature2
        );
    }

    function test_NewAgent_AddressAlreadyRegistered() public {
        uint256 nonce1 = 1;
        string memory message1 = string.concat(
            TEST_DOMAIN,
            ",",
            Strings.toHexString(uint160(agentAddress), 20),
            ",",
            Strings.toString(nonce1)
        );
        bytes memory signature1 = generateSignature(
            EVVM_ID,
            "newAgent",
            message1,
            clientPrivateKey
        );

        vm.prank(client);
        identityRegistry.newAgent{value: REGISTRATION_FEE}(
            client,
            TEST_DOMAIN,
            agentAddress,
            nonce1,
            signature1
        );

        uint256 nonce2 = 2;
        string memory message2 = string.concat(
            TEST_DOMAIN_2,
            ",",
            Strings.toHexString(uint160(agentAddress), 20),
            ",",
            Strings.toString(nonce2)
        );
        bytes memory signature2 = generateSignature(
            EVVM_ID,
            "newAgent",
            message2,
            clientPrivateKey
        );

        vm.prank(client);
        vm.expectRevert(IIdentityRegistry.AddressAlreadyRegistered.selector);
        identityRegistry.newAgent{value: REGISTRATION_FEE}(
            client,
            TEST_DOMAIN_2,
            agentAddress,
            nonce2,
            signature2
        );
    }

    function test_NewAgent_InvalidSignature() public {
        uint256 nonce = 1;
        string memory message = string.concat(
            TEST_DOMAIN,
            ",",
            Strings.toHexString(uint160(agentAddress), 20),
            ",",
            Strings.toString(nonce)
        );
        // Use wrong private key for signature
        bytes memory signature = generateSignature(
            EVVM_ID,
            "newAgent",
            message,
            0x999
        );

        vm.prank(client);
        vm.expectRevert(IIdentityRegistry.InvalidSignature.selector);
        identityRegistry.newAgent{value: REGISTRATION_FEE}(
            client,
            TEST_DOMAIN,
            agentAddress,
            nonce,
            signature
        );
    }

    function test_NewAgent_NonceAlreadyUsed() public {
        uint256 nonce = 1;
        string memory message = string.concat(
            TEST_DOMAIN,
            ",",
            Strings.toHexString(uint160(agentAddress), 20),
            ",",
            Strings.toString(nonce)
        );
        bytes memory signature = generateSignature(
            EVVM_ID,
            "newAgent",
            message,
            clientPrivateKey
        );

        vm.prank(client);
        identityRegistry.newAgent{value: REGISTRATION_FEE}(
            client,
            TEST_DOMAIN,
            agentAddress,
            nonce,
            signature
        );

        address agentAddress2 = vm.addr(0x3);
        string memory message2 = string.concat(
            TEST_DOMAIN_2,
            ",",
            Strings.toHexString(uint160(agentAddress2), 20),
            ",",
            Strings.toString(nonce)
        );
        bytes memory signature2 = generateSignature(
            EVVM_ID,
            "newAgent",
            message2,
            clientPrivateKey
        );

        vm.prank(client);
        vm.expectRevert(IIdentityRegistry.NonceAlreadyUsed.selector);
        identityRegistry.newAgent{value: REGISTRATION_FEE}(
            client,
            TEST_DOMAIN_2,
            agentAddress2,
            nonce,
            signature2
        );
    }

    function test_UpdateAgent_Success_UpdateDomain() public {
        // First register an agent
        uint256 nonce1 = 1;
        string memory message1 = string.concat(
            TEST_DOMAIN,
            ",",
            Strings.toHexString(uint160(agentAddress), 20),
            ",",
            Strings.toString(nonce1)
        );
        bytes memory signature1 = generateSignature(
            EVVM_ID,
            "newAgent",
            message1,
            clientPrivateKey
        );

        vm.prank(client);
        uint256 agentId = identityRegistry.newAgent{value: REGISTRATION_FEE}(
            client,
            TEST_DOMAIN,
            agentAddress,
            nonce1,
            signature1
        );

        // Update domain
        uint256 nonce2 = 2;
        string memory message2 = string.concat(
            Strings.toString(agentId),
            ",",
            TEST_DOMAIN_2,
            ",",
            Strings.toHexString(uint160(address(0)), 20),
            ",",
            Strings.toString(nonce2)
        );
        bytes memory signature2 = generateSignature(
            EVVM_ID,
            "updateAgent",
            message2,
            clientPrivateKey
        );

        vm.prank(agentAddress);
        bool success = identityRegistry.updateAgent(
            client,
            agentId,
            TEST_DOMAIN_2,
            address(0),
            nonce2,
            signature2
        );

        assertTrue(success, "Update should succeed");

        IIdentityRegistry.AgentInfo memory agent = identityRegistry.getAgent(
            agentId
        );
        assertEq(agent.agentDomain, TEST_DOMAIN_2, "Domain should be updated");
        assertEq(
            agent.agentAddress,
            agentAddress,
            "Address should remain unchanged"
        );
    }

    function test_UpdateAgent_Success_UpdateAddress() public {
        // First register an agent
        uint256 nonce1 = 1;
        string memory message1 = string.concat(
            TEST_DOMAIN,
            ",",
            Strings.toHexString(uint160(agentAddress), 20),
            ",",
            Strings.toString(nonce1)
        );
        bytes memory signature1 = generateSignature(
            EVVM_ID,
            "newAgent",
            message1,
            clientPrivateKey
        );

        vm.prank(client);
        uint256 agentId = identityRegistry.newAgent{value: REGISTRATION_FEE}(
            client,
            TEST_DOMAIN,
            agentAddress,
            nonce1,
            signature1
        );

        // Update address
        address newAgentAddress = vm.addr(0x4);
        uint256 nonce2 = 2;
        string memory message2 = string.concat(
            Strings.toString(agentId),
            ",",
            "",
            ",",
            Strings.toHexString(uint160(newAgentAddress), 20),
            ",",
            Strings.toString(nonce2)
        );
        bytes memory signature2 = generateSignature(
            EVVM_ID,
            "updateAgent",
            message2,
            clientPrivateKey
        );

        vm.prank(agentAddress);
        bool success = identityRegistry.updateAgent(
            client,
            agentId,
            "",
            newAgentAddress,
            nonce2,
            signature2
        );

        assertTrue(success, "Update should succeed");

        IIdentityRegistry.AgentInfo memory agent = identityRegistry.getAgent(
            agentId
        );
        assertEq(
            agent.agentDomain,
            TEST_DOMAIN,
            "Domain should remain unchanged"
        );
        assertEq(
            agent.agentAddress,
            newAgentAddress,
            "Address should be updated"
        );
    }

    function test_UpdateAgent_Success_UpdateBoth() public {
        // First register an agent
        uint256 nonce1 = 1;
        string memory message1 = string.concat(
            TEST_DOMAIN,
            ",",
            Strings.toHexString(uint160(agentAddress), 20),
            ",",
            Strings.toString(nonce1)
        );
        bytes memory signature1 = generateSignature(
            EVVM_ID,
            "newAgent",
            message1,
            clientPrivateKey
        );

        vm.prank(client);
        uint256 agentId = identityRegistry.newAgent{value: REGISTRATION_FEE}(
            client,
            TEST_DOMAIN,
            agentAddress,
            nonce1,
            signature1
        );

        // Update both domain and address
        address newAgentAddress = vm.addr(0x4);
        uint256 nonce2 = 2;
        string memory message2 = string.concat(
            Strings.toString(agentId),
            ",",
            TEST_DOMAIN_2,
            ",",
            Strings.toHexString(uint160(newAgentAddress), 20),
            ",",
            Strings.toString(nonce2)
        );
        bytes memory signature2 = generateSignature(
            EVVM_ID,
            "updateAgent",
            message2,
            clientPrivateKey
        );

        vm.prank(agentAddress);

        bool success = identityRegistry.updateAgent(
            client,
            agentId,
            TEST_DOMAIN_2,
            newAgentAddress,
            nonce2,
            signature2
        );

        assertTrue(success, "Update should succeed");

        IIdentityRegistry.AgentInfo memory agent = identityRegistry.getAgent(
            agentId
        );
        assertEq(agent.agentDomain, TEST_DOMAIN_2, "Domain should be updated");
        assertEq(
            agent.agentAddress,
            newAgentAddress,
            "Address should be updated"
        );
    }

    function test_UpdateAgent_AgentNotFound() public {
        uint256 nonce = 1;
        string memory message = string.concat(
            Strings.toString(999),
            ",",
            TEST_DOMAIN_2,
            ",",
            Strings.toHexString(uint160(agentAddress), 20),
            ",",
            Strings.toString(nonce)
        );
        bytes memory signature = generateSignature(
            EVVM_ID,
            "updateAgent",
            message,
            clientPrivateKey
        );

        vm.prank(agentAddress);
        vm.expectRevert(IIdentityRegistry.AgentNotFound.selector);
        identityRegistry.updateAgent(
            client,
            999,
            TEST_DOMAIN_2,
            agentAddress,
            nonce,
            signature
        );
    }

    function test_UpdateAgent_UnauthorizedUpdate() public {
        // First register an agent
        uint256 nonce1 = 1;
        string memory message1 = string.concat(
            TEST_DOMAIN,
            ",",
            Strings.toHexString(uint160(agentAddress), 20),
            ",",
            Strings.toString(nonce1)
        );
        bytes memory signature1 = generateSignature(
            EVVM_ID,
            "newAgent",
            message1,
            clientPrivateKey
        );

        vm.prank(client);
        uint256 agentId = identityRegistry.newAgent{value: REGISTRATION_FEE}(
            client,
            TEST_DOMAIN,
            agentAddress,
            nonce1,
            signature1
        );

        // Try to update from wrong address
        address unauthorizedAddress = vm.addr(0x5);
        uint256 nonce2 = 2;
        string memory message2 = string.concat(
            Strings.toString(agentId),
            ",",
            TEST_DOMAIN_2,
            ",",
            Strings.toHexString(uint160(address(0)), 20),
            ",",
            Strings.toString(nonce2)
        );
        bytes memory signature2 = generateSignature(
            EVVM_ID,
            "updateAgent",
            message2,
            clientPrivateKey
        );

        vm.prank(unauthorizedAddress);
        vm.expectRevert(IIdentityRegistry.UnauthorizedUpdate.selector);
        identityRegistry.updateAgent(
            client,
            agentId,
            TEST_DOMAIN_2,
            address(0),
            nonce2,
            signature2
        );
    }

    function test_UpdateAgent_DomainAlreadyRegistered() public {
        // Register two agents
        uint256 nonce1 = 1;
        string memory message1 = string.concat(
            TEST_DOMAIN,
            ",",
            Strings.toHexString(uint160(agentAddress), 20),
            ",",
            Strings.toString(nonce1)
        );
        bytes memory signature1 = generateSignature(
            EVVM_ID,
            "newAgent",
            message1,
            clientPrivateKey
        );

        vm.prank(client);
        uint256 agentId1 = identityRegistry.newAgent{value: REGISTRATION_FEE}(
            client,
            TEST_DOMAIN,
            agentAddress,
            nonce1,
            signature1
        );

        address agentAddress2 = vm.addr(0x3);
        uint256 nonce2 = 2;
        string memory message2 = string.concat(
            TEST_DOMAIN_2,
            ",",
            Strings.toHexString(uint160(agentAddress2), 20),
            ",",
            Strings.toString(nonce2)
        );
        bytes memory signature2 = generateSignature(
            EVVM_ID,
            "newAgent",
            message2,
            clientPrivateKey
        );

        vm.prank(client);
        uint256 agentId2 = identityRegistry.newAgent{value: REGISTRATION_FEE}(
            client,
            TEST_DOMAIN_2,
            agentAddress2,
            nonce2,
            signature2
        );

        // Try to update agent1's domain to agent2's domain
        uint256 nonce3 = 3;
        string memory message3 = string.concat(
            Strings.toString(agentId1),
            ",",
            TEST_DOMAIN_2,
            ",",
            Strings.toHexString(uint160(address(0)), 20),
            ",",
            Strings.toString(nonce3)
        );
        bytes memory signature3 = generateSignature(
            EVVM_ID,
            "updateAgent",
            message3,
            clientPrivateKey
        );

        vm.prank(agentAddress);
        vm.expectRevert(IIdentityRegistry.DomainAlreadyRegistered.selector);
        identityRegistry.updateAgent(
            client,
            agentId1,
            TEST_DOMAIN_2,
            address(0),
            nonce3,
            signature3
        );
    }

    // ============ Read Functions Tests ============

    function test_GetAgent_Success() public {
        uint256 nonce = 1;
        string memory message = string.concat(
            TEST_DOMAIN,
            ",",
            Strings.toHexString(uint160(agentAddress), 20),
            ",",
            Strings.toString(nonce)
        );
        bytes memory signature = generateSignature(
            EVVM_ID,
            "newAgent",
            message,
            clientPrivateKey
        );

        vm.prank(client);
        uint256 agentId = identityRegistry.newAgent{value: REGISTRATION_FEE}(
            client,
            TEST_DOMAIN,
            agentAddress,
            nonce,
            signature
        );

        IIdentityRegistry.AgentInfo memory agent = identityRegistry.getAgent(
            agentId
        );
        assertEq(agent.agentId, agentId);
        assertEq(agent.agentDomain, TEST_DOMAIN);
        assertEq(agent.agentAddress, agentAddress);
    }

    function test_GetAgent_NotFound() public {
        vm.expectRevert(IIdentityRegistry.AgentNotFound.selector);
        identityRegistry.getAgent(999);
    }

    function test_ResolveByDomain_Success() public {
        uint256 nonce = 1;
        string memory message = string.concat(
            TEST_DOMAIN,
            ",",
            Strings.toHexString(uint160(agentAddress), 20),
            ",",
            Strings.toString(nonce)
        );
        bytes memory signature = generateSignature(
            EVVM_ID,
            "newAgent",
            message,
            clientPrivateKey
        );

        vm.prank(client);
        uint256 agentId = identityRegistry.newAgent{value: REGISTRATION_FEE}(
            client,
            TEST_DOMAIN,
            agentAddress,
            nonce,
            signature
        );

        IIdentityRegistry.AgentInfo memory agent = identityRegistry
            .resolveByDomain(TEST_DOMAIN);
        assertEq(agent.agentId, agentId);
        assertEq(agent.agentDomain, TEST_DOMAIN);
        assertEq(agent.agentAddress, agentAddress);
    }

    function test_ResolveByDomain_NotFound() public {
        vm.expectRevert(IIdentityRegistry.AgentNotFound.selector);
        identityRegistry.resolveByDomain("nonexistent.example.com");
    }

    function test_ResolveByAddress_Success() public {
        uint256 nonce = 1;
        string memory message = string.concat(
            TEST_DOMAIN,
            ",",
            Strings.toHexString(uint160(agentAddress), 20),
            ",",
            Strings.toString(nonce)
        );
        bytes memory signature = generateSignature(
            EVVM_ID,
            "newAgent",
            message,
            clientPrivateKey
        );

        vm.prank(client);
        uint256 agentId = identityRegistry.newAgent{value: REGISTRATION_FEE}(
            client,
            TEST_DOMAIN,
            agentAddress,
            nonce,
            signature
        );

        IIdentityRegistry.AgentInfo memory agent = identityRegistry
            .resolveByAddress(agentAddress);
        assertEq(agent.agentId, agentId);
        assertEq(agent.agentDomain, TEST_DOMAIN);
        assertEq(agent.agentAddress, agentAddress);
    }

    function test_ResolveByAddress_NotFound() public {
        vm.expectRevert(IIdentityRegistry.AgentNotFound.selector);
        identityRegistry.resolveByAddress(vm.addr(0x999));
    }

    function test_GetAgentCount() public {
        assertEq(
            identityRegistry.getAgentCount(),
            0,
            "Initial count should be 0"
        );

        // Register first agent
        uint256 nonce1 = 1;
        string memory message1 = string.concat(
            TEST_DOMAIN,
            ",",
            Strings.toHexString(uint160(agentAddress), 20),
            ",",
            Strings.toString(nonce1)
        );
        bytes memory signature1 = generateSignature(
            EVVM_ID,
            "newAgent",
            message1,
            clientPrivateKey
        );

        vm.prank(client);
        identityRegistry.newAgent{value: REGISTRATION_FEE}(
            client,
            TEST_DOMAIN,
            agentAddress,
            nonce1,
            signature1
        );

        assertEq(identityRegistry.getAgentCount(), 1, "Count should be 1");

        // Register second agent
        address agentAddress2 = vm.addr(0x3);
        uint256 nonce2 = 2;
        string memory message2 = string.concat(
            TEST_DOMAIN_2,
            ",",
            Strings.toHexString(uint160(agentAddress2), 20),
            ",",
            Strings.toString(nonce2)
        );
        bytes memory signature2 = generateSignature(
            EVVM_ID,
            "newAgent",
            message2,
            clientPrivateKey
        );

        vm.prank(client);
        identityRegistry.newAgent{value: REGISTRATION_FEE}(
            client,
            TEST_DOMAIN_2,
            agentAddress2,
            nonce2,
            signature2
        );

        assertEq(identityRegistry.getAgentCount(), 2, "Count should be 2");
    }

    function test_AgentExists() public {
        uint256 nonce = 1;
        string memory message = string.concat(
            TEST_DOMAIN,
            ",",
            Strings.toHexString(uint160(agentAddress), 20),
            ",",
            Strings.toString(nonce)
        );
        bytes memory signature = generateSignature(
            EVVM_ID,
            "newAgent",
            message,
            clientPrivateKey
        );

        vm.prank(client);
        uint256 agentId = identityRegistry.newAgent{value: REGISTRATION_FEE}(
            client,
            TEST_DOMAIN,
            agentAddress,
            nonce,
            signature
        );

        assertTrue(identityRegistry.agentExists(agentId), "Agent should exist");
        assertFalse(
            identityRegistry.agentExists(999),
            "Non-existent agent should not exist"
        );
    }

    function test_RegistrationFee() public {
        assertEq(
            identityRegistry.REGISTRATION_FEE(),
            REGISTRATION_FEE,
            "Registration fee should match"
        );
    }
}
