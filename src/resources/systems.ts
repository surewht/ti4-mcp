import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadSystemsData } from "../data/loader.js";

export function registerSystemResources(server: McpServer) {
  server.registerResource(
    "all-systems",
    "ti4://systems",
    { description: "All TI4 system tiles keyed by tile number", mimeType: "application/json" },
    async (uri) => ({
      contents: [{ uri: uri.href, text: JSON.stringify(loadSystemsData(), null, 2) }],
    }),
  );

  server.registerResource(
    "system-detail",
    new ResourceTemplate("ti4://systems/{tileId}", {
      list: async () => {
        const systems = loadSystemsData();
        return {
          resources: Object.keys(systems).map((id) => ({
            uri: `ti4://systems/${id}`,
            name: `Tile ${id}`,
          })),
        };
      },
    }),
    { description: "Detailed system tile information by tile number", mimeType: "application/json" },
    async (uri, { tileId }) => {
      const systems = loadSystemsData();
      const system = systems[tileId as string];
      return {
        contents: [{ uri: uri.href, text: system ? JSON.stringify({ tileId, ...system }, null, 2) : "Not found" }],
      };
    },
  );
}
