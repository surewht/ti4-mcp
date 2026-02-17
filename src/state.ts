import type { ExpansionSource } from "./data/types.js";

export interface PlayerAssignment {
  seat: number;
  factionId: string;
  sliceTileIds?: number[];
}

export interface GameContext {
  expansions: ExpansionSource[];
  playerCount: number;
  players: PlayerAssignment[];
  speaker?: number;
}

let context: GameContext | null = null;

export function getGameContext(): GameContext | null {
  return context;
}

export function setGameContext(ctx: GameContext): void {
  context = ctx;
}

export function clearGameContext(): void {
  context = null;
}
