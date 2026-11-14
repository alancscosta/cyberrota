# Critérios de aceitação

- **Solo:** cinco respostas corretas em checkpoints diferentes concedem os cinco selos e permitem vencer ao alcançar o destino; no máximo 20 movimentos.
- **Desligue o Servidor 3v3:** seis peões independentes (três por equipe) mostram nomes, avatares, cores e casas; os times começam em extremos opostos, alternam turnos e cada um percorre a rotação 1→2→3.
- **Troca de turno 3v3:** cada participante recebe a própria pergunta somente depois de rolar seu dado; a resposta anterior fica oculta até a vez seguinte.
- **Desligue o Servidor 3v3:** acerto move o peão ativo o valor de um dado de seis faces; erro o recua uma casa (sem ultrapassar seu ponto inicial) e move o adversário correspondente uma casa. Casas ficam limitadas a 0–18.
- **Fim 3v3:** só vence a equipe quando os três peões alcançam o estande rival. O servidor pisca vermelho, apaga as luzes e o sinal superior apaga; a equipe vencedora aparece em tela cheia com fade, e o título usa a cor do time (azul ou vermelho). Após 60 turnos sem trio completo, há empate.
- **Cenário 3v3:** tabuleiro quadrado com rota clara e sem tiles ou peças sobrepostos. Os servidores ficam fora das casas em estandes separados, com cabo e tomada visíveis, LEDs verdes online e transição para LEDs apagados após a chegada dos três peões.
- **Dado 3v3:** aparece na área principal do tabuleiro e conserva superfície azul-marinho; somente os pontos recebem a cor do participante ativo.
- **Peões 3v3:** as seis peças do tabuleiro, a escalação e o indicador de quem joga usam os mesmos peões coloridos, com seis silhuetas distintas. Nenhum sprite antigo de robô aparece nesse modo.
- **Salas online:** criar/entrar abre o lobby em modal sobre a tela de configuração; encerrar pelo anfitrião fecha o lobby e retorna à tela de criar/entrar. Iniciar fecha o modal e abre o tabuleiro em tela cheia.
- **Defenda a Rede online:** o próximo jogador consegue rolar após o anterior responder e continuar; snapshots antigos não podem restaurar botões de uma fase anterior, e rejeições atualizam o estado compartilhado.
- **Dado e superfícies:** dado, cartas e painéis usam superfícies azul-marinho da paleta tecnológica; nenhum controle ou área de jogo tem fundo branco.
- **Cooperativo acerto:** reduz PV do Hacker conforme dificuldade e recupera até 25% do servidor sob ataque, sem passar de 100%.
- **Cooperativo erro:** reduz 25% do servidor sob ataque e aumenta alertas; terceiro alerta atinge o servidor ativo mais frágil e reinicia alerta.
- **Desafio:** erro aplica dano total de 50% ao servidor sob ataque, cura Hacker em 2 PV até o limite inicial, resolve alerta e depois checa condições terminais.
- **Nós verdes:** cada casa verde da rota recupera 25% do servidor de menor integridade uma vez, somente quando o peão está nela; pode recuperar servidor zerado e fica desabilitada quando todos estão em 100%.
- **Fases do Hacker:** cada faixa de PV apresenta o estado visual correspondente e não altera cálculo de dano. O Hacker fica com 1 PV até o peão chegar ao relé; o golpe final na chegada encerra a partida.
- **Ações finais:** resposta duplicada, cura repetida e ações após partida encerrada não mudam o estado.
- **Deck:** sem cartas elegíveis, a partida não começa e apresenta como corrigir filtros; carta não se repete até esgotar o conjunto elegível.
- **Tabuleiros:** Solo, Corrida e Defesa mantêm mapas isométricos 2D próprios; casas de servidor, cenário, peças e equipamentos usam sombras, gradientes e camadas para volume visual. Defesa também mostra a rua padrão de 19 casas no contorno do tabuleiro, dado de 1 a 3 e peão coletivo que percorre os vértices da rota. Os circuitos aparecem como traços técnicos discretos separados da rua; não substituem nem cruzam as casas do percurso. Acerto avança a quantidade sorteada; erro mantém o peão e inicia um ataque carregado que atinge o servidor selecionado. A vitória exige chegar ao relé externo e derrotar o Hacker; ele não é eliminado antes da chegada. O painel exibe PV e fase.
- **Efeitos:** laser aliado atinge o peitoral e explode no Hacker, que recua. Em cada fase, placas caem sobre a plataforma e permanecem ao redor dele; no contra-ataque, o Hacker carrega, dispara e a explosão acerta o servidor. Sons de disparo, explosão e armadura respeitam o controle de silêncio. O ataque Hacker→servidor termina no rack com explosão localizada; nós verdes aparecem nas casas de cura.
- **HUD:** durante a partida, o tabuleiro ocupa a área principal e o painel compacto apresenta pergunta, vida e controles essenciais.
- **Acessibilidade:** teclado/toque funcionam; nomes/símbolos distinguem Azul/Vermelho e eventos; jogo é compreensível sem áudio e sem movimento contínuo.
- **Persistência:** recarregar retoma estado sem reaplicar efeitos e sair oferece encerrar ou continuar.
- **Tempo por turno:** cada jogador recebe um único prazo total de 20 segundos para rolar, escolher dificuldade e responder. Nos últimos 5 segundos, uma chamada central animada conta 5, 4, 3, 2, 1 sem desfocar o mapa nem bloquear ações. A pessoa ativa vê “SUA VEZ”; nos demais clientes online aparece “VEZ DE [nome]”. Ações intermediárias não reiniciam o relógio. Ao expirar, todos veem “[nome] PASSOU A VEZ” no aviso central; a vez é pulada sem registrar erro.
- **Modo local:** validar co-op com salas de 1, 2, 3 e 6 participantes, alternância de turno, dado e movimento; a sala é pass-and-play no mesmo dispositivo e não há sincronização online entre aparelhos.

