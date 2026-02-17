import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerFactionResources } from "./factions.js";
import { registerTechnologyResources } from "./technologies.js";
import { registerObjectiveResources } from "./objectives.js";
import { registerPlanetResources } from "./planets.js";
import { registerSystemResources } from "./systems.js";
import { registerStrategyCardResources } from "./strategy-cards.js";
import { registerActionCardResources } from "./action-cards.js";
import { registerAgendaResources } from "./agendas.js";
import { registerRelicResources } from "./relics.js";
import { registerExploreResources } from "./explores.js";
import { registerPromissoryNoteResources } from "./promissory-notes.js";
import { registerGalacticEventResources } from "./galactic-events.js";
import { registerBreakthroughResources } from "./breakthroughs.js";
import { registerRuleResources } from "./rules.js";

export function registerAllResources(server: McpServer) {
  registerFactionResources(server);
  registerTechnologyResources(server);
  registerObjectiveResources(server);
  registerPlanetResources(server);
  registerSystemResources(server);
  registerStrategyCardResources(server);
  registerActionCardResources(server);
  registerAgendaResources(server);
  registerRelicResources(server);
  registerExploreResources(server);
  registerPromissoryNoteResources(server);
  registerGalacticEventResources(server);
  registerBreakthroughResources(server);
  registerRuleResources(server);
}
