import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadData } from "../data/loader.js";
import type { Breakthrough } from "../data/types.js";

export function registerBreakthroughResources(server: McpServer) {
  server.registerResource(
    "all-breakthroughs",
    "ti4://breakthroughs",
    { description: "All TI4 breakthroughs (Thunder's Edge)", mimeType: "application/json" },
    async (uri) => ({
      contents: [{ uri: uri.href, text: JSON.stringify(loadData<Breakthrough>("breakthroughs.json"), null, 2) }],
    }),
  );
}
