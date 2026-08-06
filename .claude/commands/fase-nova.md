---
description: Cria uma fase (piso) nova de ponta a ponta — questionário que preenche o faseN.prd, imagens do Pinterest para revisão, chefão com máquina de estados inédita, vozes gravadas uma a uma, cenário em alto-relevo com coadjuvantes, herdando tudo que a fase anterior resolveu. Args: [número da fase]
argument-hint: [N]
---

Criar a fase nova do **Hector, the Brave** seguindo o processo completo.

**Fase alvo:** $ARGUMENTS — se vier vazio, usar a próxima fase não construída (a tabela de pisos do `README.md` manda; hoje as fases 1 e 2 estão prontas).

Invoque a skill **`fase-nova`** (Skill tool) e siga as nove etapas dela **na ordem**, sem pular nenhuma:

1. Questionário (AskUserQuestion, opções concretas) que preenche o `faseN.prd` inteiro
2. Imagens do cenário no Pinterest → **parar para revisão**
3. Imagens dos personagens → **parar para revisão**
4. Imagem do chefão (2× o jogador, pernas que andam) → **parar para revisão**
5. Máquina de estados **inédita** para o chefão, sem repetir os anteriores
6. Vozes: pedir a gravação **uma de cada vez**, normalizar para −14/−17 LUFS
7. Espalhar as imagens pelo cenário sem repetir peça perto de peça
8. Cenário em alto-relevo + coadjuvantes em cômodos inacessíveis, com som de grupo por proximidade
9. Herdar todo o resto do motor e das fases anteriores

Trabalhe numa branch própria (`feat/faseN`), abra o jogo no navegador ao fim de cada entrega para o usuário testar, e feche com a verificação da skill (sintaxe, flood-fill da geometria, headless sem erros, fluxo completo, PRD e README atualizados).
