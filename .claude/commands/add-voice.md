---
description: Gera MP3 em Português (pt_BR) via `edge-tts` (Microsoft Neural, gratuito) e salva em output.bin. Args: <categoria> <texto> — categoria ∈ {idoso, mulher, criança, homem}
argument-hint: <idoso|mulher|criança|homem> <texto>
allowed-tools: Bash
---

Gerar um MP3 usando o **`edge-tts`** (vozes Neurais do Microsoft Edge, pt-BR, gratuitas — sem cadastro nem API key; precisa só de internet) para a fala abaixo, salvando em `output.bin` na raiz do projeto.

**Argumentos:** $ARGUMENTS

O primeiro token é a **categoria de voz** (uma de: `idoso`, `mulher`, `criança`, `homem`). Todo o resto é o **texto** da fala.

Mapeamento categoria → voz pt-BR do edge-tts (+ ajustes de rate/pitch):
- `idoso` → `pt-BR-AntonioNeural` com `--rate=-25% --pitch=-15Hz` (mais lento e grave)
- `mulher` → `pt-BR-FranciscaNeural` (sem ajustes)
- `criança` → `pt-BR-FranciscaNeural` com `--rate=+15% --pitch=+40Hz` (mais rápido e agudo)
- `homem` → `pt-BR-AntonioNeural` (sem ajustes)

Execute em uma única passada (sem perguntar ao usuário):

1. Separe `categoria` (primeiro token de `$ARGUMENTS`, lowercase, aceitando "crianca" sem cedilha como sinônimo de "criança") e `texto` (o resto). Se algum estiver vazio, aborte com uso: `/add-voice <idoso|mulher|criança|homem> <texto>`.
2. Faça o mapeamento acima. Se a categoria não for reconhecida, aborte listando as 4 opções válidas.
3. Valide que `edge-tts` está instalado: `command -v edge-tts >/dev/null || { echo "ERRO: edge-tts não encontrado. Instale com: pipx install edge-tts"; exit 1; }`.
4. Gere o MP3 direto: `edge-tts --voice "$VOZ" $EXTRA --text "$TEXTO" --write-media output.bin` — onde `$EXTRA` são os flags `--rate` e `--pitch` conforme a categoria (vazio para `mulher` e `homem`). O `edge-tts` já produz MP3 diretamente, sem precisar de ffmpeg.
5. Verifique com `file output.bin` que a saída é MPEG audio. Se for JSON/HTML/vazio, imprima `cat output.bin` (provavelmente erro de rede) e pare.
6. Reporte categoria, voz usada, flags aplicados, tamanho, caminho, e um comando pronto para mover o arquivo (ex: `mv output.bin audio/ferreiro-1.mp3`).
