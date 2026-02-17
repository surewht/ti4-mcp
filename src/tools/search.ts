import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ExpansionsParam, resolveExpansionsWithContext } from "../config.js";
import { loadFiltered, loadRawData, loadSystemsData } from "../data/loader.js";
import type {
  Faction,
  Technology,
  Planet,
  ActionCard,
  Objective,
  Agenda,
  Relic,
  ExploreCard,
  StrategyCard,
  Unit,
  PromissoryNote,
  Breakthrough,
  GalacticEvent,
  RuleSection,
  Sourced,
} from "../data/types.js";

interface SearchResult {
  category: string;
  id: string;
  name: string;
  match: string;
}

function searchInText(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.toLowerCase());
}

function searchItems<T extends Sourced & { id: string; name: string }>(
  items: T[],
  query: string,
  category: string,
  getSearchableText: (item: T) => string,
): SearchResult[] {
  return items
    .filter((item) => searchInText(getSearchableText(item), query))
    .map((item) => ({
      category,
      id: item.id,
      name: item.name,
      match: getSearchableText(item).substring(0, 200),
    }));
}

export function registerSearchTools(server: McpServer) {
  server.registerTool(
    "search",
    {
      description:
        "Full-text search across all TI4 game data (factions, techs, planets, action cards, objectives, agendas, relics, explores, strategy cards, units, promissory notes, breakthroughs, galactic events, systems, rules).",
      inputSchema: z.object({
        query: z.string().describe("Search term"),
        category: z
          .enum([
            "all",
            "factions",
            "technologies",
            "planets",
            "action-cards",
            "objectives",
            "agendas",
            "relics",
            "explores",
            "strategy-cards",
            "units",
            "promissory-notes",
            "breakthroughs",
            "galactic-events",
            "systems",
            "rules",
          ])
          .default("all")
          .describe("Category to search in"),
        expansions: ExpansionsParam,
      }),
    },
    async ({ query, category, expansions }) => {
      const exps = resolveExpansionsWithContext(expansions);
      const config = { expansions: exps };
      const results: SearchResult[] = [];

      if (category === "all" || category === "factions") {
        const factions = loadFiltered<Faction>("factions.json", config);
        results.push(
          ...searchItems(factions, query, "factions", (f) =>
            [
              f.name,
              ...f.abilities.map((a) => `${a.name} ${a.description}`),
              f.flavorText ?? "",
            ].join(" "),
          ),
        );
      }

      if (category === "all" || category === "technologies") {
        const techs = loadFiltered<Technology>("technologies.json", config);
        results.push(
          ...searchItems(techs, query, "technologies", (t) =>
            `${t.name} ${t.description}`,
          ),
        );
      }

      if (category === "all" || category === "planets") {
        const planets = loadFiltered<Planet>("planets.json", config);
        results.push(
          ...searchItems(planets, query, "planets", (p) => p.name),
        );
      }

      if (category === "all" || category === "action-cards") {
        const cards = loadFiltered<ActionCard>("action-cards.json", config);
        results.push(
          ...searchItems(cards, query, "action-cards", (c) =>
            `${c.name} ${c.description}`,
          ),
        );
      }

      if (category === "all" || category === "objectives") {
        const objectives = loadFiltered<Objective>("objectives.json", config);
        results.push(
          ...searchItems(objectives, query, "objectives", (o) =>
            `${o.name} ${o.description}`,
          ),
        );
      }

      if (category === "all" || category === "agendas") {
        const agendas = loadFiltered<Agenda>("agendas.json", config);
        results.push(
          ...searchItems(agendas, query, "agendas", (a) =>
            `${a.name} ${a.description}`,
          ),
        );
      }

      if (category === "all" || category === "relics") {
        const relics = loadFiltered<Relic>("relics.json", config);
        results.push(
          ...searchItems(relics, query, "relics", (r) =>
            `${r.name} ${r.description}`,
          ),
        );
      }

      if (category === "all" || category === "explores") {
        const explores = loadFiltered<ExploreCard>("explores.json", config);
        results.push(
          ...searchItems(explores, query, "explores", (e) =>
            `${e.name} ${e.description}`,
          ),
        );
      }

      if (category === "all" || category === "strategy-cards") {
        const cards = loadFiltered<StrategyCard>("strategy-cards.json", config);
        results.push(
          ...searchItems(cards, query, "strategy-cards", (c) =>
            `${c.name} ${c.primaryAbility} ${c.secondaryAbility}`,
          ),
        );
      }

      if (category === "all" || category === "units") {
        const units = loadFiltered<Unit>("units.json", config);
        results.push(
          ...searchItems(units, query, "units", (u) =>
            `${u.name} ${(u.abilities ?? []).join(" ")}`,
          ),
        );
      }

      if (category === "all" || category === "promissory-notes") {
        const notes = loadFiltered<PromissoryNote>("promissory-notes.json", config);
        results.push(
          ...searchItems(notes, query, "promissory-notes", (n) =>
            `${n.name} ${n.description}`,
          ),
        );
      }

      if (category === "all" || category === "breakthroughs") {
        const breakthroughs = loadFiltered<Breakthrough>("breakthroughs.json", config);
        results.push(
          ...searchItems(breakthroughs, query, "breakthroughs", (b) =>
            `${b.name} ${b.description}`,
          ),
        );
      }

      if (category === "all" || category === "galactic-events") {
        const events = loadFiltered<GalacticEvent>("galactic-events.json", config);
        results.push(
          ...searchItems(events, query, "galactic-events", (e) =>
            `${e.name} ${e.effect}`,
          ),
        );
      }

      if (category === "all" || category === "systems") {
        const systems = loadSystemsData();
        for (const [tileId, tile] of Object.entries(systems)) {
          const searchable = [
            `Tile ${tileId}`,
            tile.faction ?? "",
            tile.wormhole ?? "",
            tile.anomaly ?? "",
            ...tile.planets.map((p) => `${p.name} ${p.specialties.join(" ")}`),
          ].join(" ");
          if (searchInText(searchable, query)) {
            results.push({
              category: "systems",
              id: tileId,
              name: tile.planets.length ? tile.planets.map((p) => p.name).join(", ") : `Tile ${tileId}`,
              match: searchable.substring(0, 200),
            });
          }
        }
      }

      if (category === "all" || category === "rules") {
        try {
          const rules = loadRawData<RuleSection>("rules.json");
          const searchRules = (sections: RuleSection[]) => {
            for (const rule of sections) {
              if (
                searchInText(
                  `${rule.title} ${rule.content} ${(rule.relatedKeywords ?? []).join(" ")}`,
                  query,
                )
              ) {
                results.push({
                  category: "rules",
                  id: rule.id,
                  name: rule.title,
                  match: rule.content.substring(0, 200),
                });
              }
              if (rule.subsections) searchRules(rule.subsections);
            }
          };
          searchRules(rules);
        } catch {
          // Rules data might not be available yet
        }
      }

      if (results.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No results found for '${query}' in ${category}.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { query, category, resultCount: results.length, results },
              null,
              2,
            ),
          },
        ],
      };
    },
  );
}
