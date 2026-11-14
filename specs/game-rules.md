# Regras de jogo — Cyber Rota

## Modos e temas

Os modos jogados no mesmo dispositivo são Treino Solo, Desligue o Servidor 3v3 e Defenda a Rede. Todos mantêm tabuleiro isométrico com trilha visível e peças de jogo sombreadas. A rota do Solo, o percurso quadrado do 3v3 e o centro de dados da Defesa têm composições próprias. Os cinco temas de conteúdo/servidor são `fisica`, `rede`, `transporte`, `aplicacao` e `seguranca`.

## Treino Solo

- A pessoa rola um dado virtual de 1 a 3 e avança numa rota de 18 posições (0–18); checkpoints temáticos ficam em 3, 6, 9, 12 e 15; destino na 18.
- O movimento para no próximo checkpoint sem selo, ainda que o dado permita passar dele.
- No checkpoint, escolhe-se dificuldade antes da pergunta. Fácil/média/difícil valem 1/2/3 pontos.
- Acerto dá pontos e o selo; erro guarda a carta no caderno e agenda retransmissão mais fácil no próximo encontro do tema. Selos não são retirados.
- Vitória ao chegar ao destino com cinco selos; depois de 20 movimentos, a sessão termina como treino.
- Ping custa 1 ponto e dá dica; Firewall pode bloquear o próximo movimento em caso de erro; Congestionamento encerra o movimento; Broadcast dá bônus de 2 pontos; Subnetting gera um exercício /24–/28.

## Desligue o Servidor — 3v3

- Seis pessoas jogam localmente: três na equipe Azul e três na Vermelha. Os seis peões têm posições independentes; Azul começa na casa 0 e Vermelho na casa 18, cada time voltado ao estande adversário.
- Os times alternam turnos, começando por Azul, e a rotação percorre em ordem os três participantes de cada time. A pessoa ativa rola um dado de seis faces e responde uma pergunta.
- Acerto move o peão ativo o valor do dado em direção ao servidor rival. Erro recua esse peão uma casa em direção ao próprio estande e move o participante adversário correspondente o valor do dado em direção ao estande da equipe ativa. As posições ficam limitadas entre 0 e 18.
- A equipe só desliga o servidor rival quando os três peões chegam ao estande. Ao completar o trio, as luzes do servidor ficam vermelhas e apagam, e a luz superior do estande também apaga; uma mensagem de vitória grande aparece em tela cheia com fade. O título usa azul para a equipe Azul e vermelho para a equipe Vermelha.
- O tabuleiro tem uma rota retangular com tiles sem sobreposição e dois estandes fora das casas. Cada estande mostra um rack, cabo e tomada; os servidores ficam verdes enquanto estão ativos. O dado fica na área principal do tabuleiro, com a cor da face e da borda fixa na paleta azul-marinho e os pontos na cor da pessoa da vez.
- A passagem do dispositivo oculta a pergunta/resposta anterior até a pessoa seguinte rolar o dado e revelar a própria pergunta. Não há dano, PV ou selos neste modo.
- Após 60 turnos sem desligamento, a partida termina empatada; o avanço de uma pessoa sozinha não desliga o servidor.

## Defenda a Rede — cooperativo contra o Hacker

