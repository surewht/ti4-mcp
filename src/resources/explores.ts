import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadData } from "../data/loader.js";
import type { ExploreCard } from "../data/types.js";

export function registerExploreResources(server: McpServer) {
  server.registerResource(
    "all-explores",
    "ti4://explores",
    { description: "All TI4 exploration cards (PoK)", mimeType: "application/json" },
    async (uri) => ({
      contents: [{ uri: uri.href, text: JSON.stringify(loadData<ExploreCard>("explores.json"), null, 2) }],
    }),
  );
}
