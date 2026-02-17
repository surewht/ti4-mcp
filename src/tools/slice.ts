import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { loadSystemsData } from "../data/loader.js";
import type { SystemTile } from "../data/types.js";

// --------------- Tile Classification ---------------

type TileClassification = "clear" | "hazard" | "impassable";

function classifyTile(tile: SystemTile | undefined): TileClassification {
  if (!tile) return "clear";
  const anomaly = tile.anomaly;
  if (!anomaly) return "clear";
  if (anomaly === "supernova" || anomaly === "muaat-supernova") return "impassable";
  return "hazard";
}

function describeTile(tileId: number, tile: SystemTile | undefined): string {
  if (!tile) return `Tile ${tileId} (unknown)`;
  const classification = classifyTile(tile);
  if (classification === "impassable") {
    return `${tile.anomaly!.replace(/-/g, " ")} (IMPASSABLE)`;
  }
  const planetNames = tile.planets.map((p) => p.name).join(", ");
  const parts: string[] = [];
  if (planetNames) parts.push(planetNames);
  parts.push(classification);
  if (tile.planets.length > 0) parts.push(`${tile.planets.length} planet(s)`);
  if (tile.anomaly) parts.push(tile.anomaly.replace(/-/g, " "));
  return parts.join(", ");
}

// --------------- Mecatol Path Analysis ---------------

interface RouteAnalysis {
  path: (number | "unknown")[];
  steps: number;
  status: "clear" | "hazard" | "blocked" | "unknown";
  hazards: string[];
}

interface MecatolPathAnalysis {
  mecatolBlocked: boolean;
  mecatolGateTile: string;
  bestPath: {
    route: string;
    steps: number | null;
    status: "clear" | "hazard" | "blocked" | "unknown";
    hazards: string[];
  };
  routes: {
    center: RouteAnalysis;
    left: RouteAnalysis;
    right: RouteAnalysis;
  };
  mecatolPathScore: number;
  summary: string;
}

function evaluateRoute(
  indices: (number | "unknown")[],
  tiles: (SystemTile | undefined)[],
  tileIds: number[],
): RouteAnalysis {
  const hazards: string[] = [];
  let hasImpassable = false;
  let hasHazard = false;
  let hasUnknown = false;

  for (const idx of indices) {
    if (idx === "unknown") {
      hasUnknown = true;
      continue;
    }
    const tile = tiles[idx];
    const classification = classifyTile(tile);
    if (classification === "impassable") {
      hasImpassable = true;
      const anomaly = tile?.anomaly ?? "supernova";
      hazards.push(`${anomaly.replace(/-/g, " ")} at index ${idx}`);
    } else if (classification === "hazard") {
      hasHazard = true;
      const anomaly = tile?.anomaly ?? "unknown hazard";
      hazards.push(`${anomaly.replace(/-/g, " ")} at index ${idx}`);
    }
  }

  const path: (number | "unknown")[] = indices.map((idx) =>
    idx === "unknown" ? "unknown" : tileIds[idx],
  );

  let status: RouteAnalysis["status"];
  if (hasImpassable) status = "blocked";
  else if (hasUnknown) status = "unknown";
  else if (hasHazard) status = "hazard";
  else status = "clear";

  return {
    path,
    steps: indices.length + 1, // +1 because path includes Home step
    status,
    hazards,
  };
}

function formatRoute(name: string, indices: (number | "unknown")[]): string {
  const labels: Record<number, string> = {
    0: "Left(0)",
    1: "Center(1)",
    2: "Right(2)",
    3: "Mecatol-left(3)",
    4: "Mecatol-gate(4)",
  };
  const parts = indices.map((idx) =>
    idx === "unknown" ? "Unknown(?)" : labels[idx] ?? `(${idx})`,
  );
  return `Home → ${parts.join(" → ")} → Mecatol`;
}