- De 1 a 6 pessoas compartilham cinco servidores a 100%, Hacker com PV inicial conforme a duração da partida (Curta: 16; Normal: 20; Desafio: 25), zero alertas e três nós verdes de cura.
- A cada rodada, o jogo escolhe um tema/servidor sob ataque. A pessoa ativa escolhe dificuldade antes de ver a pergunta; conversa em equipe é opcional e a resposta segue o limite de 20 segundos do turno.
- Acerto recupera 25% no servidor sob ataque (máximo 100%) e causa 2/3/4 PV de dano ao Hacker por dificuldade fácil/média/difícil.
- Em Curta e Normal, erro causa 25% de dano ao servidor sob ataque e soma um alerta. A cada três alertas, o servidor ativo com menor integridade perde 25% e alertas voltam a zero.
- Em Desafio, além da consequência normal, erro cura o Hacker em 2 PV (sem ultrapassar o máximo inicial) e causa mais 25% de dano ao servidor sob ataque. Portanto, o servidor perde 50% nesse erro, antes da penalidade por três alertas.
- Três casas da rota (3, 11 e 15) são pontos verdes de recuperação. A equipe pode usar cada uma uma vez ao parar com o peão nessa casa. Cada nó restaura 25% do servidor com menor integridade (incluindo servidor zerado, se houver); não pode ser ativado quando todos estão em 100%. A interface informa qual servidor receberá cura.
- Resolver efeitos na ordem: dano/recuperação da resposta, alerta e consequência do terceiro alerta, então verificar derrota/vitória e limite de rodadas. Não aplicar efeitos após o fim.
- Em cada turno, a pessoa ativa rola um dado de 1 a 3. Se acertar, o peão compartilhado segue o caminho visível pelo número sorteado; se errar, permanece na casa e o Hacker ataca o servidor. Os turnos passam em ordem por todas as pessoas da sala.
- A chegada é o relé externo no fim das 19 casas. Para vencer, a equipe deve chegar ao relé e derrotar o Hacker. Se o Hacker perder toda a vida antes da chegada, ele fica cambaleando com 1 PV até a equipe chegar; o golpe final só pode derrubá-lo no relé. Se a equipe chegar antes, continua respondendo para concluir o combate.
- Limites de turno: 20 (Curta), 24 (Normal) e 27 (Desafio). Derrota se três servidores chegarem a zero ou se o limite terminar sem concluir rota e combate.
- No Desafio, falha do grupo deixa o Hacker recuperar PV e dá mais dano ao time. Os cinco servidores representam a integridade coletiva. O modo usa rota isométrica de 19 casas como o Treino, dado de 1 a 3, casas de cura e uma chegada conectada ao relé externo. Acerto move o peão e atinge o Hacker; erro deixa o peão parado, e o Hacker carrega, dispara e atinge o setor sob ataque. O Hacker fica num pedestal fora da rota; o relé marca a chegada e é necessário para finalizar o combate. A explosão acontece no peitoral, e PV/fase aparecem no painel lateral. Após a explosão em câmera lenta, a vitória aparece em tela cheia com o mesmo título grande e fade do 3v3; a mensagem fica verde por representar a vitória cooperativa, e o botão de menu surge depois que o título desaparece.
- Fases visuais do Hacker são derivadas da fração de PV restante: blindado (>75%), avariado (≤75%), armadura rompida (≤50%) e defeituoso (≤25%). A fase visual não modifica os cálculos de combate.

## Cartas, dificuldade e baralhos

- Perguntas mostram explicação após a resposta. Erros entram no caderno de erros.
- Uma sessão não repete carta até esgotar as cartas elegíveis; depois permite reciclar o conjunto. Baralho/filtragem sem perguntas elegíveis bloqueia o início da partida com orientação para corrigir filtros.
- Solo usa baralho padrão. Salas multijogador podem congelar um snapshot de baralho padrão ou personalizado.
- Resolução visual e sonora não altera a validação da resposta.

## Persistência, acessibilidade e interface

- Progresso, baralhos, erros, preferências e estado ativo da partida são locais. Recarregar permite retomar sem repetir uma resposta/efeito já registrado; encerrar partida limpa apenas o estado ativo.
- Salas multijogador entre aparelhos usam estado autoritativo do servidor; o Treino Solo permanece local. No 3v3 local, se disponível, a passagem de dispositivo oculta a resposta anterior.
- Cada turno tem um único prazo total de 20 segundos. Nos cinco segundos finais, um aviso animado conta 5–1 sem desfocar nem bloquear o mapa. Quem joga vê “SUA VEZ”; outros clientes veem “VEZ DE [nome]”. Rolar, escolher dificuldade, selecionar e confirmar usam o mesmo prazo. Ao expirar, a vez passa sem resposta aleatória nem penalidade por erro, com aviso “[nome] PASSOU A VEZ”.
- A partida abre em tabuleiro de tela cheia, com painel compacto para pergunta, vida, selos e controles. Relevo, gradientes, sombras, peças e efeitos dão volume 3D à arte 2D; a interface permanece legível e operável por teclado/toque.
- Nenhuma informação essencial depende só de cor, som ou animação; há legendas/feedback textual para efeitos, som pode ser silenciado, movimento reduzido é respeitado e controles têm foco visível.
