# Hector the Brave — RPG de ação no castelo

Jogo de ação em tempo real, visão top-down, feito em **HTML5/Canvas num único arquivo offline** — projetado para rodar no iPhone (Safari), sem servidor, sem dependências e sem build.

O jogo inteiro se passa num castelo medieval. **Cada fase é um piso do castelo**, e a fase final é a Torre. A assinatura do jogo: em cada piso há pessoas que sabem algo sobre o chefe — **explorar e conversar rende poder mecânico real** (multiplicadores de dano, telegrafia de ataques visível).

| Piso | Local | Chefe |
|---|---|---|
| 1 | Calabouço | O Gladiador ✅ |
| 2 | Cozinhas e adega | O Açougueiro 🔨 |
| 3 | Salas de Funeral | O Coveiro ⚰️ |
| 4 | Lab do Alchimista | O Alquimista |
| 5 | Dormitórios | O Zelador |
| 6 | Torre | O Dragão |

## Jogar online

**https://oliverbill.github.io/hector-thebrave-rpg-game/**

## Como jogar

Abra `castelo.html` em qualquer navegador (ou adicione à tela inicial do iPhone).

- **Andar** — arraste o polegar esquerdo (joystick virtual) ou WASD/setas
- **Rolar** — botão direito ou Espaço (invulnerabilidade breve, cooldown de 1s)
- **Trapo** (cura +40) — botão menor ou Q (2 iniciais; há mais 4 escondidos nas catacumbas)
- **Ação contextual** (FORÇAR / FALAR / ABRIR / ARROMBAR / ACENDER) — botão âmbar ou E
- **Golpe de facão** (depois de achá-lo nas catacumbas) — botão ⚔ ou F; o facão fica na mão do jogador e abre um popup de Inventário ao ser pego
- **Bolsa/Inventário** — botão ☰ ou I
- **Esparadrapo** (cura 25% da vida) — dois na areia, um em cada canto de cima, só durante a luta com o Gladiador; repostos a cada tentativa
- **Soltar-se do agarrão** (piso 3) — esmagar GOLPE até a mão se desfazer; a instrução aparece na tela na primeira vez

Cada botão traz a tecla correspondente impressa no rótulo.

## Arquitetura: MOTOR × CONTEÚDO

O arquivo é dividido em duas metades demarcadas. O **motor não conhece nenhum piso**; cada piso é um objeto de dados + ganchos. Adicionar um piso novo não toca no motor.

### MOTOR — genérico, reutilizável entre pisos

- Constantes e utilidades (índices de tiles, verificação de limites, hash)
- Estado global (piso, mapa, personagem, chefe, informantes, modo de jogo)
- Sistema de som (SFX procedurais + clipes gravados; **vozes são sempre gravações reais**, sem síntese)
- **Camadas de ambiente por proximidade** (`piso.ambientes`): som em loop que sobe conforme o jogador chega e pausa ao se afastar
- Gerenciamento de mapa e cache de cenário
- Colisão e movimento (sólido, livre, mover com subpassos e assistência de canto)
- Efeitos visuais (faíscas, flutuadores de dano, aviso de tela, partículas, destroços)
- Painel de missão (montagem dinâmica de tarefas com sobretachado e som de vitória)
- Diálogo e voz com informantes
- **Chefe configurável** — máquina de estados: espera → aproxima → combo → exausto / preparo → investida → zonzo; tudo lido de um `cfg`. Se o `cfg` trouxer `cavaT`, o combo cai num **ciclo subterrâneo** — cava → o rastro persegue → irrompe em área telegrafada → atordoado se errar (o piso 3 usa; os pisos 1–2 nem sabem que existe)
- Combate do jogador (golpear, machucar, vencer, morrer, trapos)
- Sistema de entrada (touch, joystick virtual, teclado)
- Atualização (movimento, colisão, chefe, luz, câmera)
- Desenho (canvas, HUD, braseiros, luz ambiente, partículas, riscos de dano)
- Fluxo de jogo (menu, início do piso, luta, fim)
- **Transição entre pisos**: animação do castelo (corte dos 6 andares, luz subindo) e o piso seguinte começa jogando sozinho

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

