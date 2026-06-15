// ─── Axon Protocol SDK — LangChain.js Integration ───

import { Tool } from '@langchain/core/tools';
import { BaseCallbackHandler } from '@langchain/core/callbacks/base';
import type { LLMResult } from '@langchain/core/outputs';
import type { AxonClient } from '../client.js';

/**
 * A LangChain Tool that wraps the Axon Memory search functionality.
 */
export class AxonMemoryTool extends Tool {
  name = 'axon_memory_search';
  description =
    "Search the agent's persistent vector memory for past contextual history, " +
    'instructions, facts, or preferences. Input should be a semantic text query.';

  constructor(private readonly client: AxonClient) {
    super();
  }

  /** @internal */
  async _call(query: string): Promise<string> {
    try {
      const res = await this.client.memory.search({ query });
      if (!res.results || res.results.length === 0) {
        return 'No matching memories found.';
      }
      return res.results
        .map((r) => `- ${r.content} (similarity: ${r.similarity.toFixed(3)})`)
        .join('\n');
    } catch (error: any) {
      return `Error executing memory search: ${error.message || String(error)}`;
    }
  }
}

/**
 * A LangChain Tool that wraps Axon distributed coordination locking.
 */
export class AxonLockTool extends Tool {
  name = 'axon_coordination_lock';
  description =
    'Acquire or release a distributed lock to synchronize access to shared resources. ' +
    "Format input as: 'action:resource_id' where action is either 'acquire' or 'release'. " +
    "Example: 'acquire:database_write' or 'release:database_write'.";

  constructor(private readonly client: AxonClient) {
    super();
  }

  /** @internal */
  async _call(command: string): Promise<string> {
    try {
      const parts = command.split(':');
      if (parts.length < 2) {
        return "Error: Invalid input format. Use 'acquire:resource' or 'release:resource'.";
      }
      const action = parts[0].trim().toLowerCase();
      const resourceId = parts.slice(1).join(':').trim();

      if (action === 'acquire') {
        const res = await this.client.locks.acquire(resourceId);
        return `Lock acquired successfully for resource '${resourceId}'. ID: ${
          res.granted ? 'granted' : 'not granted'
        }, expires at: ${res.expires_at}`;
      } else if (action === 'release') {
        const res = await this.client.locks.release(resourceId);
        if (res.released) {
          return `Lock on resource '${resourceId}' released successfully.`;
        }
        return `Failed to release lock on resource '${resourceId}' (not held or expired).`;
      } else {
        return "Error: Invalid action. Use 'acquire' or 'release'.";
      }
    } catch (error: any) {
      return `Error coordinating lock: ${error.message || String(error)}`;
    }
  }
}

/**
 * LangChain Callback Handler that automatically converts chain execution events
 * into reasoning steps and submits them to the Axon server as a reasoning receipt.
 */
export class AxonReceiptCallbackHandler extends BaseCallbackHandler {
  name = 'axon_receipt_callback_handler';

  private readonly steps: Array<{ thought: string; tool_called?: string; result?: string }> = [];
  private outputText = '';

  constructor(
    private readonly client: AxonClient,
    private readonly inputText: string = 'LangChain Run',
  ) {
    super();
  }

  handleLLMStart(llm: any, prompts: string[]): void {
    const prompt = prompts[0] || '';
    const promptPreview = prompt.length > 120 ? prompt.slice(0, 120) + '...' : prompt;
    this.steps.push({
      thought: `Calling LLM with prompt preview: ${promptPreview}`,
    });
  }

  handleLLMEnd(response: LLMResult): void {
    try {
      const text = response.generations[0]?.[0]?.text || '';
      const textPreview = text.length > 120 ? text.slice(0, 120) + '...' : text;
      this.steps.push({
        thought: `LLM responded: ${textPreview}`,
      });
    } catch (e) {
      // Ignored
    }
  }

  handleToolStart(tool: any, input: string): void {
    const toolName = tool?.name || 'unnamed_tool';
    this.steps.push({
      thought: `Invoking tool '${toolName}' with parameter: ${input}`,
      tool_called: toolName,
    });
  }

  handleToolEnd(output: string): void {
    // Acknowledge tool completion on the last tool call step
    for (let i = this.steps.length - 1; i >= 0; i--) {
      if (this.steps[i].tool_called && !this.steps[i].result) {
        this.steps[i].result = String(output).slice(0, 250);
        return;
      }
    }
    this.steps.push({
      thought: 'Tool invocation complete',
      result: String(output).slice(0, 250),
    });
  }

  async handleChainEnd(outputs: Record<string, any>): Promise<void> {
    this.outputText = JSON.stringify(outputs);
    const stepsData = [...this.steps];
    if (stepsData.length === 0) {
      stepsData.push({ thought: 'No reasoning steps recorded during execution.' });
    }

    try {
      await this.client.receipts.create({
        input: this.inputText,
        steps: stepsData,
        output: this.outputText,
      });
    } catch (error) {
      // Non-blocking failure to avoid interrupting the main execution flow
    }
  }
}
