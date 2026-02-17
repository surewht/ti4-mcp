import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadData } from "../data/loader.js";
import type { GalacticEvent } from "../data/types.js";

export function registerGalacticEventResources(server: McpServer) {
  server.registerResource(
    "all-galactic-events",
    "ti4://galactic-events",
    { description: "All TI4 galactic events (Thunder's Edge)", mimeType: "application/json" },
    async (uri) => ({
      contents: [{ uri: uri.href, text: JSON.stringify(loadData<GalacticEvent>("galactic-events.json"), null, 2) }],
    }),
  );
}
