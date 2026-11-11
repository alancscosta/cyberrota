# Plano de implementação — Desligue o Servidor 3v3 e Defenda a Rede

> **Estado:** plano executado após ajuste da direção visual. O produto é um jogo de tabuleiro isométrico 2D com acabamento volumétrico, personagens robóticos e combate animado. A rodada final de ajustes priorizou leitura do cenário, separação do Hacker e dos prédios e visibilidade dos servidores.

## Objetivo do trabalho

- Fazer o modo 3v3 Azul contra Vermelho terminar quando o trio inteiro chega ao estande rival e desliga seu servidor.
- Mostrar o servidor conectado por cabo à tomada, LEDs verdes enquanto ativo e animação vermelha até desligar após a chegada do trio.
- Tornar Defenda a Rede uma batalha de perguntas com dano claro no Hacker/servidores, efeitos especiais, armadura por fases e pontos de cura.
- Manter a apresentação de tabuleiro: cenário 2D isométrico, peças e objetos com sombras, gradientes e camadas que simulam volume 3D. Todos os modos usam o caminho padrão de 19 casas. No cooperativo, acerto move o peão coletivo uma casa em direção ao sinal; erro mantém a casa atual e dispara contra o setor. O Hacker fica numa plataforma física acima do sinal, sem ocupar casa.

## Regras de implementação

### Desligue o Servidor 3v3

- Seis pessoas, com exatamente três na equipe Azul e três na Vermelha. A ordem de resposta roda entre os integrantes e alterna qual time começa.
- A rota tem 19 casas numeradas de 0 a 18. Acerto move o peão ativo pelo valor de um dado de seis faces; erro recua uma casa e move o adversário correspondente pelo valor do dado.
- O servidor só desliga quando todos os três peões de uma equipe alcançam o estande inimigo. Após 60 turnos sem completar a rota, há empate.
- O dado fica no palco do tabuleiro, com superfície azul-marinho constante e pontos na cor da pessoa ativa.
- Cada lado usa seu próprio servidor desenhado no estande, com cabo, tomada e farol superior; chegada completa pisca as luzes em vermelho, apaga o rack e desliga o farol.

### Defenda a Rede

- Cinco servidores compartilham integridade; o Hacker tem PV e três fases visuais de armadura danificada.
- Acerto recupera o servidor atacado e causa dano ao Hacker. Erro reduz a integridade do servidor e eleva alertas; a cada três alertas, o Hacker causa dano no servidor ativo mais frágil.
- No nível Desafio, o erro causa 50% de dano ao servidor e recupera 2 PV do Hacker, até o máximo inicial.
- Três nós verdes aparecem no tabuleiro; cada um recupera 25% do servidor danificado mais frágil e só pode ser usado uma vez.
- Respostas mostram explicação e consequência por texto. Lasers, rajadas, explosões, flashes, recuo e queda de armadura reforçam os eventos sem esconder a pergunta.

## Direção visual e interação

- Manter o tabuleiro central e o painel de pergunta compacto. A ação continua com aparência de jogo de mesa, sem substituir a trilha por uma cena 3D de tela cheia.
- Criar composições distintas: rota urbana de redes para Solo, arena simétrica com bases e bandeiras para 3v3, tabuleiro de defesa com cinco plataformas setorizadas, base central e portal de ameaça. O Hacker fica sobre uma plataforma física logo acima do sinal externo; cada modo mantém seu próprio mapa em formato de tabuleiro.
- Fazer as peças dos times parecerem miniaturas robóticas: capacete facetado, visor luminoso, torso com placas, ombreiras, articulações, pernas/luvas e base com sombra. Azul e Vermelho usam materiais espelhados e silhuetas iguais.
- Desenhar o Hacker como um robô chefe maior, com visor, antenas, ombreiras, peitoral e placas destacáveis. As fases de PV removem essas placas sem deixar o personagem atravessar prédios.
- Construir servidores com faces frontal/lateral, gavetas, indicadores, etiquetas e sombras sobre casas próprias. Racks mantêm margens entre si e dentro do losango do tabuleiro.
- Acerto: laser aliado atinge o peitoral, cria explosão no Hacker e ele recua. Quando a vida cruza uma fase, placas se soltam e ficam ao redor da plataforma. Erro: o Hacker carrega o disparo, atira e explode o servidor atacado; som de cada etapa respeita o mudo. Ataques do Hacker atingem o rack escolhido e detonam no servidor.
- Usar animações curtas, feedback visual com rótulos, som sintetizado com opção de silêncio e alternativa reduzida de movimento.
- Em celular, conservar ordem dos elementos, texto legível e alvos de toque; a página pode rolar na vertical sem cobrir controles essenciais.

## Processo SDD/TDD aplicado

1. Atualizar regras e critérios de aceitação antes do comportamento novo.
2. Escrever testes que falham para 3v3: times válidos, rotação, alternância, avanço, selos, dano, eliminação e chegada.
3. Implementar estado puro no `game-core.js`, sem colocar regras de vitória dentro da interface.
4. Integrar fluxo de resposta/hand-off, HUD, peças na rota, cenários por modo e efeitos no `app.js`/CSS.
5. Validar no navegador: uma resposta discordante, explosão na peça atingida, cura de servidor, fase de armadura e cenário sem sobreposição.
6. Rodar testes do domínio, verificações de sintaxe e build. Atualizar Graphify após fechar documentação e código.

## Verificações implementadas

- 17 testes automatizados do motor cobrem movimento, selos, dano, eliminação, empate, Desafio, cura e fases do Hacker.
- Revisão no navegador encontrou e corrigiu o bloqueio de escolha de dificuldade em Defenda a Rede.
- A revisão visual reverteu a apresentação 3D em tela cheia para tabuleiro; agora usa cenários vetoriais próprios, volume 2.5D, peças robóticas, laser e explosão.
- A cena cooperativa mantém servidores como cenografia interna e casas numeradas de 0–18 na borda do tabuleiro; o peão avança por acerto e o Hacker fica acima do sinal externo. Cinco setores elevados mantêm distância e margem dentro do mapa.

## Critérios de conclusão

- Cada modo inicia num tabuleiro reconhecível e adequado à sua mecânica.
- A Corrida mostra as seis peças, avança os times com acerto, concede selos e encerra por chegada, eliminação ou limite descrito.
- Dano e cura aparecem no placar, nos alvos e no feedback textual/visual.
- O centro de dados mantém cinco setores sem sobreposição, a base de defesa central, o portal externo e os três pontos verdes. O Hacker aparece acima do sinal externo, fora das casas do tabuleiro.
- O Hacker perde partes da armadura por fase; explosões, lasers e dano não ficam escondidos atrás da interface.
- Perguntas continuam legíveis, a partida continua sem áudio e prefere pouco movimento quando essa opção do sistema estiver ativa.
- As regras, os testes, a interface e o relatório Graphify descrevem o mesmo comportamento.

## Referências de design

- [Regras oficiais do Trivial Pursuit](https://instructions.hasbro.com/en-us/instruction/trivial-pursuit-board-game): progressão por categorias e objetivo visível de partida.
- [Pandemic — Asmodee](https://store.asmodee.com/products/pandemic): pressão coletiva e prioridades concorrentes no jogo cooperativo.
- [SVG filters — MDN](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/filter): filtros para sombra e iluminação nas peças e efeitos vetoriais.