### CONTEÚDO — Piso 2: As Cozinhas (em construção, jogável)

Construído sobre a mesma receita — uma paleta quente, um construtor de mapa, três informantes, um `cfg` de chefe e ganchos de roteiro (`fase2.prd` documenta tudo):

- **Mapa 46×54**: cozinha grande com fogões, câmara de carnes (arena), salão central com rosácea, refeitório, despensa, **adega labiríntica de barris** (mesmo backtracker+braiding das catacumbas, semente própria) e escada de chegada da arena
- **Labaredas cíclicas** nos corredores e bocas dos fornos — o papel dos espinhos, com janela de dano aprendível
- **Pão** (cura 15% + ração) espalhado; **caldo quente** (25%) nos cantos da câmara, só durante a luta, reposto a cada tentativa
- **Porta de tábuas arrombável**: exige o **machado do Gladiador** empunhado e os 3 servos ouvidos; a machadada parte a porta ao meio em animação procedural (bandas girando nas dobradiças, lascas voando)
- **Realismo pintado no cache** (gancho `pintarCache`): tábuas corridas, fornos de tijolo em brasa, mesas de preparo com talhos, lajes no salão, prateleiras na despensa, sangue arrastado e **carcaças balançando** na câmara
- **O Açougueiro**: combo de 2 talhos e **três batidas de faca na mesa** antes da investida — exatamente `comboGolpes:2, batidasEm:[1.2,.8,.4]`, zero linhas alteradas na máquina de estados. Fraquezas: `pausa` (Cozinheiro), `avental` (Copeiro), `mesa` (Faxineira). Vozes reais gravadas em `audio/fase2/vozes/`
- **Estações de trabalho** subdividindo a cozinha: 3 cômodos sólidos com 15 ajudantes andando e trabalhando, mobiliados com utensílios; ao chegar perto, sobe o falatório com facas e panelas
- **Cenário em alto-relevo** (perspectiva 3/4): faces de tijolo com cantaria, portas que abrem ao passar, janelas com gelosia, a grande cisterna octogonal do salão e a adega virada cave de vinhos
- **Transição de piso**: vencer o Gladiador oferece "Subir a escada" → animação do castelo → a fase 2 começa sozinha, com a bolsa intacta

### CONTEÚDO — Piso 3: As Salas de Funeral (em construção, jogável)

O piso onde o castelo lava, vela e enterra os seus mortos. Mesma receita, paleta fria — pedra azulada, luz escassa, água parada (`fase3.prd` documenta tudo):

