// --------------- Expansion source tagging ---------------

export type ExpansionSource =
  | "base"
  | "pok"
  | "codex-1"
  | "codex-2"
  | "codex-3"
  | "codex-4"
  | "thunders-edge";

export interface Sourced {
  source: ExpansionSource;
  /** If this replaces a card/component from another source (codex updates, etc.) */
  replaces?: string;
}

// --------------- Session configuration ---------------

export interface GameConfig {
  expansions: ExpansionSource[];
  playerCount?: number;
}

// --------------- Factions ---------------

export interface Faction extends Sourced {
  id: string;
  name: string;
  abilities: FactionAbility[];
  startingTech: string[];
  startingUnits: Record<string, number>;
  commodities: number;
  homeSystem: string;
  promissoryNote: PromissoryNote;
  leaders?: Leader[];
  mech?: UnitAbility;
  flavorText?: string;
}

export interface FactionAbility {
  name: string;
  description: string;
}

export interface Leader {
  type: "agent" | "commander" | "hero";
  name: string;
  title: string;
  ability: string;
  unlockCondition?: string;
}

export interface UnitAbility {
  name: string;
  description: string;
}

// --------------- Technologies ---------------

export type TechColor = "blue" | "red" | "yellow" | "green";
export type TechType = "color" | "unit-upgrade" | "faction";

export interface Technology extends Sourced {
  id: string;
  name: string;
  type: TechType;
  color?: TechColor;
  prerequisites: TechColor[];
  description: string;
  faction?: string;
}

// --------------- Planets ---------------

export interface Planet extends Sourced {
  id: string;
  name: string;
  resources: number;
  influence: number;
  trait?: "cultural" | "industrial" | "hazardous";
  techSpecialty?: TechColor;
  legendary?: boolean;
  systemId: string;
}

// --------------- Systems/Tiles ---------------

export interface SystemTilePlanet {
  name: string;
  resources: number;
  influence: number;
  trait: string | string[] | null;
  legendary: boolean | string;
  specialties: string[];
}

export interface SystemTile {
  type: "green" | "blue" | "red" | "hyperlane";
  faction?: string;
  wormhole: string | null;
  anomaly?: string | null;
  planets: SystemTilePlanet[];
  stations?: { name: string; resources: number; influence: number }[];
  nonDraftable?: boolean;
  source: string;
}

// --------------- Strategy Cards ---------------

export interface StrategyCard extends Sourced {
  id: string;
  name: string;
  initiative: number;
  primaryAbility: string;
  secondaryAbility: string;
}

// --------------- Objectives ---------------

export interface Objective extends Sourced {
  id: string;
  name: string;
  type: "public" | "secret";
  stage?: 1 | 2;
  description: string;
  points: number;
  phase?: string;
}

// --------------- Action Cards ---------------

export interface ActionCard extends Sourced {
  id: string;
  name: string;
  description: string;
  playTiming: string;
  count: number;
}

// --------------- Agenda Cards ---------------

export interface Agenda extends Sourced {
  id: string;
  name: string;
  type: "law" | "directive";
  electionType:
    | "player"
    | "planet"
    | "cultural-planet"
    | "industrial-planet"
    | "hazardous-planet"
    | "non-home-planet"
    | "scored-secret-objective"
    | "law"
    | "strategy-card"
    | "for-or-against"
    | "other";
  description?: string;
  for?: string;
  against?: string;
  removedByPok?: boolean;
}

// --------------- Promissory Notes ---------------

export interface PromissoryNote extends Sourced {
  id: string;
  name: string;
  description: string;
  faction?: string;
}

// --------------- Relics (PoK) ---------------

export interface Relic extends Sourced {
  id: string;
  name: string;
  description: string;
}

// --------------- Exploration Cards (PoK) ---------------

export interface ExploreCard extends Sourced {
  id: string;
  name: string;
  trait: "cultural" | "industrial" | "hazardous" | "frontier";
  description: string;
  count: number;
}

// --------------- Units ---------------

export interface Unit extends Sourced {
  id: string;
  name: string;
  type: "flagship" | "war-sun" | "dreadnought" | "cruiser" | "carrier" | "destroyer" | "fighter" | "infantry" | "space-dock" | "pds" | "mech";
  cost?: number;
  combat?: number;
  move?: number;
  capacity?: number;
  abilities?: string[];
  faction?: string;
}

// --------------- Galactic Events (Thunder's Edge) ---------------

export interface GalacticEvent extends Sourced {
  id: string;
  name: string;
  complexity: number;
  effect: string;
}

// --------------- Breakthroughs (Thunder's Edge) ---------------

export interface Breakthrough extends Sourced {
  id: string;
  name: string;
  description: string;
  faction?: string;
  synergy?: string[];
}

// --------------- Rules ---------------

export interface RuleSection {
  id: string;
  title: string;
  content: string;
  subsections?: RuleSection[];
  relatedKeywords?: string[];
}
