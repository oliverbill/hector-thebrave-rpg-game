#!/usr/bin/env node
/* Valida a geometria de todos os pisos sem navegador: extrai os construtores de
   mapa do castelo.html, roda flood-fill a partir do spawn e confere que tudo que
   precisa ser alcançável é — e que a arena do chefe fica selada até abrir.

   Uso:  node testes/geometria.js        (sai 1 se algo falhar)
         node testes/geometria.js --mapa (imprime também o mapa em ASCII)  */

const fs = require('fs');
const path = require('path');

const PAREDE = 0, CHAO = 1, GRADE = 2, CHAO2 = 3, FOSSO = 4, PONTE = 5;
const TAU = Math.PI * 2;
const anda = v => v === CHAO || v === CHAO2 || v === PONTE;

const html = fs.readFileSync(path.join(__dirname, '..', 'castelo.html'), 'utf8');
const js = html.match(/<script>([\s\S]*)<\/script>/)[1];
const pega = re => { const m = js.match(re); if (!m) throw new Error('não achei: ' + re); return m[0]; };

const ctx = {
  PAREDE, CHAO, GRADE, CHAO2, FOSSO, PONTE, TAU,
  hash: (x, y) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); },
  Math, Uint8Array, console
};
const src = [
  pega(/function gerarLabirinto\(cols, linhas, semente\)\{[\s\S]*?\n\}/),
  pega(/const CAL = \{[\s\S]*?\n\};/),
  pega(/function construirCalabouco\(\)\{[\s\S]*?\n\}/),
  pega(/const COZ = \{[\s\S]*?\n\};/),
  pega(/const ESTACOES = \[[\s\S]*?\];/),
  pega(/function construirCozinhas\(\)\{[\s\S]*?\n\}/)
].join('\n');
new Function(...Object.keys(ctx), src + '\nthis.calabouco = construirCalabouco; this.cozinhas = construirCozinhas;')
  .apply(ctx, Object.values(ctx));

/* alvos por piso: [nome, x, y, exigência]
   'anda'    = precisa ser piso caminhável (pode estar atrás de porta fechada)
   'alcanca' = precisa ser alcançável a pé desde o spawn
   'fala'    = precisa ter chão alcançável a até 2.9 tiles (NPC atrás de grade
               conta: o jogador conversa através dela, como as celas do piso 1) */
const PISOS = [
  {
    nome: 'Piso 1 — O Calabouço', mapa: ctx.calabouco(), spawn: [5.8, 21.2],
    alvos: [
      ['O Velho (14,21)', 14, 21, 'fala'],
      ['A Ladra (5,54)', 5, 54, 'fala'],
      ['O Ferreiro (41,27)', 41, 27, 'fala'],
      ['catacumbas fundo (41,54)', 41, 54, 'alcanca'],
      ['corredor do portão (10,16)', 10, 16, 'alcanca'],
      ['arena do Gladiador (10,6)', 10, 6, 'anda']
    ],
    selado: { alvo: [10, 6], abrir: [[9, 14], [10, 14], [11, 14]] }
  },
  {
    nome: 'Piso 2 — As Cozinhas', mapa: ctx.cozinhas(), spawn: [40, 50],
    alvos: [
      ['O Cozinheiro (11,9)', 11, 9, 'fala'],
      ['O Copeiro (41,29)', 41, 29, 'fala'],
      ['A Faxineira (17,51)', 17, 51, 'fala'],
      ['salão oeste (17,36)', 17, 36, 'alcanca'],
      ['salão leste (29,36)', 29, 36, 'alcanca'],
      ['salão norte (23,31)', 23, 31, 'alcanca'],
      ['salão sul (23,42)', 23, 42, 'alcanca'],
      ['refeitório (7,35)', 7, 35, 'alcanca'],
      ['adega serviço (5,45)', 5, 45, 'alcanca'],
      ['adega alçapão (32,45)', 32, 45, 'alcanca'],
      ['corredor da porta (29,10)', 29, 10, 'alcanca'],
      ['câmara de carnes (37,9)', 37, 9, 'anda'],
      ['caldo NO (32,5)', 32, 5, 'anda'],
      ['caldo NE (41,5)', 41, 5, 'anda']
    ],
    selado: { alvo: [37, 9], abrir: [[30, 9], [30, 10], [30, 11]] }
  }
];

