---
name: buscar-sfx-prd
description: Busca e baixa os efeitos sonoros (SFX) especificados no PRD de uma fase — 3 opções CC0 por som, via Freesound, salvas em audio/faseN/. Usar no momento em que o PRD de uma fase é confirmado como correto e o desenvolvimento começa, ou quando o usuário pedir para buscar/baixar os sons de um PRD. Vale somente para SFX — vozes (gravações reais do usuário) e trilhas/músicas ficam de fora.
---

# Buscar SFX do PRD

Quando o PRD de uma fase for confirmado e o desenvolvimento iniciar, baixar automaticamente **3 opções** para cada efeito sonoro especificado, todas em licença **CC0**, para o usuário escolher a melhor.

## 1. Levantar a lista de SFX

Ler o PRD da fase (`faseN.prd`):

- **Seção `### 3.6 Áudio`** — extrair os requisitos de efeito sonoro. Ex.: "fogo crepitando, panelas, vapor", "batidas de cutelo na mesa".
- **Apêndice A (Assets)** — linhas com `Tipo = SFX` e `Status = pendente`.

**Fora do escopo — nunca baixar:**

- **Vozes** (NPC ou chefe): são gravações reais do usuário, nunca TTS nem banco de sons.
- **Trilhas / BGM / música**: fornecidas pelo usuário.
- Sons marcados como **reaproveitados** de fase anterior ou já existentes em `audio/faseN/`.

Um requisito composto ("fogo crepitando, panelas, vapor") vira um som por item.

## 2. Buscar no Freesound (CC0 direto no filtro)

Traduzir cada som para termos de busca em inglês (ex.: "fogo crepitando" → `fire crackling`; "batida de cutelo" → `meat cleaver chop` / `chop cutting board`) e buscar **já com o filtro CC0 na URL** — evita descartar resultado por licença depois:

```bash
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0 Safari/537.36"
curl -s -L -A "$UA" 'https://freesound.org/search/?q=TERMOS+AQUI&f=license%3A%22Creative+Commons+0%22' -o busca.html
```

Extrair título, duração e URL do preview do HTML (os atributos `data-*` ficam espalhados em várias linhas dentro da `<div class="bw-player">` — casar em sequência):

```python
import re, sys, html as h
data = open(sys.argv[1], encoding="utf-8", errors="ignore").read()
seen = set()
for m in re.finditer(r'data-mp3="([^"]*)"[\s\S]{0,600}?data-title="([^"]*)"[\s\S]{0,200}?data-duration="([^"]*)"', data):
    mp3, title, dur = m.group(1), h.unescape(m.group(2)), float(m.group(3))
    if mp3 not in seen:
        seen.add(mp3)
        print(f"{dur:8.1f}s  {title[:55]:55s}  {mp3}")
```

Se a busca vier vazia ou fraca, variar os termos (sinônimos, singular/plural, contexto: `pots pans clatter`, `pan clang`, `steam hiss`...).

## 3. Escolher 3 opções por som

Escolher **3 resultados variados** por som, guiado pelo uso descrito no PRD:

- Som de **ambiente** (camada sonora contínua): priorizar durações que façam bom loop (~20–90 s) e variar entre elas (curto/médio/longo).
- Som de **mecânica** (telegrafia, golpe, impacto): priorizar one-shots curtos (0,5–5 s) e variar o caráter (seco, com sequência, com ressonância).
- Evitar títulos que denunciem som falso/sintetizado ("fake", "foil", "synth") — o pilar da fase é som **captado, não sintetizado**.

## 4. Baixar

O preview de alta qualidade é a URL do resultado trocando `-lq.mp3` por `-hq.mp3` (128 kbps, suficiente para o jogo):

```bash
curl -s -A "$UA" -o audio/faseN/NOME-1.mp3 "https://cdn.freesound.org/previews/.../ID_USER-hq.mp3"
```

- Destino: `audio/faseN/` da fase do PRD.
- Nomes em português, kebab-case, com sufixo numérico para as opções: `fogo-crepitando-1.mp3`, `fogo-crepitando-2.mp3`, `fogo-crepitando-3.mp3`.
- Validar cada arquivo com `file *.mp3` — precisa ser `MPEG ADTS, layer III`; um HTML de erro salvo como .mp3 passa despercebido sem isso.

## 5. Conferir nível e entregar

- Rodar a verificação de nível do PRD (herdada do template) em cada clipe e comparar com os SFX já existentes da fase:

```bash
ffmpeg -i clipe.mp3 -af loudnorm=I=-16:TP=-1.5:print_format=json -f null /dev/null 2>&1 | sed -n '/^{/,/^}/p'
```

  Clipe muito fora da faixa dos vizinhos (lembrar do caso −41 LUFS da Fase 1) → normalizar com `loudnorm` antes de commitar.

- Commitar e empurrar (entrega direta, sem pedir confirmação), mensagem no padrão do repo, e listar ao usuário as opções baixadas (arquivo, duração, título/autor de origem) para ele escolher qual fica.

## Armadilhas conhecidas

- **Pixabay** bloqueia acesso automatizado (Cloudflare "Just a moment") — não perder tempo, ir direto ao Freesound.
- **`urllib` do Python local falha com `CERTIFICATE_VERIFY_FAILED`** — baixar sempre com `curl`, usar Python só para o parse do HTML salvo.
- Sem o header `User-Agent` de navegador, o Freesound pode recusar a busca.
- O filtro CC0 na URL dispensa checar licença página a página; se um som vier de busca **sem** o filtro, confirmar na página dele (`https://freesound.org/s/ID/`) que a licença é `creativecommons.org/publicdomain/zero` antes de usar.
