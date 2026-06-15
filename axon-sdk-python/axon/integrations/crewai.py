import inspect
import asyncio
from typing import Any, Dict, List, Optional

# Attempt to load CrewAI BaseTool dynamically to keep installation light
try:
    from crewai.tools import BaseTool as CrewBaseTool
except ImportError:
    try:
        from crewai_tools import BaseTool as CrewBaseTool
    except ImportError:
        # Fallback to LangChain or a generic object stub
        try:
            from langchain_core.tools import BaseTool as CrewBaseTool
        except ImportError:
            class CrewBaseTool:
                def __init__(self, *args, **kwargs):
                    pass

# CrewAI runs on LangChain base components, so standard LangChain Callbacks are supported
try:
    from langchain_core.callbacks import BaseCallbackHandler
except ImportError:
    class BaseCallbackHandler:
        def __init__(self, *args, **kwargs):
            pass


class AxonMemoryTool(CrewBaseTool):
    name: str = "axon_memory_search"
    description: str = (
        "Search the agent's persistent vector memory for past contextual history, "
        "instructions, facts, or preferences. Input should be a semantic text query."
    )
    client: Any = None

    def __init__(self, **kwargs):
        client = kwargs.pop("client", None)
        super().__init__(**kwargs)
        if client is not None:
            object.__setattr__(self, "client", client)

    def _run(self, query: str) -> str:
        """Execute semantic search synchronously."""
        try:
            if not self.client:
                return "Error: Axon client not configured on this tool."
                
            res = self.client.memory.search(query=query)
            if not res.results:
                return "No matching memories found."
                
            lines = []
            for r in res.results:
                lines.append(f"- {r.content} (similarity: {r.similarity:.3f})")
            return "\n".join(lines)
        except Exception as e:
            return f"Error executing memory search: {str(e)}"

    async def _arun(self, query: str) -> str:
        """Execute semantic search asynchronously."""
        try:
            if not self.client:
                return "Error: Axon client not configured on this tool."

            if inspect.iscoroutinefunction(self.client.memory.search):
                res = await self.client.memory.search(query=query)
            else:
                res = self.client.memory.search(query=query)
                
            if not res.results:
                return "No matching memories found."
                
            lines = []
            for r in res.results:
                lines.append(f"- {r.content} (similarity: {r.similarity:.3f})")
            return "\n".join(lines)
        except Exception as e:
            return f"Error executing memory search: {str(e)}"


class AxonLockTool(CrewBaseTool):
    name: str = "axon_coordination_lock"
    description: str = (
        "Acquire or release a distributed lock to synchronize access to shared resources. "
        "Format input as: 'action:resource_id' where action is either 'acquire' or 'release'. "
        "Example: 'acquire:database_write' or 'release:database_write'."
    )
    client: Any = None

    def __init__(self, **kwargs):
        client = kwargs.pop("client", None)
        super().__init__(**kwargs)
        if client is not None:
            object.__setattr__(self, "client", client)

    def _run(self, command: str) -> str:
        """Execute lock action synchronously."""
        try:
            if not self.client:
                return "Error: Axon client not configured on this tool."
                
            parts = command.split(":", 1)
            if len(parts) != 2:
                return "Error: Invalid input format. Use 'acquire:resource' or 'release:resource'."
                
            action, resource_id = parts[0].strip().lower(), parts[1].strip()
            
            if action == "acquire":
                res = self.client.lock.acquire(resource_id)
                return f"Lock acquired successfully for resource '{resource_id}'. ID: {res.lock_id}, expires at: {res.expires_at}"
            elif action == "release":
                released = self.client.lock.release(resource_id)
                if released:
                    return f"Lock on resource '{resource_id}' released successfully."
                return f"Failed to release lock on resource '{resource_id}' (not held or expired)."
            else:
                return "Error: Invalid action. Use 'acquire' or 'release'."
        except Exception as e:
            return f"Error coordinating lock: {str(e)}"

    async def _arun(self, command: str) -> str:
        """Execute lock action asynchronously."""
        try:
            if not self.client:
                return "Error: Axon client not configured on this tool."
                
            parts = command.split(":", 1)
            if len(parts) != 2:
                return "Error: Invalid input format. Use 'acquire:resource' or 'release:resource'."
                
            action, resource_id = parts[0].strip().lower(), parts[1].strip()
            
            is_async_acquire = inspect.iscoroutinefunction(self.client.lock.acquire)
            is_async_release = inspect.iscoroutinefunction(self.client.lock.release)
            
            if action == "acquire":
                if is_async_acquire:
                    res = await self.client.lock.acquire(resource_id)
                else:
                    res = self.client.lock.acquire(resource_id)
                return f"Lock acquired successfully for resource '{resource_id}'. ID: {res.lock_id}, expires at: {res.expires_at}"
            elif action == "release":
                if is_async_release:
                    released = await self.client.lock.release(resource_id)
                else:
                    released = self.client.lock.release(resource_id)
                if released:
                    return f"Lock on resource '{resource_id}' released successfully."
                return f"Failed to release lock on resource '{resource_id}' (not held or expired)."
            else:
                return "Error: Invalid action. Use 'acquire' or 'release'."
        except Exception as e:
            return f"Error coordinating lock: {str(e)}"


