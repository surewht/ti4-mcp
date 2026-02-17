import { z } from "zod";
import type { ExpansionSource } from "./data/types.js";
import { getGameContext } from "./state.js";

export const ExpansionSchema = z.enum([
  "base",
  "pok",
  "codex-1",
  "codex-2",
  "codex-3",
  "codex-4",
  "thunders-edge",
]);

export const ExpansionsParam = z
  .array(ExpansionSchema)
  .optional()
  .describe(
    "Active expansions. If omitted, uses game context or defaults to base game. Options: base, pok, codex-1, codex-2, codex-3, codex-4, thunders-edge",
  );

export function resolveExpansions(input?: string[]): ExpansionSource[] {
  if (!input || input.length === 0) return ["base"];
  const result = new Set<ExpansionSource>(input as ExpansionSource[]);
  // All expansions implicitly include base
  if (result.size > 0) result.add("base");
  // thunders-edge implicitly includes pok
  if (result.has("thunders-edge")) result.add("pok");
  return [...result];
}

export function resolveExpansionsWithContext(
  explicit?: string[],
): ExpansionSource[] {
  // Use explicit if provided and not just the default ["base"]
  if (explicit && explicit.length > 0) return resolveExpansions(explicit);
  // Fall back to game context
  const ctx = getGameContext();
  if (ctx) return ctx.expansions;
  // Default
  return resolveExpansions(explicit);
}
