---
name: fase-nova
description: Cria uma fase (piso) nova do Hector, the Brave de ponta a ponta — questionário que preenche o faseN.prd, busca de imagens de cenário/personagens/chefe no Pinterest para o usuário revisar, máquina de estados inédita para o chefão, gravação das vozes uma a uma, montagem do cenário em alto-relevo com coadjuvantes em cômodos inacessíveis, e herança de tudo que a fase anterior já resolveu. Usar quando o usuário pedir para criar/começar uma fase nova, o piso N, ou invocar /fase-nova.
---

# Criar uma fase nova

Processo fechado depois da Fase 2 (as Cozinhas). As nove etapas abaixo rodam **em ordem**, com paradas explícitas para revisão do usuário. Nada de pular etapa: cada uma existe porque a Fase 2 pagou o preço de não tê-la.

**Regra que atravessa tudo:** ao fim de cada entrega de código, abrir o jogo no navegador do usuário para ele testar (`open "http://127.0.0.1:PORTA/castelo.html?piso=N"`, servindo com `python3 -m http.server` o checkout onde a mudança está). Ele nunca deve ter que pedir.

---

## 0. Preparar o terreno

```bash
N=<número da fase>
git checkout -b feat/fase$N          # toda fase nova nasce em branch própria
mkdir -p img/fase$N audio/fase$N/vozes audio/fase$N/sons
cp fase-template.prd fase$N.prd
```

O `README.md` já traz a tabela de pisos com o chefe previsto de cada um — é a fonte da verdade sobre tema e chefão. Ler antes de perguntar qualquer coisa.

---

## 1. Questionário que preenche o PRD

Fazer as perguntas com **AskUserQuestion**, em blocos de até 4, sempre com opções concretas (o objetivo é o usuário **não** ter que editar o PRD à mão depois). Sempre oferecer a opção derivada do README/imagem de inspiração como **(Recomendado)**, e lembrar que ele pode responder "Outro".

**Bloco 1 — objetivo e espinha dorsal (§1):**
- *Pilar de design da fase* — o eixo que domina as decisões (ex.: "calor e comida" foi o da Fase 2). Opções: sugerir 3 derivadas do tema + Outro.
- *Item herdado e seu uso* — como o item do chefe anterior abre esta fase (chave de porta / arma mais forte / proteção contra um ataque / ferramenta de puzzle).
- *Item entregue no fim* — o que o chefe larga para a fase seguinte.
- *Tom da fase* — sombria / grotesca / melancólica / cômica.

**Bloco 2 — mundo (§3.1):**
- *Regiões do piso* (multiSelect, 5–7 opções derivadas da imagem de inspiração em `img/scenarios/`).
- *Obstáculo cíclico* — o papel dos espinhos/labaredas nesta fase (gás, lâminas, água fervente, correntes, luz que cega…).
- *Estrutura labiríntica* — reaproveitar o gerador (`gerarLabirinto`) em qual região.
- *Travessia falsa* — qual caminho parece válido e não é.

**Bloco 3 — personagens (§3.2) e missão (§3.3):**
- *Três informantes*: papel de cada um no piso (com sugestão de nomes) e **qual segredo mecânico** cada um entrega.
- *As 4 tarefas do HUD*.
- *Ponto de retorno após a morte*.

**Bloco 4 — itens e combate (§3.4):**
- *Consumível de cura* da fase (o "pão e caldo" desta) e percentual.
- *Inimigo comum* — reaproveitar ratazanas/baratas ou criar novo.
- **HP e ataque de CADA ameaça/inimigo** — perguntar explicitamente, um a um (obstáculo cíclico incluído), com faixas de referência das fases prontas nas opções: ratazana 18 HP/mordida 6 · barata 34 HP/mordida 9 · espinho e labareda ~9-11 de dano por janela. As respostas entram no PRD como números oficiais (sem ⚠).
- *Cura da arena* (o análogo dos esparadrapos/caldos), 25%.

**Bloco 5 — chefe (§3.5) e áudio (§3.6):** ver etapas 5 e 6 — as respostas entram no PRD na hora.

Ao fim: escrever `faseN.prd` inteiro a partir do `fase-template.prd`, com **todas** as respostas já aplicadas, a coluna *Origem* preenchida (data + trecho do pedido) e os itens não decididos marcados com ⚠. Mostrar o PRD ao usuário e só seguir com o "ok".

---

## 2. Imagens do cenário (Pinterest) → revisão

