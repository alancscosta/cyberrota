# Auditoria dos fluxos de jogo — inventário SDD/TDD

## Objetivo e sequência

Registrar as regras esperadas, cruzá-las com cliente, GameCore e Worker, e corrigir os fluxos com testes de regressão. Este inventário precede a implementação das correções que ainda faltam.

Sequência: (1) consolidar achados; (2) fechar cada comportamento no SDD; (3) escrever/reproduzir teste que falha; (4) corrigir e executar os testes do fluxo; (5) rodar suíte completa e build; (6) atualizar Graphify por último.

## Superfícies analisadas

| Fluxo | Especificação | Implementação / testes examinados |
|---|---|---|
| Treino Solo | `game-rules.md`, `acceptance.md`, `turn-and-solo-map-sdd.md` | `dist/app.js`, `dist/game-core.js`, `tests/game-core.test.cjs`, `tests/visual-contract.test.cjs` |
| Defenda a Rede (local/online) | `game-rules.md`, `acceptance.md`, `online-rooms-sdd.md`, `defense-victory-board-sdd.md` | `dist/app.js`, `dist/game-core.js`, `worker/src/rooms.mjs`, testes GameCore/Worker/UI |
| Desligue o Servidor 3v3 (local/online) | `game-rules.md`, `acceptance.md`, `online-rooms-sdd.md`, `podium-sdd.md` | `dist/app.js`, `dist/race-mode.js`, `dist/game-core.js`, `worker/src/rooms.mjs`, testes GameCore/Worker/UI |
| Lobby, conexão e partida entre clientes | `online-rooms-sdd.md` | `dist/room-client.js`, `dist/multiplayer-ui.js`, `worker/src/rooms.mjs`, Worker API, Room Client e Durable Object tests |
| Resultado/pódio e próxima partida | `podium-sdd.md` | `dist/app.js`, `dist/game-core.js`, Worker, testes GameCore/UI/DO |

## Lacunas confirmadas

