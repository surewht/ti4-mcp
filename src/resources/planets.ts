import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadData } from "../data/loader.js";
import type { Planet } from "../data/types.js";

export function registerPlanetResources(server: McpServer) {
  server.registerResource(
    "all-planets",
    "ti4://planets",
    { description: "All TI4 planets with stats", mimeType: "application/json" },
    async (uri) => ({
      contents: [{ uri: uri.href, text: JSON.stringify(loadData<Planet>("planets.json"), null, 2) }],
    }),
  );

  server.registerResource(
    "planet-detail",
    new ResourceTemplate("ti4://planets/{planetId}", {
      list: async () => ({
        resources: loadData<Planet>("planets.json").map((p) => ({
          uri: `ti4://planets/${p.id}`,
          name: p.name,
        })),
      }),
    }),
    { description: "Detailed planet information", mimeType: "application/json" },
    async (uri, { planetId }) => {
      const planet = loadData<Planet>("planets.json").find((p) => p.id === planetId);
      return {
        contents: [{ uri: uri.href, text: planet ? JSON.stringify(planet, null, 2) : "Not found" }],
      };
    },
  );
}
