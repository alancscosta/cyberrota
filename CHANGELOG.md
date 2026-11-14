# Changelog

## [1.0.0] — Primeira versão jogável multiplayer

Primeira release pública do Cyber Rota com salas multiplayer entre dispositivos.

### Adicionado

- Treino Solo com checkpoints temáticos, questões, dificuldade, selos, eventos de rota e caderno de erros.
- Salas online para Desligue o Servidor 3v3 e Defenda a Rede, com códigos compartilháveis, lobby ao vivo, personagens/cores sem duplicação, anfitrião, reconexão e atualização por WebSocket com polling de recuperação.
- Regras de 3v3 com turnos alternados, dado de seis faces, bots para completar lugares após confirmação e vitória ao chegar com os três peões.
- COOP online com dado, dano e fases do Hacker, cinco servidores, pontos de cura, papéis e habilidades, limite de rodadas, efeitos de combate e pódio.
- Turno sincronizado de 20 segundos, aviso visual nos últimos cinco segundos, mensagem de passagem e validação do participante ativo no servidor.
- Pódio com avatares e métricas por dificuldade, ações do anfitrião para próxima partida ou encerramento de sala.
- Conta Google opcional para progresso, estatísticas, histórico, erros, baralhos, salvamento Solo, exportação e exclusão de dados.
- Backend Cloudflare Worker, Durable Objects e D1; frontend publicado em Vercel.
- Documentação completa de regras, modos, dados, APIs e fluxos com diagramas Mermaid.

### Infraestrutura e serviços

- Jogo e salas podem ser usados sem conta. Login Google é opcional.
- A autenticação Cyber Rota não guarda senha Google; a credencial é validada no servidor e a aplicação usa cookie de sessão próprio.
- O projeto foi configurado para serviços com cotas gratuitas, sujeitas aos termos e limites atuais dos provedores.

### Documentação

- [Guia do jogo](docs/guia-do-jogo.md)
- [Arquitetura e diagramas](docs/arquitetura-e-fluxos.md)
- [Regras detalhadas](specs/game-rules.md)
- [Auditoria de fluxos](specs/gameplay-flow-audit.md)

[1.0.0]: https://github.com/alancscosta/cyberrota/releases/tag/v1.0.0
