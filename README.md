# Cyber Rota: Defenda a Rede

Jogo educativo local sobre redes para estudantes iniciantes. As partidas usam tabuleiros isométricos com peças robóticas volumétricas, efeitos de combate e identidade visual própria por modo.

## Executar localmente

Com Node.js instalado, abra o terminal na pasta do projeto e execute:

```sh
npm install
npm run dev
```

Abra o endereço local mostrado pelo Vite. Para gerar os arquivos de produção, execute `npm run build`; a saída fica em `build/`.

## O que está no protótipo

- Treino solo com baralho padrão, filtros por dificuldade e capítulo, explicações, pontos, selos e caderno de erros.
- Desligue o Servidor 3v3 e modo cooperativo local para 1–6 pessoas. As pessoas compartilham o dispositivo e revezam os turnos na mesma tela; ainda não há sala online nem sincronização entre aparelhos.
- Tabuleiros próprios para cada modo: rota solo, rota retangular 3v3 com dois estandes de servidor e centro de dados com cinco setores elevados. Em Defenda a Rede, o tabuleiro também tem 19 casas: cada acerto move o peão coletivo em direção ao sinal externo, cada erro deixa o peão no lugar e inicia um contra-ataque. O Hacker fica fisicamente numa plataforma acima do sinal, fora das casas.
- No 3v3, seis peões percorrem individualmente a rota entre os servidores. Os times alternam turnos e cada participante joga em ordem; acerto avança o valor do dado de seis faces, enquanto erro recua uma casa e dá esse avanço ao rival correspondente. Os três peões precisam chegar ao estande inimigo para desligar o servidor; as luzes ficam vermelhas e apagam, com animação e tela grande da equipe vencedora.
- Em Defenda a Rede, a equipe rola um dado de 1 a 3 e percorre a rota: acertos avançam, atingem o Hacker e recuperam o servidor sob ataque; erros deixam o peão parado e danificam esse servidor. A vitória exige chegar ao relé externo e concluir o combate. No nível Desafio, os erros causam dano adicional e recuperam PV do Hacker; três pontos verdes restauram servidores danificados, uma vez cada.
- Lasers, mini explosões no Hacker e nos servidores, robô recuando e placas de armadura que caem e ficam na plataforma; os contra-ataques têm carregamento, disparo e impacto. Música ambiente e sons de interface/combate começam após interação e podem ser silenciados juntos pelo botão de áudio.
- Salas competitivas/cooperativas permitem usar o baralho padrão ou um conjunto personalizado criado/editado pelo anfitrião.
- 30 cartas padrão, divididas por cinco temas e três dificuldades; subnetting gera valores aleatórios durante a partida.
- Perfil, estatísticas, histórico, erros e baralhos personalizados ficam no armazenamento local do navegador. Exporte backups JSON para movê-los entre navegadores/dispositivos.
- A página “Versão impressa” abre uma prévia de tabuleiro e 18 cartas. O roteiro para concluir o conjunto Print & Play está em [docs/print-and-play.md](docs/print-and-play.md).

## Especificação e plano

- Regras: [specs/game-rules.md](specs/game-rules.md)
- Conteúdo e formato das cartas: [specs/content.md](specs/content.md)
- Salas e baralhos: [specs/rooms-and-decks.md](specs/rooms-and-decks.md)
- Critérios de aceitação: [specs/acceptance.md](specs/acceptance.md)
- Plano de desenvolvimento SDD/TDD: [PLANO_DESENVOLVIMENTO.md](PLANO_DESENVOLVIMENTO.md)

## Verificações

```sh
node --check dist/game-core.js
node --check dist/app.js
node --test tests/game-core.test.cjs
npm run build
```

As regras do motor têm testes automatizados. O build usa Vite. O projeto ainda é local e pass-and-play, sem sincronização online.

## Graphify

The document graph is in graphify-out/graph.html. The interactive game modules live under dist/, which Graphify excludes by default, so their dedicated graph is in graphify-out/application/graph.html. Refresh both with python -m graphify update . --force and python -m graphify update dist --force; move the generated dist/graphify-out folder to graphify-out/application after refreshing the application graph.
