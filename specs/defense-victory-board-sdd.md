# SDD — Vitória do Hacker e tabuleiro de Defesa

## Aditivo SDD — Espaçamento dos racks, peões e ataque do Hacker

### Intenção

Manter Defesa legível como jogo de tabuleiro. A estrada é reservada ao movimento; racks ficam nas áreas internas. Os seis peões cabem na casa inicial em duas fileiras. A base mostra fundação, plataforma elevada e totem apoiado nela. Ao contra-atacar, o Hacker recebe código binário vermelho em movimento, marcas visuais de grito e um som sintetizado.

### Contrato espacial

- Casas da rota usam escala 1,3× e permanecem dentro do tabuleiro quadrado.
- Racks usam escala 0,54 e âncoras fixas nas baias internas laterais. Seus limites desenhados não podem cruzar casas da rota, o núcleo de defesa nem outros racks.
- O impacto do laser termina no centro do volume do servidor correspondente, sem atingir sua plataforma.
- Os seis peões são desenhados como peças largas de tabuleiro, com bases ovais e seis silhuetas distintas. Eles formam uma grade de três colunas por duas fileiras, com animação individual, e preservam o espaçamento ao se moverem.
- A base mantém o eixo central. O totem fica acima da plataforma elevada e os suportes continuam visíveis.

### Estado de ataque

- Fluxos binários e marcas de grito só aparecem durante o contra-ataque e ficam atrás ou junto do Hacker no relé externo.
- O grito sintetizado respeita o controle de silêncio já existente.
- Preferência por movimento reduzido desativa movimento dos peões, do código e das marcas.

### Aceitação TDD

- O contrato visual calcula os limites dos racks contra as casas da rota e uns contra os outros.
- Testes exigem casas maiores, partes da base separadas, seis peões animados e efeitos de ataque com grito.
- As suítes do jogo e do contrato visual passam antes da entrega.

## Contexto

O golpe final hoje troca o jogo imediatamente para um painel genérico, desmontando o contexto visual da partida. O Hacker não ganha uma derrota final encenada. O tabuleiro de Defesa ocupa área demais e os racks, impactos e limites da plataforma não formam uma composição compacta e equilibrada.

## Objetivos

1. Preservar o tabuleiro após a vitória cooperativa.
2. Mostrar uma explosão final no corpo do Hacker, ejeção de armadura/antenas e destroços que param no piso junto ao relé.
3. Exibir uma confirmação de vitória verde sem encobrir o mapa nem perder o resumo, a revisão das respostas e o retorno aos modos.
4. Reduzir a pegada visual do tabuleiro mantendo uma forma de quadrado isométrico e a rota jogável intacta.
5. Reposicionar os cinco servidores e seus pontos de impacto para evitar colisões entre racks, rota e base.

## Regras e estados

- A regra de jogo existente continua exigindo chegar ao relé antes de reduzir os PV do Hacker a zero.
- `coop.outcome === 'win'` é a fonte de verdade da derrota do boss e ativa a cena terminal. A animação não altera PV, rounds nem histórico.
- Os fragmentos são parte da renderização final, não um estado de combate temporário; navegar ou atualizar a tela de resultado não ressuscita o Hacker.
- O botão de retorno conserva a ação existente `finish-session`.
- Depois de o peão alcançar a casa 18, a equipe ainda responde às perguntas para concluir o combate, sem rolar novamente nem exibir uma casa 19.
- Cada acerto avança uma etapa visível de avaria; fumaça começa a persistir após o primeiro golpe e fogo aparece após golpes seguintes, permanecendo até a derrota.
- Em cada ataque, as partes destacadas da armadura ficam acima do corpo durante a queda e continuam visíveis no piso do relé depois que a animação termina.
- Em Defenda a Rede, os seis participantes aparecem como robôs individuais agrupados no peão compartilhado e em uma lista visível com destaque para a pessoa da vez.
- Durante o movimento do peão compartilhado, a animação mantém o espaçamento de cada robô para que os seis continuem distinguíveis.
- O dado e o aviso de turno usam a cor da pessoa ativa sobre superfícies claras de alto contraste; “SUA VEZ!!!” desaparece em fade.
- As 19 plataformas são ampliadas, permanecem dentro do perímetro quadrado com margem e não são encobertas pela base central.
- A tampa da base levita acima dos suportes, sem sobrepor sua própria fundação ou as casas da estrada.
- A mensagem de vitória desaparece em fade, mantendo o botão de retorno acessível.
- A pista ocupa o perímetro da rota; os cinco servidores ficam em baias centrais separadas da estrada e da base, e os alvos laser coincidem com as faces dos racks.
- No fim, o Hacker se desmonta em peças grandes e reconhecíveis do próprio robô (cabeça, tronco, braços e pernas), que caem com gravidade e ficam perto do relé. Não usar estilhaços genéricos em forma de cubo ou uma dispersão radial de confetes.

## Direção visual

- Vitória usa verde de sucesso já reconhecível, em um overlay curto e contrastante.
- Explosão localizada no volume do Hacker, clarão breve, peças de armadura reconhecíveis e destroços imóveis após a queda.
- A plataforma e o relé continuam acima da borda superior; a base permanece no eixo central.
- Reduzir toda a composição do tabuleiro em conjunto para preservar o alinhamento entre casas, peão, racks, base e circuitos.
- Racks ocupam posições interiores reservadas e sem sobreposição; impactos atingem cada rack no mesmo sistema de coordenadas.

