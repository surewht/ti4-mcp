import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadData } from "../data/loader.js";
import type { StrategyCard } from "../data/types.js";

export function registerStrategyCardResources(server: McpServer) {
  server.registerResource(
    "all-strategy-cards",
    "ti4://strategy-cards",
    { description: "All TI4 strategy cards", mimeType: "application/json" },
    async (uri) => ({
      contents: [{ uri: uri.href, text: JSON.stringify(loadData<StrategyCard>("strategy-cards.json"), null, 2) }],
    }),
  );
}
