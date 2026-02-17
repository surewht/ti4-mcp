import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadRawData } from "../data/loader.js";
import type { RuleSection } from "../data/types.js";

function findRule(
  sections: RuleSection[],
  keyword: string,
): RuleSection | undefined {
  const lower = keyword.toLowerCase();
  for (const section of sections) {
    if (
      section.title.toLowerCase().includes(lower) ||
      section.id.toLowerCase().includes(lower) ||
      (section.relatedKeywords ?? []).some((k) =>
        k.toLowerCase().includes(lower),
      )
    ) {
      return section;
    }
    if (section.subsections) {
      const found = findRule(section.subsections, keyword);
      if (found) return found;
    }
  }
  return undefined;
}

export function registerRulesTools(server: McpServer) {
  server.registerTool(
    "get_rules",
    {
      description:
        "Look up a specific rule or game concept from the TI4 Living Rules Reference.",
      inputSchema: z.object({
        keyword: z
          .string()
          .describe(
            "Rule keyword or concept, e.g. 'space combat', 'agenda phase'",
          ),
      }),
    },
    async ({ keyword }) => {
      let rules: RuleSection[];
      try {
        rules = loadRawData<RuleSection>("rules.json");
      } catch {
        return {
          content: [
            { type: "text", text: "Rules data not yet available." },
          ],
        };
      }

      const rule = findRule(rules, keyword);
      if (!rule) {
        const available = rules.map((r) => r.title);
        return {
          content: [
            {
              type: "text",
              text: `No rule found for '${keyword}'. Available sections: ${available.join(", ")}`,
            },
          ],
        };
      }

      return {
        content: [{ type: "text", text: JSON.stringify(rule, null, 2) }],
      };
    },
  );
}