| ID | Fluxo | Evidência atual | Falha / risco | Teste de regressão necessário |
|---|---|---|---|---|
| GF-01 | COOP online — habilidades de equipe | `dist/app.js` apresenta `data-action="role"`; `handleOnlineGameAction()` não mapeia `role`; `worker/src/rooms.mjs` não aplica `game.role`. `tests/rooms.test.mjs` já contém um teste que espera esse comando. | Admin, Analista e Engenheiro não alteram o estado autoritativo online; um cliente pode aparentar aplicar a ação localmente e perdê-la no snapshot seguinte. | Testar autorização do jogador ativo, cada habilidade, uso único, validação de fase/pergunta e sincronização da mesma pergunta para todos os clientes. |
| GF-02 | COOP — cura em nó | `renderHealingNodes()` mostrava ação conforme posição/servidor, sem restringir fase; Worker aceita `game.heal` somente em `walk`. O HTML usava `data-node`, enquanto o cliente online lia `data-node-id`. | Depois de rolar, o botão podia permanecer visível; mesmo na fase correta, o cliente online enviava `NaN` como ID do nó. | Testar visibilidade por fase, envio do ID numérico correto e validação de posição, uso único, integridade e turno. |
| GF-03 | Relógio local/online | O cliente mostrava overlay desfocado de 5 s antes de iniciar mais 20 s; outros clientes não sincronizavam o relógio e não havia aviso persistente de quem perdeu a vez. Agora o prazo é 20 s total, o aviso 5–1 fica nos cinco finais sem blur, e a sala recebe `turnNotice`. | O comportamento anterior alongava cada rodada para 25 s e escondia o mapa; observadores não tinham a indicação do turno/timeout. | Testar prazo de 20 s em todas as fases, aviso final 5–1, mensagens em host/visitante e skip sem efeito incorreto. |
| GF-04 | 3v3 online — término da vitória | O servidor colocava o jogo em `race-shutdown`, mas a finalização visual local não era persistida no Durable Object. Correção preliminar adiciona prazo/alarm no Worker e refresh no cliente. | Sem evento final autoritativo, visitantes/reconexões poderiam permanecer em `playing` ou ver estado divergente. | Testar DO com host e visitante conectados, alarme após janela da animação, status `finished`, pódio igual nos snapshots e reload durante/depois do shutdown. |
| GF-05 | 3v3 online — feedback sem pergunta ativa | `resolveGameAnswer()` limpa `game.question`; `dist/race-mode.js` lia a explicação de `game.question`. Correção preliminar usa o cartão preservado em `game.feedback.card`. | Render do feedback pode lançar erro em cliente online depois de resposta. | Testar renderer com snapshot race-feedback/race-shutdown sem `question`, com e sem explicação opcional. |
| GF-06 | COOP — papel inválido ou sem efeito | A implementação local `useRole()` consome o uso antes de confirmar que Admin tem outra carta ou que Analista recebeu pergunta de alternativas. `renderCoopSupport()` habilita Admin/Analista para qualquer tipo de pergunta ativa. | Uma tentativa sem efeito pode gastar permanentemente o recurso; pergunta aberta/sem alternativa pode mostrar uma ação impossível. A versão online deve validar os mesmos pré-requisitos no servidor. | Testar MCQ, texto livre e baralho sem carta substituta; ações inválidas devem dar feedback e preservar uso. |
| GF-08 | COOP online — dica preparada | Engineer pode ser usado em `walk` sem pergunta, mas `selectCoopQuestion()` não transferia `pendingHint` para a próxima carta (ao contrário do modo local). | A ação era aceita e consumia o recurso, mas a dica nunca aparecia. | Testar ativação antes da pergunta, transferência à próxima carta e limpeza da flag; confirmar dica imediata em pergunta ativa. |
| GF-09 | URL de sala ao trocar de modo | `mount()` tratava qualquer `RoomClient.active` como a sala do modo recém-escolhido, e o código `?sala=` era retomado automaticamente sem comparar o modo do convite com o modo selecionado. `leave-game` também mantinha cliente e código locais ativos. | Abrir outro modo podia voltar à partida já encerrada, inclusive após retornar ao painel. | Testar saída limpa do cliente/código, filtro de retomada por modo e preservação dos demais parâmetros/hash da URL. |
| GF-10 | Pós-jogo — visitante sem saída e anfitrião desconectado | Pódio mostrava visitantes apenas a mensagem cinza de espera; o resultado usava `hostPlayerId`, mas descartava o estado `connected` do anfitrião. | Visitantes ficavam presos ao resultado se o anfitrião saísse e não tinham saída explícita para o menu. | Testar controles de anfitrião conectado, botão “Voltar ao início” para todos, aviso de partida finalizada quando o anfitrião está desconectado e limpeza da sala/URL ao sair. |
| GF-11 | Defenda a Rede online — snapshot atrasado durante a rolagem | `RoomClient.receive()` aceitava qualquer snapshot WebSocket e `command()` não recuperava estado após erro de fase. A UI exibia erro `INVALID_GAME_PHASE` de rolagem sem atualizar para o estado autoritativo. | Evento atrasado podia voltar o cliente a uma fase anterior e exibir o dado quando o servidor já aguardava dificuldade/pergunta. | Testar rejeição de revisões antigas, atualização após comando rejeitado, rotação da equipe após resposta/continuação e comando de rolagem nos dois turnos. |
| GF-12 | Desligue o Servidor 3v3 — penalidade por erro | `Core.resolveRaceTurn()` movia o adversário pelo valor do dado quando a resposta estava errada. | Regra pedida é recuo de uma casa para o peão ativo (sem recuar além do início) e avanço de uma casa para o adversário correspondente. | Testar erro com dado alto, peão ativo no início da rota e execução pela sala online. |
| GF-07 | Testes ponta a ponta dos modos online | A suíte cobre regras/DO e contratos de UI em arquivos separados; não há fluxo automatizado único de duas sessões atravessando lobby → jogo → timeout/ação → resultado → nova partida. | Regressões de renderização ou coordenação entre browsers podem passar nos testes unitários, especialmente o defeito visitante/anfitrião já observado. | Adicionar verificação integrada com dois clientes (ou harness equivalente do Worker/WebSocket) para COOP e 3v3, incluindo reconexão e snapshot após eventos. |

## Divergências nas especificações resolvidas

1. Regras e aceite agora distinguem Treino Solo local de salas online; ações de timeout não escolhem resposta aleatória.
2. `game-rules.md`, `turn-and-solo-map-sdd.md`, `acceptance.md` e `online-rooms-sdd.md` agora concordam: 20 segundos totais e aviso 5–1 nos últimos cinco segundos, sem blur ou reinício do prazo.
3. Core testa limites de partida e DO cobre prazo/resultado. A transmissão de partida, habilidade e timeout para clientes visitantes está coberta pelo harness de WebSocket simulado.

