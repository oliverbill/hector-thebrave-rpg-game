---
description: Gera MP3 em Português (pt_BR) via `say` do macOS e salva em output.bin. Args: <categoria> <texto> — categoria ∈ {idoso, mulher, criança, homem}
argument-hint: <idoso|mulher|criança|homem> <texto>
allowed-tools: Bash
---

Gerar um MP3 usando o `say` do macOS **em Português brasileiro (pt_BR)** para a fala abaixo, salvando em `output.bin` na raiz do projeto.

**Argumentos:** $ARGUMENTS

O primeiro token é a **categoria de voz** (uma de: `idoso`, `mulher`, `criança`, `homem`). Todo o resto é o **texto** da fala.

**Idioma padrão: pt_BR.** Vozes como `Grandpa`/`Rocko`/`Flo` existem em 13+ idiomas no macOS; sem qualificação, o `say` usa o padrão do sistema (geralmente en_US) e o resultado vira inglês macarrônico. Por isso o comando sempre passa o **nome completo com o idioma pt_BR entre parênteses**.

Mapeamento categoria → voz pt_BR do macOS (nome completo):
- `idoso` → `Grandpa (Portuguese (Brazil))`
- `mulher` → `Luciana` (só existe em pt_BR, não precisa qualificar)
- `criança` → `Flo (Portuguese (Brazil))` com pitch-shift para cima (via `ffmpeg`, pois não há voz infantil nativa em pt_BR)
- `homem` → `Rocko (Portuguese (Brazil))`

Execute em uma única passada (sem perguntar ao usuário):

1. Separe `categoria` (primeiro token de `$ARGUMENTS`, lowercase, aceitando "crianca" sem cedilha como sinônimo de "criança") e `texto` (o resto). Se algum estiver vazio, aborte com uso: `/add-voice <idoso|mulher|criança|homem> <texto>`.
2. Faça o mapeamento acima. Se a categoria não for reconhecida, aborte listando as 4 opções válidas.
3. **Valide que a voz existe** (crítico: o `say` NÃO reclama de voz inexistente — ele silenciosamente cai na voz padrão do sistema e sai com código 0):
   ```
   if ! say -v '?' | grep -qF "$VOZ"; then
     echo "ERRO: voz '$VOZ' não encontrada no sistema. Vozes pt_BR/pt_PT disponíveis:"
     say -v '?' | grep -iE 'pt_BR|pt_PT'
     exit 1
   fi
   ```
4. Gere AIFF: `say -v "$VOZ" -o output.aiff "$TEXTO"` (onde `$VOZ` é o nome completo, ex: `Grandpa (Portuguese (Brazil))`).
5. Converta para MP3:
   - **Se categoria ≠ criança**: `ffmpeg -y -hide_banner -loglevel error -i output.aiff -codec:a libmp3lame -qscale:a 2 -f mp3 output.bin`
   - **Se categoria = criança**: aplique pitch-shift subindo ~30% e ajuste tempo pra não ficar acelerado: `ffmpeg -y -hide_banner -loglevel error -i output.aiff -af "asetrate=44100*1.35,aresample=44100,atempo=1/1.15" -codec:a libmp3lame -qscale:a 2 -f mp3 output.bin`
   - **Importante**: `-f mp3` é obrigatório porque a extensão `.bin` não permite ao ffmpeg inferir o formato.
   - Fallback se `ffmpeg` faltar: `lame output.aiff output.bin` (sem pitch-shift; avise).
6. Remova o AIFF intermediário: `rm -f output.aiff`.
7. Verifique com `file output.bin` que a saída é MPEG audio.
8. Reporte categoria, voz usada (com idioma), tamanho, caminho, e um comando pronto para mover o arquivo (ex: `mv output.bin audio/ferreiro-1.mp3`).
