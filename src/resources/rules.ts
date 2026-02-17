import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadData } from "../data/loader.js";
import type { RuleSection, Sourced } from "../data/types.js";

export function registerRuleResources(server: McpServer) {
  server.registerResource(
    "rules-reference",
    "ti4://rules",
    { description: "TI4 structured rules reference", mimeType: "application/json" },
    async (uri) => {
      try {
        const rules = loadData<RuleSection & Sourced>("rules.json");
        return { contents: [{ uri: uri.href, text: JSON.stringify(rules, null, 2) }] };
      } catch {
        return { contents: [{ uri: uri.href, text: "[]" }] };
      }
    },
  );

  server.registerResource(
    "rules-section",
    new ResourceTemplate("ti4://rules/{keyword}", { list: async () => {
      try {
        const rules = loadData<RuleSection & Sourced>("rules.json");
        return {
          resources: rules.map((r) => ({
            uri: `ti4://rules/${r.id}`,
            name: r.title,
          })),
        };
      } catch {
        return { resources: [] };
      }
    }}),
    { description: "Specific rules section by keyword", mimeType: "application/json" },
    async (uri, { keyword }) => {
      try {
        const rules = loadData<RuleSection & Sourced>("rules.json");
        const section = rules.find(
          (r) => r.id === keyword || r.title.toLowerCase().includes((keyword as string).toLowerCase()),
        );
        return {
          contents: [{ uri: uri.href, text: section ? JSON.stringify(section, null, 2) : "Not found" }],
        };
      } catch {
        return { contents: [{ uri: uri.href, text: "Rules data not available" }] };
      }
    },
  );
}
