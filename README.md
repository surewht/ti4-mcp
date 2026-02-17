# ti4-mcp

MCP server for **Twilight Imperium 4** — provides game data, rules lookup, faction strategy guides, and setup assistance through the [Model Context Protocol](https://modelcontextprotocol.io).

## Supported Content

- **Base game** (17 factions)
- **Prophecy of Kings** (7 factions)
- **Codex I–IV** (errata, updated components, Council Keleres)
- **Thunder's Edge** (5 factions, breakthroughs, galactic events)

## Installation

```bash
npm install
npm run build
```

Requires Node.js 18+.

## Usage

### Claude Code

From GitHub:

```bash
claude mcp add ti4 -- npx --yes github:tokdaniel/ti4-mcp
```

From a local clone:

```bash
claude mcp add ti4 node /path/to/ti4-mcp/dist/index.js
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ti4": {
      "command": "npx",
      "args": ["--yes", "github:tokdaniel/ti4-mcp"]
    }
  }
}
```

### Inspector

```bash
npm run inspect
```

## Tools (27)

### Game Context

| Tool | Description |
|------|-------------|
| `set_game_context` | Set game session context (expansions, player count, factions, slices) — subsequent tools auto-apply it |
| `get_game_context` | View current game context |
| `clear_game_context` | Clear game context |

### Factions

| Tool | Description |
|------|-------------|
| `list_factions` | List factions for active expansions |
| `get_faction` | Detailed faction info (abilities, starting tech, units, leaders, promissory note) |
| `get_faction_guide` | Strategy guide — strengths, weaknesses, tips, tech paths |
| `list_faction_guides` | List all available faction guides |

### Technologies

| Tool | Description |
|------|-------------|
| `get_tech` | Look up a technology by ID |
| `get_tech_path` | Get recommended tech path for a faction |

### Objectives

| Tool | Description |
|------|-------------|
| `list_objectives` | List objectives, filter by type (public/secret) and stage (1/2) |
| `get_objective` | Look up a specific objective |

### Agendas

| Tool | Description |
|------|-------------|
| `list_agendas` | List agenda cards, filter by type (law/directive) or election type |
| `get_agenda` | Look up a specific agenda |

### Action Cards

| Tool | Description |
|------|-------------|
| `list_action_cards` | List action cards, filter by play timing keyword |
| `get_action_card` | Look up a specific action card |

### Relics & Exploration

| Tool | Description |
|------|-------------|
| `list_relics` | List all relics |
| `get_relic` | Look up a specific relic |
| `list_explore_cards` | List exploration cards, filter by trait |

### Planets & Systems

| Tool | Description |
|------|-------------|
| `list_planets` | List planets, filter by trait or tech specialty |
| `get_planet` | Look up a specific planet |
| `get_system` | Look up a system tile by number (planets, wormholes, anomalies) |

### Strategy & Setup

| Tool | Description |
|------|-------------|
| `get_strategy_notes` | Strategic analysis for a faction given the game state |
| `setup_game` | Generate a complete game setup (draft pool, strategy card order, etc.) |
| `suggest_map` | Suggest a balanced map layout for the player count |
| `analyze_slices` | Analyze map slices for balance (resources, influence, tech specialties) |

### Rules & Search

| Tool | Description |
|------|-------------|
| `get_rules` | Look up rules by keyword |
| `search` | Full-text search across all game data categories |

## Game Context

Set your game setup once, and all tools auto-apply it:

```
"Set game context: 6 players, base + PoK + Codex 3"
```

The AI calls `set_game_context` with your expansions and player count. After that, tools like `list_factions`, `list_objectives`, `suggest_map`, etc. automatically use those expansions without you specifying them each time.

You can still override expansions per-call if needed.

## Data

All game data lives in `data/` as JSON files:

| File | Content |
|------|---------|
| `factions.json` | 30 factions with abilities, starting tech, units, leaders |
| `technologies.json` | All technologies across expansions |
| `objectives.json` | Public stage I/II and secret objectives |
| `agendas.json` | Law and directive agenda cards |
| `action-cards.json` | Action cards with play timing |
| `strategy-cards.json` | Strategy cards with primary/secondary abilities |
| `systems.json` | System tiles with planets, wormholes, anomalies |
| `planets.json` | Individual planet data |
| `units.json` | Unit stats (cost, combat, move, capacity, abilities) |
| `promissory-notes.json` | Faction and generic promissory notes |
| `relics.json` | Relics (PoK) |
| `explores.json` | Exploration cards (PoK) |
| `leaders.json` | Agents, commanders, heroes |
| `breakthroughs.json` | Breakthroughs (Thunder's Edge) |
| `galactic-events.json` | Galactic events (Thunder's Edge) |
| `rules.json` | Rules reference with subsections |
| `tile-tiers.json` | Tile quality tiers for map balancing |
| `factions/*.guide.json` | 30 faction strategy guides from competitive community sources |

## Expansions

Tools accept an `expansions` parameter to control which content is included:

- `base` — Base game
- `pok` — Prophecy of Kings
- `codex-1` through `codex-4` — Codex volumes (includes omega replacements)
- `thunders-edge` — Thunder's Edge expansion

When expansions include content that replaces older versions (e.g. omega techs), the older versions are automatically filtered out.

## License

MIT