function analyzeMecatolPath(tileIds: number[]): MecatolPathAnalysis {
  const systems = loadSystemsData();
  const tiles: (SystemTile | undefined)[] = tileIds.map((id) => systems[String(id)]);

  const gateTile = tiles[4];
  const gateClassification = classifyTile(gateTile);
  const mecatolGateTile = describeTile(tileIds[4], gateTile);

  // If index 4 is impassable, ALL paths are blocked
  if (gateClassification === "impassable") {
    const blockedRoute: RouteAnalysis = {
      path: [],
      steps: 0,
      status: "blocked",
      hazards: [`${gateTile?.anomaly ?? "supernova"} at index 4`],
    };
    return {
      mecatolBlocked: true,
      mecatolGateTile,
      bestPath: {
        route: "none through own slice",
        steps: null,
        status: "blocked",
        hazards: [`${gateTile?.anomaly ?? "supernova"} at index 4`],
      },
      routes: {
        center: { ...evaluateRoute([1, 4], tiles, tileIds), status: "blocked" },
        left: { ...evaluateRoute([0, 3, 4], tiles, tileIds), status: "blocked" },
        right: { ...evaluateRoute([2, "unknown", 4], tiles, tileIds), status: "blocked" },
      },
      mecatolPathScore: calculateMecatolScore(tiles),
      summary: `ALL routes blocked. ${mecatolGateTile} at Mecatol gate (index 4). No Mecatol access through this slice.`,
    };
  }

  // Evaluate the three main routes
  const center = evaluateRoute([1, 4], tiles, tileIds);
  const left = evaluateRoute([0, 3, 4], tiles, tileIds);
  const right = evaluateRoute([2, "unknown", 4], tiles, tileIds);

  // Pick best path: clear center > clear left > hazard center > hazard left > right > blocked
  type Candidate = { name: string; route: RouteAnalysis; indices: (number | "unknown")[] };
  const candidates: Candidate[] = [
    { name: "center", route: center, indices: [1, 4] },
    { name: "left", route: left, indices: [0, 3, 4] },
    { name: "right", route: right, indices: [2, "unknown", 4] },
  ];

  const statusPriority: Record<string, number> = {
    clear: 0,
    hazard: 1,
    unknown: 2,
    blocked: 3,
  };

  candidates.sort((a, b) => {
    const sPri = statusPriority[a.route.status] - statusPriority[b.route.status];
    if (sPri !== 0) return sPri;
    return a.route.steps - b.route.steps; // prefer fewer steps
  });

  const best = candidates[0];
  const bestRoute = formatRoute(best.name, best.indices);

  // Build summary
  const summaryParts: string[] = [];
  if (center.status === "clear") summaryParts.push("Clean 3-step center route available.");
  else if (center.status === "hazard") summaryParts.push(`Center route possible but ${center.hazards[0] ?? "hazard"}.`);
  else if (center.status === "blocked") summaryParts.push("Center route blocked.");

  if (left.status === "clear") summaryParts.push("Left route also clear as backup.");
  else if (left.status === "hazard") summaryParts.push(`Left route has hazard: ${left.hazards.join(", ")}.`);
  else if (left.status === "blocked") summaryParts.push("Left route blocked.");

  summaryParts.push(`Mecatol gate (${mecatolGateTile}).`);

  return {
    mecatolBlocked: false,
    mecatolGateTile,
    bestPath: {
      route: bestRoute,
      steps: best.route.steps,
      status: best.route.status,
      hazards: best.route.hazards,
    },
    routes: { center, left, right },
    mecatolPathScore: calculateMecatolScore(tiles),
    summary: summaryParts.join(" "),
  };
}

function calculateMecatolScore(tiles: (SystemTile | undefined)[]): number {
  let score = 0;
  const gate = classifyTile(tiles[4]);
  const idx1 = classifyTile(tiles[1]);
  const idx0 = classifyTile(tiles[0]);
  const idx3 = classifyTile(tiles[3]);

  // Index 4 (Mecatol gate)
  if (gate === "impassable") score -= 100;
  else if (gate === "hazard") score -= 15;

  // Center route (index 1)
  if (idx1 === "clear") score += 10;
  else if (idx1 === "hazard") score -= 5;
  else if (idx1 === "impassable") score -= 10;

  // Left route (indices 0, 3)
  const leftHasImpassable = idx0 === "impassable" || idx3 === "impassable";
  const leftHasHazard = idx0 === "hazard" || idx3 === "hazard";

  if (!leftHasImpassable && !leftHasHazard) score += 5; // fully clear
  else if (leftHasHazard) score -= 3;
  if (leftHasImpassable) score -= 5;

  // Index 0 specifically impassable (blocks left route entirely)
  if (idx0 === "impassable") score -= 5;

  // Both center and left blocked
  const centerBlocked = idx1 === "impassable" || gate === "impassable";
  const leftBlocked = idx0 === "impassable" || idx3 === "impassable" || gate === "impassable";
  if (centerBlocked && leftBlocked) score -= 20;

  return score;
}

// --------------- Slice Analysis ---------------