## Revisão visual e multiplayer — aceite

- A interface usa IBM Plex Sans localmente, inclusive no painel Hacker e nos rótulos do SVG; texto de pergunta fica entre 22–26 px conforme o espaço disponível e alternativas têm pelo menos 17 px.
- Física, Rede, Transporte, Aplicação e Segurança mantêm, respectivamente, verde-água, azul, âmbar, lilás e coral nos racks, casas de checkpoint e indicadores. Piso e percurso permanecem em azul tecnológico.
- O núcleo da base de defesa, o centro do Hacker e o relé ficam no mesmo eixo vertical do tabuleiro; o marco da base e a casa de início também compartilham o eixo central. A pose e os efeitos de impacto não podem deslocar o Hacker para fora do pedestal.
- Depois da casa 18, o jogo não oferece outro dado nem anuncia casas inexistentes; cada resposta seguinte é um ataque final direto ao Hacker até ele ser derrotado.
- Os cinco racks mantêm caixas visuais separadas entre si, sem cobrir os checkpoints da rota, a casa inicial ou a base.
- O peão e as duas camadas da trilha usam os mesmos 19 pontos, na mesma ordem; nenhum traço atravessa o centro das casas fora do caminho.
- Nenhuma peça, contorno ou detalhe do Hacker usa azul: corpo em grafite/bordô, placas em vinho escuro e visor vermelho, separado das cores tecnológicas do tabuleiro.
- Os olhos do Hacker aparecem como dois visores curtos separados, sem um traço atravessando o rosto.
- Cada parte perdida sai da posição correta do corpo, gira, bate na plataforma e permanece ao redor do pedestal. A explosão dá lugar a fogo e fumaça breves; nada fica animando ou preso depois do efeito.
- Quando o Hacker recupera vida no Desafio, uma peça que está no chão retorna voando até seu encaixe no corpo, com brilho de reparo; não duplica a placa nem deixa destroços sobrepostos.
- Salas locais de 1 a 6 participantes avançam uma vez por participante, na ordem configurada, e retornam ao primeiro sem perder jogadores ou duplicar turnos.
- Em Defenda a Rede, até seis jogadores aparecem visualmente no peão compartilhado e em uma lista de equipe sempre visível, com a pessoa da vez destacada.
- Os seis peões preservam posições separadas durante a animação do movimento compartilhado.
- O dado e o aviso de turno usam a cor de destaque do participante ativo, com face clara e texto legível.
- A indicação “SUA VEZ!!!” entra e sai em fade; a mensagem de vitória também desaparece suavemente sem esconder o botão de retorno.
- As plataformas da rota ficam maiores e inteiramente dentro do piso quadrado, com uma margem visível até a borda.
- A tampa da base de defesa flutua separada do corpo, e a estrutura não cobre as casas da rota.

## Derrota final do Hacker e tabuleiro de Defesa — SDD

- Ao zerar os PV do Hacker na chegada, a partida mantém o tabuleiro visível e inicia uma explosão final localizada no corpo do boss.
- A animação final ejeta placas e antenas; os fragmentos caem e ficam ao redor do sinal externo. O corpo não permanece sobre a plataforma nem volta a aparecer após a animação.
- Cada golpe acrescenta avaria visível: placas e partes reconhecíveis caem em fases, fumaça permanece após o primeiro dano e fogo surge nas fases seguintes. Na vitória, cabeça, tronco, braços e pernas caem ao redor do relé, sem cubos genéricos ou dispersão de confetes.
- Uma faixa de vitória verde, legível e acessível aparece sobre o tabuleiro com ação para voltar aos modos. A tela final mantém acesso ao resumo e às cartas para revisar. Após a explosão em câmera lenta, a vitória usa o mesmo título central em tela cheia e fade do modo 3v3; o botão de menu aparece após o fade, e o sucesso cooperativo permanece verde.
- O tabuleiro de Defesa é menor no espaço de jogo e conserva a projeção isométrica de um quadrado, com a rota de 19 casas, circuitos discretos e entrada/chegada alinhadas.
- Os cinco racks ficam totalmente dentro da plataforma, sem cobrir a rota, a base, casas de cura ou uns aos outros; pontos de impacto do laser correspondem às posições visuais dos racks.
- A estrada segue a rota de casas no perímetro; os servidores ficam em baias centrais separadas da estrada e da base.
- Em cada ataque ao Hacker, a armadura cai à frente do corpo em etapas e continua visível no piso depois da animação.
- Respeitar `prefers-reduced-motion`: nesse caso, mostrar o resultado final e os fragmentos no estado final sem movimentos contínuos.

### Verificação TDD

- Teste de contrato da UI verifica estado final do Hacker, explosão e fragmentos persistentes, vitória verde e ação de retorno.
- Teste de contrato do tabuleiro verifica a pegada menor em forma de quadrado isométrico, separação dos cinco racks e alinhamento dos alvos de impacto.
- Testes existentes de regra preservam a condição de derrota somente após a chegada e a transição de PV para zero.

- A equipe pode identificar visualmente cada participante: os seis pinos têm silhuetas de peça distintas e a mesma cor do seletor aparece na lista da equipe e nos peões do tabuleiro.
- Os cinco servidores ocupam baias internas, fora das 19 casas da trilha; a base não cobre casas e nenhum cabo atravessa a rota até o início.
- “SUA VEZ” e a vitória aparecem em avisos grandes no centro da jogatina, com contraste alto, fade breve e sem cobrir os controles depois de desaparecerem.
