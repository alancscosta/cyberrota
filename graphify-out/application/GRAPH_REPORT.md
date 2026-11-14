# Graph Report - dist  (2026-11-14)

## Corpus Check
- 7 files · ~16,401 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 16 file(s) not represented in the graph (top: .css 12, .woff2 4)

## Summary
- 218 nodes · 627 edges · 15 communities (13 shown, 2 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 56 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4254ebaf`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- esc
- game-core.js
- renderGame
- render
- app.js
- difficultyName
- multiplayer-ui.js
- RoomClient
- attachPageEvents
- account-client.js
- renderCoopVictory
- vercel.json
- renderBoardScene
- race-mode.js
- renderBoardPawnAvatar

## God Nodes (most connected - your core abstractions)
1. `render()` - 43 edges
2. `esc()` - 31 edges
3. `handleAction()` - 28 edges
4. `RoomClient` - 21 edges
5. `toast()` - 18 edges
6. `renderGame()` - 18 edges
7. `submitAnswer()` - 16 edges
8. `playSfx()` - 15 edges
9. `renderBoardScene()` - 13 edges
10. `saveStore()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `mount()` --calls--> `RoomClient`  [EXTRACTED]
  dist/multiplayer-ui.js → dist/room-client.js
- `renderActive()` --calls--> `renderLobby()`  [EXTRACTED]
  dist/multiplayer-ui.js → dist/room-client.js

## Import Cycles
- None detected.

## Communities (15 total, 2 thin omitted)

### Community 0 - "esc"
Cohesion: 0.23
Nodes (14): editProfile(), esc(), init(), loadCustomCard(), openDeckEditor(), openSetup(), profileButtons(), renderCoopActions() (+6 more)

### Community 1 - "game-core.js"
Cohesion: 0.15
Nodes (10): checkAnswer(), clone(), normalizeText(), racePairing(), resolveCoopTurn(), resolveRaceTurn(), skipCoopTurn(), skipRaceTurn() (+2 more)

### Community 2 - "renderGame"
Cohesion: 0.31
Nodes (10): initials(), renderCoopSupport(), renderDiceTray(), renderDiePips(), renderGame(), renderHealingNodes(), renderRaceDiceTray(), renderRaceGame() (+2 more)

### Community 3 - "render"
Cohesion: 0.17
Nodes (41): advancePlayer(), animateCountdownTick(), answerText(), chooseDifficulty(), clearErrors(), clearPlayerTurnClock(), continueAfterAnswer(), continueRace() (+33 more)

### Community 4 - "app.js"
Cohesion: 0.12
Nodes (16): download(), exportData(), exportDeck(), renderBossTargetCard(), renderHeroBoardArt(), renderHome(), renderModeCards(), renderModeLandmarks() (+8 more)

### Community 5 - "difficultyName"
Cohesion: 0.38
Nodes (7): difficultyButtons(), difficultyName(), renderFeedback(), renderQuestion(), renderQuestionPanel(), reviewError(), themePill()

### Community 6 - "multiplayer-ui.js"
Cohesion: 0.17
Nodes (23): attached, bindGame(), bindLobbyActions(), colors, currentPlayer(), esc(), gameMarkup(), launchMarkup() (+15 more)

### Community 7 - "RoomClient"
Cohesion: 0.22
Nodes (3): credentialsKey(), roomApiBase(), RoomClient

### Community 8 - "attachPageEvents"
Cohesion: 0.50
Nodes (4): attachPageEvents(), finishSession(), renderPlayerNames(), setPage()

### Community 9 - "account-client.js"
Cohesion: 0.38
Nodes (13): applyProgress(), deleteAccount(), ensureGuestSession(), exportAccount(), init(), loadGoogleScript(), localProgress(), logout() (+5 more)

### Community 10 - "renderCoopVictory"
Cohesion: 0.28
Nodes (9): persistActiveGame(), renderCoopVictory(), renderDecks(), renderErrorRows(), renderErrors(), renderMultiplayerPodium(), renderResult(), scheduleRaceVictoryFinish() (+1 more)

### Community 12 - "renderBoardScene"
Cohesion: 0.21
Nodes (13): coopBoardScale(), renderArmorDebris(), renderBoardPawn(), renderBoardScene(), renderBossDamageFX(), renderBossModel(), renderCombatEffects(), renderCoopBoardScene() (+5 more)

### Community 14 - "renderBoardPawnAvatar"
Cohesion: 0.25
Nodes (9): coopPosition(), renderBoardPawnAvatar(), renderCoopPlayerRoster(), renderCoopTurn(), renderPrint(), renderRouteGame(), specialDescription(), specialIcon() (+1 more)

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RoomClient` connect `RoomClient` to `multiplayer-ui.js`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `esc()` (e.g. with `renderBoardScene()` and `renderRaceGame()`) actually correct?**
  _`esc()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `game-core.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14736842105263157 - nodes in this community are weakly interconnected._
- **Why does `render()` connect `render` to `esc`, `renderGame`, `app.js`, `attachPageEvents`, `renderCoopVictory`, `renderBoardPawnAvatar`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11594202898550725 - nodes in this community are weakly interconnected._
- **Why does `esc()` connect `esc` to `renderGame`, `render`, `app.js`, `difficultyName`, `attachPageEvents`, `renderCoopVictory`, `renderBoardScene`, `renderBoardPawnAvatar`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._