# Graph Report - dist  (2026-11-14)

## Corpus Check
- 8 files · ~17,012 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 17 file(s) not represented in the graph (top: .css 13, .woff2 4)

## Summary
- 223 nodes · 635 edges · 16 communities (13 shown, 3 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 60 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `881adfff`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- esc
- game-core.js
- renderGame
- render
- app.js
- difficultyName
- renderOnlineSnapshot
- RoomClient
- renderBoardPawnAvatar
- account-client.js
- renderCoopVictory
- vercel.json
- renderBoardScene
- race-mode.js
- renderBoardPawnAvatar

## God Nodes (most connected - your core abstractions)
1. `render()` - 43 edges
2. `esc()` - 33 edges
3. `handleAction()` - 27 edges
4. `RoomClient` - 23 edges
5. `toast()` - 18 edges
6. `renderGame()` - 18 edges
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

## Communities (16 total, 3 thin omitted)

### Community 0 - "esc"
Cohesion: 0.23
Nodes (12): attachPageEvents(), editProfile(), finishSession(), init(), loadCustomCard(), openDeckEditor(), profileButtons(), renderDeckEditorCards() (+4 more)

### Community 1 - "game-core.js"
Cohesion: 0.15
Nodes (10): checkAnswer(), clone(), normalizeText(), racePairing(), resolveCoopTurn(), resolveRaceTurn(), skipCoopTurn(), skipRaceTurn() (+2 more)

### Community 2 - "renderGame"
Cohesion: 0.36
Nodes (9): initials(), renderCoopSupport(), renderDiceTray(), renderDiePips(), renderGame(), renderHealingNodes(), renderRaceDiceTray(), renderRaceGame() (+1 more)

### Community 3 - "render"
Cohesion: 0.15
Nodes (44): advancePlayer(), answerText(), chooseDifficulty(), clearErrors(), clearPlayerTurnClock(), continueAfterAnswer(), continueRace(), continueSpecial() (+36 more)

### Community 4 - "app.js"
Cohesion: 0.13
Nodes (13): download(), exportDeck(), renderBossTargetCard(), renderHeroBoardArt(), renderHome(), renderModeArt(), renderModeCards(), renderModeLandmarks() (+5 more)

### Community 5 - "difficultyName"
Cohesion: 0.28
Nodes (9): difficultyButtons(), difficultyName(), renderFeedback(), renderPrint(), renderQuestion(), renderQuestionPanel(), reviewError(), specialTitle() (+1 more)

### Community 6 - "renderOnlineSnapshot"
Cohesion: 0.40
Nodes (6): animateCountdownTick(), decorateOnlineRoomCode(), handleOnlineGameAction(), onlineNow(), renderOnlineSnapshot(), syncOnlineTurnClock()

### Community 7 - "RoomClient"
Cohesion: 0.12
Nodes (19): attached, bindLobbyActions(), colors, esc(), launchMarkup(), mount(), readSavedCode(), renderActive() (+11 more)

### Community 8 - "renderBoardPawnAvatar"
Cohesion: 0.23
Nodes (13): coopPosition(), esc(), mountOnlineRoomLauncher(), openSetup(), renderBoardPawnAvatar(), renderCoopActions(), renderCoopPlayerRoster(), renderCoopTurn() (+5 more)

### Community 9 - "account-client.js"
Cohesion: 0.28
Nodes (16): applyProgress(), avatarMarkup(), clearLegacyProgress(), deleteAccount(), exportAccount(), init(), legacyProgress(), loadGoogleScript() (+8 more)

### Community 10 - "renderCoopVictory"
Cohesion: 0.33
Nodes (7): persistActiveGame(), renderCoopVictory(), renderDecks(), renderErrorRows(), renderErrors(), scheduleRaceVictoryFinish(), uiIcon()

### Community 12 - "renderBoardScene"
Cohesion: 0.21
Nodes (13): coopBoardScale(), renderArmorDebris(), renderBoardPawn(), renderBoardScene(), renderBossDamageFX(), renderBossModel(), renderCombatEffects(), renderCoopBoardScene() (+5 more)

### Community 14 - "renderBoardPawnAvatar"
Cohesion: 0.67
Nodes (3): renderRouteGame(), specialDescription(), specialIcon()

## Knowledge Gaps
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `render()` connect `render` to `esc`, `renderGame`, `app.js`, `difficultyName`, `renderOnlineSnapshot`, `renderBoardPawnAvatar`, `renderCoopVictory`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `esc()` (e.g. with `renderBoardScene()` and `renderRaceGame()`) actually correct?**
  _`esc()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `game-core.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14736842105263157 - nodes in this community are weakly interconnected._
- **Why does `esc()` connect `renderBoardPawnAvatar` to `esc`, `renderGame`, `render`, `app.js`, `difficultyName`, `renderOnlineSnapshot`, `renderCoopVictory`, `renderBoardScene`, `renderBoardPawnAvatar`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `RoomClient` be split into smaller, more focused modules?**
  _Cohesion score 0.11585365853658537 - nodes in this community are weakly interconnected._