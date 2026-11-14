# Graph Report - dist  (2026-11-14)

## Corpus Check
- 8 files · ~17,688 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 17 file(s) not represented in the graph (top: .css 13, .woff2 4)

## Summary
- 242 nodes · 695 edges · 17 communities (14 shown, 3 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 64 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f391ac84`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- renderDeckEditorCards
- game-core.js
- renderCoopVictory
- render
- app.js
- renderQuestionPanel
- room-client.js
- RoomClient
- esc
- account-client.js
- renderOnlineSnapshot
- vercel.json
- renderBoardScene
- race-mode.js
- renderBoardPawnAvatar
- renderGame

## God Nodes (most connected - your core abstractions)
1. `render()` - 44 edges
2. `esc()` - 34 edges
3. `handleAction()` - 27 edges
4. `RoomClient` - 26 edges
5. `renderGame()` - 21 edges
6. `playSfx()` - 19 edges
7. `toast()` - 18 edges
8. `submitAnswer()` - 15 edges
9. `renderBoardScene()` - 13 edges
10. `renderOnlineSnapshot()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `mount()` --calls--> `RoomClient`  [EXTRACTED]
  dist/multiplayer-ui.js → dist/room-client.js
- `clearRoomCodeFromUrl()` --calls--> `roomUrlWithoutCode()`  [EXTRACTED]
  dist/multiplayer-ui.js → dist/room-client.js
- `renderActive()` --calls--> `renderLobby()`  [EXTRACTED]
  dist/multiplayer-ui.js → dist/room-client.js
- `renderLobbyModal()` --calls--> `renderLobby()`  [EXTRACTED]
  dist/multiplayer-ui.js → dist/room-client.js
- `mount()` --calls--> `canAutoResumeRoom()`  [EXTRACTED]
  dist/multiplayer-ui.js → dist/room-client.js

## Import Cycles
- None detected.

## Communities (17 total, 3 thin omitted)

### Community 0 - "renderDeckEditorCards"
Cohesion: 0.32
Nodes (8): editProfile(), loadCustomCard(), openDeckEditor(), profileButtons(), renderDeckEditorCards(), reviewError(), saveCustomCard(), showModal()

### Community 1 - "game-core.js"
Cohesion: 0.15
Nodes (10): checkAnswer(), clone(), normalizeText(), racePairing(), resolveCoopTurn(), resolveRaceTurn(), skipCoopTurn(), skipRaceTurn() (+2 more)

### Community 2 - "renderCoopVictory"
Cohesion: 0.31
Nodes (9): persistActiveGame(), renderCoopVictory(), renderErrorRows(), renderErrors(), renderMultiplayerPodium(), renderResult(), renderRoomPostgameOverlay(), scheduleRaceVictoryFinish() (+1 more)

### Community 3 - "render"
Cohesion: 0.16
Nodes (42): advancePlayer(), answerText(), attachPageEvents(), chooseDifficulty(), clearErrors(), clearPlayerTurnClock(), continueAfterAnswer(), continueRace() (+34 more)

### Community 4 - "app.js"
Cohesion: 0.13
Nodes (15): download(), exportDeck(), renderHeroBoardArt(), renderHome(), renderModeArt(), renderModeCards(), renderModeLandmarks(), renderNetworkLandmarks() (+7 more)

### Community 5 - "renderQuestionPanel"
Cohesion: 0.38
Nodes (7): difficultyButtons(), difficultyName(), renderDecks(), renderFeedback(), renderQuestion(), renderQuestionPanel(), themePill()

### Community 6 - "room-client.js"
Cohesion: 0.18
Nodes (22): attached, bindLobbyActions(), clearRoomCodeFromUrl(), colors, esc(), launchMarkup(), leaveActiveRoom(), mount() (+14 more)

### Community 7 - "RoomClient"
Cohesion: 0.20
Nodes (4): credentialsKey(), roomApiBase(), RoomClient, roomWebSocketUrl()

### Community 8 - "esc"
Cohesion: 0.18
Nodes (15): coopPosition(), esc(), mountOnlineRoomLauncher(), onlineTurnNoticeRemaining(), openSetup(), renderBoardPawnAvatar(), renderCoopActions(), renderCoopPlayerRoster() (+7 more)

### Community 9 - "account-client.js"
Cohesion: 0.28
Nodes (16): applyProgress(), avatarMarkup(), clearLegacyProgress(), deleteAccount(), exportAccount(), init(), legacyProgress(), loadGoogleScript() (+8 more)

### Community 10 - "renderOnlineSnapshot"
Cohesion: 0.21
Nodes (13): animateCountdownTick(), decorateOnlineRoomCode(), handleOnlineGameAction(), onlineNow(), playOnlineSnapshotAudio(), renderOnlineSnapshot(), renderTurnClock(), renderTurnNotice() (+5 more)

### Community 12 - "renderBoardScene"
Cohesion: 0.21
Nodes (13): coopBoardScale(), renderArmorDebris(), renderBoardPawn(), renderBoardScene(), renderBossDamageFX(), renderBossModel(), renderCombatEffects(), renderCoopBoardScene() (+5 more)

### Community 14 - "renderBoardPawnAvatar"
Cohesion: 0.40
Nodes (5): renderPrint(), renderRouteGame(), specialDescription(), specialIcon(), specialTitle()

### Community 16 - "renderGame"
Cohesion: 0.27
Nodes (11): initials(), renderBossTargetCard(), renderCoopSupport(), renderDiceTray(), renderDiePips(), renderGame(), renderHealingNodes(), renderRaceDiceTray() (+3 more)

## Knowledge Gaps
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RoomClient` connect `RoomClient` to `room-client.js`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `esc()` (e.g. with `renderBoardScene()` and `renderRaceGame()`) actually correct?**
  _`esc()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `game-core.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14736842105263157 - nodes in this community are weakly interconnected._
- **Why does `render()` connect `render` to `renderCoopVictory`, `app.js`, `renderQuestionPanel`, `esc`, `renderOnlineSnapshot`, `renderBoardPawnAvatar`, `renderGame`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.13043478260869565 - nodes in this community are weakly interconnected._
- **Why does `esc()` connect `esc` to `renderDeckEditorCards`, `renderCoopVictory`, `render`, `app.js`, `renderQuestionPanel`, `renderOnlineSnapshot`, `renderBoardScene`, `renderBoardPawnAvatar`, `renderGame`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._