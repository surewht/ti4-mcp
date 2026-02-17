import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ExpansionsParam, resolveExpansionsWithContext } from "../config.js";
import { loadFiltered } from "../data/loader.js";
import type { Objective } from "../data/types.js";

export function registerObjectiveTools(server: McpServer) {
  server.registerTool(
    "list_objectives",
    {
      description:
        "List TI4 objectives, optionally filtered by type (public/secret) and stage (1/2).",
      inputSchema: z.object({
        expansions: ExpansionsParam,
        type: z
          .enum(["public", "secret"])
          .optional()
          .describe("Filter by objective type"),
        stage: z
          .number()
          .int()
          .min(1)
          .max(2)
          .optional()
          .describe("Filter public objectives by stage (1 or 2)"),
      }),
    },
    async ({ expansions, type, stage }) => {
      const exps = resolveExpansionsWithContext(expansions);
      let objectives = loadFiltered<Objective>("objectives.json", {
        expansions: exps,
      });
      if (type) objectives = objectives.filter((o) => o.type === type);
      if (stage) objectives = objectives.filter((o) => o.stage === stage);
      return {
        content: [{ type: "text", text: JSON.stringify(objectives, null, 2) }],
      };
    },
  );

  server.registerTool(
    "get_objective",
    {
      description: "Get a specific TI4 objective by ID.",
      inputSchema: z.object({
        objective_id: z.string().describe("Objective identifier"),
        expansions: ExpansionsParam,
      }),
    },
    async ({ objective_id, expansions }) => {
      const exps = resolveExpansionsWithContext(expansions);
      const objectives = loadFiltered<Objective>("objectives.json", {
        expansions: exps,
      });
      const obj = objectives.find((o) => o.id === objective_id);
      if (!obj) {
        return {
          content: [
            {
              type: "text",
              text: `Objective '${objective_id}' not found.`,
            },
          ],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(obj, null, 2) }],
      };
    },
  );
}
