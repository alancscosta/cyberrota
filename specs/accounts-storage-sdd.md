# Contas e persistência — SDD

## Objetivo

Persistir o progresso exclusivamente na conta autenticada com Google. Pessoas sem login podem jogar, mas o estado fica apenas na memória da aba e desaparece ao sair ou recarregar. A foto e o nome do perfil vêm da identidade Google verificada.

## Regras

- O Google ID token é verificado no servidor: assinatura, `aud`, `iss` e `exp`; nunca confiar em um ID informado pelo cliente.
- A identidade externa usa o `sub` do Google como chave única. A sessão da aplicação é curta/renovável, assinada no Worker e enviada em cookie `HttpOnly`, `Secure` e `SameSite=Lax`.
- O banco guarda perfil, foto do Google, estatísticas agregadas, histórico de partidas, caderno de erros, baralhos personalizados e partidas solo em andamento. O estado de salas online pertence ao serviço de salas.
- Sem conta autenticada, perfil, estatísticas, erros, baralhos, histórico e partidas não são gravados no navegador nem no banco. O jogo segue disponível em memória.
- O cliente carrega a conta e o progresso do banco antes de habilitar a interface de jogo. A identidade do Google não é editável localmente.
- No login, progresso em memória da sessão atual e dados locais legados podem ser importados uma única vez para a conta; após importação confirmada, as chaves antigas de progresso são removidas. Dados anônimos novos nunca são persistidos antes da autenticação.
- O painel da conta mantém o tema escuro do produto e a foto de perfil vem do campo `avatar_url` retornado pelo servidor.
- Exportação retorna esses dados em JSON; exclusão remove a conta e os dados pessoais vinculados. O chamador deve transferir salas ativas antes de apagar a conta.
- Importação legada de convidado é idempotente por `guestId`: estatísticas são somadas uma vez; histórico/erros preservam itens sem duplicá-los; decks com nome conflitante são mantidos com nome ajustado; salvamentos solo são preservados por dispositivo.
- O cliente nunca recebe segredo de sessão nem credenciais do provedor. Segredos e Client ID chegam por bindings do ambiente.

## TDD

- Cobrir normalização e mescla de dados legados, chave de deduplicação, conflito de decks e repetição da importação.
- Cobrir que visitante não escreve em `localStorage` nem chama a API de progresso; com conta, grava apenas por `/api/account/progress`.
- Cobrir leitura da foto e do nome do Google no perfil e o tema escuro do botão Google.
- Cobrir verificação de token com assinatura válida/inválida e claims `aud`, `iss`, `exp`; cobrir cookies e rejeição de sessão adulterada/expirada.
- Cobrir isolamento por account ID, exportação e exclusão usando contrato compatível com D1.

