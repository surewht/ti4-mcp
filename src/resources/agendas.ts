import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadData } from "../data/loader.js";
import type { Agenda } from "../data/types.js";

export function registerAgendaResources(server: McpServer) {
  server.registerResource(
    "all-agendas",
    "ti4://agendas",
    { description: "All TI4 agenda cards", mimeType: "application/json" },
    async (uri) => ({
      contents: [{ uri: uri.href, text: JSON.stringify(loadData<Agenda>("agendas.json"), null, 2) }],
    }),
  );
}
