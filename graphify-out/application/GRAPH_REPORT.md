# Graph Report - dist  (2026-11-14)

## Corpus Check
- 8 files · ~17,064 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 17 file(s) not represented in the graph (top: .css 13, .woff2 4)

## Summary
- 224 nodes · 639 edges · 14 communities (11 shown, 3 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 60 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2e70758e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- esc
- game-core.js
- renderGame
- render
- app.js
- difficultyName
- RoomClient
- renderBoardPawnAvatar
- account-client.js
- vercel.json
- renderBoardScene
- race-mode.js
- renderBoardPawnAvatar

## God Nodes (most connected - your core abstractions)
1. `render()` - 43 edges
2. `esc()` - 33 edges
3. `handleAction()` - 27 edges
4. `RoomClient` - 23 edges
5. `renderGame()` - 20 edges
6. `toast()` - 18 edges
7. `submitAnswer()` - 16 edges
8. `playSfx()` - 15 edges
9. `renderBoardScene()` - 13 edges
10. `currentPlayer()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `renderActive()` --calls--> `renderLobby()`  [EXTRACTED]
  dist/multiplayer-ui.js → dist/room-client.js
- `mount()` --calls--> `RoomClient`  [EXTRACTED]
  dist/multiplayer-ui.js → dist/room-client.js

## Import Cycles
- None detected.

## Communities (14 total, 3 thin omitted)

### Community 0 - "esc"
Cohesion: 0.32
Nodes (8): editProfile(), loadCustomCard(), openDeckEditor(), profileButtons(), renderDeckEditorCards(), reviewError(), saveCustomCard(), showModal()

### Community 1 - "game-core.js"
Cohesion: 0.15
Nodes (10): checkAnswer(), clone(), normalizeText(), racePairing(), resolveCoopTurn(), resolveRaceTurn(), skipCoopTurn(), skipRaceTurn() (+2 more)

### Community 2 - "renderGame"
Cohesion: 0.20
Nodes (18): initials(), persistActiveGame(), renderCoopSupport(), renderCoopVictory(), renderDiceTray(), renderDiePips(), renderErrorRows(), renderErrors() (+10 more)

### Community 3 - "render"
Cohesion: 0.15
Nodes (46): advancePlayer(), answerText(), attachPageEvents(), chooseDifficulty(), clearErrors(), clearPlayerTurnClock(), continueAfterAnswer(), continueRace() (+38 more)

### Community 4 - "app.js"
Cohesion: 0.11
Nodes (18): animateCountdownTick(), download(), exportDeck(), onlineNow(), renderBossTargetCard(), renderHeroBoardArt(), renderHome(), renderModeArt() (+10 more)

### Community 5 - "difficultyName"
Cohesion: 0.38
Nodes (7): difficultyButtons(), difficultyName(), renderDecks(), renderFeedback(), renderQuestion(), renderQuestionPanel(), themePill()

### Community 7 - "RoomClient"
Cohesion: 0.12
Nodes (19): attached, bindLobbyActions(), colors, esc(), launchMarkup(), mount(), readSavedCode(), renderActive() (+11 more)

### Community 8 - "renderBoardPawnAvatar"
Cohesion: 0.24
Nodes (11): decorateOnlineRoomCode(), esc(), handleOnlineGameAction(), mountOnlineRoomLauncher(), openSetup(), renderCoopActions(), renderOnlineSnapshot(), renderPlayerNames() (+3 more)

### Community 9 - "account-client.js"
Cohesion: 0.28
Nodes (16): applyProgress(), avatarMarkup(), clearLegacyProgress(), deleteAccount(), exportAccount(), init(), legacyProgress(), loadGoogleScript() (+8 more)

### Community 12 - "renderBoardScene"
Cohesion: 0.21
Nodes (13): coopBoardScale(), renderArmorDebris(), renderBoardPawn(), renderBoardScene(), renderBossDamageFX(), renderBossModel(), renderCombatEffects(), renderCoopBoardScene() (+5 more)

### Community 14 - "renderBoardPawnAvatar"
Cohesion: 0.25
Nodes (9): coopPosition(), renderBoardPawnAvatar(), renderCoopPlayerRoster(), renderCoopTurn(), renderPrint(), renderRouteGame(), specialDescription(), specialIcon() (+1 more)

## Knowledge Gaps
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `render()` connect `render` to `renderGame`, `app.js`, `difficultyName`, `renderBoardPawnAvatar`, `renderBoardPawnAvatar`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `esc()` (e.g. with `renderBoardScene()` and `renderRaceGame()`) actually correct?**
  _`esc()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `game-core.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14736842105263157 - nodes in this community are weakly interconnected._
- **Why does `esc()` connect `renderBoardPawnAvatar` to `esc`, `renderGame`, `render`, `app.js`, `difficultyName`, `renderBoardScene`, `renderBoardPawnAvatar`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Should `render` be split into smaller, more focused modules?**
  _Cohesion score 0.1468599033816425 - nodes in this community are weakly interconnected._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11076923076923077 - nodes in this community are weakly interconnected._
- **Should `RoomClient` be split into smaller, more focused modules?**
  _Cohesion score 0.11585365853658537 - nodes in this community are weakly interconnected._