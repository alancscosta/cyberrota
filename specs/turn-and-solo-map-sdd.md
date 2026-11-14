# Turnos sem bloqueio e rota Solo — SDD

## Objetivo

Manter o tabuleiro utilizável durante a chamada de início do turno, dar uma saída automática para perguntas de alternativas e tornar a rota do Treino Solo uma trilha contínua sem plataformas encavaladas.

## Regras

- A chamada de cinco segundos fica em um relógio compacto dentro da interface do jogo; não escurece, desfoca nem intercepta cliques na tela.
- Rolar, escolher rota/dificuldade, selecionar e confirmar continuam disponíveis durante a chamada.
- Cada etapa de decisão reinicia a chamada de cinco segundos. Se ninguém agir, o jogo rola o dado ou escolhe aleatoriamente a rota, dificuldade ou alternativa, e segue para a próxima etapa. Uma alternativa já selecionada é confirmada ao fim dos cinco segundos.
- Se o limite ativo de resposta expirar em uma pergunta com alternativas, o sistema também escolhe e registra uma alternativa aleatória. Formatos de resposta livre mantêm a regra atual de expiração.
- A rota Solo mantém as 19 posições e os checkpoints existentes. As casas seguem o perímetro do tabuleiro em ordem, respeitam sua margem e deixam espaço visível entre plataformas vizinhas; nenhum segmento do percurso cruza outro segmento não adjacente.
- Avisos e relógios do Treino usam a paleta azul-marinho/ciano do jogo, sem superfícies brancas isoladas.
- Peões de partidas salvas usam uma cor válida da paleta atual; uma cor antiga ou inválida não pode virar uma peça preta.
- Um movimento solo anima o peão saltando por cada casa intermediária, com o mesmo movimento suave usado pela rota cooperativa; a animação respeita movimento reduzido.
- A peça do Treino Solo fica centralizada na plataforma quando o movimento termina; o aumento de tamanho aplica-se à ilustração, sem deslocar o grupo que marca a casa.
- O logo carregado pelo jogo permanece em `assets/` no pacote de produção, incluindo as referências criadas em tempo de execução.
- A rota do Solo descreve uma volta contínua pelo perímetro do tabuleiro e termina na casa integrada ao gateway da Internet.
- O miolo do tabuleiro usa apenas trilhas e nós gravados como textura de circuito; não recebe pedestal ou monumento sem função de jogo.
- A chegada identifica visualmente a saída da rota com um portal tecnológico apoiado na casa 18, mantendo os checkpoints e a leitura das casas.

## TDD

- `tests/game-core.test.cjs` cobre seleção aleatória de alternativa com fonte determinística.
- `tests/visual-contract.test.cjs` cobre relógio compacto sem overlay/desfoque, ações automáticas nas etapas do turno, cores do aviso e geometria/ordem da trilha Solo.
- `tests/visual-contract.test.cjs` cobre a recuperação de cores antigas e os saltos do peão pelas casas percorridas.
- `tests/visual-contract.test.cjs` cobre o centramento do peão solo e a cópia do logo para os assets públicos de produção.
- `tests/visual-contract.test.cjs` cobre o gateway na última casa e a remoção do pedestal e da coroa flutuantes.
- Rodar a suíte existente e o build após a implementação.
