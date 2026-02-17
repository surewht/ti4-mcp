import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadData } from "../data/loader.js";
import type { PromissoryNote } from "../data/types.js";

export function registerPromissoryNoteResources(server: McpServer) {
  server.registerResource(
    "all-promissory-notes",
    "ti4://promissory-notes",
    { description: "All TI4 promissory notes", mimeType: "application/json" },
    async (uri) => ({
      contents: [{ uri: uri.href, text: JSON.stringify(loadData<PromissoryNote>("promissory-notes.json"), null, 2) }],
    }),
  );
}
