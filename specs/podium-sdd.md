# Pódio multiplayer — SDD

## Objetivo

Ao concluir uma partida online de Desligue o Servidor ou Defenda a Rede, mostrar um pódio individual com três posições, os personagens correspondentes e um resumo do desempenho. A tela também permite ao anfitrião voltar ao lobby para outra partida ou encerrar a sala.

## Regras

- Registrar por pessoa respostas certas, respostas erradas e respostas certas por dificuldade durante a partida.
- O pódio inclui pessoas reais; bots ficam fora da classificação individual.
- Ordenar por pontos de acerto ponderados pela dificuldade (fácil = 1, média = 2, difícil = 3), depois por número de acertos, menos erros e ordem estável dos assentos.
- Exibir até três pessoas. Lugares sem pessoa elegível permanecem vazios.
- A tela final mantém o resultado da partida/equipe, apresenta nome, personagem, cor, pontuação, acertos, erros e distribuição por dificuldade de cada colocação.
- O pódio aparece depois das animações existentes de vitória/derrota. Todos os clientes da sala veem o mesmo resultado.
- Somente o anfitrião conectado recebe os controles de próxima partida e encerrar sala. Próxima partida retorna ao mesmo lobby com código e participantes preservados; encerrar sala invalida o código e retorna os participantes ao menu.
- Todos os participantes recebem um controle explícito para voltar ao início enquanto o resultado está aberto. Para visitantes com anfitrião conectado, mostrar que estão aguardando a decisão do anfitrião junto desse controle.
- Se o snapshot indicar que o anfitrião desconectou, considerar a sala finalizada: substituir a espera/controles de anfitrião por uma mensagem clara de partida finalizada e permitir voltar ao início, limpando cliente e código da URL.
- Empates são resolvidos de forma determinística pela sequência definida acima; o índice de assento é o desempate final para manter as posições 1, 2 e 3 estáveis.

## TDD

- Testar classificação por pontos ponderados, acertos, erros e assento; excluir bots e aceitar lista com menos de três humanos.
- Testar captura de métricas nos dois modos e garantir que a pontuação de pódio não altera as regras de vitória atuais.
- Testar os contratos visuais: três degraus, avatar/cor/nome e métricas, espera por lugares vazios, ações para anfitrião e visitante, anfitrião desconectado e apresentação depois do overlay final.
- Testar no servidor de sala a mesma classificação para todos os clientes, permissão exclusiva do anfitrião e transições de lobby/encerramento.
- Executar a suíte automatizada e o build.
