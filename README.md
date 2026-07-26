# Hector the Brave — RPG de ação no castelo

Jogo de ação em tempo real, visão top-down, feito em **HTML5/Canvas num único arquivo offline** — projetado para rodar no iPhone (Safari), sem servidor, sem dependências e sem build.

O jogo inteiro se passa num castelo medieval. **Cada fase é um piso do castelo**, e a fase final é a Torre. A assinatura do jogo: em cada piso há pessoas que sabem algo sobre o chefe — **explorar e conversar rende poder mecânico real** (multiplicadores de dano, telegrafia de ataques visível).

| Piso | Local | Chefe |
|---|---|---|
| 1 | Calabouço | O Gladiador ✅ |
| 2 | Cozinhas e adega | O Açougueiro |
| 3 | Pátio de armas | O Capitão |
| 4 | Salão de banquetes | O Chanceler |
| 5 | Biblioteca do alquimista | O Alquimista |
| 6 | Torre | O Rei |

## Jogar online

**https://oliverbill.github.io/hector-thebrave-rpg-game/**

## Como jogar

Abra `castelo.html` em qualquer navegador (ou adicione à tela inicial do iPhone).

- **Andar** — arraste o polegar esquerdo (joystick virtual) ou WASD/setas
- **Rolar** — botão direito ou Espaço (invulnerabilidade breve, cooldown de 1s)
- **Trapo** (cura +40) — botão menor ou Q (2 iniciais; há mais 4 escondidos nas catacumbas)
- **Ação contextual** (FORÇAR / FALAR / ABRIR) — botão âmbar ou E

## Arquitetura: MOTOR × CONTEÚDO

O arquivo é dividido em duas metades demarcadas. O **motor não conhece nenhum piso**; cada piso é um objeto de dados + ganchos. Adicionar um piso novo não toca no motor.

### MOTOR — genérico, reutilizável entre pisos

- Constantes e utilidades (índices de tiles, verificação de limites, hash)
- Estado global (piso, mapa, personagem, chefe, informantes, modo de jogo)
- Sistema de som (beep procedural, síntese de fala offline para os diálogos)
- Gerenciamento de mapa e cache de cenário
- Colisão e movimento (sólido, livre, mover com subpassos e assistência de canto)
- Efeitos visuais (faíscas, flutuadores de dano, aviso de tela, partículas, destroços)
- Painel de missão (montagem dinâmica de tarefas com sobretachado e som de vitória)
- Diálogo e voz com informantes
- **Chefe configurável** — máquina de estados: espera → aproxima → combo → exausto / preparo → investida → zonzo; tudo lido de um `cfg`
- Combate do jogador (golpear, machucar, vencer, morrer, trapos)
- Sistema de entrada (touch, joystick virtual, teclado)
- Atualização (movimento, colisão, chefe, luz, câmera)
- Desenho (canvas, HUD, braseiros, luz ambiente, partículas, riscos de dano)
- Fluxo de jogo (menu, início do piso, luta, fim)

### CONTEÚDO — Piso 1: O Calabouço

- Constantes geográficas (largura, altura, posições das celas, do portão, da arena de areia)
- Construtor de mapa (tiles, braseiros, pilares) — celas, guarnição, **fosso com duas travessias de pontes** (mais uma quebrada) e **labirinto de catacumbas com duas entradas** (backtracker com semente fixa + braiding: becos sem saída viram voltas e atalhos)
- **Espinhos cíclicos** (armadilhas nas pontes, corredores e catacumbas) e **trapos coletáveis** nos becos sem saída do labirinto
- Roteiro da corrente (forçar até arrebentar, efeitos, tremor)
- Lógica do portão (bloqueia se não ouviu 3/3 presos, sela a luta ao atravessar)
- Desenho da corrente (elos em 4 camadas, barriga dinâmica, grilhão permanente no tornozelo)
- Desenho da argola e barra de força
- **Desenho do Gladiador** (pernas, saiote, torso, cicatrizes, ombreiras, elmo com placa cega, escudo oval, gládio com canal, arfar quando exausto)
- **Configuração do chefe** (`cfg`: hp=560, raio=0.75, 3 golpes, 2 batidas de escudo, dano conforme estado; fraquezas: flanco, ritmo, investida)
- Paleta de cores (pedra, areia, paredes, luz ambiente)
- Spawn do jogador, trapos iniciais
- Textos (intro, vitória, derrota)
- Missão com 4 tarefas (corrente, cruzar o fosso, 3 presos, Gladiador)
- 3 informantes (o Velho, a Ladra, o Ferreiro) com falas, vozes e segredos
- Ganchos: `aoIniciar()`, `atualizar()`, `interacao()`, `agir()`, `desenharCenario()`, `desenharNoJogador()`

### Os segredos são mecânica, não texto

Cada preso ensina algo **observável e verdadeiro** no comportamento do chefe:

- *"Ele bate três vezes; depois do terceiro, o braço cai"* (o Velho) → combo sempre de 3 golpes, seguido de exaustão de 1,5s. Com o segredo: dano ×2,2 na exaustão e contador de golpes no HUD.
- *"O elmo cobre o olho esquerdo; fique atrás dele"* (a Ladra) → a placa cega é desenhada no elmo. Com o segredo: dano ×2,1 pelas costas.
- *"Duas batidas de escudo, e vem como um touro"* (o Ferreiro) → sempre 2 batidas audíveis antes da investida; a direção fica selada na 2ª. Com o segredo: a linha vermelha da investida fica visível.

### Criando o piso 2

Um piso novo é: uma paleta, um construtor de mapa, uma lista de informantes, um `cfg` de chefe com função de desenho, e ganchos de roteiro. Exemplo: se o Açougueiro tiver combo de 2 e três batidas de cutelo, isso é `comboGolpes:2, batidasEm:[1.2,.8,.4]` — zero linhas alteradas no motor.

## Testes

O jogo foi validado com bots simulados em Node.js (canvas stub): rompimento da corrente, trava do portão em 0/3 e 2/3, comportamento do chefe fiel aos segredos (2 batidas → investida; 3 golpes → exaustão), e balanço da luta em quatro perfis de jogador (hábil/desatento × informado/desinformado).
