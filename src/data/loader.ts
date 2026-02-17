import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Sourced, ExpansionSource, GameConfig, SystemTile } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../../data");

const cache = new Map<string, unknown[]>();
const objectCache = new Map<string, unknown>();

export function loadObjectData<T>(filename: string): T {
  if (objectCache.has(filename)) return objectCache.get(filename) as T;
  const raw = readFileSync(resolve(DATA_DIR, filename), "utf-8");
  const data = JSON.parse(raw) as T;
  objectCache.set(filename, data);
  return data;
}

export function loadSystemsData(): Record<string, SystemTile> {
  return loadObjectData<Record<string, SystemTile>>("systems.json");
}

export function loadRawData<T>(filename: string): T[] {
  if (cache.has(filename)) return cache.get(filename) as T[];
  const raw = readFileSync(resolve(DATA_DIR, filename), "utf-8");
  const data = JSON.parse(raw) as T[];
  cache.set(filename, data);
  return data;
}

export function loadData<T extends Sourced>(filename: string): T[] {
  if (cache.has(filename)) return cache.get(filename) as T[];
  const raw = readFileSync(resolve(DATA_DIR, filename), "utf-8");
  const data = JSON.parse(raw) as T[];
  cache.set(filename, data);
  return data;
}

export function filterByExpansion<T extends Sourced>(
  items: T[],
  expansions: ExpansionSource[],
): T[] {
  const expSet = new Set(expansions);
  const filtered = items.filter((item) => expSet.has(item.source));

  // Handle replacements: remove items that are replaced by newer versions (codex updates, etc.)
  const replacedIds = new Set(
    filtered.filter((i) => i.replaces).map((i) => i.replaces!),
  );

  if (replacedIds.size === 0) return filtered;

  return filtered.filter(
    (item) => !replacedIds.has((item as Record<string, unknown>).id as string),
  );
}

export function loadFiltered<T extends Sourced>(
  filename: string,
  config: GameConfig,
): T[] {
  return filterByExpansion(loadData<T>(filename), config.expansions);
}