const DIST_FALA = 2.9;                     // o mesmo raio de definirInteracao()
function podeFalar(m, vis, x, y) {
  const { larg: L, alt: A, tiles: t } = m, r = Math.ceil(DIST_FALA);
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= L || ny >= A) continue;
    // distância até o ponto mais próximo do tile (o jogador anda dentro dele)
    const cx = Math.max(nx, Math.min(x, nx + 1)), cy = Math.max(ny, Math.min(y, ny + 1));
    if (Math.hypot(cx - x, cy - y) > DIST_FALA) continue;
    if (anda(t[ny * L + nx]) && vis[ny * L + nx]) return true;
  }
  return false;
}
function alcancaveis(m, [sx, sy]) {
  const { larg: L, alt: A, tiles: t } = m;
  const vis = new Uint8Array(L * A), fila = [[Math.floor(sx), Math.floor(sy)]];
  vis[Math.floor(sy) * L + Math.floor(sx)] = 1;
  while (fila.length) {
    const [x, y] = fila.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= L || ny >= A) continue;
      if (vis[ny * L + nx] || !anda(t[ny * L + nx])) continue;
      vis[ny * L + nx] = 1; fila.push([nx, ny]);
    }
  }
  return vis;
}

let falhas = 0;
for (const p of PISOS) {
  const m = p.mapa, L = m.larg, t = m.tiles;
  const vis = alcancaveis(m, p.spawn);
  let total = 0, alc = 0;
  for (let i = 0; i < t.length; i++) { if (anda(t[i])) total++; if (vis[i]) alc++; }
  console.log(`\n${p.nome}  —  andáveis: ${total} | alcançáveis do spawn: ${alc}`);

  for (const [nome, x, y, tipo] of p.alvos) {
    const ok = tipo === 'anda' ? anda(t[y * L + x])
             : tipo === 'fala' ? podeFalar(m, vis, x, y)
             : vis[y * L + x] === 1;
    if (!ok) {
      falhas++;
      console.log(`  FALHA: ${nome} — ${tipo === 'anda' ? 'não é chão'
        : tipo === 'fala' ? 'sem chão alcançável a distância de fala' : 'inalcançável'}`);
    }
  }

  if (p.selado) {
    const [ax, ay] = p.selado.alvo;
    if (vis[ay * L + ax]) { falhas++; console.log('  FALHA: a arena do chefe já é alcançável com a passagem fechada'); }
    for (const [x, y] of p.selado.abrir) t[y * L + x] = CHAO;      // abre e refaz
    const vis2 = alcancaveis(m, p.spawn);
    if (!vis2[ay * L + ax]) { falhas++; console.log('  FALHA: a arena continua inalcançável mesmo com a passagem aberta'); }
    for (const [nome, x, y, tipo] of p.alvos) {
      if (tipo !== 'anda') continue;
      if (!vis2[y * L + x]) { falhas++; console.log(`  FALHA: ${nome} — inalcançável mesmo com a passagem aberta`); }
    }
  }

  if (process.argv.includes('--mapa')) {
    const ch = { 0: '█', 1: '.', 2: '#', 3: ',', 4: ' ', 5: '=' };
    let out = '';
    for (let y = 0; y < m.alt; y++) { let l = ''; for (let x = 0; x < L; x++) l += ch[t[y * L + x]]; out += l + '\n'; }
    console.log(out);
  }
}

console.log(falhas === 0 ? '\nGEOMETRIA OK — todos os pisos passaram' : `\n${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
