import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadData } from "../data/loader.js";
import type { Technology } from "../data/types.js";

export function registerTechnologyResources(server: McpServer) {
  server.registerResource(
    "all-technologies",
    "ti4://technologies",
    { description: "Full TI4 tech tree across all expansions", mimeType: "application/json" },
    async (uri) => ({
      contents: [{ uri: uri.href, text: JSON.stringify(loadData<Technology>("technologies.json"), null, 2) }],
    }),
  );

  server.registerResource(
    "tech-detail",
    new ResourceTemplate("ti4://technologies/{techId}", {
      list: async () => ({
        resources: loadData<Technology>("technologies.json").map((t) => ({
          uri: `ti4://technologies/${t.id}`,
          name: t.name,
        })),
      }),
    }),
    { description: "Detailed technology information", mimeType: "application/json" },
    async (uri, { techId }) => {
      const tech = loadData<Technology>("technologies.json").find((t) => t.id === techId);
      return {
        contents: [{ uri: uri.href, text: tech ? JSON.stringify(tech, null, 2) : "Not found" }],
      };
    },
  );
}
