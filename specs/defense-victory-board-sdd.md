# SDD — Vitória do Hacker e tabuleiro de Defesa

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
| Pegada compacta e quadrado isométrico | `tests/visual-contract.test.cjs` |
| Cinco racks e impactos reposicionados em conjunto | `tests/visual-contract.test.cjs` |
| Sem dado ou casa excedente após a chegada | `tests/visual-contract.test.cjs` |
| Regras de PV e vitória só no relé | `tests/game-core.test.cjs` |