Buscar em **pt.pinterest.com** com a chave `tema + "rpg 2D medieval"` — o tema vem **primeiro** (ex.: `cozinha rpg 2D medieval`, `cripta rpg 2D medieval`, `rezador rpg 2D medieval`).

**Raspar com Playwright** — o script `testes/pinterest.py` do repositório já faz tudo (o HTML cru vem sem imagens, carregadas por JS, e o endpoint `BaseSearchResource` devolve 403; por isso navegador de verdade):

```bash
python3 testes/pinterest.py "cozinha" --dest img/faseN --n 8
python3 testes/pinterest.py "coveiro" --dest img/faseN --n 6 --prefixo npc
```

Ele monta a chave `<tema> rpg 2D medieval`, rola o feed para carregar mais pins, prefere a versão `/originals/` (com a servida como reserva), baixa com **curl** (o `urllib` do macOS falha com `CERTIFICATE_VERIFY_FAILED`) e descarta miniatura por dimensão (< 400 px de lado). Se o Chromium do Playwright faltar: `python3 -m playwright install chromium`.

Buscar **um termo por família de objeto** do §3.1 do PRD (mobília, utensílios, obstáculo, porta, janela, itens de cura) e trazer 3–5 opções de cada.

**Porta e janela são obrigatórias na leva**: baixar a arte da **porta interna** e da **janela** da fase e mandá-las para revisão **junto com as demais imagens** — o cenário vai precisar das duas (ver etapa 8) e descobrir isso depois da revisão significa outra rodada de espera.

**Curadoria de estilo — descartar antes de mandar para revisão** (olhar cada download com `Read`):

- **Ficam**: arte pintada 2D de jogo / concept art com traço definido e cores chapadas-pintadas — o estilo que o cenário incorpora bem (ex. da fase 3: `coveiro-b-1.jpg`, `caixao-3.jpg`, `carpinteiro-aj-2.jpg`).
- **Caem**: renders foto-realistas ou 3D (parecem foto de maquete; o jogo não consegue incorporar — ex.: `carpinteiro-aj-4/5.jpg` da fase 3), pixel-art de resolução baixa que chega pixelada, e qualquer imagem com **marca d'água** de banco de imagens (ex.: `caixao-5.jpg`).
- Na dúvida entre 2 candidatas, escolher a mais próxima do traço das já aprovadas nas fases anteriores.

**PARE e peça revisão — um tema por vez, com o caminho de cada arquivo.** Nada de folha de contato única com tudo junto: para **cada tema** (mobília, porta, janela, obstáculo, cada personagem, o chefe…), mandar as candidatas daquele tema com `SendUserFile` e **listar na resposta o caminho completo de cada uma**, numerado, para o dono abrir e escolher:

```
Porta — escolha uma:
1. /Users/.../img/faseN/porta-1.jpg
2. /Users/.../img/faseN/porta-2.jpg
3. /Users/.../img/faseN/porta-5.jpg
```

Esperar a escolha desse tema antes de mandar o próximo. Só depois de aprovadas, recortar fundo:

```bash
uvx --with onnxruntime "rembg[cli]" i entrada.jpg saida.png     # arte/foto
# folha de sprites (grade NxM): fatiar em células e recortar uma a uma;
# pixel-art com fundo chapado: chroma-key sai mais limpo que rembg
```

---

## 3. Imagens dos personagens → revisão

Mesmo script, chave `papel + "rpg 2D medieval"` (ex.: `cozinheira rpg 2D medieval`, `coveiro rpg 2D medieval`).

- Um recorte por informante, **PNG sem fundo**, corpo inteiro, de pé.
- Conferir o recorte olhando o PNG (`Read`) antes de instalar: rembg corta braços e pernas quando o fundo é claro ou o membro se confunde com o cenário — se sair pela metade, escolher **outra figura** em vez de insistir.
- **Coadjuvantes**: pesquisar as imagens deles com o MESMO mecanismo (`testes/pinterest.py`, chave `papel do grupo + "rpg 2D medieval"` — ex.: `carpideiras velório`, `lavadeiras medievais`); uma cena coletiva rende 4–5 recortes.

**PARE e peça revisão** com `SendUserFile` antes de seguir — **um personagem por vez**, listando o caminho de cada candidata para o dono abrir (mesmo formato da etapa 2).

---

## 4. Imagem do chefão → revisão

Mesmo script, chave `chefe + "rpg 2D medieval"` (ex.: `butcher boss rpg 2D medieval`).

