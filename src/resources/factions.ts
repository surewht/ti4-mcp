import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadData } from "../data/loader.js";
import type { Faction } from "../data/types.js";

export function registerFactionResources(server: McpServer) {
  server.registerResource(
    "all-factions",
    "ti4://factions",
    { description: "List of all TI4 factions across all expansions", mimeType: "application/json" },
    async (uri) => ({
      contents: [{ uri: uri.href, text: JSON.stringify(loadData<Faction>("factions.json"), null, 2) }],
    }),
  );

  server.registerResource(
    "faction-detail",
    new ResourceTemplate("ti4://factions/{factionId}", {
      list: async () => ({
        resources: loadData<Faction>("factions.json").map((f) => ({
          uri: `ti4://factions/${f.id}`,
          name: f.name,
        })),
      }),
    }),
    { description: "Detailed faction information", mimeType: "application/json" },
    async (uri, { factionId }) => {
      const faction = loadData<Faction>("factions.json").find((f) => f.id === factionId);
      return {
        contents: [{ uri: uri.href, text: faction ? JSON.stringify(faction, null, 2) : "Not found" }],
      };
    },
  );
}
