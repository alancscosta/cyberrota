# Decisão de apresentação: tabuleiro 2D com volume 3D

- **Estado:** aceita após revisão do formato da partida.
- A experiência continua sendo um jogo de tabuleiro. Um mapa isométrico SVG ocupa a área principal; perguntas, placar e controles ficam num painel compacto ao lado.
- O volume visual vem de planos inclinados, espessura de plataforma, sombras, gradientes, peças robóticas em camadas e detalhes vetoriais. Lasers, explosões, impactos, armadura quebrada e pontos de cura são animações sobre o tabuleiro.
- Cada modo tem cenário e composição próprios: rota de redes no Solo, bases e arena de duelo na Corrida, cinco setores de servidor e uma base central em Defenda a Rede. O Hacker fica numa plataforma física sobre o sinal externo, fora das casas do tabuleiro; seu painel lateral mostra PV e fase, e os disparos acertam o peitoral.
- A decisão mantém o jogo leve, acessível e independente de WebGL, preserva o estilo do protótipo e permite que a pergunta continue legível. Three.js foi removido porque uma cena 3D em tela cheia desviava do formato solicitado.
- As regras ficam em `game-core.js`; estado e montagem vetorial ficam em `app.js`; aparência e animações ficam em `board.css` e `tabletop.css`.
