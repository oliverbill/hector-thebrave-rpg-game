#!/usr/bin/env bash
# Panorama das worktrees: o que ainda não chegou na branch de integração,
# o que está sujo, e qual servidor local serve cada pasta.
#
#   tools/worktrees.sh            # audita contra origin/feat/fase3
#   tools/worktrees.sh main       # audita contra origin/main
#
# A conta de "falta" usa `git cherry`, que compara o CONTEÚDO do commit: um
# commit rebaseado (SHA novo, mesmo patch) não aparece como pendente. Só
# aparece o que de fato não existe na branch de integração.
set -u

ALVO="origin/${1:-feat/fase3}"
cd "$(git rev-parse --show-toplevel)" || exit 1
git fetch origin --quiet 2>/dev/null

if ! git rev-parse --verify --quiet "$ALVO" >/dev/null; then
  echo "Branch de integração não existe: $ALVO" >&2; exit 1
fi

porta_de(){                      # qual http.server serve este diretório
  local dir="$1" pid porta
  for pid in $(pgrep -f "http.server" 2>/dev/null); do
    [ "$(lsof -p "$pid" -a -d cwd -Fn 2>/dev/null | sed -n 's/^n//p')" = "$dir" ] || continue
    porta=$(lsof -p "$pid" -a -iTCP -sTCP:LISTEN -Fn 2>/dev/null | sed -n 's/.*://p' | head -1)
    [ -n "$porta" ] && printf ':%s ' "$porta"
  done
}

printf '%s = %s   (main = %s)\n\n' "$ALVO" "$(git rev-parse --short "$ALVO")" \
  "$(git rev-parse --short origin/main 2>/dev/null)"
printf '%-34s %-38s %-6s %-6s %s\n' PASTA BRANCH FALTA SUJO SERVE
printf '%-34s %-38s %-6s %-6s %s\n' ---- ------ ----- ---- -----

orfaos=""
while IFS=$'\t' read -r dir branch; do
  [ -n "$branch" ] || continue
  faltam=$(git cherry "$ALVO" "$branch" 2>/dev/null | grep -c '^+')
  sujo=$(git -C "$dir" status --porcelain 2>/dev/null | wc -l | tr -d ' ')
  marca=""; [ "$faltam" -gt 0 ] && { marca=" <<<"; orfaos="$orfaos $branch"; }
  printf '%-34s %-38s %-6s %-6s %s%s\n' \
    "$(basename "$dir")" "$branch" "$faltam" "$sujo" "$(porta_de "$dir")" "$marca"
done < <(git worktree list --porcelain |
         awk '/^worktree /{w=$2} /^branch /{sub("refs/heads/","",$2); print w"\t"$2}')

if [ -n "$orfaos" ]; then
  echo
  echo "Commits que ainda NÃO estão em $ALVO:"
  for b in $orfaos; do
    echo "  $b"
    git cherry -v "$ALVO" "$b" | sed -n 's/^+ /    /p'
  done
  echo
  echo "Para trazer um deles:  git cherry-pick <sha>   (ou git merge $b)"
fi
