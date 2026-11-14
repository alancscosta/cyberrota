# Graph Report - cyberrota  (2026-11-14)

## Corpus Check
- 55 files · ~53,163 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 21 file(s) not represented in the graph (top: .pptx 12, .ndjson 5, (none) 2)

## Summary
- 487 nodes · 753 edges · 25 communities (22 shown, 3 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1f8f0549`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- README.md
- Plano de execução — SDD/TDD
- visual-contract.test.cjs
- Proposta de regras para o protótipo
- SDD — Vitória do Hacker e tabuleiro de Defesa
- rooms.mjs
- Cyber Rota: Defenda a Rede
- Product-specific creative direction
- UI Design
- UI Art Direction
- adr-3d-engine.md
- index.mjs
- accounts.js
- build_design.mjs
- RoomDurableObject
- build_short.mjs
- Turnos sem bloqueio e rota Solo — SDD
- Worker API: spec-driven development
- Contas e persistência — SDD
- Salas online — SDD
- Pódio multiplayer — SDD
- Auditoria dos fluxos de jogo — inventário SDD/TDD
- room-do.test.mjs
- vercel.json

## God Nodes (most connected - your core abstractions)
1. `roomError()` - 26 edges
2. `clone()` - 19 edges
3. `RoomDurableObject` - 16 edges
4. `UI Design` - 16 edges
5. `Common generated-interface tells` - 15 edges
6. `applyGameCommand()` - 13 edges
7. `UI Art Direction` - 12 edges
8. `Final UI review` - 12 edges
9. `SDD — Vitória do Hacker e tabuleiro de Defesa` - 11 edges
10. `routeRoom()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Lacunas confirmadas` --references--> `resolveGameAnswer()`  [INFERRED]
  specs/gameplay-flow-audit.md → worker/src/rooms.mjs
- `Lacunas confirmadas` --references--> `selectCoopQuestion()`  [INFERRED]
  specs/gameplay-flow-audit.md → worker/src/rooms.mjs
- `CyberrotaWorkerRoom` --inherits--> `RoomDurableObject`  [EXTRACTED]
  worker/src/index.mjs → worker/src/rooms.mjs
- `routeRoom()` --calls--> `generateRoomCode()`  [EXTRACTED]
  worker/src/index.mjs → worker/src/rooms.mjs

## Import Cycles
- None detected.

## Communities (25 total, 3 thin omitted)

### Community 0 - "README.md"
Cohesion: 0.06
Nodes (29): Decisões que precisam permanecer iguais entre tela e mesa, Estado da entrega digital, Etapas para a versão impressa (Print & Play), Arquitetura, Cyber Rota — desenvolvimento e estado atual, Modos implementados, Próximas etapas recomendadas, Regras e decisões (+21 more)

### Community 1 - "Plano de execução — SDD/TDD"
Cohesion: 0.06
Nodes (31): author, bugs, url, description, devDependencies, vite@^8.3.6, wrangler@^4.162.0, directories (+23 more)

### Community 2 - "visual-contract.test.cjs"
Cohesion: 0.08
Nodes (22): appSource, assert, createClient(), fs, path, response(), source, test (+14 more)

### Community 3 - "Proposta de regras para o protótipo"
Cohesion: 0.18
Nodes (10): Critérios de conclusão, Defenda a Rede, Desligue o Servidor 3v3, Direção visual e interação, Objetivo do trabalho, Plano de implementação — Desligue o Servidor 3v3 e Defenda a Rede, Processo SDD/TDD aplicado, Referências de design (+2 more)

### Community 4 - "SDD — Vitória do Hacker e tabuleiro de Defesa"
Cohesion: 0.09
Nodes (21): Aceitação TDD, Aditivo SDD — Espaçamento dos racks, peões e ataque do Hacker, Avatares e leitura imediata da partida — SDD, Contexto, Contrato espacial, Contratos TDD, Direção visual, Especificação (+13 more)

### Community 5 - "rooms.mjs"
Cohesion: 0.13
Nodes (44): Lacunas confirmadas, deck, host, applyCoopRole(), applyGameCommand(), assertActiveTurn(), assertHost(), assignTeam() (+36 more)

### Community 6 - "Cyber Rota: Defenda a Rede"
Cohesion: 0.29
Nodes (6): Direção de arte e critérios de qualidade, GDevelop, Genex Desktop — recomendação para este repositório, Godot, Opções avaliadas, Pesquisa: recursos gratuitos para criar jogos com IA

### Community 7 - "Product-specific creative direction"
Cohesion: 0.05
Nodes (39): 10. Design-system amnesia, 11. Dashboard-by-default, 12. Decorative emptiness, 13. Individually spaced fields, 14. Scattered actions, 1. Cardification, 2. Decorative gradients and glow, 3. Generic hero recipe (+31 more)

### Community 8 - "UI Design"
Cohesion: 0.10
Nodes (20): 10. Use motion as feedback and explanation, 11. Treat copy as part of the interface, 12. Keep implementation disciplined, 13. Visually verify material UI changes, 14. When existing UI looks AI-generated, 15. Final response, 1. Establish design authority, 2. Understand the product before styling (+12 more)

### Community 9 - "UI Art Direction"
Cohesion: 0.15
Nodes (12): 1. Respect design authority and scope, 2. Build a product-specific creative brief, 3. Develop three different concepts, not three skins, 4. Challenge the concepts before choosing one, 5. Turn the winning concept into a buildable direction, 6. Apply expression in proportion to the surface, 7. Translate the concept into real UI, 8. Review what was actually built (+4 more)

### Community 11 - "index.mjs"
Cohesion: 0.12
Nodes (22): assert, encodePart(), signGoogleToken(), test, assert, test, CyberrotaWorkerRoom, doRoomRequest() (+14 more)

### Community 12 - "accounts.js"
Cohesion: 0.12
Nodes (32): asArray(), authenticateGoogleCredential(), base64UrlDecode(), base64UrlEncode(), clearSessionCookie(), createGuestSessionToken(), createSessionToken(), decodeJsonPart() (+24 more)

### Community 14 - "build_design.mjs"
Cohesion: 0.05
Nodes (46): add(), build, C, candidate, contentSlide(), finalPath, footer(), out (+38 more)

### Community 15 - "RoomDurableObject"
Cohesion: 0.29
Nodes (6): accountRoomRows(), jsonResponse(), publicRoomConfig(), publicRoomSnapshot(), randomToken(), RoomDurableObject

### Community 16 - "build_short.mjs"
Cohesion: 0.24
Nodes (13): add(), build, bullets(), C, candidate, content(), finalPath, footer() (+5 more)

### Community 17 - "Turnos sem bloqueio e rota Solo — SDD"
Cohesion: 0.40
Nodes (4): Objetivo, Regras, TDD, Turnos sem bloqueio e rota Solo — SDD

### Community 18 - "Worker API: spec-driven development"
Cohesion: 0.29
Nodes (6): Account acceptance criteria, Deployment, Purpose, Room acceptance criteria, TDD scenarios, Worker API: spec-driven development

### Community 19 - "Contas e persistência — SDD"
Cohesion: 0.40
Nodes (4): Contas e persistência — SDD, Objetivo, Regras, TDD

### Community 20 - "Salas online — SDD"
Cohesion: 0.40
Nodes (4): Objetivo, Regras e contrato, Salas online — SDD, TDD e aceite

### Community 21 - "Pódio multiplayer — SDD"
Cohesion: 0.40
Nodes (4): Objetivo, Pódio multiplayer — SDD, Regras, TDD

### Community 22 - "Auditoria dos fluxos de jogo — inventário SDD/TDD"
Cohesion: 0.22
Nodes (8): Auditoria dos fluxos de jogo — inventário SDD/TDD, Cobertura já presente (não é garantia de E2E), Divergências nas especificações resolvidas, Estado, Fila de investigação para fechar o inventário, Objetivo e sequência, Resultado da primeira regressão, Superfícies analisadas

### Community 23 - "room-do.test.mjs"
Cohesion: 0.20
Nodes (3): deck, MemoryState, MemoryStorage

## Knowledge Gaps
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Lacunas confirmadas` connect `rooms.mjs` to `Auditoria dos fluxos de jogo — inventário SDD/TDD`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Should `README.md` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Why does `RoomDurableObject` connect `RoomDurableObject` to `index.mjs`, `rooms.mjs`, `room-do.test.mjs`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Should `Plano de execução — SDD/TDD` be split into smaller, more focused modules?**
  _Cohesion score 0.06439393939393939 - nodes in this community are weakly interconnected._
- **Why does `Auditoria dos fluxos de jogo — inventário SDD/TDD` connect `Auditoria dos fluxos de jogo — inventário SDD/TDD` to `rooms.mjs`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Should `visual-contract.test.cjs` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Should `SDD — Vitória do Hacker e tabuleiro de Defesa` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._