Requisitos herdados, inegociáveis:

- **Duas vezes maior que o jogador**: no desenho, `alt = r*3.8` para o tronco mais `~r*0.9` de pernas (o Açougueiro fechou em ~4,6 tiles), e `raio`/`comboAlcance` do `cfg` acompanham o corpo.
- **Pernas desenhadas que se movem**: coxas, joelheira e botas plantadas no chão, passando uma à frente da outra no gingado — sprite sozinho **flutua**, foi reclamação explícita na Fase 2.
- **`tremorPasso`** no `cfg`: o chão treme a cada pisada.
- Retrato do chefe pode ser o próprio sprite recortado.

**PARE e peça revisão** — mandar as candidatas do chefe com `SendUserFile` e listar o caminho de cada uma.

---

## 5. Máquina de estados inédita para o chefão

O motor lê tudo do `cfg` — mexer no motor é sinal de que a abstração não deu conta. O que **cada chefe herda**: `espera → aproxima → combo → exausto / preparo → investida → zonzo`, telegrafia visível, e as três fraquezas amarradas às chaves dos informantes (`costas` + dois estados).

**Inovar sempre.** Antes de propor, listar o que os chefes anteriores já fizeram para não repetir:

| Piso | Chefe | Assinatura |
|---|---|---|
| 1 | O Gladiador | combo de 3, 2 batidas de escudo, investida em linha reta, corrente girando |
| 2 | O Açougueiro | combo de 2 talhos, 3 batidas de faca na mesa, windup que ergue a lâmina, investida pesada |

Propor ao usuário (AskUserQuestion, 3 opções + Outro) **uma mecânica nova de verdade** para o chefe da vez — não só números diferentes. Direções que o motor comporta com pouco acréscimo: ataque em área ao redor, projétil/arremesso, invocação de lacaios, fase 2 com moveset trocado abaixo de X% de vida, ataque que muda o cenário (apagar luzes, alagar, incendiar), agarrão que exige esquiva no tempo certo, contra-ataque se golpeado no momento errado.

**Perguntar também os números do chefão** (AskUserQuestion): HP total e o dano de cada golpe do moveset novo, com as referências dos anteriores nas opções (Gladiador 560 HP, combo 18/18/28, investida 24 · Açougueiro 700 HP, talhos 26/34, investida 30). Registrar no PRD (§3.5) o `cfg` completo — HP, tempos, danos, alcances, janelas — com os valores respondidos como oficiais; só o que o usuário não decidir leva ⚠, e tudo vale **até a primeira sessão de jogo real** (balanceamento nunca fecha no papel).

---

## 6. Gravação das vozes — uma de cada vez

1. Fechar **todos** os textos antes de gravar, num arquivo `FN-FALAS.md`: 3 falas por informante (as duas primeiras de ambientação, **a terceira entrega o segredo mecânico**) + 3 do chefe (entrada com legenda, ao golpear, ao levar golpe). Nome do arquivo MP3 ao lado de cada fala.
2. **Pedir uma voz por vez**, na ordem do arquivo: dizer o personagem, o texto exato e o nome do arquivo; esperar o usuário enviar; só então pedir a próxima. Nunca despejar a lista inteira e sumir.
3. Converter e normalizar cada clipe recebido (o `m4a` do celular é o formato usual):

```bash
m=$(ffmpeg -i in.m4a -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null /dev/null 2>&1 | sed -n '/^{/,/^}/p')
# ler input_i, input_tp, input_lra, input_thresh, target_offset do JSON e:
ffmpeg -y -i in.m4a -af "loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${I}:measured_TP=${TP}:measured_LRA=${LRA}:measured_thresh=${TH}:offset=${OFF}:linear=true" \
  -ar 44100 -c:a libmp3lame -q:a 2 audio/faseN/vozes/personagem-1.mp3
```

   Alvo **−14 a −17 LUFS**. Conferir a duração do MP3 contra o original antes de apagar o source. A Fase 1 teve um clipe em −41 LUFS inaudível por uma semana.
4. **A legenda usa o texto gravado, palavra por palavra** — se o usuário improvisou na gravação, pedir o texto real e atualizar `FN-FALAS.md` e o código.
5. **Nunca TTS para voz de personagem.** O motor não tem mais fallback de síntese (removido na Fase 2, porque pular a fala fazia o robô narrar) — sem clipe, a legenda fala em silêncio.
6. SFX (não-voz) vêm da skill **`/buscar-sfx-prd`**; trilhas são fornecidas pelo usuário.

