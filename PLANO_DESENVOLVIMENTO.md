# Cyber Rota: Defenda a Rede — plano de desenvolvimento

> **Estado:** protótipo web implementado em HTML/CSS/JavaScript sem framework, com três modos locais, 30 cartas padrão, editor e importação/exportação de baralhos, progresso local e prévia Print & Play. A partida usa uma cena de tabuleiro isométrica em SVG, em tela cheia, com peças e um Hacker animado no modo cooperativo. Este documento registra decisões e próximos passos do produto; o protótipo não implementa salas online, conta ou sincronização entre dispositivos.

**Status:** plano revisado com as decisões fornecidas. As regras abaixo que não vieram da pessoa responsável são propostas de design para validar durante o primeiro protótipo.

## Decisões confirmadas

- Produto: protótipo web; documentar junto o caminho para uma versão imprimível.
- Modos: solo primeiro, mas os três modos (solo, competitivo e cooperativo) fazem parte do escopo.
- Multiplayer inicialmente no mesmo dispositivo, em formato pass-and-play; sem salas online sincronizadas nesta etapa.
- Público iniciante de Engenharia de Software; texto, explicações e progressão em português claro.
- O competitivo exige os cinco selos.
- O criador de uma sala escolhe usar o baralho padrão ou criar/editar um conjunto próprio para aquela sala.
- O solo sempre inicia com cartas padrão predefinidas.
- Recursos desejados: caderno de erros, estatísticas, filtro por capítulo, editor, persistência/login e os tipos de carta propostos.
- Stack sugerida: web responsiva em TypeScript, interface com componentes acessíveis, persistência local para jogo convidado e serviço de autenticação/banco para contas e progresso entre sessões. Confirmar fornecedores e hospedagem na etapa de arquitetura.

## Referências de design consultadas

