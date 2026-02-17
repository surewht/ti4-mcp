import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadData } from "../data/loader.js";
import type { ActionCard } from "../data/types.js";

export function registerActionCardResources(server: McpServer) {
  server.registerResource(
    "all-action-cards",
    "ti4://action-cards",
    { description: "All TI4 action cards", mimeType: "application/json" },
    async (uri) => ({
      contents: [{ uri: uri.href, text: JSON.stringify(loadData<ActionCard>("action-cards.json"), null, 2) }],
    }),
  );
}
