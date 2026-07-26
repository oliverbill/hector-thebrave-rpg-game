---
description: Gera MP3 via `say` do macOS (offline, gratuito) e salva em output.bin. Args: <voz> <texto da fala>
argument-hint: <voz> <texto>
allowed-tools: Bash
---

Gerar um MP3 usando o `say` do macOS para a fala abaixo, salvando em `output.bin` na raiz do projeto.

**Argumentos:** $ARGUMENTS

O primeiro token é o **nome da voz** do macOS (ex: `Luciana`, `Felipe`, `Grandpa`, `Grandma`, `Eddy`, `Joana`). Todo o resto é o **texto** da fala. Para listar vozes PT: `say -v '?' | grep -iE 'pt_BR|pt_PT'`.

Execute em uma única passada (sem perguntar ao usuário):

1. Separe `voz` (primeiro token de `$ARGUMENTS`) e `texto` (o resto). Se algum estiver vazio, aborte com erro explicando o uso: `/add-voice <voz> <texto>` e sugira listar vozes com `say -v '?' | grep pt_BR`.
2. Valide que a voz existe: `say -v '?' | awk '{print $1}' | grep -Fxq "$VOZ"`. Se não existir, aborte listando as vozes PT disponíveis.
3. Gere o AIFF: `say -v "$VOZ" -o output.aiff "$TEXTO"`. Se falhar, aborte reportando o erro.
4. Converta para MP3 com `ffmpeg` (silencioso): `ffmpeg -y -hide_banner -loglevel error -i output.aiff -codec:a libmp3lame -qscale:a 2 output.bin`. Se `ffmpeg` não estiver no PATH, faça fallback para `lame output.aiff output.bin` e, se ainda falhar, use `afconvert -f m4af -d aac output.aiff output.bin` (avisando o usuário que o formato é M4A/AAC, não MP3).
5. Remova o AIFF intermediário: `rm -f output.aiff`.
6. Verifique com `file output.bin` que a saída é MPEG audio (ou M4A no fallback).
7. Reporte voz usada, tamanho, caminho, e um comando pronto para mover o arquivo (ex: `mv output.bin audio/ferreiro-1.mp3`).
