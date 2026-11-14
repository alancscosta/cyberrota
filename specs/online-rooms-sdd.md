# Salas online — SDD

## Objetivo

Habilitar lobby e salas multijogador entre aparelhos, preservando as regras atuais de Defenda a Rede e Desligue o Servidor 3v3.

## Regras e contrato

- Cada sala tem código compartilhável, modo, estado (`lobby`, `playing`, `finished` ou `closed`), anfitrião e roster persistente.
- O Worker gera códigos aleatórios com três letras e três números, sem permitir duplicatas; o anfitrião pode gerar outro código durante o lobby. A troca conserva os participantes e invalida o código anterior, atualizando as URLs e reconexões.
- Os cartões cooperativo e 3v3 abrem diretamente o fluxo online de criar sala ou entrar com código; a configuração local de personagens fica reservada ao modo solo.
- Abrir um link com `?sala=CODIGO` leva à tela de entrada com o código preenchido. Depois de entrar, cada pessoa confirma seu nome e escolhe uma cor livre no lobby.
- O anfitrião escolhe nome e personagem/cor ao criar. Jogadores entram pelo código/link e escolhem nome e uma cor livre entre as seis cores já existentes, mostradas como bonecos coloridos. O servidor reserva nome/cor por jogador e uma vaga desconectada continua reservada para reconexão.
- Defesa da Rede aceita capacidade de 2–6 (padrão 6). Corrida tem seis assentos fixos, com três por equipe; participantes humanos são alocados à equipe menos ocupada.
- Só o anfitrião pode iniciar. Se ainda houver vagas na capacidade configurada, a solicitação retorna `ROOM_NOT_FULL` com `requiresConfirmation`; a confirmação explícita permite iniciar.
- Defesa da Rede começa com os participantes humanos presentes, respeitando mínimo de dois. A Corrida preenche seis assentos com bots quando confirmada incompleta; cada equipe continua com três participantes e cada ação de bot tem 50% de chance de acerto.
- A próxima partida devolve a sala ao lobby com o mesmo código e os participantes humanos. Encerrar sala é ação exclusiva do anfitrião.
- O estado autoritativo fica no Durable Object da sala e snapshots são transmitidos por WebSocket sem tokens de retomada.
- Os comandos de jogo (`game.roll`, `game.choose-difficulty`, `game.answer`, `game.continue`, `game.skip`, `game.heal`) são aplicados pelo Durable Object com GameCore compartilhado; só o participante ativo pode rolar, escolher dificuldade, responder, pular ou curar.
- O servidor inicia um prazo de 20 segundos para a ação da vez. Expiração pula o turno sem registrar resposta errada; os relógios são persistidos como deadlines e tratados por alarmes do Durable Object.
- Deck e respostas corretas ficam em estado privado. Snapshots públicos removem o deck, gabarito, respostas aceitas, tokens de retomada e IDs de conta.
- IDs de conta são injetados pelo Worker após validar sessão; respostas internas carregam linhas `accountRooms` para sincronizar associação da conta sem expô-las aos navegadores.
- O Durable Object conserva a sala durante o jogo e a fecha após 24 horas sem atividade.

## TDD e aceite

- Testar criação/configuração inválida, código e seis cores válidas.
- Testar lotação, nomes, cores duplicadas, alocação de equipes e reconexão por token.
- Testar a geração segura e não duplicada de códigos, a troca pelo anfitrião, a preservação das vagas e a migração do link/credenciais.
- Testar autorização do anfitrião, aviso de início antecipado, mínimo cooperativo e composição 3v3 com bots.
- Testar bots em fonte aleatória determinística, fechamento e retorno ao lobby sem apagar jogadores humanos.
- Testar snapshot público sem gabarito, deck, tokens de retomada ou IDs de conta; testar deadlines sem registrar erro.
- Testar snapshot público e eventos WebSocket de conexão/comando/atualização, além das linhas privadas de conta para create/join/transfer/close.
