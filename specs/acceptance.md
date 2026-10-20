# Critérios de aceitação do protótipo

- **Solo:** dadas cinco respostas corretas em checkpoints distintos, o jogador obtém cinco selos e pode chegar ao destino.
- **Retransmissão:** quando uma carta é errada, ela aparece no caderno de erros e, na próxima tentativa do tema, a dificuldade não aumenta.
- **Competitivo:** 2–6 pessoas jogam em ordem no dispositivo compartilhado; a primeira chegada aciona uma última rodada, e a tela final identifica vencedor ou empate.
- **Cooperativo:** 1–6 pessoas enfrentam um tema sorteado em cada rodada; respostas certas reduzem PV do Hacker e restauram o servidor; erros reduzem integridade e avançam alerta.
- **Derrota cooperativa:** três servidores em 0% encerram a partida.
- **Cartas:** solo usa padrão; sala multijogador pode usar padrão ou deck personalizado.
- **Persistência:** recarregar o site preserva baralhos personalizados, progresso estatístico e caderno de erros.
- **Impressão:** a página Print & Play abre a caixa de impressão do navegador; sua prévia contém o tabuleiro e 18 cartas selecionadas, com as etapas para produzir um conjunto completo documentadas em `docs/print-and-play.md`.
- **Limite local:** salas funcionam apenas no dispositivo atual. Não há convite por código nem sincronização de conta entre aparelhos.
- **Acessibilidade:** controles usam botões e formulários HTML com foco visível; validar navegação completa por teclado e leitor de tela com usuários antes de declarar conformidade.
