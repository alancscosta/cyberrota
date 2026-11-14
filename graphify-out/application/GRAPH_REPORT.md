# Graph Report - dist  (2026-11-14)

## Corpus Check
- 8 files · ~17,081 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 17 file(s) not represented in the graph (top: .css 13, .woff2 4)

## Summary
- 224 nodes · 635 edges · 16 communities (13 shown, 3 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 58 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bdda79c7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- esc
- game-core.js
- esc
- render
- app.js
- difficultyName
- multiplayer-ui.js
- RoomClient
- renderBoardPawnAvatar
- account-client.js
- renderCoopVictory
- vercel.json
- renderBoardScene
- race-mode.js
- renderBoardPawnAvatar

## God Nodes (most connected - your core abstractions)
1. `render()` - 42 edges
2. `esc()` - 30 edges
3. `handleAction()` - 27 edges
4. `RoomClient` - 23 edges
5. `renderGame()` - 18 edges
6. `toast()` - 17 edges
7. `submitAnswer()` - 16 edges
8. `playSfx()` - 15 edges
9. `renderBoardScene()` - 13 edges
10. `renderRaceGame()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `mount()` --calls--> `RoomClient`  [EXTRACTED]
  dist/multiplayer-ui.js → dist/room-client.js
- `renderActive()` --calls--> `renderLobby()`  [EXTRACTED]
  dist/multiplayer-ui.js → dist/room-client.js

## Import Cycles
- None detected.

## Communities (16 total, 3 thin omitted)

### Community 0 - "esc"
Cohesion: 0.18
Nodes (14): attachPageEvents(), editProfile(), finishSession(), init(), loadCustomCard(), openDeckEditor(), profileButtons(), renderDeckEditorCards() (+6 more)

### Community 1 - "game-core.js"
Cohesion: 0.15
Nodes (10): checkAnswer(), clone(), normalizeText(), racePairing(), resolveCoopTurn(), resolveRaceTurn(), skipCoopTurn(), skipRaceTurn() (+2 more)

### Community 2 - "esc"
Cohesion: 0.23
Nodes (14): esc(), initials(), renderBossTargetCard(), renderCoopActions(), renderCoopSupport(), renderGame(), renderHealingNodes(), renderMultiplayerPodium() (+6 more)

### Community 3 - "render"
Cohesion: 0.17
Nodes (41): advancePlayer(), answerText(), chooseDifficulty(), clearErrors(), clearPlayerTurnClock(), continueAfterAnswer(), continueRace(), continueSpecial() (+33 more)

### Community 4 - "app.js"
Cohesion: 0.13
Nodes (11): animateCountdownTick(), download(), exportDeck(), renderHome(), renderModeCards(), renderModeLandmarks(), renderNetworkLandmarks(), renderPlay() (+3 more)

### Community 5 - "difficultyName"
Cohesion: 0.38
Nodes (7): difficultyButtons(), difficultyName(), renderFeedback(), renderQuestion(), renderQuestionPanel(), reviewError(), themePill()

### Community 6 - "multiplayer-ui.js"
Cohesion: 0.17
Nodes (23): attached, bindGame(), bindLobbyActions(), colors, currentPlayer(), esc(), gameMarkup(), launchMarkup() (+15 more)

### Community 7 - "RoomClient"
Cohesion: 0.23
Nodes (3): credentialsKey(), roomApiBase(), RoomClient

### Community 8 - "renderBoardPawnAvatar"
Cohesion: 0.33
Nodes (7): coopPosition(), mountOnlineRoomLauncher(), openSetup(), renderBoardPawnAvatar(), renderCoopPlayerRoster(), renderCoopTurn(), renderPlayerSetupFields()

### Community 9 - "account-client.js"
Cohesion: 0.28
Nodes (16): applyProgress(), avatarMarkup(), clearLegacyProgress(), deleteAccount(), exportAccount(), init(), legacyProgress(), loadGoogleScript() (+8 more)

### Community 10 - "renderCoopVictory"
Cohesion: 0.24
Nodes (11): persistActiveGame(), renderCoopVictory(), renderDecks(), renderDiceTray(), renderDiePips(), renderErrorRows(), renderErrors(), renderRaceDiceTray() (+3 more)

### Community 12 - "renderBoardScene"
Cohesion: 0.19
Nodes (13): coopBoardScale(), renderArmorDebris(), renderBoardPawn(), renderBoardScene(), renderBossDamageFX(), renderBossModel(), renderCombatEffects(), renderCoopBoardScene() (+5 more)

### Community 14 - "renderBoardPawnAvatar"
Cohesion: 0.40
Nodes (5): renderPrint(), renderRouteGame(), specialDescription(), specialIcon(), specialTitle()

## Knowledge Gaps
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RoomClient` connect `RoomClient` to `multiplayer-ui.js`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `esc()` (e.g. with `renderBoardScene()` and `renderRaceGame()`) actually correct?**
  _`esc()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `game-core.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14736842105263157 - nodes in this community are weakly interconnected._
- **Why does `render()` connect `render` to `esc`, `esc`, `app.js`, `renderCoopVictory`, `renderBoardPawnAvatar`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.13450292397660818 - nodes in this community are weakly interconnected._
- **Why does `esc()` connect `esc` to `esc`, `render`, `app.js`, `difficultyName`, `renderBoardPawnAvatar`, `renderCoopVictory`, `renderBoardScene`, `renderBoardPawnAvatar`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._