- **Trivial Pursuit:** dá uma referência para progressão visível por categorias e colecionáveis; sua versão atual também apresenta modo solo/cooperativo e perguntas All-Play. Aproveitar a legibilidade de progresso e a variedade de turnos como princípios, com regras e identidade próprias. [Regras e modos oficiais Hasbro](https://instructions.hasbro.com/en-us/instruction/trivial-pursuit-board-game)
- **Pandemic:** referência de cooperação com pressão compartilhada: jogadores administram ameaças a um sistema comum e perdem quando as crises se acumulam. Adaptar o princípio de tensão coletiva aos servidores e ao Hacker sem copiar seu mapa, papéis ou estrutura de ações. [Página oficial Asmodee](https://store.asmodee.com/products/pandemic)

## Proposta de regras para o protótipo

Estes valores dão um ponto de partida completo e ajustável após partidas de teste.

### Elementos comuns

- Cinco temas/servidores: Física e Enlace, Rede, Transporte, Aplicação e Segurança.
- Mapa em rota com checkpoints dos cinco temas. A rota garante oportunidade de obter cada selo; dados e bifurcações mudam o trajeto sem deixar o jogador terminar sem enfrentar os cinco temas.
- Antes de revelar uma pergunta, o jogador escolhe dificuldade: fácil (1 ponto), média (2), difícil (3). A interface só revela a carta depois dessa escolha.
- Cada resposta mostra explicação curta. Erros entram no caderno de erros e podem ser revistos depois da partida.
- “Ping” concede uma dica e custa 1 ponto (nunca reduz pontuação abaixo de zero); cada jogador pode usar uma vez por partida.
- Cartas têm tema, capítulo, tipo, dificuldade, enunciado, resposta/alternativas e explicação. Conteúdo padrão é revisado para iniciantes e não depende de jargão sem definição.

### Solo — primeiro fluxo a implementar

- Uma pessoa atravessa a rota de origem ao destino e precisa obter os cinco selos.
- Uma resposta errada não elimina progresso: registra o erro e agenda uma retransmissão do mesmo tema, com dificuldade um nível abaixo, na próxima oportunidade desse tema.
- Meta da primeira versão: completar a rota em até 20 turnos. Se exceder, mostrar conclusão de treino e desempenho, sem bloquear o aprendizado.
- Roteador: escolha entre atalho com pergunta difícil e desvio com pergunta fácil.
- Firewall: carta de Segurança; erro consome o próximo turno de movimento.
- Congestionamento: perde o movimento atual.
- Broadcast: resolve uma carta curta; acerto dá +2 pontos.
- Subnetting: exercício numérico com cronômetro opcional de 60 segundos.
- Papéis/recursos adaptados para solo como três ferramentas de uso único: trocar carta, eliminar duas alternativas ou pedir dica.

### Competitivo local — pass-and-play para 2 a 6 pessoas

- Cada pessoa percorre o mapa, responde cartas e acumula pontos e até cinco selos (um por tema).
- Para vencer, precisa obter os cinco selos e chegar ao destino. Quando alguém chega, os demais recebem uma última rodada; entre quem cumprir a condição, vence a maior pontuação. Empate: uma pergunta final de Segurança; persistindo o empate, vitória compartilhada.
- Erro registra carta para revisão e oferece retransmissão mais fácil na próxima oportunidade do tema. Uma pessoa que ainda não obteve o selo do tema pode tentar novamente; selos não são perdidos.
- Broadcast é respondido por todos em sequência no mesmo dispositivo, com respostas ocultas até a revelação. Cada acerto vale 2 pontos; não usar velocidade como critério, pois um dispositivo compartilhado não mede reação de forma justa.
- A interface revela a pergunta e oculta a resposta antes de passar o dispositivo ao jogador ativo. Regras de resposta escrita versus múltipla escolha ficam explícitas na carta.

### Cooperativo local — equipe contra o Hacker

- 1 a 6 pessoas compartilham cinco servidores com integridade inicial de 100%; o Hacker começa com 20 PV.
- Partida padrão: até 12 rodadas. Em cada rodada o jogo anuncia um ataque/tema, o grupo discute por até 30 segundos e o jogador da vez confirma a resposta.
- Acerto: recupera 25% de integridade do servidor do tema (máximo 100%) e causa dano ao Hacker: fácil 2, média 3, difícil 4 PV. O grupo escolhe o risco de dificuldade antes de ver a carta.
- Erro: o servidor atacado perde 25% de integridade e o marcador de alerta do Hacker avança um espaço. A cada três alertas, o Hacker causa mais 25% de dano ao servidor íntegro com menor integridade e o alerta reinicia.
- Vitória: zerar os 20 PV do Hacker até o fim da 12.ª rodada. Derrota: três servidores chegam a 0% ou termina a 12.ª rodada com PV restantes.
- Papéis de equipe, uma utilização cada por partida: Admin troca uma carta antes de responder; Analista elimina duas alternativas; Engenheiro de Rotas recebe uma dica. Em solo, cada ferramenta é uma utilização individual.
- Dificuldade ajustável: partidas curta/normal/desafio alteram limite de rodadas e quantidade inicial de PV do Hacker; a dificuldade das cartas continua escolhida em cada turno.

### Conteúdo e criação de salas

- Solo usa somente o baralho padrão selecionável por filtros de capítulo e dificuldade.
- Ao criar partida competitiva ou cooperativa, o criador escolhe **baralho padrão** ou **baralho personalizado**.
- No baralho personalizado, o criador pode adicionar, editar, excluir e revisar cartas antes de iniciar; a partida usa um retrato congelado do baralho escolhido para evitar mudanças no meio do jogo.
- Guardar autoria e versão do baralho; dados compartilhados devem identificar quem criou o conteúdo. A implementação inicial é local no dispositivo; sincronização online fica para uma fase posterior.
- Manter baralho padrão separado dos baralhos criados pelos usuários; edição de uma carta personalizada nunca altera o conteúdo padrão.

## Recursos do produto

- Caderno de erros com tema, capítulo, resposta escolhida, resposta correta, explicação e opção de refazer.
- Estatísticas por tema/capítulo, acerto por dificuldade e evolução entre partidas, com amostra pequena indicada sem fazer afirmações enganosas.
- Filtro por capítulo e dificuldade para partidas de treino.
- Editor de cartas e conjuntos personalizados para criador de sala.
- Login opcional para sincronizar progresso; jogo convidado com dados locais continua disponível.
- Cartas de tipos variados em etapas: múltipla escolha, verdadeiro/falso com justificativa, ordenar, ligar colunas, lacuna, subnetting gerado, identificar defeito em diagrama, terminal simulado e relâmpago.
- Preparar QR codes apenas para conteúdo externo curado; não criar links falsos nem depender de vídeo para compreender uma resposta.
- Design responsivo e acessível, com alto contraste, texto legível, estados visuais que não dependem só da cor, controles de teclado e temporizador opcional quando a regra permitir.

## Plano de execução — SDD/TDD

### Etapa 1 — especificar antes de implementar (SDD)

- Criar `specs/game-rules.md` com regras comuns e regras separadas para solo, competitivo e cooperativo; resolver expressamente fim de partida, empate, dificuldade, retransmissão, broadcast, temporizadores e selos.
- Criar `specs/content.md` com esquema e critérios editoriais de cartas para iniciantes, critérios de resposta aceita e política de revisão técnica.
- Criar `specs/rooms-and-decks.md` para baralho padrão, personalizado, autoria, imutabilidade durante partida e salvamento.
- Criar `specs/acceptance.md` em cenários Given/When/Then, incluindo uma partida vencedora e uma derrota em cada modo.
- Registrar escolhas de stack, autenticação, persistência e futuro multiplayer em ADRs curtos antes de depender de serviços externos.

### Etapa 2 — arquitetura e design visual

- Definir TypeScript e aplicação web responsiva; escolher framework e serviços após uma prova curta de persistência, acessibilidade e publicação.
- Separar domínio/regras, baralhos, persistência, interface e autenticação. A UI não duplica lógica do jogo.
- Criar a partida como um tabuleiro virtual em tela cheia: mapa isométrico com relevo e construções de rede, rota de casas destacadas, peças animadas, destino, HUD e painel de ações integrado. A cena deve ocupar a maior área da tela; evitar que a partida pareça um painel de site.
- No cooperativo, representar o Hacker como personagem em cena com silhueta volumétrica, animação ociosa e reação visível a cada acerto/dano, além de barra de vida sincronizada. Os cinco servidores mantêm indicadores de integridade legíveis no painel.
- Verificar a escala do tabuleiro, leitura da carta e controles em desktop e celular, incluindo pass-and-play.
- Usar IndexedDB/local storage para visitante, com migração clara para conta autenticada e sincronização quando disponível.
- Planejar interface do criador para seleção de baralho padrão/personalizado, pré-visualização e revisão antes da partida.

### Etapa 3 — motor de regras com TDD

- Escrever primeiro testes unitários do domínio a partir dos critérios de aceitação.
- Injetar gerador pseudoaleatório e relógio para reproduzir sorteios e cronômetros nos testes.
- Implementar mapa/checkpoints e regras de turno; acerto, erro, pontuação, selos e retransmissão; cartas especiais; vitória, derrota, empate e fim de rodada.
- Implementar separadamente máquina de estados do solo, competitivo e cooperativo, reutilizando resolução de cartas e pontuação.
- Cobrir limites: integridade entre 0–100, PV entre 0–20, não repetir papel, evitar carta inválida/duplicada, não agir após fim, empate e expiração de tempo.

### Etapa 4 — cartas e modos de resposta

- Criar validador para campos, alternativas, resposta correta, explicação, tema, capítulo e dificuldade.
- Preparar lote padrão inicial equilibrado pelos cinco temas e pelas três dificuldades; revisar tecnicamente com material de referência confiável e linguagem para iniciantes.
- Desenvolver os tipos de carta em ordem: múltipla escolha/VF; ordenar/ligar/lacuna; subnetting e terminal; identificar defeito e relâmpago.
- Gerar subnetting a partir de parâmetros controlados e verificar cada resposta por uma função independente testada; não armazenar uma pergunta aleatória sem explicação da solução.
- Implementar criação/edição e preview de baralho personalizado, snapshot ao iniciar partida e filtros aplicáveis ao padrão e aos baralhos próprios.

### Etapa 5 — telas e progressão

- Implementar primeiro fluxo solo completo, do início à revisão de erros.
- Implementar competitivo pass-and-play, com troca de turno segura e resposta oculta para o próximo jogador.
- Implementar cooperativo pass-and-play, alertas do Hacker, discussão/cronômetro configurável, papéis e resumos.
- Adicionar onboarding de regras para iniciantes, explicação após cada pergunta e opção de consultar glossário.
- Adicionar editor de perfil/conta, progresso local, sincronização após autenticação, estatísticas e página de caderno de erros.

### Etapa 6 — adaptação para impresso

- Criar `docs/print-and-play.md` registrando todas as decisões necessárias: tamanho e orientação do tabuleiro, casas/checkpoints, cores com símbolos acessíveis, quantidade de cartas por tema/dificuldade, verso com resposta/explicação, marcadores, dado, papéis, trilha de alerta, integridade, PV e cronômetros.
- Definir como substituir funções digitais: sorteio embaralhando baralhos, persistência com folhas de campanha, cronômetro com ampulheta/celular, validação por leitor de cartas e autoria de conteúdo por folhas editáveis.
- Gerar PDFs A4 com áreas de corte, margens de impressora, escala legível e instruções de montagem; manter cartas frente/verso alinhadas para impressão duplex.
- Fazer uma partida de mesa sem interface para encontrar ambiguidades que a automação esconda; revisar manual e cartas antes de chamar a versão imprimível de pronta.

### Etapa 7 — qualidade e entrega

- Rodar testes do motor, validação de conteúdo, testes de interface e um fluxo de ponta a ponta por modo; implementar correções guiadas pela especificação.
- Conduzir teste exploratório com iniciantes, medir duração, compreensão das regras e clareza das explicações; ajustar valores de balanceamento sem alterar regras sem atualizar as specs.
- Verificar navegação por teclado, leitor de tela, responsividade, estados vazios/erro/offline e recuperação de progresso.
- Documentar execução local, publicação, formato de importação/exportação de baralhos e limitações conhecidas.
- Preparar pacote print-and-play conforme os critérios da etapa 6.

### Etapa 8 — atualizar Graphify (última tarefa)

- Depois de concluídas todas as alterações de código e documentação, executar `graphify update .`, conferir a atualização e tratar os artefatos gerados segundo a política do repositório.
- Esta é a última tarefa do ciclo. Se qualquer código ou documentação mudar depois, repetir a atualização para que o grafo represente a entrega final.

## Referência do Graphify

A documentação do Graphify Labs lista `graphify update .` para atualizar o grafo do projeto e reprocessar arquivos alterados. Conferir a sintaxe da versão instalada na [referência oficial de comandos](https://github.com/Graphify-Labs/graphify#common-commands).
