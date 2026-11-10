# Regras de jogo — Cyber Rota

## Modos e temas

Os modos jogados no mesmo dispositivo são Treino Solo, Corrida de Pacotes 3v3 e Defenda a Rede. Todos mantêm tabuleiro isométrico com trilha visível e peças robóticas sombreadas. A rota do Solo, a arena da Corrida e o centro de dados da Defesa têm composições próprias. Os cinco temas de conteúdo/servidor são `fisica`, `rede`, `transporte`, `aplicacao` e `seguranca`.

## Treino Solo

- A pessoa rola um dado virtual de 1 a 3 e avança numa rota de 18 posições (0–18); checkpoints temáticos ficam em 3, 6, 9, 12 e 15; destino na 18.
- O movimento para no próximo checkpoint sem selo, ainda que o dado permita passar dele.
- No checkpoint, escolhe-se dificuldade antes da pergunta. Fácil/média/difícil valem 1/2/3 pontos.
- Acerto dá pontos e o selo; erro guarda a carta no caderno e agenda retransmissão mais fácil no próximo encontro do tema. Selos não são retirados.
- Vitória ao chegar ao destino com cinco selos; depois de 20 movimentos, a sessão termina como treino.
- Ping custa 1 ponto e dá dica; Firewall pode bloquear o próximo movimento em caso de erro; Congestionamento encerra o movimento; Broadcast dá bônus de 2 pontos; Subnetting gera um exercício /24–/28.

## Corrida de Pacotes — 3v3

- Seis pessoas jogam localmente: três na equipe Azul e três na equipe Vermelha. A rotação percorre as três pessoas de cada equipe, em ordem.
- Cada equipe percorre uma rota de 19 casas numeradas de 0 a 18 (18 movimentos), com cinco checkpoints nos espaços 3, 6, 9, 12 e 15. Cada acerto move a equipe uma casa e dá o selo ao alcançar um checkpoint; erro não avança.
- Cada duelo usa a mesma pergunta e dificuldade para um jogador de cada equipe; respondem em sequência no mesmo dispositivo. A ordem alterna entre Azul e Vermelha. A pergunta e a resposta anterior ficam ocultas durante a passagem, e o resultado só é revelado depois das duas respostas.
- Se só uma pessoa acertar, a equipe de quem errou perde 1 PV e a equipe que acertou avança. Se as duas acertarem, as duas avançam. Se as duas errarem, ninguém avança nem recebe dano.
- Cada equipe começa com 10 PV. Zerar PV causa game over e elimina a equipe antes da chegada. Para vencer, é preciso chegar ao destino com os cinco selos; se ambas chegarem na mesma jogada, há empate. Após 30 duelos sem chegada, a equipe mais avançada vence; posição igual desempata por PV.
- Não há bônus por velocidade. A rotação passa pelos três participantes por equipe. O tabuleiro mostra as seis peças ao longo da rota.

## Defenda a Rede — cooperativo contra o Hacker

- De 1 a 6 pessoas compartilham cinco servidores a 100%, Hacker com PV inicial conforme a duração da partida (Curta: 16; Normal: 20; Desafio: 25), zero alertas e três nós verdes de cura.
- A cada rodada, o jogo escolhe um tema/servidor sob ataque. A pessoa ativa escolhe dificuldade antes de ver a pergunta; conversa em equipe é opcional e o timer é visual.
- Acerto recupera 25% no servidor sob ataque (máximo 100%) e causa 2/3/4 PV de dano ao Hacker por dificuldade fácil/média/difícil.
- Em Curta e Normal, erro causa 25% de dano ao servidor sob ataque e soma um alerta. A cada três alertas, o servidor ativo com menor integridade perde 25% e alertas voltam a zero.
- Em Desafio, além da consequência normal, erro cura o Hacker em 2 PV (sem ultrapassar o máximo inicial) e causa mais 25% de dano ao servidor sob ataque. Portanto, o servidor perde 50% nesse erro, antes da penalidade por três alertas.
- Três casas da rota (3, 11 e 15) são pontos verdes de recuperação. A equipe pode usar cada uma uma vez ao parar com o peão nessa casa. Cada nó restaura 25% do servidor com menor integridade (incluindo servidor zerado, se houver); não pode ser ativado quando todos estão em 100%. A interface informa qual servidor receberá cura.
- Resolver efeitos na ordem: dano/recuperação da resposta, alerta e consequência do terceiro alerta, então verificar derrota/vitória e limite de rodadas. Não aplicar efeitos após o fim.
- Em cada turno, a pessoa ativa rola um dado de 1 a 3. Se acertar, o peão compartilhado segue o caminho visível pelo número sorteado; se errar, permanece na casa e o Hacker ataca o servidor. Os turnos passam em ordem por todas as pessoas da sala.
- A chegada é o relé externo no fim das 19 casas. Para vencer, a equipe deve chegar ao relé e derrotar o Hacker. Se o Hacker perder toda a vida antes da chegada, ele fica cambaleando com 1 PV até a equipe chegar; o golpe final só pode derrubá-lo no relé. Se a equipe chegar antes, continua respondendo para concluir o combate.
- Limites de turno: 20 (Curta), 24 (Normal) e 27 (Desafio). Derrota se três servidores chegarem a zero ou se o limite terminar sem concluir rota e combate.
- No Desafio, falha do grupo deixa o Hacker recuperar PV e dá mais dano ao time. Os cinco servidores representam a integridade coletiva. O modo usa rota isométrica de 19 casas como o Treino, dado de 1 a 3, casas de cura e uma chegada conectada ao relé externo. Acerto move o peão e atinge o Hacker; erro deixa o peão parado, e o Hacker carrega, dispara e atinge o setor sob ataque. O Hacker fica num pedestal fora da rota; o relé marca a chegada e é necessário para finalizar o combate. A explosão acontece no peitoral, e PV/fase aparecem no painel lateral.
- Fases visuais do Hacker são derivadas da fração de PV restante: blindado (>75%), avariado (≤75%), armadura rompida (≤50%) e defeituoso (≤25%). A fase visual não modifica os cálculos de combate.

## Cartas, dificuldade e baralhos

- Perguntas mostram explicação após a resposta. Erros entram no caderno de erros.
- Uma sessão não repete carta até esgotar as cartas elegíveis; depois permite reciclar o conjunto. Baralho/filtragem sem perguntas elegíveis bloqueia o início da partida com orientação para corrigir filtros.
- Solo usa baralho padrão. Salas multijogador podem congelar um snapshot de baralho padrão ou personalizado.
- Resolução visual e sonora não altera a validação da resposta.

## Persistência, acessibilidade e interface

- Progresso, baralhos, erros, preferências e estado ativo da partida são locais. Recarregar permite retomar sem repetir uma resposta/efeito já registrado; encerrar partida limpa apenas o estado ativo.
- Sala é pass-and-play local, sem convite online nesta etapa.
- A partida abre em tabuleiro de tela cheia, com painel compacto para pergunta, vida, selos e controles. Relevo, gradientes, sombras, peças e efeitos dão volume 3D à arte 2D; a interface permanece legível e operável por teclado/toque.
- Nenhuma informação essencial depende só de cor, som ou animação; há legendas/feedback textual para efeitos, som pode ser silenciado, movimento reduzido é respeitado e controles têm foco visível.
