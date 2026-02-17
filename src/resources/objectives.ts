import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadData } from "../data/loader.js";
import type { Objective } from "../data/types.js";

export function registerObjectiveResources(server: McpServer) {
  server.registerResource(
    "all-objectives",
    "ti4://objectives",
    { description: "All TI4 public and secret objectives", mimeType: "application/json" },
    async (uri) => ({
      contents: [{ uri: uri.href, text: JSON.stringify(loadData<Objective>("objectives.json"), null, 2) }],
    }),
  );
}
