import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Can create a new profile",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1 = accounts.get('wallet_1')!;
        
        let block = chain.mineBlock([
            Tx.contractCall('skill_link', 'create-profile', [
                types.ascii("John Doe"),
                types.ascii("Blockchain Development, Smart Contracts")
            ], wallet1.address)
        ]);
        
        block.receipts[0].result.expectOk().expectUint(1);
        
        // Verify profile was created
        let getProfile = chain.callReadOnlyFn(
            'skill_link',
            'get-profile',
            [types.uint(1)],
            wallet1.address
        );
        
        let profile = getProfile.result.expectSome().expectTuple();
        assertEquals(profile['name'], "John Doe");
    }
});

Clarinet.test({
    name: "Can post and accept a job",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const client = accounts.get('wallet_1')!;
        const freelancer = accounts.get('wallet_2')!;
        
        // Post job
        let block = chain.mineBlock([
            Tx.contractCall('skill_link', 'post-job', [
                types.ascii("Smart Contract Development"),
                types.ascii("Need help building DeFi protocol"),
                types.uint(1000)
            ], client.address)
        ]);
        
        block.receipts[0].result.expectOk().expectUint(1);
        
        // Accept job
        let acceptBlock = chain.mineBlock([
            Tx.contractCall('skill_link', 'accept-job', [
                types.uint(1)
            ], freelancer.address)
        ]);
        
        acceptBlock.receipts[0].result.expectOk().expectBool(true);
        
        // Verify job status
        let getJob = chain.callReadOnlyFn(
            'skill_link',
            'get-job',
            [types.uint(1)],
            client.address
        );
        
        let job = getJob.result.expectSome().expectTuple();
        assertEquals(job['status'], "in-progress");
    }
});

Clarinet.test({
    name: "Can rate a freelancer",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1 = accounts.get('wallet_1')!;
        const wallet2 = accounts.get('wallet_2')!;
        
        // Create profile first
        chain.mineBlock([
            Tx.contractCall('skill_link', 'create-profile', [
                types.ascii("Jane Doe"),
                types.ascii("Web Development")
            ], wallet1.address)
        ]);
        
        // Rate the freelancer
        let block = chain.mineBlock([
            Tx.contractCall('skill_link', 'rate-freelancer', [
                types.uint(1),
                types.uint(5)
            ], wallet2.address)
        ]);
        
        block.receipts[0].result.expectOk().expectBool(true);
        
        // Verify rating
        let getProfile = chain.callReadOnlyFn(
            'skill_link',
            'get-profile',
            [types.uint(1)],
            wallet1.address
        );
        
        let profile = getProfile.result.expectSome().expectTuple();
        assertEquals(profile['rating'], "5");
        assertEquals(profile['rating-count'], "1");
    }
});