class AxonReceiptCallbackHandler(BaseCallbackHandler):
    """
    CrewAI/LangChain Callback Handler that automatically converts execution events 
    into reasoning steps and submits them to the Axon server as a reasoning receipt.
    """
    def __init__(self, client: Any, input_text: str = "CrewAI Run"):
        super().__init__()
        self.client = client
        self.input_text = input_text
        self.steps = []
        self.output_text = ""

    def on_llm_start(self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any) -> Any:
        prompt_preview = prompts[0][:120] + "..." if len(prompts[0]) > 120 else prompts[0]
        self.steps.append({
            "thought": f"Calling LLM with prompt preview: {prompt_preview}"
        })

    def on_llm_end(self, response: Any, **kwargs: Any) -> Any:
        try:
            text = response.generations[0][0].text
            text_preview = text[:120] + "..." if len(text) > 120 else text
            self.steps.append({
                "thought": f"LLM responded: {text_preview}"
            })
        except Exception:
            pass

    def on_tool_start(self, serialized: Dict[str, Any], input_str: str, **kwargs: Any) -> Any:
        tool_name = serialized.get("name", "unnamed_tool")
        self.steps.append({
            "thought": f"Invoking tool '{tool_name}' with parameter: {input_str}",
            "tool_called": tool_name
        })

    def on_tool_end(self, output: str, **kwargs: Any) -> Any:
        for step in reversed(self.steps):
            if "tool_called" in step and "result" not in step:
                step["result"] = str(output)[:250]
                return
                
        self.steps.append({
            "thought": "Tool invocation complete",
            "result": str(output)[:250]
        })

    def on_chain_end(self, outputs: Dict[str, Any], **kwargs: Any) -> Any:
        self.output_text = str(outputs)
        steps_data = self.steps.copy()
        if not steps_data:
            steps_data.append({"thought": "No reasoning steps recorded during execution."})
            
        try:
            is_async_create = inspect.iscoroutinefunction(self.client.receipts.create)
            if is_async_create:
                try:
                    loop = asyncio.get_running_loop()
                    loop.create_task(self.client.receipts.create(
                        input=self.input_text,
                        steps=steps_data,
                        output=self.output_text
                    ))
                except RuntimeError:
                    asyncio.run(self.client.receipts.create(
                        input=self.input_text,
                        steps=steps_data,
                        output=self.output_text
                    ))
            else:
                self.client.receipts.create(
                    input=self.input_text,
                    steps=steps_data,
                    output=self.output_text
                )
        except Exception:
            pass
