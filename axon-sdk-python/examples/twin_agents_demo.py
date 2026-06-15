"""
Twin Agents Coordination Demo — Axon Protocol SDK
=================================================

This demo showcases two agents (Planner Agent and Coder Agent) collaborating on a shared project log file (shared_log.txt).
It compares execution under two environments:
1. WITHOUT AXON: Race conditions occur, resulting in lost updates/overwritten state.
2. WITH AXON: Coordination locks guarantee correct sequential updates, and shared memory is used to log historical progress.
"""

import os
import time
import asyncio
from axon import AxonClient

SHARED_FILE = "shared_log.txt"

# Simple Agent simulation
async def simulate_agent_without_axon(agent_name: str, task: str, delay: float):
    print(f"[{agent_name}] Starting task: '{task}' without coordination...")
    
    # 1. Read the shared resource
    content = ""
    if os.path.exists(SHARED_FILE):
        with open(SHARED_FILE, "r") as f:
            content = f.read()
    
    current_lines = len(content.splitlines())
    print(f"[{agent_name}] Read shared log. Found {current_lines} lines.")
    
    # 2. Simulate processing delay
    await asyncio.sleep(delay)
    
    # 3. Write back changes
    new_line = f"{agent_name}: Completed '{task}' at index {current_lines + 1}\n"
    content += new_line
    
    with open(SHARED_FILE, "w") as f:
        f.write(content)
        
    print(f"[{agent_name}] Wrote log entry. Current file length: {len(content.splitlines())} lines.")


async def simulate_agent_with_axon(client: AxonClient, agent_name: str, task: str, delay: float):
    print(f"[{agent_name}] Starting task: '{task}' using Axon locks & memory...")
    
    # 1. Acquire coordination lock from Axon (with retry loop)
    print(f"[{agent_name}] Requesting coordination lock 'project_log_lock'...")
    while True:
        try:
            async with client.lock("project_log_lock", timeout=10) as lock:
                print(f"[{agent_name}] Lock acquired successfully! Expires at: {lock.expires_at}")
                
                # 2. Read the shared resource
                content = ""
                if os.path.exists(SHARED_FILE):
                    with open(SHARED_FILE, "r") as f:
                        content = f.read()
                        
                current_lines = len(content.splitlines())
                print(f"[{agent_name}] Read shared log. Found {current_lines} lines.")
                
                # 3. Simulate processing delay
                await asyncio.sleep(delay)
                
                # 4. Write back changes
                new_line = f"{agent_name}: Completed '{task}' at index {current_lines + 1}\n"
                content += new_line
                
                with open(SHARED_FILE, "w") as f:
                    f.write(content)
                    
                print(f"[{agent_name}] Wrote log entry. Current file length: {len(content.splitlines())} lines.")
                
                # 5. Save operation state to Axon persistent vector memory
                await client.memory.store(
                    content=f"{agent_name} successfully appended '{task}' at position {current_lines + 1}",
                    tags={"agent": agent_name, "action": "append"},
                    scope="project"
                )
                print(f"[{agent_name}] Saved execution log to Axon persistent vector memory.")
            
            print(f"[{agent_name}] Lock released.")
            break
        except Exception as e:
            print(f"[{agent_name}] Lock 'project_log_lock' is held. Retrying in 0.5s... ({e})")
            await asyncio.sleep(0.5)


async def main():
    print("=" * 60)
    print("AXON TWIN AGENTS COORDINATION DEMO")
    print("=" * 60)
    
    # Setup clean environment
    if os.path.exists(SHARED_FILE):
        os.remove(SHARED_FILE)
        
    print("\n--- PHASE 1: Running WITHOUT Axon Coordination ---")
    # Both agents try to read and write to the same file at the same time
    # Delay is varied slightly so one reads/writes in overlap
    t0 = time.time()
    await asyncio.gather(
        simulate_agent_without_axon("PlannerAgent", "Define software requirements", 1.5),
        simulate_agent_without_axon("CoderAgent", "Initialize core repository structure", 1.0)
    )
    t_end = time.time()
    
    print("\n--- PHASE 1 RESULTS ---")
    if os.path.exists(SHARED_FILE):
        with open(SHARED_FILE, "r") as f:
            lines = f.readlines()
        print(f"Final shared file contains {len(lines)} lines:")
        for line in lines:
            print(f"  > {line.strip()}")
            
        # One update is lost because of overlapping read/write without locks
        if len(lines) < 2:
            print("[WARNING] RACE CONDITION CONFIRMED: One of the agent updates was overwritten/lost!")
    
    print("\n" + "=" * 60)
    
    # Reset file
    if os.path.exists(SHARED_FILE):
        os.remove(SHARED_FILE)
        
    print("\n--- PHASE 2: Running WITH Axon Coordination ---")
    # Initialize Axon client by registering agents first
    import httpx
    try:
        async with httpx.AsyncClient() as http:
            try:
                ping_res = await http.get("http://localhost:8000/v1/health")
                if ping_res.status_code != 200:
                    print("[WARNING] Axon Server not running at http://localhost:8000! Running in mock demo mode.")
                    return
            except Exception:
                print("[WARNING] Axon Server not running at http://localhost:8000! Running in mock demo mode.")
                return

            import uuid
            project_id = f"twin-demo-{uuid.uuid4().hex[:6]}"

            # Register Planner Agent (first registration creates project)
            reg_planner = await http.post(
                "http://localhost:8000/v1/agents/register",
                json={"name": "PlannerAgent", "project_id": project_id}
            )
            planner_data = reg_planner.json()
            api_key = planner_data["api_key"]
            planner_token = planner_data["token"]
            planner_agent_id = planner_data["id"]

            # Register Coder Agent under same project
            reg_coder = await http.post(
                "http://localhost:8000/v1/agents/register",
                json={"name": "CoderAgent", "project_id": project_id},
                headers={"X-API-Key": api_key}
            )
            coder_data = reg_coder.json()
            coder_token = coder_data["token"]
            coder_agent_id = coder_data["id"]

        print(f"Registered demo agents under project '{project_id}' successfully.")

        async with AxonClient(api_key=api_key, project_id=project_id, agent_token=planner_token, agent_id=planner_agent_id, base_url="http://localhost:8000") as planner_client, \
                   AxonClient(api_key=api_key, project_id=project_id, agent_token=coder_token, agent_id=coder_agent_id, base_url="http://localhost:8000") as coder_client:

            await asyncio.gather(
                simulate_agent_with_axon(planner_client, "PlannerAgent", "Define software requirements", 1.5),
                simulate_agent_with_axon(coder_client, "CoderAgent", "Initialize core repository structure", 1.0)
            )

            print("\n--- PHASE 2 RESULTS ---")
            if os.path.exists(SHARED_FILE):
                with open(SHARED_FILE, "r") as f:
                    lines = f.readlines()
                print(f"Final shared file contains {len(lines)} lines:")
                for line in lines:
                    print(f"  > {line.strip()}")
                if len(lines) == 2:
                    print("[SUCCESS] COORDINATION SUCCESS: Both agent updates were safely written in order!")

            # Search memory logs
            print("\nSearching Axon persistent memory for actions...")
            memories = await planner_client.memory.search("successfully appended")
            for m in memories.results:
                print(f"  Memory Found: '{m.content}' (similarity: {m.similarity:.3f})")

    except Exception as e:
        print(f"[WARNING] Failed to run Axon demo: {e}")
        print("Ensure the Axon server is running locally (e.g. via `uvicorn app.main:app`) first.")


if __name__ == "__main__":
    asyncio.run(main())
