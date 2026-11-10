# Pesquisa: recursos gratuitos para criar jogos com IA

**Data:** 8 de novembro de 2026
**Objetivo:** escolher um fluxo capaz de melhorar os cenários do Cyber Rota sem trocar o jogo de tabuleiro por uma cena de ação em tempo real.

## Opções avaliadas

### Genex Desktop — recomendação para este repositório

- O aplicativo é gratuito e open source sob MIT. O fluxo de desktop pode usar uma assinatura ChatGPT/Codex já existente ou um modelo local; seu agente planeja, altera o jogo e faz testes visuais.
- A experiência de jogo atual é um projeto web. Genex tem suporte a jogos de navegador e Three.js, e a CLI Genex Tools pode adicionar arquivos de assets a um repositório existente.
- O aplicativo em si não cobra. Geração hospedada de modelos, imagens, áudio e outros assets usa créditos; esses recursos pagos não fazem parte deste plano.
- No Windows, a versão disponível é preview e o instalador oficial ainda não é assinado. Não instalar sem aprovação explícita do usuário no momento da instalação.
- Uso proposto: manter Vite e regras atuais; usar o agente para refazer os elementos gráficos, manter câmera isométrica fixa e casas explícitas, validar se nada atravessa os limites do mapa e executar playtests no navegador.

Fontes oficiais: [Genex Desktop](https://genex.games/docs/desktop), [Genex no GitHub](https://github.com/genex-games/genex-desktop), [visão geral da geração de assets e preços](https://genex.games/docs/guide/how-it-works).

### GDevelop

- O editor e o plano gratuito permitem criar jogos e usar assets grátis; a cota gratuita do Ask AI é limitada (a página de preços consultada lista 40 créditos de IA por mês).
- O projeto Cyber Rota atual é um aplicativo web Vite em JavaScript. Migrá-lo para o formato de projeto GDevelop reescreveria interface e fluxo de jogo, então não é a rota de menor risco para corrigir somente os cenários.

Fonte oficial: [preços do GDevelop](https://gdevelop.io/pricing/individual).

### Godot

- A engine é livre e open source sob MIT, mas não inclui por si só um gerador de jogo por IA.
- Migrar a aplicação atual para Godot seria uma reimplementação e mudaria a forma de entrega do jogo; não é necessário para obter tabuleiros melhores no navegador.

Fonte oficial: [licença do Godot](https://godotengine.org/license/).

## Direção de arte e critérios de qualidade

- Preservar o produto como jogo de tabuleiro 2D isométrico com profundidade visual, não câmera livre nem arena de ação 3D.
- Dar a cada modo um mapa e uma composição próprios; objetos têm casas e áreas de segurança para que prédios, racks, personagens e efeitos não se cruzem.
- Em Defenda a Rede, manter os cinco setores, as casas de cura e a base defensiva dentro do tabuleiro, com a rota de 19 casas do Treino em volta deles e composição visual própria por modo; no Cooperativo, acerto avança o peão coletivo uma casa até o sinal externo. Posicionar o Hacker numa plataforma física sobre o portal, fora das casas, com explosão no peitoral e detritos persistentes.
- Validar cada mudança por imagem no navegador, estados de ataque e erro, dimensões menores e teste automatizado das regras.
