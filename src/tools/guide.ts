import { z } from "zod";
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const guidesDir = join(__dirname, "../../data/factions");

interface FactionGuide {
  factionId: string;
  strengths: string[];
  weaknesses: string[];
  tips: string[];
  techPaths: { name: string; techs: string[]; note: string }[];
  sources: string[];
}

function loadGuide(factionId: string): FactionGuide | null {
  try {
    const raw = readFileSync(
      join(guidesDir, `${factionId}.guide.json`),
      "utf-8",
    );
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function listGuideIds(): string[] {
  try {
    return readdirSync(guidesDir)
      .filter((f) => f.endsWith(".guide.json"))
      .map((f) => f.replace(".guide.json", ""))
      .sort();
  } catch {
    return [];
  }
}

export function registerGuideTools(server: McpServer) {
  server.registerTool(
    "get_faction_guide",
    {
      description:
        "Get strategy guide for a TI4 faction — strengths, weaknesses, tips, and recommended tech paths from competitive community sources.",
      inputSchema: z.object({
        faction_id: z
          .string()
          .describe(
            "Faction identifier, e.g. 'sol', 'hacan', 'argent-flight'",
          ),
      }),
    },
    async ({ faction_id }) => {
      const guide = loadGuide(faction_id);
      if (!guide) {
        const available = listGuideIds();
        return {
          content: [
            {
              type: "text",
              text: `No guide found for '${faction_id}'. Available guides: ${available.join(", ")}`,
            },
          ],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(guide, null, 2) }],
      };
    },
  );

  server.registerTool(
    "list_faction_guides",
    {
      description:
        "List all available faction strategy guides.",
      inputSchema: z.object({}),
    },
    async () => {
      const ids = listGuideIds();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { count: ids.length, factions: ids },
              null,
              2,
            ),
          },
        ],
      };
    },
  );
}
