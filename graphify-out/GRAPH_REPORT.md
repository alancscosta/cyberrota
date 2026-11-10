# Graph Report - cyberrota  (2026-11-08)

## Corpus Check
- 13 files · ~5,770 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 2)

## Summary
- 84 nodes · 79 edges · 12 communities (10 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `31c069ff`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- README.md
- package.json
- game-core.test.cjs
- Plano de implementação — Corrida 3v3 e Defenda a Rede
- Regras de jogo — Cyber Rota
- Cyber Rota — desenvolvimento e estado atual
- Opções avaliadas
- print-and-play.md
- scripts
- repository
- adr-3d-engine.md
- directories

## God Nodes (most connected - your core abstractions)
1. `Plano de implementação — Corrida 3v3 e Defenda a Rede` - 8 edges
2. `Regras de jogo — Cyber Rota` - 7 edges
3. `Cyber Rota: Defenda a Rede` - 5 edges
4. `Cyber Rota — desenvolvimento e estado atual` - 5 edges
5. `scripts` - 5 edges
6. `Opções avaliadas` - 4 edges
7. `Regras de implementação` - 3 edges
8. `Pesquisa: recursos gratuitos para criar jogos com IA` - 3 edges
9. `directories` - 3 edges
10. `vite` - 3 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (12 total, 2 thin omitted)

### Community 0 - "README.md"
Cohesion: 0.13
Nodes (9): Cyber Rota: Defenda a Rede, Especificação e plano, Executar localmente, O que está no protótipo, Verificações, Critérios de aceitação, Especificação de conteúdo, Esquema usado no protótipo (+1 more)

### Community 1 - "package.json"
Cohesion: 0.13
Nodes (14): author, bugs, url, description, devDependencies, vite@^8.3.6, homepage, keywords (+6 more)

### Community 3 - "Plano de implementação — Corrida 3v3 e Defenda a Rede"
Cohesion: 0.18
Nodes (10): Corrida de Pacotes 3v3, Critérios de conclusão, Defenda a Rede, Direção visual e interação, Objetivo do trabalho, Plano de implementação — Corrida 3v3 e Defenda a Rede, Processo SDD/TDD aplicado, Referências de design (+2 more)

### Community 4 - "Regras de jogo — Cyber Rota"
Cohesion: 0.29
Nodes (7): Cartas, dificuldade e baralhos, Corrida de Pacotes — 3v3, Defenda a Rede — cooperativo contra o Hacker, Modos e temas, Persistência, acessibilidade e interface, Regras de jogo — Cyber Rota, Treino Solo

### Community 5 - "Cyber Rota — desenvolvimento e estado atual"
Cohesion: 0.40
Nodes (5): Arquitetura, Cyber Rota — desenvolvimento e estado atual, Modos implementados, Próximas etapas recomendadas, Regras e decisões

### Community 6 - "Opções avaliadas"
Cohesion: 0.29
Nodes (6): Direção de arte e critérios de qualidade, GDevelop, Genex Desktop — recomendação para este repositório, Godot, Opções avaliadas, Pesquisa: recursos gratuitos para criar jogos com IA

### Community 7 - "print-and-play.md"
Cohesion: 0.50
Nodes (3): Decisões que precisam permanecer iguais entre tela e mesa, Estado da entrega digital, Etapas para a versão impressa (Print & Play)

### Community 8 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, preview, test

### Community 9 - "repository"
Cohesion: 0.67
Nodes (3): repository, type, url

### Community 11 - "directories"
Cohesion: 0.67
Nodes (3): directories, doc, test

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Regras de jogo — Cyber Rota` connect `Regras de jogo — Cyber Rota` to `README.md`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Should `README.md` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Why does `Cyber Rota — desenvolvimento e estado atual` connect `Cyber Rota — desenvolvimento e estado atual` to `README.md`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._