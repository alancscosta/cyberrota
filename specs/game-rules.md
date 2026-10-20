# Regras implementadas — Cyber Rota

## Temas

`fisica`, `rede`, `transporte`, `aplicacao`, `seguranca`. Cada tema é uma área colorida do mapa e um selo/servidor.

## Solo e competitivo

- O jogador rola um dado virtual de 1 a 3 e avança por uma rota de 18 passos (casas numeradas de 0 a 18). Checkpoints ficam nas posições 3, 6, 9, 12 e 15; destino na 18.
- O movimento para no próximo checkpoint ainda sem selo, mesmo que o dado permitisse ultrapassá-lo. Assim todo jogador precisa responder aos cinco temas.
- Ao parar em checkpoint, escolha dificuldade antes de a pergunta aparecer. Fácil/média/difícil valem 1/2/3 pontos.
- Acerto concede pontos e selo do tema. Erro registra a carta para revisão e agenda retransmissão mais fácil no próximo encontro daquele tema. Selos não são retirados.
- Solo termina ao chegar ao destino com cinco selos ou após 20 movimentos. Competitivo para 2–6; a chegada de alguém inicia uma última rodada dos demais. Qualifica-se quem tem cinco selos e chegou ao destino; pontuação decide e empate na maior pontuação é compartilhado.
- Pontos especiais: Ping gasta 1 ponto para revelar uma pista; firewall bloqueia o próximo movimento se errar; congestionamento encerra o movimento; Broadcast concede 2 pontos de bônus ao jogador ativo que acertar; Subnetting gera uma pergunta numérica aleatória de /24 a /28.

## Cooperativo

- Cinco servidores iniciam em 100%, Hacker em 20 PV, alerta em zero. A partida dura 12 rodadas, exceto quando termina antes.
- No início da rodada, o sistema sorteia um tema sob ataque. O jogador ativo escolhe dificuldade antes de ver a carta. Conversa de equipe opcional, até 30 s.
- Acerto recupera 25% no servidor (máximo 100%) e causa 2/3/4 de dano no Hacker por dificuldade fácil/média/difícil.
- Erro causa 25% de dano no servidor atacado e adiciona um alerta. A cada 3 alertas, o servidor ativo com menor integridade recebe 25% de dano; alerta volta a zero.
- Vitória: Hacker em 0 PV até a rodada 12. Derrota: 3 servidores zerados ou fim da rodada 12 com o Hacker vivo.
- Papéis: Admin troca uma carta; Analista remove duas alternativas; Engenheiro de Rotas pede uma dica. Cada um pode ser usado uma vez por partida.

## Conteúdo e persistência

- Solo sempre usa o baralho padrão e filtros escolhidos pelo jogador.
- Ao criar partida multijogador, a pessoa anfitriã seleciona baralho padrão ou um conjunto personalizado. O conjunto é copiado para a partida e não muda durante ela.
- Progresso, conjuntos próprios, estatísticas e caderno de erros são salvos no dispositivo. O Site exige autenticação do proprietário; sincronização entre dispositivos requer etapa backend posterior.
- As salas são locais, sem código de convite nem rede em tempo real. Jogadores compartilham o dispositivo e passam o controle em cada turno.
- O timer de conversa cooperativa é visual; não encerra automaticamente a discussão. A pergunta de Subnetting é gerada na partida e não se repete na mesma sessão, mas a prévia impressa mostra só parte do baralho padrão.
