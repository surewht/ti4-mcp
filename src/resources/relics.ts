import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadData } from "../data/loader.js";
import type { Relic } from "../data/types.js";

export function registerRelicResources(server: McpServer) {
  server.registerResource(
    "all-relics",
    "ti4://relics",
    { description: "All TI4 relics (PoK)", mimeType: "application/json" },
    async (uri) => ({
      contents: [{ uri: uri.href, text: JSON.stringify(loadData<Relic>("relics.json"), null, 2) }],
    }),
  );
}