---

## 7. Espalhar as imagens pelo cenário

> **PORTEIRA: o cenário é a ÚLTIMA coisa a ser construída.** As etapas 7 e 8
> (espalhar imagens, alto-relevo, coadjuvantes) só podem começar quando **todos os
> componentes da fase estiverem prontos**:
>
> 1. **Todas** as levas de imagens revisadas e escolhidas pelo usuário — cenário,
>    personagens, coadjuvantes e chefão (etapas 2–4, incluindo levas extras);
> 2. A máquina de estados do chefão fechada (etapa 5);
> 3. **As vozes gravadas, normalizadas e instaladas (etapa 6)** — todas, não parte.
>
> Construir o cenário com componente pendente obriga a retrofitar tudo quando ele
> chega (aconteceu na fase 3: os 4 passes de pintura foram feitos com a leva de
> imagens ainda em revisão e os sprites tiveram de ser amarrados por cima depois).
> Enquanto algo estiver pendente do usuário (revisão de imagens, gravação de voz),
> a espera é dele — não adiantar o cenário para "ganhar tempo".

- Fatiar folhas de itens em PNGs individuais (`img/faseN/itens/iRC.png`) e carregá-las sob demanda, repintando o cache uma vez quando a leva chega.
- Pintar tudo no **cache do mapa** pelo gancho `pintarCache(cmx, T)` — custo zero por quadro. Só o que anima (água, fogo, portas, personagens) vai no `desenharCenario`.
- **Não repetir a mesma imagem perto dela mesma**: variar por cômodo e manter distância mínima entre repetições; alternar entre 3+ variantes quando a peça se repete (foi assim que as paredes da adega ganharam nicho / prateleira / lanterna alternados).
- Sombra elíptica sob cada móvel; objetos assentados **no tampo** quando vão sobre mesas (na Fase 2 os pratos foram parar nas prateleiras de baixo e sumiram — conferir na tela, não no código).

---

## 8. Cenário em alto-relevo + coadjuvantes

**Alto-relevo, sempre** (perspectiva 3/4, nunca topo puro):

- Parede com chão ao sul mostra a **face frontal** (fiadas de tijolo, rodapé de cantaria); o resto é **topo de muro** em pedra bruta.
- A face projeta **sombra em degradê** no chão logo abaixo.
- Móveis, balcões, parapeitos e pilares: superfície iluminada em cima + **face lateral sombreada** embaixo + sombra no chão.
- Aparar arestas: remendo de chão sob estruturas sólidas, e o passe de paredes **ignora** os tiles delas, senão sobram cantos escuros nas bordas.
- **Janelas pelo cenário, sempre**: espalhar janelas (com a arte aprovada) pelas faces de parede das salas — a fase 2 tem gelosias por toda parte e uma grande na cozinha; fase sem janela parece porão por acidente.
- **Portas internas com efeito de abertura, sempre**: cada passagem entre cômodos ganha porta (com a arte aprovada) que **abre quando o jogador passa**, como na fase 2. A porta abre **inteira, girando na dobradiça — NUNCA partida ao meio** com o jogador passando entre duas bandas (foi retrabalho na fase 2: a porta dupla teve de virar folha única).

**Coadjuvantes:**

- 3 estações/cômodos **sólidos** subdividindo a área principal — o jogador contorna e vê por cima do balcão, nunca entra.
- **Sempre povoar MAIS cômodos além das estações**: cada sala relevante ganha seu grupo temático de coadjuvantes (na fase 3: o velório na capela, com o corpo no esquife e choro por proximidade). Grupo sem som é cenário morto — cada um tem sua camada em `piso.ambientes`, e eventos pontuais ganham one-shot próprio (ex.: o grito quando um vulto surge).
- ~5 coadjuvantes por estação, **menores que o informante** daquele tema, que andam entre a bancada e o fundo, param, trabalham e viram para onde caminham (loop de 8 quadros, como `desenharInformante`).
- **Som ambiente por proximidade**: declarar em `piso.ambientes` os focos de som — o motor toca em loop, sobe o volume conforme o jogador chega e pausa o clipe ao se afastar:

```js
ambientes:[
  { url:'audio/faseN/sons/estacao-conversa.mp3', ganho:.42, raio:5, desvanece:5,
    pontos:[[6.5,13],[14.5,13],[22.5,13]] }   // um ponto por estação
]
```

  Nas estações, empilhar **grupo conversando + utensílios batendo** (na cozinha: facas e martelos de carne). Buscar os clipes com `/buscar-sfx-prd` e normalizar para **−20 LUFS** (ambiente fica abaixo de voz).

