# Graph Report - cyberrota  (2026-10-20)

## Corpus Check
- 9 files · ~4,197 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 51 nodes · 49 edges · 8 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5b317716`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- README.md
- Plano de execução — SDD/TDD
- game-core.test.cjs
- Proposta de regras para o protótipo
- Regras implementadas — Cyber Rota
- Cyber Rota: Defenda a Rede — plano de desenvolvimento
- Cyber Rota: Defenda a Rede
- print-and-play.md

## God Nodes (most connected - your core abstractions)
1. `Plano de execução — SDD/TDD` - 9 edges
2. `Cyber Rota: Defenda a Rede — plano de desenvolvimento` - 7 edges
3. `Proposta de regras para o protótipo` - 6 edges
4. `Cyber Rota: Defenda a Rede` - 5 edges
5. `Regras implementadas — Cyber Rota` - 5 edges
6. `Etapas para a versão impressa (Print & Play)` - 2 edges
7. `Estado da entrega digital` - 2 edges
8. `Especificação de conteúdo` - 2 edges
9. `test` - 1 edges
10. `assert` - 1 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (8 total, 0 thin omitted)

### Community 0 - "README.md"
Cohesion: 0.22
Nodes (4): Critérios de aceitação do protótipo, Especificação de conteúdo, Esquema usado no protótipo, Salas e baralhos

### Community 1 - "Plano de execução — SDD/TDD"
Cohesion: 0.22
Nodes (9): Etapa 1 — especificar antes de implementar (SDD), Etapa 2 — arquitetura e design visual, Etapa 3 — motor de regras com TDD, Etapa 4 — cartas e modos de resposta, Etapa 5 — telas e progressão, Etapa 6 — adaptação para impresso, Etapa 7 — qualidade e entrega, Etapa 8 — atualizar Graphify (última tarefa) (+1 more)

### Community 2 - "game-core.test.cjs"
Cohesion: 0.29
Nodes (3): assert, Core, test

### Community 3 - "Proposta de regras para o protótipo"
Cohesion: 0.33
Nodes (6): Competitivo local — pass-and-play para 2 a 6 pessoas, Conteúdo e criação de salas, Cooperativo local — equipe contra o Hacker, Elementos comuns, Proposta de regras para o protótipo, Solo — primeiro fluxo a implementar

### Community 4 - "Regras implementadas — Cyber Rota"
Cohesion: 0.33
Nodes (5): Conteúdo e persistência, Cooperativo, Regras implementadas — Cyber Rota, Solo e competitivo, Temas

### Community 5 - "Cyber Rota: Defenda a Rede — plano de desenvolvimento"
Cohesion: 0.40
Nodes (5): Cyber Rota: Defenda a Rede — plano de desenvolvimento, Decisões confirmadas, Recursos do produto, Referência do Graphify, Referências de design consultadas

### Community 6 - "Cyber Rota: Defenda a Rede"
Cohesion: 0.40
Nodes (5): Cyber Rota: Defenda a Rede, Especificação e plano, Executar localmente, O que está no protótipo, Verificações

### Community 7 - "print-and-play.md"
Cohesion: 0.50
Nodes (3): Decisões que precisam permanecer iguais entre tela e mesa, Estado da entrega digital, Etapas para a versão impressa (Print & Play)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Cyber Rota: Defenda a Rede — plano de desenvolvimento` connect `Cyber Rota: Defenda a Rede — plano de desenvolvimento` to `README.md`, `Plano de execução — SDD/TDD`, `Proposta de regras para o protótipo`?**
  _High betweenness centrality (0.470) - this node is a cross-community bridge._
- **Why does `Plano de execução — SDD/TDD` connect `Plano de execução — SDD/TDD` to `Cyber Rota: Defenda a Rede — plano de desenvolvimento`?**
  _High betweenness centrality (0.251) - this node is a cross-community bridge._
- **Why does `Proposta de regras para o protótipo` connect `Proposta de regras para o protótipo` to `Cyber Rota: Defenda a Rede — plano de desenvolvimento`?**
  _High betweenness centrality (0.163) - this node is a cross-community bridge._