import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ExpansionsParam, resolveExpansionsWithContext } from "../config.js";
import { loadFiltered } from "../data/loader.js";
import type { Agenda } from "../data/types.js";

export function registerAgendaTools(server: McpServer) {
  server.registerTool(
    "list_agendas",
    {
      description:
        "List TI4 agenda cards, optionally filtered by type (law/directive) or election type.",
      inputSchema: z.object({
        expansions: ExpansionsParam,
        type: z
          .enum(["law", "directive"])
          .optional()
          .describe("Filter by agenda type"),
        election_type: z
          .string()
          .optional()
          .describe(
            "Filter by election type (player, planet, for-or-against, scored-secret-objective, law, strategy-card, etc.)",
          ),
      }),
    },
    async ({ expansions, type, election_type }) => {
      const exps = resolveExpansionsWithContext(expansions);
      let agendas = loadFiltered<Agenda>("agendas.json", {
        expansions: exps,
      });
      if (type) agendas = agendas.filter((a) => a.type === type);
      if (election_type)
        agendas = agendas.filter((a) => a.electionType === election_type);
      return {
        content: [{ type: "text", text: JSON.stringify(agendas, null, 2) }],
      };
    },
  );

  server.registerTool(
    "get_agenda",
    {
      description: "Get a specific TI4 agenda card by ID.",
      inputSchema: z.object({
        agenda_id: z.string().describe("Agenda identifier"),
        expansions: ExpansionsParam,
      }),
    },
    async ({ agenda_id, expansions }) => {
      const exps = resolveExpansionsWithContext(expansions);
      const agendas = loadFiltered<Agenda>("agendas.json", {
        expansions: exps,
      });
      const agenda = agendas.find((a) => a.id === agenda_id);
      if (!agenda) {
        return {
          content: [
            { type: "text", text: `Agenda '${agenda_id}' not found.` },
          ],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(agenda, null, 2) }],
      };
    },
  );
}
