#!/usr/bin/env python3
"""Raspa imagens do Pinterest com Playwright, para os assets de uma fase nova.

O Pinterest carrega os pins por JS (o HTML cru vem vazio) e o endpoint
BaseSearchResource devolve 403 — por isso o caminho é navegador de verdade.

Uso:
    python3 testes/pinterest.py "cozinha" --dest img/fase2 --n 8
    python3 testes/pinterest.py "coveiro" --dest img/fase3 --n 6 --prefixo npc

A chave de busca vira: "medieval rpg 2d" + <tema>.
Baixa as maiores versões (/originals/) e ignora repetidas e miniaturas.
"""
import argparse, pathlib, re, shutil, subprocess, sys, urllib.parse

BUSCA = 'https://pt.pinterest.com/search/pins/?q=medieval%20rpg%202d%20'
UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/126.0 Safari/537.36')
MIN_LADO = 400          # abaixo disso é miniatura do feed, não serve de asset


def coletar(tema: str, quantos: int) -> list[str]:
    from playwright.sync_api import sync_playwright
    urls: list[str] = []
    with sync_playwright() as p:
        nav = p.chromium.launch(headless=True)
        pag = nav.new_page(user_agent=UA, viewport={'width': 1400, 'height': 1000})
        pag.goto(BUSCA + urllib.parse.quote(tema), wait_until='domcontentloaded', timeout=60000)
        pag.wait_for_timeout(4000)
        for _ in range(6):                       # rola para o feed carregar mais pins
            achadas = pag.eval_on_selector_all(
                'img',
                "els => els.map(e => e.src).filter(s => /i\\.pinimg\\.com/.test(s))")
            for s in achadas:
                # tenta a maior versão (/originals/) e guarda a servida como reserva
                par = (re.sub(r'/\d+x\d*/', '/originals/', s), s)
                if par not in urls:
                    urls.append(par)
            if len(urls) >= quantos * 2:
                break
            pag.mouse.wheel(0, 2400)
            pag.wait_for_timeout(2500)
        nav.close()
    return urls


def _curl(url: str, alvo: pathlib.Path) -> bool:
    """Baixa com curl — o urllib do macOS falha com CERTIFICATE_VERIFY_FAILED."""
    r = subprocess.run(
        ['curl', '-sfL', '--max-time', '30', '-A', UA,
         '-e', 'https://pt.pinterest.com/', '-o', str(alvo), url],
        capture_output=True)
    if r.returncode != 0 or not alvo.exists():
        return False
    try:                                   # descarta miniatura (o feed serve 236x236)
        from PIL import Image
        with Image.open(alvo) as im:
            return min(im.size) >= MIN_LADO
    except Exception:
        return alvo.stat().st_size > 60000


def baixar(urls, dest: pathlib.Path, prefixo: str, quantos: int) -> list[pathlib.Path]:
    dest.mkdir(parents=True, exist_ok=True)
    salvos: list[pathlib.Path] = []
    for orig, reserva in urls:
        if len(salvos) >= quantos:
            break
        ext = pathlib.Path(urllib.parse.urlparse(orig).path).suffix.lower() or '.jpg'
        if ext not in ('.jpg', '.jpeg', '.png', '.webp'):
            continue
        alvo = dest / f'{prefixo}-{len(salvos) + 1}{ext}'
        # /originals/ nem sempre existe; a versão servida no feed é a reserva
        if not _curl(orig, alvo) and not _curl(reserva, alvo):
            alvo.unlink(missing_ok=True)
            print(f'  pulei {orig[-30:]}', file=sys.stderr)
            continue
        salvos.append(alvo)
        try:
            from PIL import Image
            with Image.open(alvo) as im:
                dim = f'{im.size[0]}x{im.size[1]}'
        except Exception:
            dim = '?'
        print(f'  {alvo.name}  {dim}  ({alvo.stat().st_size // 1024} KB)')
    return salvos


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('tema', help='tema da busca, somado a "medieval rpg 2d"')
    ap.add_argument('--dest', default='img/tmp', help='pasta de destino')
    ap.add_argument('--n', type=int, default=6, help='quantas imagens baixar')
    ap.add_argument('--prefixo', default=None, help='prefixo dos arquivos (padrão: o tema)')
    a = ap.parse_args()
    prefixo = a.prefixo or re.sub(r'\W+', '-', a.tema.lower()).strip('-')

    if not shutil.which('curl'):
        print('ERRO: curl não encontrado', file=sys.stderr)
        return 1
    print(f'buscando: "medieval rpg 2d {a.tema}"')
    urls = coletar(a.tema, a.n)
    print(f'{len(urls)} candidatas; baixando até {a.n} para {a.dest}/')
    salvos = baixar(urls, pathlib.Path(a.dest), prefixo, a.n)
    print(f'\n{len(salvos)} imagem(ns) salvas — revise antes de usar.')
    return 0 if salvos else 1


if __name__ == '__main__':
    raise SystemExit(main())
