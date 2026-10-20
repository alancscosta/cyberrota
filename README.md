# Cyber Rota: Defenda a Rede

Protótipo web de um jogo educativo sobre redes para estudantes iniciantes. O projeto usa HTML, CSS e JavaScript sem dependências de build.

## Executar localmente

Com Python instalado, abra o PowerShell na pasta do projeto e execute:

```powershell
python -m http.server 8181 --directory dist
```

Depois abra <http://127.0.0.1:8181> no navegador.

## O que está no protótipo

- Treino solo com baralho padrão, filtros por dificuldade e capítulo, explicações, pontos, selos e caderno de erros.
- Competitivo local para 2–6 pessoas e cooperativo local para 1–6. As pessoas compartilham o dispositivo; não há sala online/código de convite.
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

```powershell
node --check dist/game-core.js
node --check dist/app.js
node --test tests/game-core.test.cjs
```

O motor de regras tem testes automatizados; a interface precisa de teste exploratório em navegadores e com iniciantes antes de ser tratada como produto pronto.
