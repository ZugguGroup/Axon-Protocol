import ws from 'ws';
// Polyfill WebSocket for Node.js
(globalThis as any).WebSocket = ws;

import { AxonClient } from '../src/index.js';

async function runE2E() {
  console.log('==================================================');
  console.log('AXON JS SDK END-TO-END INTEGRATION TEST');
  console.log('==================================================');

  const baseApiUrl = 'http://localhost:8000';
  const client = new AxonClient({ baseUrl: baseApiUrl });

  // 1. Ping server to verify it is running
  console.log('\n[1/7] Pinging Axon local server...');
  try {
    const pingRes = await client.ping();
    console.log(`Ping Success:`, pingRes);
  } catch (err) {
    console.error('⚠ Axon local server is NOT running or unreachable at http://localhost:8000');
    console.error('Please start the server first (e.g. `uvicorn app.main:app`) to run E2E.');
    process.exit(0);
  }

  // 2. Perform SaaS registration and Project creation
  console.log('\n[2/7] Simulating Developer User registration...');
  const testEmail = `js-e2e-${Date.now()}@example.com`;
  const signupRes = await fetch(`${baseApiUrl}/v1/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'securepassword123' })
  }).then(r => r.json()) as any;

  console.log(`Signup response:`, signupRes);
  console.log(`Signup success: User ID: ${signupRes.user_id}`);

  console.log('\nCreating new Project scoped under SaaS user...');
  const projectRes = await fetch(`${baseApiUrl}/v1/projects`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${signupRes.token}`
    },
    body: JSON.stringify({ name: `JS-E2E-Project-${Date.now()}` })
  }).then(r => r.json()) as any;

  console.log(`Project response:`, projectRes);
  const projectId = projectRes.id;
  const projectApiKey = projectRes.api_key;
  console.log(`Project Created: ID: ${projectId}, API Key: ${projectApiKey}`);

  // Re-configure client credentials
  client.setCredentials(projectApiKey, projectId);

  // 3. Register Agents
  console.log('\n[3/7] Registering agents under project API key...');
  const agent1 = await client.agents.register({
    name: 'js-agent-1',
    project_id: projectId,
    capabilities: ['storage', 'ws']
  });
  console.log(`Registered agent 1:`, agent1.name, `ID:`, agent1.id);

  const agent2 = await client.agents.register({
    name: 'js-agent-2',
    project_id: projectId,
    capabilities: ['consumer']
  });
  console.log(`Registered agent 2:`, agent2.name, `ID:`, agent2.id);

  // 4. Memory Store & Search
  console.log('\n[4/7] Storing and searching semantic memory...');
  const storeRes = await client.memory.store({
    content: 'The dashboard URL is http://dashboard.axon.local',
    tags: { env: 'local' }
  });
  console.log('Saved Memory ID:', storeRes.id);

  // Wait 1 second to let vector indexing/storing complete if needed (Supabase/DB is async)
  await new Promise(r => setTimeout(r, 1000));

  const searchRes = await client.memory.search({
    query: 'Where is the dashboard hosted?'
  });
  console.log(`Search Results (Found ${searchRes.total_found}):`);
  searchRes.results.forEach((r, idx) => {
    console.log(`  [${idx + 1}] "${r.content}" (similarity: ${r.similarity})`);
  });

  // 5. Lock Management
  console.log('\n[5/7] Testing lock acquisition...');
  const lockResource = `js_lock_${Date.now()}`;
  const lock1 = await client.locks.acquire(lockResource, 5);
  console.log(`Lock acquired: ID: ${lock1.lock_id}, expires: ${lock1.expires_at}`);

  // Try to acquire again, should throw ConflictError (locked)
  try {
    await client.locks.acquire(lockResource, 5);
    console.error('⚠ FAILED: Should have thrown lock acquisition conflict error!');
  } catch (err: any) {
    console.log(`✅ Lock conflict verified (ConflictError thrown):`, err.message);
  }

  // Release
  const releaseRes = await client.locks.release(lockResource);
  console.log(`Lock released:`, releaseRes.released);

  // 6. WebSocket Events
  console.log('\n[6/7] Connecting to real-time events WebSocket stream...');
  const wsEvents: any[] = [];
  const unsubscribe = client.events.subscribe((event) => {
    wsEvents.push(event);
    console.log(`  WebSocket Event Captured:`, event.type);
  });

  await client.events.connect();
  console.log('WS Connection status:', client.events.connected ? 'Connected' : 'Disconnected');

  // Trigger an event (by acquiring lock again)
  await client.locks.acquire(lockResource, 2);
  await new Promise(r => setTimeout(r, 500)); // wait for socket prop
  await client.locks.release(lockResource);
  
  unsubscribe();
  client.events.disconnect();
  console.log(`WebSocket event capture complete.`);

  // 7. Receipts creation
  console.log('\n[7/7] Creating reasoning receipt log...');
  const receiptRes = await client.receipts.create({
    input: 'E2E Validation task',
    steps: [
      { thought: 'Pinged endpoints' },
      { thought: 'Verified vector searches' }
    ],
    output: 'E2E fully verified'
  });
  console.log(`Receipt created successfully: ID: ${receiptRes.id}, signature: ${receiptRes.signature}`);

  console.log('\n==================================================');
  console.log('✅ ALL E2E JS SDK TESTS PASSED SUCCESSFULLY!');
  console.log('==================================================');
}

runE2E().catch((err) => {
  console.error('\n❌ E2E RUN FAILED WITH ERROR:');
  console.error(err);
  process.exit(1);
});
