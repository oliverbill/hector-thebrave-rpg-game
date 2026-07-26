---
description: Gera MP3 via `say` do macOS (offline, gratuito) e salva em output.bin. Args: <categoria> <texto> — categoria ∈ {idoso, mulher, criança, homem}
argument-hint: <idoso|mulher|criança|homem> <texto>
allowed-tools: Bash
---

Gerar um MP3 usando o `say` do macOS para a fala abaixo, salvando em `output.bin` na raiz do projeto.

**Argumentos:** $ARGUMENTS

O primeiro token é a **categoria de voz** (uma de: `idoso`, `mulher`, `criança`, `homem`). Todo o resto é o **texto** da fala.

Mapeamento categoria → voz pt_BR do macOS:
- `idoso` → `Grandpa`
- `mulher` → `Luciana`
- `criança` → `Flo` com pitch-shift para cima (via `ffmpeg`, pois não há voz infantil nativa em pt_BR)
- `homem` → `Rocko`

Execute em uma única passada (sem perguntar ao usuário):

1. Separe `categoria` (primeiro token de `$ARGUMENTS`, lowercase, aceitando "crianca" sem cedilha como sinônimo de "criança") e `texto` (o resto). Se algum estiver vazio, aborte com uso: `/add-voice <idoso|mulher|criança|homem> <texto>`.
2. Faça o mapeamento acima. Se a categoria não for reconhecida, aborte listando as 4 opções válidas.
3. Gere AIFF: `say -v "$VOZ" -o output.aiff "$TEXTO"`. Se falhar (voz ausente), aborte e sugira `say -v '?' | grep pt_BR`.
4. Converta para MP3:
   - **Se categoria ≠ criança**: `ffmpeg -y -hide_banner -loglevel error -i output.aiff -codec:a libmp3lame -qscale:a 2 output.bin`
   - **Se categoria = criança**: aplique pitch-shift subindo ~30% e ajuste tempo pra não ficar acelerado: `ffmpeg -y -hide_banner -loglevel error -i output.aiff -af "asetrate=44100*1.35,aresample=44100,atempo=1/1.15" -codec:a libmp3lame -qscale:a 2 output.bin`
   - Fallback se `ffmpeg` faltar: `lame output.aiff output.bin` (sem pitch-shift; avise).
5. Remova o AIFF intermediário: `rm -f output.aiff`.
6. Verifique com `file output.bin` que a saída é MPEG audio.
7. Reporte categoria, voz usada, tamanho, caminho, e um comando pronto para mover o arquivo (ex: `mv output.bin audio/ferreiro-1.mp3`).
