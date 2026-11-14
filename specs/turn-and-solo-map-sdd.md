# Turnos sem bloqueio e rota Solo — SDD

## Objetivo

Manter o tabuleiro utilizável durante a chamada de início do turno, dar uma saída automática para perguntas de alternativas e tornar a rota do Treino Solo uma trilha contínua sem plataformas encavaladas.

## Regras

- A chamada de cinco segundos fica em um relógio compacto dentro da interface do jogo; não escurece, desfoca nem intercepta cliques na tela.
- Rolar, escolher rota/dificuldade, selecionar e confirmar continuam disponíveis durante a chamada.
- O turno tem vinte segundos totais para todas as decisões. Nos cinco segundos finais, um aviso animado conta 5–1 sem blur ou bloqueio; ações intermediárias não reiniciam o prazo.
- Se o prazo expirar, o turno é pulado sem selecionar/registrar resposta aleatória, sem dano por erro e sem efeitos de combate; a próxima pessoa recebe a própria chamada e janela.
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
- `tests/visual-contract.test.cjs` cobre relógio compacto sem overlay/desfoque, prazo único sem ações automáticas nas etapas do turno, cores do aviso e geometria/ordem da trilha Solo.
- `tests/visual-contract.test.cjs` cobre a recuperação de cores antigas e os saltos do peão pelas casas percorridas.
- `tests/visual-contract.test.cjs` cobre o centramento do peão solo e a cópia do logo para os assets públicos de produção.
- `tests/visual-contract.test.cjs` cobre o gateway na última casa e a remoção do pedestal e da coroa flutuantes.
- Rodar a suíte existente e o build após a implementação.
