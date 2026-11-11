# Graph Report - cyberrota  (2026-11-10)

## Corpus Check
- 20 files · ~20,281 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 2)

## Summary
- 203 nodes · 196 edges · 14 communities (13 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5de6f650`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- README.md
- Plano de execução — SDD/TDD
- visual-contract.test.cjs
- Proposta de regras para o protótipo
- SDD — Vitória do Hacker e tabuleiro de Defesa
- UI Design
- Cyber Rota: Defenda a Rede
- Product-specific creative direction
- Common generated-interface tells
- UI Art Direction
- adr-3d-engine.md
- Final UI review
- Critérios de aceitação
- Regras de jogo — Cyber Rota

## God Nodes (most connected - your core abstractions)
1. `UI Design` - 16 edges
2. `Common generated-interface tells` - 15 edges
3. `UI Art Direction` - 12 edges
4. `Final UI review` - 12 edges
5. `SDD — Vitória do Hacker e tabuleiro de Defesa` - 11 edges
6. `Plano de implementação — Desligue o Servidor 3v3 e Defenda a Rede` - 8 edges
7. `Regras de jogo — Cyber Rota` - 7 edges
8. `Cyber Rota: Defenda a Rede` - 6 edges
9. `scripts` - 5 edges
10. `5. Structure before decoration` - 5 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (14 total, 1 thin omitted)

### Community 0 - "README.md"
Cohesion: 0.09
Nodes (17): Decisões que precisam permanecer iguais entre tela e mesa, Estado da entrega digital, Etapas para a versão impressa (Print & Play), Arquitetura, Cyber Rota — desenvolvimento e estado atual, Modos implementados, Próximas etapas recomendadas, Regras e decisões (+9 more)

### Community 1 - "Plano de execução — SDD/TDD"
Cohesion: 0.08
Nodes (25): author, bugs, url, description, devDependencies, vite@^8.3.6, directories, doc (+17 more)

### Community 2 - "visual-contract.test.cjs"
Cohesion: 0.09
Nodes (15): assert, test, app, assert, boardCss, css, finishCss, fs (+7 more)

### Community 3 - "Proposta de regras para o protótipo"
Cohesion: 0.18
Nodes (10): Critérios de conclusão, Defenda a Rede, Desligue o Servidor 3v3, Direção visual e interação, Objetivo do trabalho, Plano de implementação — Desligue o Servidor 3v3 e Defenda a Rede, Processo SDD/TDD aplicado, Referências de design (+2 more)

### Community 4 - "SDD — Vitória do Hacker e tabuleiro de Defesa"
Cohesion: 0.09
Nodes (21): Aceitação TDD, Aditivo SDD — Espaçamento dos racks, peões e ataque do Hacker, Avatares e leitura imediata da partida — SDD, Contexto, Contrato espacial, Contratos TDD, Direção visual, Especificação (+13 more)

### Community 5 - "UI Design"
Cohesion: 0.10
Nodes (20): 10. Use motion as feedback and explanation, 11. Treat copy as part of the interface, 12. Keep implementation disciplined, 13. Visually verify material UI changes, 14. When existing UI looks AI-generated, 15. Final response, 1. Establish design authority, 2. Understand the product before styling (+12 more)

### Community 6 - "Cyber Rota: Defenda a Rede"
Cohesion: 0.29
Nodes (6): Direção de arte e critérios de qualidade, GDevelop, Genex Desktop — recomendação para este repositório, Godot, Opções avaliadas, Pesquisa: recursos gratuitos para criar jogos com IA

### Community 7 - "Product-specific creative direction"
Cohesion: 0.12
Nodes (12): Anti-slop reference, Distinctiveness test, 1. Locate the real product signal, 2. Consider three fundamentally different organizing ideas, 3. Reject generic or costly concepts, 4. Commit to one practical visual thesis, Background, Cross-check with UI craft (+4 more)

### Community 8 - "Common generated-interface tells"
Cohesion: 0.13
Nodes (15): 10. Design-system amnesia, 11. Dashboard-by-default, 12. Decorative emptiness, 13. Individually spaced fields, 14. Scattered actions, 1. Cardification, 2. Decorative gradients and glow, 3. Generic hero recipe (+7 more)

### Community 9 - "UI Art Direction"
Cohesion: 0.15
Nodes (12): 1. Respect design authority and scope, 2. Build a product-specific creative brief, 3. Develop three different concepts, not three skins, 4. Challenge the concepts before choosing one, 5. Turn the winning concept into a buildable direction, 6. Apply expression in proportion to the surface, 7. Translate the concept into real UI, 8. Review what was actually built (+4 more)

### Community 11 - "Final UI review"
Cohesion: 0.17
Nodes (12): Accessibility, Anti-slop, Color and surfaces, Components and states, Creative direction (when a new direction was requested), Final UI review, Hierarchy and layout, Motion (+4 more)

### Community 12 - "Critérios de aceitação"
Cohesion: 0.40
Nodes (4): Critérios de aceitação, Derrota final do Hacker e tabuleiro de Defesa — SDD, Revisão visual e multiplayer — aceite, Verificação TDD

### Community 13 - "Regras de jogo — Cyber Rota"
Cohesion: 0.29
Nodes (7): Cartas, dificuldade e baralhos, Defenda a Rede — cooperativo contra o Hacker, Desligue o Servidor — 3v3, Modos e temas, Persistência, acessibilidade e interface, Regras de jogo — Cyber Rota, Treino Solo

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `UI Design` connect `UI Design` to `Product-specific creative direction`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Should `README.md` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
- **Why does `Common generated-interface tells` connect `Common generated-interface tells` to `Product-specific creative direction`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Should `Plano de execução — SDD/TDD` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Why does `Anti-slop reference` connect `Product-specific creative direction` to `Common generated-interface tells`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Should `visual-contract.test.cjs` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `SDD — Vitória do Hacker e tabuleiro de Defesa` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._