- **Mapa 46×58**: capela de velório com mosaico circular e esquife, sala de preparação dos corpos, salão dos enterros ligando tudo, oficina de caixões e depósito, **cripta alagada** com passarelas, **colombário em labirinto** (grade 10×3 de nichos, semente própria), quarto do Coveiro e a **cova grande** (arena), selada até a hora. O jogador chega pela escada do canto sudeste
- **Cada cômodo se apresenta na primeira entrada** — nome e uma linha de subtexto ("*água parada — pise só nas passarelas*"), uma vez por partida. É o mapa que o jogo não tem
- **O Coveiro**: a primeira mecânica de chefe que não é corpo-a-corpo contínuo. Ele dá uma **pazada** curta (a única que o Avental de Aço amortece, 34 → 14) e então **cava** — some na terra, fica invulnerável, e só um **rastro de três lombadas de terra revolvida** persegue o jogador. Ao fim do rastro o ponto trava, um **círculo vermelho pisca no chão** com o anel do tempo fechando, e ele **irrompe**: quem estiver dentro leva 36 e voa. Se ele errar, sai **atordoado**; no **segundo mergulho**, emerge **exausto**. Tudo por `cfg` — a máquina genérica só entra no ciclo subterrâneo se o piso trouxer `cavaT`
- **Três velantes**: o **Carpinteiro de Caixões** na oficina (mede as pessoas com o olhar), a **Lavadeira dos Mortos** na sala de preparação e o **Sacristão** no fundo do colombário, o difícil de achar. Os segredos: *"quando ele some, deixa um rastro de terra"* → ×2.2 no atordoado; *"a lanterna só ilumina a frente; pelas costas, ele tá morto"* → ×2.1 pelas costas, com o bafo âmbar da lanterna desenhado no lado para onde ele olha; *"depois de 2 mergulhos, ele tá morto de cansado"* → ×2.2 no exausto e o contador "mergulho 1 de 2" na barra do chefe
- **Mãos dos mortos** (25 HP): irrompem do chão, perseguem devagar e **agarram** — imobilizam o jogador e drenam 5 por segundo até ele **esmagar GOLPE** três vezes (duas, com o Avental). Verbo de combate novo. Os dedos são fatiados no nó e se mexem, mais depressa quanto mais perto o jogador está
- **Vultos** (45 HP): só existem no escuro. Uma **zona de luz cíclica** no fundo do colombário apaga a cada 6 segundos e acende 4 depois; quando o jogador passa perto no escuro, eles se erguem com um grito e mordem. A luz os afunda de volta
- **Itens**: **água benta** (6 frascos, curam 15% e ainda entram na bolsa como ração) e, só durante a luta, **dois círios** nos cantos da cova (25%, repostos a cada tentativa). Vencer entrega a **Lanterna dos Mortos**, a chave contra o Alquimista
- **Trava dupla da arena**: os 3 velantes ouvidos **e** as **5 velas do caminho** reacesas (botão ACENDER); só então a terra se abre
- **Duas travessias falsas**: a **escada desmoronada** que sai do salão rumo à cova e morre num buraco, e os **becos d'água** — passarelas que acabam sobre a água parada
- **Cenário em alto-relevo, em cinco passes de pintura**: paredes 3/4 em pedra fria, cripta e salão, capela e preparação, oficina e colombário, e por último os itens recortados assentados pelo pé. Os PNGs carregam sob demanda e o cache se repinta sozinho quando um chega tarde
- **A cripta é desenhada viva por cima do cache**: caixões e caixotes **boiando** com rastro na lâmina, **goteiras** pingando em anéis e o reflexo das velas acesas escorrendo para dentro d'água
- **Um corpo em preparo** na mesa da Lavadeira — deitado, sujo de terra, a água escorrendo para a canaleta

**Pendente no piso 3** (detalhado em `fase3.prd` §8): as **vozes** dos velantes e do Coveiro (textos fechados em `F3-FALAS.md`, gravação não começou — hoje sai voz sintetizada), a **trilha da fase** (toca a da fase 2 como tapa-buraco), a **porta e a janela** recortadas mas ainda não espalhadas pelo cenário, e os **ajudantes de carpintaria** recortados e ainda não instalados na oficina.

### Atalhos de teste

| URL | O que faz |
|---|---|
| `castelo.html?piso=2` | começa direto no piso, herdando as recompensas dos anteriores |
| `castelo.html?piso=3` | idem, para as Salas de Funeral (chega com o Avental de Aço e o machado) |
| `castelo.html?piso=2&chefe=1` | cai na luta do chefe: segredos ouvidos, caminho liberado |
| `castelo.html?piso=3&chefe=1` | cai na cova do Coveiro: velantes ouvidos, velas acesas, passagem aberta |
| `castelo.html?transicao=1` | cai na vitória do piso, para rever a subida ao seguinte |
| `castelo.html?piso=3&transicao=1` | a vitória do piso 3, com a bolsa e o placar |

`?piso=N` vale para qualquer piso registrado em `PISOS`; `&chefe=1` e `&transicao=1` combinam com ele.

## Testes

```bash
node testes/geometria.js          # flood-fill de todos os pisos (sai 1 se quebrar)
node testes/geometria.js --mapa   # imprime também o mapa em ASCII
```

Valida que todo NPC é alcançável (contando quem fica atrás de grade, que se fala através dela), que as regiões se conectam e que a arena do chefe só abre depois do gatilho.

Antes disso, o jogo tinha sido validado com bots simulados em Node.js (canvas stub): rompimento da corrente, trava do portão em 0/3 e 2/3, comportamento do chefe fiel aos segredos (2 batidas → investida; 3 golpes → exaustão), e balanço da luta em quatro perfis de jogador (hábil/desatento × informado/desinformado).
