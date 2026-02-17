import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerFactionTools } from "./faction.js";
import { registerTechTools } from "./tech.js";
import { registerGameSetupTools } from "./game-setup.js";
import { registerMapTools } from "./map.js";
import { registerSearchTools } from "./search.js";
import { registerRulesTools } from "./rules.js";
import { registerStrategyTools } from "./strategy.js";
import { registerSliceTools } from "./slice.js";
import { registerContextTools } from "./context.js";
import { registerObjectiveTools } from "./objectives.js";
import { registerAgendaTools } from "./agendas.js";
import { registerActionCardTools } from "./action-cards.js";
import { registerRelicTools } from "./relics.js";
import { registerGuideTools } from "./guide.js";
import { registerPlanetTools } from "./planets.js";

export function registerAllTools(server: McpServer) {
  registerContextTools(server);
  registerFactionTools(server);
  registerGuideTools(server);
  registerTechTools(server);
  registerObjectiveTools(server);
  registerAgendaTools(server);
  registerActionCardTools(server);
  registerRelicTools(server);
  registerPlanetTools(server);
  registerGameSetupTools(server);
  registerMapTools(server);
  registerSearchTools(server);
  registerRulesTools(server);
  registerStrategyTools(server);
  registerSliceTools(server);
}
