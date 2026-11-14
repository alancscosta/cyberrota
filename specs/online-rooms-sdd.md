# Salas online — SDD

## Objetivo

Habilitar lobby e salas multijogador entre aparelhos, preservando as regras atuais de Defenda a Rede e Desligue o Servidor 3v3.

## Regras e contrato

- Cada sala tem código compartilhável, modo, estado (`lobby`, `playing`, `finished` ou `closed`), anfitrião e roster persistente.
- O Worker gera códigos aleatórios com três letras e três números, sem permitir duplicatas; o anfitrião pode gerar outro código durante o lobby. A troca conserva os participantes e invalida o código anterior, atualizando as URLs e reconexões.
- Os cartões cooperativo e 3v3 abrem diretamente o fluxo online de criar sala ou entrar com código; a configuração local de personagens fica reservada ao modo solo.
- Abrir um link com `?sala=CODIGO` leva à tela de entrada com o código preenchido. Depois de entrar, cada pessoa confirma seu nome e escolhe uma cor livre no lobby.
- Ao criar ou entrar em uma sala pelo seletor de partidas online, o lobby abre em um modal sobre a tela de criação/entrada; encerrar a sala pelo anfitrião retorna a esse seletor sem manter a sala ou o código ativos. Ao começar a partida, o modal dá lugar ao tabuleiro em tela cheia.
- O anfitrião escolhe nome e personagem/cor ao criar. Jogadores entram pelo código/link e escolhem nome e uma cor livre entre as seis cores já existentes, mostradas como bonecos coloridos. O servidor reserva nome/cor por jogador e uma vaga desconectada continua reservada para reconexão.
- Defesa da Rede aceita capacidade de 2–6 (padrão 6). Corrida tem seis assentos fixos, com três por equipe; participantes humanos são alocados à equipe menos ocupada.
- Só o anfitrião pode iniciar. Se ainda houver vagas na capacidade configurada, a solicitação retorna `ROOM_NOT_FULL` com `requiresConfirmation`; a confirmação explícita permite iniciar.
- Defesa da Rede começa com os participantes humanos presentes, respeitando mínimo de dois. A Corrida preenche seis assentos com bots quando confirmada incompleta; cada equipe continua com três participantes e cada ação de bot tem 50% de chance de acerto.
- A próxima partida devolve a sala ao lobby com o mesmo código e os participantes humanos. Encerrar sala é ação exclusiva do anfitrião.
- O estado autoritativo fica no Durable Object da sala e snapshots são transmitidos por WebSocket sem tokens de retomada. O cliente também consulta o snapshot a cada 2 segundos para recuperar atualizações perdidas ou conexões WebSocket indisponíveis; snapshots com revisão repetida não provocam nova renderização.
- O cliente nunca substitui um snapshot por outro de revisão menor. Se uma ação for rejeitada por fase/turno, consulta um snapshot autoritativo antes de mostrar o erro, para remover controles que ficaram desatualizados.
- Um convite `?sala=CODIGO` só retoma automaticamente a sala se o modo selecionado corresponder ao modo salvo. Ao sair da partida ou trocar para outro modo, o cliente local da sala é encerrado e o parâmetro `sala` é removido, preservando os demais parâmetros da URL; a sala no servidor continua acessível pelo código/link.
- Os comandos de jogo (`game.roll`, `game.choose-difficulty`, `game.answer`, `game.continue`, `game.skip`, `game.heal`, `game.role`, `game.ping`) são aplicados pelo Durable Object com GameCore compartilhado; só o participante ativo pode rolar, escolher dificuldade, responder, pular, curar ou usar uma habilidade.
- Habilidades COOP usam estado compartilhado e cada papel pode ser ativado uma vez por partida: Admin troca a pergunta por outra elegível, Analista remove duas alternativas incorretas de uma questão de múltipla escolha, e Engenheiro revela/prepara uma dica. Ações sem efeito ou em fase incompatível são rejeitadas sem consumir o papel.
- Cura só fica disponível enquanto o turno está em `walk`, na casa do nó ainda não usado e se algum servidor puder receber integridade; após rolar, o controle some até o próximo turno.
- Cada rodada online tem um único prazo total de 20 segundos para rolar, escolher dificuldade e responder. Nos últimos cinco segundos há uma chamada central animada 5–1 sem blur nem bloqueio de controles. A pessoa ativa vê “SUA VEZ”; os outros clientes veem “VEZ DE [nome]”. A pessoa ativa vê um aviso central “SUA VEZ!!!” e os demais veem “VEZ DE [nome]”; o aviso aparece uma vez por turno. Fases intermediárias não reiniciam o prazo; após vencer, o Durable Object pula a vez sem erro e todos veem “[nome] PASSOU A VEZ” em aviso central.
- Deck e respostas corretas ficam em estado privado. Snapshots públicos removem o deck, gabarito, respostas aceitas, tokens de retomada e IDs de conta.
- IDs de conta são injetados pelo Worker após validar sessão; respostas internas carregam linhas `accountRooms` para sincronizar associação da conta sem expô-las aos navegadores.
- O Durable Object conserva a sala durante o jogo e a fecha após 24 horas sem atividade.

## TDD e aceite

- Testar criação/configuração inválida, código e seis cores válidas.
- Testar lotação, nomes, cores duplicadas, alocação de equipes e reconexão por token.
- Testar a geração segura e não duplicada de códigos, a troca pelo anfitrião, a preservação das vagas e a migração do link/credenciais.
- Testar autorização do anfitrião, aviso de início antecipado, mínimo cooperativo e composição 3v3 com bots.
- Testar bots em fonte aleatória determinística, fechamento e retorno ao lobby sem apagar jogadores humanos.
- Testar o lobby modal sobre a tela de criação/entrada, retorno ao seletor ao encerrar e transição para o tabuleiro em tela cheia ao iniciar.
- Testar snapshot público sem gabarito, deck, tokens de retomada ou IDs de conta; testar deadlines sem registrar erro.
- Testar monotonicidade de revisões WebSocket/HTTP e recuperação do snapshot autoritativo após um comando rejeitado, cobrindo as fases de Defenda a Rede.
- Testar habilidades COOP, usos inválidos sem consumo, cura e restrição de fase.
- Testar que sair de uma sala ou trocar de modo remove o código antigo do URL, não reabre uma partida finalizada e preserva links profundos quando a pessoa ainda está na sala.
- Testar snapshot público e eventos WebSocket de conexão/comando/atualização, transmissão do início a todos os jogadores, recuperação por consulta periódica após falha de evento e troca de código, importação de módulo com cache versionado e retomada de link com atualização visual, além das linhas privadas de conta para create/join/transfer/close.

- Em produção no Vercel, WebSocket conecta diretamente ao Worker Cloudflare; o polling HTTP permanece ativo como recuperação caso WebSocket falhe.
- Na fase choose-difficulty do COOP, a tela online usa attackTheme e campos autoritativos do snapshot, nunca estruturas exclusivas do fluxo local. Ping online é comando do servidor, custa um ponto e prepara uma dica para a próxima pergunta; cada jogador pode usar uma vez por partida.