interface SliceAnalysis {
  tileIds: number[];
  totalResources: number;
  totalInfluence: number;
  optimalValue: number;
  techSkips: string[];
  wormholes: string[];
  anomalies: string[];
  planets: { name: string; resources: number; influence: number; trait: string | string[] | null }[];
  legendaryPlanets: { name: string; ability: string }[];
  planetCount: number;
  mecatolPath: MecatolPathAnalysis;
}

function analyzeSlice(tileIds: number[]): SliceAnalysis {
  const systems = loadSystemsData();
  let totalResources = 0;
  let totalInfluence = 0;
  const techSkips: string[] = [];
  const specialtyToColor: Record<string, string> = {
    propulsion: "blue",
    warfare: "red",
    biotic: "green",
    cybernetic: "yellow",
  };
  const wormholes: string[] = [];
  const anomalies: string[] = [];
  const planets: SliceAnalysis["planets"] = [];
  const legendaryPlanets: SliceAnalysis["legendaryPlanets"] = [];

  for (const tileId of tileIds) {
    const tile = systems[String(tileId)];
    if (!tile) continue;

    if (tile.wormhole) wormholes.push(tile.wormhole);
    if (tile.anomaly) anomalies.push(tile.anomaly);

    for (const p of tile.planets) {
      totalResources += p.resources;
      totalInfluence += p.influence;
      planets.push({ name: p.name, resources: p.resources, influence: p.influence, trait: p.trait });
      if (p.specialties && p.specialties.length) {
        for (const spec of p.specialties) {
          const color = specialtyToColor[spec] ?? spec;
          techSkips.push(`${p.name}: ${spec} (${color})`);
        }
      }
      if (p.legendary) {
        legendaryPlanets.push({
          name: p.name,
          ability: typeof p.legendary === "string" ? p.legendary : "yes",
        });
      }
    }

    if (tile.stations) {
      for (const s of tile.stations) {
        totalResources += s.resources;
        totalInfluence += s.influence;
      }
    }
  }

  return {
    tileIds,
    totalResources,
    totalInfluence,
    optimalValue: totalResources + totalInfluence,
    techSkips,
    wormholes,
    anomalies,
    planets,
    legendaryPlanets,
    planetCount: planets.length,
    mecatolPath: analyzeMecatolPath(tileIds),
  };
}

export function registerSliceTools(server: McpServer) {
  server.registerTool(
    "analyze_slices",
    {
      description:
        "Analyze and compare Milty Draft slices. Each slice is an array of 5 tile IDs (indices: 0=home-left, 1=center, 2=home-right, 3=mecatol-left, 4=mecatol-gate). Returns resource/influence totals, tech skips, wormholes, anomalies, legendary planets, Mecatol path analysis, and a ranking from best to worst.",
      inputSchema: z.object({
        slices: z
          .array(z.array(z.number()))
          .describe("Array of slices. Each slice is an array of tile IDs from Milty Draft (e.g. [[29,27,60,47,79], [32,73,20,48,68]])."),
      }),
    },
    async ({ slices }) => {
      if (slices.length === 0) {
        return {
          content: [{ type: "text" as const, text: "No slices provided." }],
          isError: true,
        };
      }

      const analyses = slices.map((tileIds, index) => ({
        sliceIndex: index + 1,
        ...analyzeSlice(tileIds),
      }));

      // Rank slices: optimal value, then tech skips count, then planet count, then wormhole count
      const ranking = [...analyses].sort((a, b) => {
        if (b.optimalValue !== a.optimalValue) return b.optimalValue - a.optimalValue;
        if (b.techSkips.length !== a.techSkips.length) return b.techSkips.length - a.techSkips.length;
        if (b.planetCount !== a.planetCount) return b.planetCount - a.planetCount;
        return b.wormholes.length - a.wormholes.length;
      });

      const result = {
        slices: analyses,
        ranking: ranking.map((s) => ({
          sliceIndex: s.sliceIndex,
          optimalValue: s.optimalValue,
          mecatolPathScore: s.mecatolPath.mecatolPathScore,
          techSkips: s.techSkips,
          summary: `${s.totalResources}R/${s.totalInfluence}I, ${s.techSkips.length} skip(s)${s.techSkips.length ? " [" + s.techSkips.join(", ") + "]" : ""}, ${s.planetCount} planet(s)${s.wormholes.length ? ", " + s.wormholes.join("+") + " wormhole(s)" : ""}${s.legendaryPlanets.length ? ", LEGENDARY" : ""} | Mecatol: ${s.mecatolPath.mecatolBlocked ? "BLOCKED" : s.mecatolPath.bestPath.status} (score: ${s.mecatolPath.mecatolPathScore})`,
        })),
      };

      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