Resolver estas divergências antes de declarar o SDD fechado; atualizar as especificações canônicas para não reintroduzir regras antigas.

## Cobertura já presente (não é garantia de E2E)

- Core cobre rota Solo/checkpoints, cartas e respostas, combate COOP por dificuldade, alertas, nós, PV/fases do Hacker, chegada ao relé, tempo esgotado, limites de rodada, rotação de 1–6 participantes e regras 3v3 (dado, rotação, recuo/avanço, trio completo, empate após 60 turnos).
- Worker cobre criação/entrada, códigos e cores únicas, lobby/início antecipado, bots 3v3, reconexão, comandos autoritativos, deadlines, respostas, snapshots privados, pódio e ações do anfitrião; testes adicionais em andamento cobrem habilidades e finalização do 3v3 online.
- UI cobre reaproveitamento dos mapas existentes, apresentação do relógio, efeitos visuais do Hacker, vitória, pódio e controles online.
- A cobertura automatizada é majoritariamente unitária/contratual. Ainda deve ser verificado um percurso ponta a ponta com duas sessões/browser contexts para início do jogo, cada modo, relógio, habilidades/cura, término, reload/reconexão e controles do pódio.

## Fila de investigação para fechar o inventário

- Confirmar comportamento e persistência de efeitos de tiles especiais no Solo, retransmissões e limite de movimentos.
- Conferir paridade dos estados do Hacker (dano, armadura, cura no Desafio, carga/ataque, derrota, sequência visual) entre local e online, inclusive ao recarregar durante animações.
- Conferir limites/empate 3v3, troca de time/jogador, timeout e ações de bot no Worker com roster incompleto.
- Conferir timeout/skip em todas as fases e efeitos de atualização tardia/reconexão, incluindo evitar dois avanços pelo alarme e pelo cliente.
- Conferir captura/classificação do pódio para ambos modos, bot excluído, empate determinístico, snapshot público e transições próxima partida/encerrar sala para host e visitantes.
- Identificar comportamentos de jogo importantes sem teste direto e acrescentar testes antes de alterar a implementação.
- Relógio atualizado conforme a regra revisada pelo usuário; testes cobrem 20 segundos, aviso final e broadcast do nome após timeout.

| GF-13 | Defenda a Rede online — tela de dificuldade após o dado | O servidor avançava corretamente para choose-difficulty, enquanto a UI lia game.pending.theme e game.currentPlayerData.usedPing, exclusivos do estado local. | Exceção de theme interrompia a renderização; o próximo clique enviava outro game.roll e recebia HTTP 400 por fase inválida. | Renderer usa tema do snapshot, dados de jogador seguros e teste de contrato; Worker DO testa o ciclo online de Ping/dica. |
| GF-14 | Salas online — WebSocket no domínio Vercel | O rewrite de API HTTP do Vercel não conclui o upgrade WebSocket para o Worker; conexão direta ao hostname do Worker abre o socket. | Clientes repetiam falhas de socket e dependiam somente do polling. | Testar URL de produção/local e manter polling de recuperação; verificar handshake sem credenciais inválidas. |
| GF-15 | COOP online — aviso de turno por participante | Um aviso lateral indicava o turno de outra pessoa e não entregava o aviso central esperado em cada tela. | A pessoa ativa e observadores viam semântica/posição inadequadas. | Testar aviso central uma vez por turno: ativa vê “SUA VEZ!!!”, demais “VEZ DE FULANO”. |

## Estado

Auditoria atualizada: GF-01 a GF-15 estão cobertos por implementação/testes, incluindo rejeição de snapshots obsoletos e recuperação após erro no COOP, regras de erro no 3v3, sequência entre os dois jogadores e lobby modal. GF-07 usa harness de WebSocket do Durable Object; não houve browser real de duas sessões nesta verificação. Regressão final: 152 testes passaram e o build de produção concluiu. Wrangler dry-run confirmou o bundle, D1, Durable Object e Assets.

## Resultado da primeira regressão

- `npm test`: 128 testes passaram e 1 falhou.
- Falha única reproduz GF-01: `co-op roles modify the shared question...` recebe `UNKNOWN_GAME_ACTION` para `game.role`, conforme esperado antes da implementação do comando.
- Esta execução ocorreu durante a fase de inventário para registrar o estado reproduzível; será repetida após as correções e acompanhada do build.
