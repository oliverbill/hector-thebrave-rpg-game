---
description: Gera MP3 do ElevenLabs (modelo eleven_v3) e salva em output.bin. Chave lida de .env. Args: <voice_id> <texto da fala>
argument-hint: <voice_id> <texto>
allowed-tools: Bash
---

Gerar um MP3 do ElevenLabs para a fala abaixo, salvando em `output.bin` na raiz do projeto.

**Argumentos:** $ARGUMENTS

O primeiro token é o **voice_id** do ElevenLabs (último segmento da URL `https://api.elevenlabs.io/v1/text-to-speech/<voice_id>`). Todo o resto é o **texto** da fala.

Execute em uma única passada (sem perguntar ao usuário):

1. Extraia a chave: `ELEVENLABS_API_KEY=$(grep -E '^ELEVENLABS_API_KEY=' .env | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")`. Se ficar vazia, aborte com erro.
2. Separe `voice_id` (primeiro token de `$ARGUMENTS`) e `texto` (o resto). Se algum estiver vazio, aborte com erro explicando o uso: `/add-voice <voice_id> <texto>`.
3. Monte o JSON body com escape correto do texto (use `python3 -c` ou `jq -n --arg`, nunca concatenação com aspas). O body deve ser `{"model_id":"eleven_v3","text":"<texto>"}`.
4. Rode o curl:
   ```
   curl -sS -X POST "https://api.elevenlabs.io/v1/text-to-speech/<voice_id>" \
     -H "xi-api-key: $ELEVENLABS_API_KEY" \
     -H "Content-Type: application/json" \
     -d "$BODY" \
     --output output.bin
   ```
5. Verifique com `file output.bin` que a saída é MPEG áudio. Se `file` disser JSON/ASCII, imprima `cat output.bin` (é resposta de erro da API) e pare.
6. Reporte tamanho, caminho, e um comando pronto para mover o arquivo (ex: `mv output.bin audio/ladra-1.mp3`).
