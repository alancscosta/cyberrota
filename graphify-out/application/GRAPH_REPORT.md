# Graph Report - dist  (2026-11-14)

## Corpus Check
- 8 files · ~17,180 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 17 file(s) not represented in the graph (top: .css 13, .woff2 4)

## Summary
- 226 nodes · 645 edges · 15 communities (12 shown, 3 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 60 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `aa982f63`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- renderDeckEditorCards
- game-core.js
- renderGame
- render
- app.js
- difficultyName
- room-client.js
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
4. `RoomClient` - 25 edges
5. `renderGame()` - 20 edges
6. `toast()` - 18 edges
7. `submitAnswer()` - 16 edges
8. `playSfx()` - 15 edges
9. `renderBoardScene()` - 13 edges
10. `currentPlayer()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `mount()` --calls--> `RoomClient`  [EXTRACTED]
  dist/multiplayer-ui.js → dist/room-client.js
- `renderActive()` --calls--> `renderLobby()`  [EXTRACTED]
  dist/multiplayer-ui.js → dist/room-client.js

## Import Cycles
- None detected.

## Communities (15 total, 3 thin omitted)

### Community 0 - "renderDeckEditorCards"
Cohesion: 0.67
Nodes (4): loadCustomCard(), openDeckEditor(), renderDeckEditorCards(), saveCustomCard()

### Community 1 - "game-core.js"
Cohesion: 0.15
Nodes (10): checkAnswer(), clone(), normalizeText(), racePairing(), resolveCoopTurn(), resolveRaceTurn(), skipCoopTurn(), skipRaceTurn() (+2 more)

### Community 2 - "renderGame"
Cohesion: 0.18
Nodes (19): currentPlayer(), initials(), persistActiveGame(), renderCoopSupport(), renderCoopVictory(), renderDiceTray(), renderDiePips(), renderErrorRows() (+11 more)

### Community 3 - "render"
Cohesion: 0.13
Nodes (49): advancePlayer(), answerText(), attachPageEvents(), chooseDifficulty(), clearErrors(), clearPlayerTurnClock(), continueAfterAnswer(), continueRace() (+41 more)

### Community 4 - "app.js"
Cohesion: 0.12
Nodes (17): animateCountdownTick(), download(), exportDeck(), onlineNow(), renderBossTargetCard(), renderHeroBoardArt(), renderHome(), renderModeArt() (+9 more)

### Community 5 - "difficultyName"
Cohesion: 0.38
Nodes (7): difficultyButtons(), difficultyName(), renderDecks(), renderFeedback(), renderQuestion(), renderQuestionPanel(), themePill()

### Community 6 - "room-client.js"
Cohesion: 0.20
Nodes (16): attached, bindLobbyActions(), colors, esc(), launchMarkup(), mount(), readSavedCode(), renderActive() (+8 more)

### Community 7 - "RoomClient"
Cohesion: 0.21
Nodes (3): credentialsKey(), roomApiBase(), RoomClient

### Community 8 - "renderBoardPawnAvatar"
Cohesion: 0.18
Nodes (16): coopPosition(), decorateOnlineRoomCode(), esc(), handleOnlineGameAction(), mountOnlineRoomLauncher(), openSetup(), renderBoardPawnAvatar(), renderCoopActions() (+8 more)

### Community 9 - "account-client.js"
Cohesion: 0.28
Nodes (16): applyProgress(), avatarMarkup(), clearLegacyProgress(), deleteAccount(), exportAccount(), init(), legacyProgress(), loadGoogleScript() (+8 more)

### Community 12 - "renderBoardScene"
Cohesion: 0.21
Nodes (13): coopBoardScale(), renderArmorDebris(), renderBoardPawn(), renderBoardScene(), renderBossDamageFX(), renderBossModel(), renderCombatEffects(), renderCoopBoardScene() (+5 more)

### Community 14 - "renderBoardPawnAvatar"
Cohesion: 0.40
Nodes (5): renderPrint(), renderRouteGame(), specialDescription(), specialIcon(), specialTitle()

## Knowledge Gaps
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RoomClient` connect `RoomClient` to `room-client.js`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `esc()` (e.g. with `renderBoardScene()` and `renderRaceGame()`) actually correct?**
  _`esc()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `game-core.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14736842105263157 - nodes in this community are weakly interconnected._
- **Why does `render()` connect `render` to `renderGame`, `app.js`, `difficultyName`, `renderBoardPawnAvatar`, `renderBoardPawnAvatar`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Should `render` be split into smaller, more focused modules?**
  _Cohesion score 0.13010204081632654 - nodes in this community are weakly interconnected._
- **Why does `esc()` connect `renderBoardPawnAvatar` to `renderDeckEditorCards`, `renderGame`, `render`, `app.js`, `difficultyName`, `renderBoardScene`, `renderBoardPawnAvatar`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11666666666666667 - nodes in this community are weakly interconnected._