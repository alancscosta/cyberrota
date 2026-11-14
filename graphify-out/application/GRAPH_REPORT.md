# Graph Report - dist  (2026-11-14)

## Corpus Check
- 8 files · ~17,202 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 17 file(s) not represented in the graph (top: .css 13, .woff2 4)

## Summary
- 226 nodes · 646 edges · 17 communities (14 shown, 3 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 60 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `669d0cf6`
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
- renderOnlineSnapshot
- vercel.json
- renderBoardScene
- race-mode.js
- renderBoardPawnAvatar
- renderRaceGame

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

## Communities (17 total, 3 thin omitted)

### Community 0 - "renderDeckEditorCards"
Cohesion: 0.67
Nodes (4): loadCustomCard(), openDeckEditor(), renderDeckEditorCards(), saveCustomCard()

### Community 1 - "game-core.js"
Cohesion: 0.15
Nodes (10): checkAnswer(), clone(), normalizeText(), racePairing(), resolveCoopTurn(), resolveRaceTurn(), skipCoopTurn(), skipRaceTurn() (+2 more)

### Community 2 - "renderGame"
Cohesion: 0.24
Nodes (14): currentPlayer(), initials(), renderCoopSupport(), renderCoopVictory(), renderErrorRows(), renderErrors(), renderGame(), renderHealingNodes() (+6 more)

### Community 3 - "render"
Cohesion: 0.13
Nodes (49): advancePlayer(), answerText(), attachPageEvents(), chooseDifficulty(), clearErrors(), clearPlayerTurnClock(), continueAfterAnswer(), continueRace() (+41 more)

### Community 4 - "app.js"
Cohesion: 0.13
Nodes (14): download(), exportDeck(), renderBossTargetCard(), renderHeroBoardArt(), renderHome(), renderModeArt(), renderModeCards(), renderModeLandmarks() (+6 more)

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
Cohesion: 0.23
Nodes (12): coopPosition(), esc(), mountOnlineRoomLauncher(), openSetup(), renderBoardPawnAvatar(), renderCoopActions(), renderCoopPlayerRoster(), renderCoopTurn() (+4 more)

### Community 9 - "account-client.js"
Cohesion: 0.28
Nodes (16): applyProgress(), avatarMarkup(), clearLegacyProgress(), deleteAccount(), exportAccount(), init(), legacyProgress(), loadGoogleScript() (+8 more)

### Community 10 - "renderOnlineSnapshot"
Cohesion: 0.40
Nodes (6): animateCountdownTick(), decorateOnlineRoomCode(), handleOnlineGameAction(), onlineNow(), renderOnlineSnapshot(), syncOnlineTurnClock()

### Community 12 - "renderBoardScene"
Cohesion: 0.21
Nodes (13): coopBoardScale(), renderArmorDebris(), renderBoardPawn(), renderBoardScene(), renderBossDamageFX(), renderBossModel(), renderCombatEffects(), renderCoopBoardScene() (+5 more)

### Community 14 - "renderBoardPawnAvatar"
Cohesion: 0.40
Nodes (5): renderPrint(), renderRouteGame(), specialDescription(), specialIcon(), specialTitle()

### Community 16 - "renderRaceGame"
Cohesion: 0.40
Nodes (6): persistActiveGame(), renderDiceTray(), renderDiePips(), renderRaceDiceTray(), renderRaceGame(), scheduleRaceVictoryFinish()

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
- **Why does `render()` connect `render` to `renderGame`, `app.js`, `difficultyName`, `renderBoardPawnAvatar`, `renderOnlineSnapshot`, `renderBoardPawnAvatar`, `renderRaceGame`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Should `render` be split into smaller, more focused modules?**
  _Cohesion score 0.13010204081632654 - nodes in this community are weakly interconnected._
- **Why does `esc()` connect `renderBoardPawnAvatar` to `renderDeckEditorCards`, `renderGame`, `render`, `app.js`, `difficultyName`, `renderOnlineSnapshot`, `renderBoardScene`, `renderBoardPawnAvatar`, `renderRaceGame`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.12987012987012986 - nodes in this community are weakly interconnected._