---

## 9. Herdar todo o resto

Vale sem re-especificar (e **regredir qualquer um destes é bug**):

- **Motor × Conteúdo**: piso é objeto de dados + ganchos. Nada de hardcode de fase no motor.
- **Transição de piso**: a vitória oferece "Subir a escada" → roda a **animação do castelo** (corte dos 6 andares, a luz sobe do piso vencido para o próximo) → o piso novo **começa jogando sozinho**, sem tela de início; o texto de intro vira aviso na tela. Basta acrescentar o nome do piso em `NOMES_PISOS`. A mesma animação **abre o jogo** (luz nascendo no portão e subindo ao piso 1) — não existe tela inicial com botão; o áudio destrava no primeiro toque/tecla.
- **Morte sem perder progresso**: `retomar()` reergue antes da arena com segredos, bolsa e caminho. **A música da luta é disparada na entrada da arena, não no momento em que a porta abre** — senão não volta na segunda tentativa (bug da Fase 2).
- **Golpe nunca automático**; botão GOLPE / `F`.
- **Diálogo com botão PULAR**, que vale como ouvir por inteiro (segredo + contador + callback).
- **Ducking**: BGM cai para `.08` enquanto há fala **e enquanto a legenda estiver aberta** — quem devolve o volume é fechar a fala, não o áudio acabar.
- **Item do chefe** vai à bolsa com popup e serve contra o chefe seguinte.
- **Atalhos de teste**: `?piso=N`, `?piso=N&chefe=1` (gancho `irAoChefe()` — segredos ouvidos, caminho liberado, jogador na soleira da arena) e `?piso=N&transicao=1` (cai na vitória do piso, para rever a subida ao seguinte). Implementar os três na fase nova.
- Escala de personagem por `escala` no informante; vozes e som de batida do chefe pelo `cfg` (`sons`, `somBatida`, `tremorPasso`).
- **Pose da arma empunhada** (`desenharArmaNaMao`, fechada na fase 3): em repouso o cabo fica em **diagonal ao lado do olhar** — cabeça da lâmina erguida na altura do ombro, base descendo, com dois punhos no cabo e **nenhum braço desenhado** ligando corpo e arma. O deslocamento acompanha o olhar (`px + lado*tam*.42`); inverter esse sinal faz a diagonal atravessar o torso e a arma parecer colada. Durante o golpe, o arco por ângulo de sempre.

---

## Verificação antes de entregar

1. **Sintaxe**: extrair o `<script>` do `castelo.html` e `node --check`.
2. **Geometria**: `node testes/geometria.js` — flood-fill do spawn em todos os pisos. Acrescentar o piso novo ao array `PISOS` do teste com os alvos (`fala` para NPC, que pode estar atrás de grade; `alcanca` para região; `anda` + `selado` para a arena do chefe). O teste sai com código 1 se algo quebrar.
3. **Navegador headless**: carregar `?piso=N`, checar `console --errors` vazio e tirar screenshots das regiões novas — olhar as imagens, não só o log.
4. **Fluxo completo**: falar com os 3 informantes (e pular um), abrir a arena, lutar, morrer, retomar (música volta?), vencer, ver a bolsa e a transição.
5. Preencher §5 (revertidos), §7 (adições) e §8 (pendências) do PRD.
6. Atualizar o `README.md`: marcar o piso na tabela e descrever o conteúdo novo.
7. Commitar e empurrar direto (sem pedir confirmação), abrir o jogo para o usuário testar, e **conferir o deploy**: o GitHub Pages usa build legado — se o build falhar, checar `gh api repos/OWNER/REPO/pages/builds/latest` (o `.nojekyll` na raiz já resolve o caso conhecido).

## Armadilhas conhecidas

- **Cache do navegador** é o suspeito nº 1 quando "a alteração não aparece" — mandar dar `Cmd+Shift+R` e conferir o HTML servido com `curl | grep`.
- Recorte do rembg com fundo claro **come membros**: sempre olhar o PNG antes de instalar.
- GIF por cima do canvas fica horrível e o canvas não anima GIF: animação de cena é **procedural** (a porta partindo ao meio na Fase 2).
- Não commitar os worktrees do `.claude` (entram como gitlink) — já estão no `.gitignore`.
