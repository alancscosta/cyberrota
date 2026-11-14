# Cyber Rota

Cyber Rota é um jogo educativo de redes de computadores. A primeira versão jogável multiplayer inclui salas online para **Desligue o Servidor 3v3** e **Defenda a Rede**, além do **Treino Solo**. As partidas acontecem em tabuleiros ilustrados, com perguntas, avatares, animações, efeitos sonoros e música.

**Jogue:** [cyberrota.vercel.app](https://cyberrota.vercel.app) · **Release:** [v1.0.0 — Primeira versão jogável multiplayer](https://github.com/alancscosta/cyberrota/releases/tag/v1.0.0)

## Modos

| Modo | Jogadores | Objetivo |
|---|---:|---|
| Treino Solo | 1 | Percorrer a rota, conquistar cinco selos temáticos e chegar ao destino. |
| Desligue o Servidor 3v3 | 2–6 pessoas; bots completam seis lugares se o anfitrião confirmar início antecipado | Levar os três peões da equipe ao estande rival antes do adversário. |
| Defenda a Rede | 2–6 | Avançar até o relé e derrotar o Hacker protegendo cinco servidores. |

Leia o [guia do jogo](docs/guia-do-jogo.md) para regras e instruções de sala, turno e pódio. Os [diagramas e a arquitetura](docs/arquitetura-e-fluxos.md) explicam contas, backend, dados e fluxo técnico.

## Contas e salas

É possível jogar como visitante, sem criar conta. O login Google é opcional e permite sincronizar progresso, estatísticas, histórico, caderno de erros, baralhos e partidas solo salvas. Salas online têm código compartilhável; cada sala mantém seu próprio estado autoritativo no servidor.

## Rodar localmente

Requer Node.js. Para desenvolver a interface sem backend:

```sh
npm install
npm run dev
```

Para testar as APIs e salas localmente, configure os valores de desenvolvimento e inicie o Worker:

```sh
Copy-Item .dev.vars.example .dev.vars
# Defina SESSION_SECRET com pelo menos 32 caracteres em .dev.vars.
npm run dev:worker
```

O login Google pode ficar sem configuração durante o desenvolvimento; o jogo permanece disponível como visitante. A origem local usada no login precisa estar cadastrada no Google OAuth quando esse fluxo for testado.

## Verificações e build

```sh
npm test
npm run build
npx wrangler deploy --dry-run
```

## Publicação e banco

O frontend é servido pelos Cloudflare Workers Assets. As APIs, salas e sincronização em tempo real usam Cloudflare Workers, Durable Objects e D1. O Vercel publica o frontend associado ao GitHub; `npm run deploy` publica o Worker e seus assets.

O schema e o fluxo de migrations estão em `server/migrations/`. Nunca publique `.dev.vars`, segredos de sessão, cookies ou tokens de retomada. Para instruções completas, leia [arquitetura e fluxos](docs/arquitetura-e-fluxos.md).

## Documentos

- [Guia do jogo: modos, regras, salas e pódio](docs/guia-do-jogo.md)
- [Arquitetura, APIs, dados e diagramas](docs/arquitetura-e-fluxos.md)
- [Regras detalhadas](specs/game-rules.md)
- [Design de salas online](specs/online-rooms-sdd.md)
- [Contas e persistência](specs/accounts-storage-sdd.md)
- [Critérios de aceitação](specs/acceptance.md)
- [Auditoria dos fluxos e lacunas conhecidas](specs/gameplay-flow-audit.md)
- [Visão interativa do Graphify](graphify-out/GRAPH_REPORT.md)
- [Versão imprimível](docs/print-and-play.md)

## Licença

MIT. Veja [LICENSE](LICENSE).