## Verificação

| Critério | Cobertura |
|---|---|
| Vitória mantém o mapa e apresenta resultado verde | `tests/visual-contract.test.cjs` |
| Explosão, ejeção e destroços persistentes | `tests/visual-contract.test.cjs` |
| Dano progressivo mantém fumaça, fogo e desmonte acumulado | `tests/visual-contract.test.cjs` |
| Placas caem na frente do Hacker e continuam no piso | `tests/visual-contract.test.cjs` |
| Seis avatares e lista de participantes permanecem visíveis | `tests/visual-contract.test.cjs` |
| Pegada compacta e quadrado isométrico | `tests/visual-contract.test.cjs` |
| Cinco racks fora da pista e impactos reposicionados em conjunto | `tests/visual-contract.test.cjs` |
| Sem dado ou casa excedente após a chegada | `tests/visual-contract.test.cjs` |
| Regras de PV e vitória só no relé | `tests/game-core.test.cjs` |


## Avatares e leitura imediata da partida — SDD

- A seleção de sala apresenta seis peças de tabuleiro, cada qual ligada a uma cor única. A peça conserva a mesma silhueta e cor no seletor, no elenco lateral e no tabuleiro.
- Cores já atribuídas ficam desabilitadas para outros participantes. A validação do início também rejeita cor repetida ou índice inválido.
- A equipe aparece como pinos individuais agrupados dentro da casa atual; o nome fica na lista lateral para evitar etiquetas minúsculas amontoadas sobre as peças.
- Os servidores são organizados em baias interiores separadas da trilha. A base e qualquer cabo não cruzam a estrada nem cobrem a casa de início.
- “SUA VEZ” e vitória usam cartões grandes, centrais e com alto contraste. O turno desaparece em fade; a vitória mantém o botão de retorno acessível.

### Testes TDD

- Contrato visual cobre seis silhuetas, correspondência de cor, retratos da equipe e pinos dimensionados dentro da casa.
- Contrato da sala cobre bloqueio das cores ocupadas e validação de unicidade no início.
- Contrato do tabuleiro cobre baias dos servidores e ausência de cabo atravessando a trilha.
- Contrato de leitura cobre os avisos grandes de turno e vitória.


## Revisão visual de peões e pista — ciclo atual

- Substituir as miniaturas robóticas finas por peças tipo pino com corpo curto, cabeça legível e base larga.
- Manter os seis participantes visíveis na casa inicial em duas fileiras e garantir que o conjunto caiba dentro da plataforma ampliada.
- Reposicionar racks em baias laterais, maiores e claramente fora da estrada e do núcleo central.
- Terminar os feixes no corpo dos racks.
- Medir cada vértice da geometria das plataformas contra o limite quadrado; a casa não pode atravessar a borda do tabuleiro.
- Testar o dado com faces reais de um a seis e colorir apenas os pontos ocupados.

### Testes TDD deste ciclo

- `tests/visual-contract.test.cjs`: confirma silhueta e formação dos peões, posições dos racks, colisões contra as 19 casas e núcleo, limites do tabuleiro e alinhamento dos impactos.
- `tests/visual-contract.test.cjs`: confirma que CSS de turno afeta somente pontos ativos do dado.

## Tabuleiro adaptável e movimento em saltos — ciclo atual

- O caminho mantém 19 casas, e os modos Curta, Normal e Desafio mantêm os limites selecionados de 20, 24 e 27 turnos. O tabuleiro usa escala conjunta de 0,90, 0,86 ou 0,83; piso, casas, servidores, avatares, base e relé recebem a mesma transformação.
- Os polígonos das casas devem ficar separados entre si, dentro do piso e longe dos racks e do núcleo. A trilha liga os centros sem atravessar plataformas.
- O elenco e o cartão do jogador da vez exibem o mesmo avatar colorido e a mesma silhueta do peão na rota.
- Um acerto move o grupo uma única vez, saltando sequencialmente pelos centros correspondentes ao dado. Atualizações do cartão, da animação de combate ou recargas não podem repetir o percurso.

### Testes TDD deste ciclo

- `tests/visual-contract.test.cjs` calcula interseções entre os polígonos das 19 casas, os limites do piso e o espaçamento dos racks.
- `tests/visual-contract.test.cjs` valida as escalas dos três limites, a identidade dos avatares e os saltos sem reprodução em rerender.
- `tests/game-core.test.cjs` verifica que Curta, Normal e Desafio terminam exatamente nos limites 20, 24 e 27.

### Revisão após teste no navegador

- Os avatares de elenco e turno reutilizam o SVG dos peões fora do contêiner do tabuleiro; os seletores de cor antigos só atendiam ao SVG dentro do mapa e deixavam silhuetas pretas. O CSS deve aplicar cor da peça, brilho e contraste também ao avatar fora do mapa.
- Na jogada correta, guardar `moveAnimationPlayed` imediatamente após o primeiro render impede que o rerender de dano repita o salto. A posição final permanece estável até a próxima rodada.
- Teste manual no navegador com seis jogadores: dado 3 moveu a equipe da casa 5 à 8; após o ataque, o Hacker passou de 16 para 14 PV. Na jogada seguinte, dado 2 moveu da casa 8 à 10 e o Hacker passou a 12 PV. O pino permaneceu na casa 10 após o rerender de combate.
- TDD: o contrato visual agora exige os seletores que mantêm as cores nos avatares do elenco e do jogador ativo.
