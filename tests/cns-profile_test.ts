import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.6/index.ts';
import { assertEquals } from 'https://deno.land/std@0.170.0/testing/asserts.ts';

const deployer = 'ST1PQHQKV0RJQDZKYR4T6YVRQND4K41GC7S1B1KBT';
const wallet1 = 'ST1HTBVD3JGGB49EXR7RMXEDG9TSK56SJQ3X5C8C';
const wallet2 = 'ST1PHB626C4F3W7N97G50C1K5629XG54A6F1C5K4';

// Fee defined in cns-registrar to successfully register a name
const nameFee = 10000000; 

Clarinet.test({
    name: "CNS Profile: Only the CNS name owner can set their profile data",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let wallet1Account = accounts.get('wallet_1')!;
        let wallet2Account = accounts.get('wallet_2')!;
        const name = types.ascii("profileuser");
        const avatarUrl = types.utf8("https://avatar.url/1");
        const bio = types.utf8("Hello I am the owner");
        
        // PREREQUISITE: Register Name (using cns-registrar)
        // Wallet 1 registers the name 'profileuser' (requires a successful STX transfer)
        chain.mineBlock([
            Tx.contractCall(
                "cns-registrar", 
                "register-name", 
                [name, types.none()], // BTC address is optional
                wallet1Account.principal
            ),
        ]);
        
        // TEST 1: Wallet 2 (Non-owner) attempts to set profile
        let block1 = chain.mineBlock([
            Tx.contractCall(
                "cns-profile", 
                "set-profile", 
                [name, avatarUrl, bio], 
                wallet2Account.principal // Should fail (not owner)
            ),
        ]);
        // Assert it fails with ERR-NOT-OWNER (u200)
        block1.receipts[0].result.expectErr().expectUint(200);

        // TEST 2: Wallet 1 (Owner) successfully sets the profile
        chain.mineBlock([
            Tx.contractCall(
                "cns-profile", 
                "set-profile", 
                [name, avatarUrl, bio], 
                wallet1Account.principal // Should succeed (owner)
            ),
        ]);

        // TEST 3: Retrieve the profile data (Read-Only)
        let profileResult = chain.callReadOnlyFn(
            "cns-profile",
            "get-profile",
            [name],
            deployer 
        );
        
        // Assert the data matches the new profile
        let expectedProfile = `{avatar-url: ${avatarUrl}, bio: ${bio}}`;
        profileResult.result.expectOk().expectSome(expectedProfile);
    },
});

Clarinet.test({
    name: "CNS Profile: Cannot set profile for an unregistered name",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let wallet1Account = accounts.get('wallet_1')!;
        const unregisteredName = types.ascii("idontexist");
        const avatarUrl = types.utf8("https://avatar.url/1");
        const bio = types.utf8("Test");

        // Attempt to set a profile for a name that was never registered in cns-registrar
        let block = chain.mineBlock([
            Tx.contractCall(
                "cns-profile", 
                "set-profile", 
                [unregisteredName, avatarUrl, bio], 
                wallet1Account.principal
            ),
        ]);
        
        // Assert it fails with ERR-NAME-NOT-REGISTERED (u201) from the nested call check
        block.receipts[0].result.expectErr().expectUint(201);
    },
});
