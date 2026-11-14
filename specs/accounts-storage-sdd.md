# Contas e persistência — SDD

## Objetivo

Adicionar autenticação opcional por Google e persistir o progresso da conta entre dispositivos, mantendo o modo convidado e migrando dados locais sem duplicação.

## Regras

- O Google ID token é verificado no servidor: assinatura, `aud`, `iss` e `exp`; nunca confiar em um ID informado pelo cliente.
- A identidade externa usa o `sub` do Google como chave única. A sessão da aplicação é curta/renovável, assinada no Worker e enviada em cookie `HttpOnly`, `Secure` e `SameSite=Lax`.
- O banco guarda perfil, estatísticas agregadas, histórico de partidas, caderno de erros, baralhos personalizados e salvamentos solo. O estado de salas online pertence ao serviço de salas.
- Exportação retorna esses dados em JSON; exclusão remove a conta e os dados pessoais vinculados. O chamador deve transferir salas ativas antes de apagar a conta.
- Importação de convidado é idempotente por `guestId`: estatísticas são somadas uma vez; histórico/erros preservam itens sem duplicá-los; decks com nome conflitante são mantidos com nome ajustado; salvamentos solo são preservados por dispositivo.
- O cliente nunca recebe segredo de sessão nem credenciais do provedor. Segredos e Client ID chegam por bindings do ambiente.

## TDD

- Cobrir normalização e mescla de dados locais, chave de deduplicação, conflito de decks e repetição da importação.
- Cobrir verificação de token com assinatura válida/inválida e claims `aud`, `iss`, `exp`; cobrir cookies e rejeição de sessão adulterada/expirada.
- Cobrir isolamento por account ID, exportação e exclusão usando contrato compatível com D1.

