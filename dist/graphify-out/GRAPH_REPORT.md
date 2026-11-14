# Graph Report - dist  (2026-11-14)

## Corpus Check
- 8 files · ~17,345 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 17 file(s) not represented in the graph (top: .css 13, .woff2 4)

## Summary
- 231 nodes · 655 edges · 18 communities (15 shown, 3 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 62 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `04f0f832`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- renderDeckEditorCards
- game-core.js
- renderCoopVictory
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
- renderGame
- renderOnlineSnapshot

## God Nodes (most connected - your core abstractions)
1. `render()` - 42 edges
2. `esc()` - 34 edges
3. `handleAction()` - 27 edges
4. `RoomClient` - 25 edges
5. `renderGame()` - 21 edges
6. `toast()` - 18 edges
7. `playSfx()` - 15 edges
8. `submitAnswer()` - 15 edges
9. `renderBoardScene()` - 13 edges
10. `renderRaceGame()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `mount()` --calls--> `RoomClient`  [EXTRACTED]
  dist/multiplayer-ui.js → dist/room-client.js
- `clearRoomCodeFromUrl()` --calls--> `roomUrlWithoutCode()`  [EXTRACTED]
  dist/multiplayer-ui.js → dist/room-client.js
- `renderActive()` --calls--> `renderLobby()`  [EXTRACTED]
  dist/multiplayer-ui.js → dist/room-client.js
- `mount()` --calls--> `canAutoResumeRoom()`  [EXTRACTED]
  dist/multiplayer-ui.js → dist/room-client.js
- `mount()` --calls--> `canReuseActiveRoom()`  [EXTRACTED]
  dist/multiplayer-ui.js → dist/room-client.js

## Import Cycles
- None detected.

## Communities (18 total, 3 thin omitted)

### Community 0 - "renderDeckEditorCards"
Cohesion: 0.32
Nodes (8): editProfile(), loadCustomCard(), openDeckEditor(), profileButtons(), renderDeckEditorCards(), reviewError(), saveCustomCard(), showModal()

### Community 1 - "game-core.js"
Cohesion: 0.15
Nodes (10): checkAnswer(), clone(), normalizeText(), racePairing(), resolveCoopTurn(), resolveRaceTurn(), skipCoopTurn(), skipRaceTurn() (+2 more)

### Community 2 - "renderCoopVictory"
Cohesion: 0.27
Nodes (10): persistActiveGame(), renderCoopVictory(), renderDecks(), renderErrorRows(), renderErrors(), renderMultiplayerPodium(), renderResult(), renderRoomPostgameOverlay() (+2 more)

### Community 3 - "render"
Cohesion: 0.16
Nodes (42): advancePlayer(), answerText(), attachPageEvents(), chooseDifficulty(), clearErrors(), clearPlayerTurnClock(), continueAfterAnswer(), continueRace() (+34 more)

### Community 4 - "app.js"
Cohesion: 0.12
Nodes (15): download(), exportDeck(), renderBossTargetCard(), renderHeroBoardArt(), renderHome(), renderModeArt(), renderModeCards(), renderModeLandmarks() (+7 more)

### Community 5 - "difficultyName"
Cohesion: 0.47
Nodes (6): difficultyButtons(), difficultyName(), renderFeedback(), renderQuestion(), renderQuestionPanel(), themePill()

### Community 6 - "room-client.js"
Cohesion: 0.18
Nodes (21): attached, bindLobbyActions(), clearRoomCodeFromUrl(), colors, esc(), launchMarkup(), leaveActiveRoom(), mount() (+13 more)

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
Nodes (6): animateCountdownTick(), onlineNow(), renderTurnClock(), renderTurnNotice(), renderTurnWarning(), syncOnlineTurnClock()

### Community 12 - "renderBoardScene"
Cohesion: 0.21
Nodes (13): coopBoardScale(), renderArmorDebris(), renderBoardPawn(), renderBoardScene(), renderBossDamageFX(), renderBossModel(), renderCombatEffects(), renderCoopBoardScene() (+5 more)

### Community 14 - "renderBoardPawnAvatar"
Cohesion: 0.40
Nodes (5): renderPrint(), renderRouteGame(), specialDescription(), specialIcon(), specialTitle()

### Community 16 - "renderGame"
Cohesion: 0.31
Nodes (10): initials(), renderCoopSupport(), renderDiceTray(), renderDiePips(), renderGame(), renderHealingNodes(), renderOnlineTurnBanner(), renderRaceDiceTray() (+2 more)

### Community 17 - "renderOnlineSnapshot"
Cohesion: 1.00
Nodes (3): decorateOnlineRoomCode(), handleOnlineGameAction(), renderOnlineSnapshot()

## Knowledge Gaps
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RoomClient` connect `RoomClient` to `room-client.js`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `esc()` (e.g. with `renderBoardScene()` and `renderRaceGame()`) actually correct?**
  _`esc()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `game-core.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14736842105263157 - nodes in this community are weakly interconnected._
- **Why does `render()` connect `render` to `renderCoopVictory`, `app.js`, `renderBoardPawnAvatar`, `renderOnlineSnapshot`, `renderBoardPawnAvatar`, `renderGame`, `renderOnlineSnapshot`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1225296442687747 - nodes in this community are weakly interconnected._
- **Why does `esc()` connect `renderBoardPawnAvatar` to `renderDeckEditorCards`, `renderCoopVictory`, `render`, `app.js`, `difficultyName`, `renderOnlineSnapshot`, `renderBoardScene`, `renderBoardPawnAvatar`, `renderGame`, `renderOnlineSnapshot`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._