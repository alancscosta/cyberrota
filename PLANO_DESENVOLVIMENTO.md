# Cyber Rota — desenvolvimento e estado atual

> **Estado:** jogo local de tabuleiro implementado em HTML, CSS e JavaScript. O tabuleiro isométrico 2D recebe peças e efeitos com volume 3D desenhados em camadas. Cada modo tem cenário próprio. O jogo ainda não oferece contas, salas online ou sincronização entre dispositivos.

## Modos implementados

- **Treino Solo:** rota de 19 casas numeradas de 0 a 18, cinco checkpoints/selos, dado virtual e baralho padrão.
- **Corrida de Pacotes 3v3:** três pessoas por equipe, Azul contra Vermelho; a cada acerto o time avança uma casa, ganha selos nos checkpoints e precisa chegar à casa 18. Quando um time erra sozinho, perde PV; PV zero causa game over antes da chegada.
- **Defenda a Rede:** cinco servidores, Hacker com fases de armadura, perguntas de ataque, efeitos de combate e três nós verdes de cura. No Desafio, erros causam penalidade maior e recuperam vida do Hacker.
- **Apresentação:** os jogos continuam com tabuleiro, HUD curto, perguntas legíveis e efeitos por cima do cenário. Rota de cidade, arena da Corrida e centro de dados cooperativo são composições diferentes.

## Regras e decisões

- Pass-and-play local; respostas ficam ocultas durante a troca de participante.
- A Corrida usa 10 PV por equipe. Duelos com respostas diferentes ferem o time que errou; respostas iguais não causam dano. Se nenhum time chegar depois de 30 duelos, posição decide e PV desempata.
- Defenda a Rede: acerto tira PV do Hacker e recupera servidor; erro danifica servidor e soma alerta. No Desafio, o Hacker recupera 2 PV e o servidor sofre 50% de dano no erro. Três nós de cura restauram 25% do servidor mais frágil, uma vez cada.
- Sons originais sintetizados têm controle de silêncio. Ações relevantes também têm feedback textual.
- Cartas erradas, estatísticas, progresso, preferências e sessão ativa são salvos no navegador.

## Arquitetura

- `dist/game-core.js`: regras puras e estado dos modos.
- `dist/app.js`: interface, tabuleiros vetoriais, efeitos, perguntas e armazenamento local.
- `dist/board.css` e `dist/tabletop.css`: visual isométrico, volume das peças, HUD e efeitos animados.
- `specs/game-rules.md` e `specs/acceptance.md`: regras e critérios de aceitação.
- `tests/game-core.test.cjs`: testes de domínio.
- `docs/adr-3d-engine.md`: decisão de manter tabuleiro 2D com detalhes volumétricos, depois da revisão do estilo pedido.

Use `npm install` e `npm run dev` para iniciar. `npm run build` gera o pacote de produção em `build/`.

## Próximas etapas recomendadas

- Ajustar equilíbrio de PV, dano e duração com sessões de jogo reais.
- Revisar contraste, teclado, leitor de tela, telas pequenas e movimento reduzido.
- Fazer playtest com iniciantes para conferir regras, duração e troca do dispositivo.
- Completar o pacote Print & Play para refletir a Corrida 3v3 e os efeitos de Defenda a Rede.
- Planejar contas e partidas online somente se a sincronização remota virar requisito.
