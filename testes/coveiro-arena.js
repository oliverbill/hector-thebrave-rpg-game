#!/usr/bin/env node
/* A coleira do Coveiro, conferida sem navegador: extrai do castelo.html a
   colisão do motor (solido/livre/mover), o grampo prenderChefeNaArena e os
   números do chefe da fase 3, abre a passagem da cova como o jogo abre e
   empurra o corpo dele contra todas as bordas — sobretudo contra o vão do
   portão, que é por onde ele fugia para o salão.

   Uso:  node testes/coveiro-arena.js        (sai 1 se algo falhar)  */

const fs = require('fs');
const path = require('path');

const PAREDE = 0, CHAO = 1, GRADE = 2, CHAO2 = 3, FOSSO = 4, PONTE = 5;

const html = fs.readFileSync(path.join(__dirname, '..', 'castelo.html'), 'utf8');
const js = html.match(/<script>([\s\S]*)<\/script>/)[1];
const pega = re => { const m = js.match(re); if (!m) throw new Error('não achei: ' + re); return m[0]; };

/* ---- o cfg do Coveiro, lido do arquivo (nada de número copiado à mão) ----
   o bloco é recortado antes: `velAproxima` aparece no cfg de todos os chefes,
   e o que importa aqui é o do piso 3 */
const cfgCoveiro = pega(/nome:'O Coveiro', x:[\s\S]*?desenhar: desenharCoveiro/);
const num = re => { const m = cfgCoveiro.match(re); if (!m) throw new Error('não achei no cfg do Coveiro: ' + re); return parseFloat(m[1]); };
const raio = num(/raio:([\d.]+)/);
const velAproxima = num(/velAproxima:([\d.]+)/);
const persegueVel = num(/persegueVel:([\d.]+)/);
if (!/arena:FUN\.COVA/.test(cfgCoveiro)) {
  console.log('FALHA: o cfg do Coveiro não declara mais `arena:FUN.COVA`');
  process.exit(1);
}
/* o funil só vale se o motor continuar chamando o grampo a cada quadro */
if (!/atualizarChefe\(dt\);\s*\n\s*prenderChefeNaArena\(chefe\);/.test(js)) {
  console.log('FALHA: o motor não chama prenderChefeNaArena(chefe) logo depois de atualizarChefe(dt)');
  process.exit(1);
}

/* ---- o motor: geografia do piso, colisão e o grampo ---- */
const ctx = {
  PAREDE, CHAO, GRADE, CHAO2, FOSSO, PONTE, TAU: Math.PI * 2, Math, Uint8Array, console,
  hash: (x, y) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); },
  mapa: null, LARG: 0, ALT: 0, jog: { raio: .42 }
};
const src = [
  pega(/function gerarLabirinto\(cols, linhas, semente, braid\)\{[\s\S]*?\n\}/),
  pega(/const FUN = \{[\s\S]*?\n\};/),
  pega(/function construirFuneral\(\)\{[\s\S]*?\n\}/),
  pega(/const idx = \(x,y\) => .*/),
  pega(/const dentro = \(x,y\) => .*/),
  pega(/function solido\(x,y\)\{[\s\S]*?\n\}/),
  pega(/function livre\(x, y, r\)\{[\s\S]*?\n\}/),
  pega(/function mover\(e, dx, dy\)\{[\s\S]*?\n\}/),
  pega(/function prenderChefeNaArena\(c\)\{[\s\S]*?\n\}/)
].join('\n');
new Function(...Object.keys(ctx), src +
  '\nthis.FUN = FUN; this.funeral = construirFuneral; this.mover = mover;' +
  '\nthis.prender = prenderChefeNaArena; this.solido = solido;' +
  /* mapa/LARG/ALT chegam como parâmetros: só de dentro dá para trocá-los */
  '\nthis.montar = (m, L, A) => { mapa = m; LARG = L; ALT = A; };')
  .apply(ctx, Object.values(ctx));

const FUN = ctx.FUN, COVA = FUN.COVA;
const m3 = ctx.funeral();
ctx.montar(m3.tiles, m3.larg, m3.alt);
/* a passagem ABERTA: é o cenário perigoso, o mesmo que o jogo faz quando a cova
   destrava (FUN.PORTA vira CHAO). Com ela fechada qualquer parede já segurava */
for (let x = FUN.PORTA.x; x < FUN.PORTA.x + FUN.PORTA.larg; x++) m3.tiles[FUN.PORTA.y * m3.larg + x] = CHAO;

let falhas = 0;
const falhar = msg => { falhas++; console.log('  FALHA: ' + msg); };

/* a folga que o grampo usa é a mesma do mover: raio*.9 */
const marg = raio * .9;
const dentroDaCoveira = c =>
  c.x >= COVA.x1 + marg - 1e-9 && c.x <= COVA.x2 - marg + 1e-9 &&
  c.y >= COVA.y1 + marg - 1e-9 && c.y <= COVA.y2 - marg + 1e-9;

console.log('Coveiro — arena ' + JSON.stringify(COVA) + ' | raio ' + raio +
            ' | velAproxima ' + velAproxima + ' | persegueVel ' + persegueVel);

/* ---- 1. o retângulo da coleira é chão de verdade ----
   sem isto o grampo poderia empurrar o corpo dele para dentro de pedra */
for (let y = COVA.y1; y <= COVA.y2 - 1; y++) {
  for (let x = COVA.x1; x <= COVA.x2 - 1; x++) {
    const t = m3.tiles[y * m3.larg + x];
    if (t !== CHAO && t !== CHAO2) falhar(`o tile (${x},${y}) da coleira não é chão da cova`);
  }
}

/* ---- 2. um passo do motor: empurra o chefe numa direção e grampeia ---- */
function passo(c, ang, vel, dt) {
  c.vx = Math.cos(ang) * vel; c.vy = Math.sin(ang) * vel;
  ctx.mover(c, c.vx * dt, c.vy * dt);
  ctx.prender(c);
}

/* ---- 3. a fuga clássica: correr para o sul, em cima do vão do portão ----
   o rastro seguia o jogador parado no salão e o Coveiro saía andando */
{
  const c = { cfg: { arena: COVA }, x: 37, y: 9, vx: 0, vy: 0, raio };
  const alvo = { x: 37, y: 22 };            // o jogador no salão dos enterros
  for (let i = 0; i < 60 * 12; i++) {       // 12 segundos de perseguição
    const ang = Math.atan2(alvo.y - c.y, alvo.x - c.x);
    passo(c, ang, persegueVel, 1 / 60);
    if (!dentroDaCoveira(c)) { falhar(`fugiu pelo portão em (${c.x.toFixed(2)},${c.y.toFixed(2)})`); break; }
  }
  console.log(`  perseguição rumo ao salão parou em (${c.x.toFixed(2)},${c.y.toFixed(2)}) — a soleira fica em y${FUN.PORTA.y}`);
  if (c.y < 14) falhar('ele nem chegou perto da borda sul: o teste não provou nada');
}

/* ---- 3b. a testemunha: SEM o grampo ele foge mesmo ----
   um teste que passa com e sem a correção não prova nada. Aqui a mesma
   perseguição roda com o grampo desligado e tem obrigação de escapar */
{
  const c = { cfg: { arena: COVA }, x: 37, y: 9, vx: 0, vy: 0, raio };
  const alvo = { x: 37, y: 22 };
  let fugiu = false;
  for (let i = 0; i < 60 * 12; i++) {
    const ang = Math.atan2(alvo.y - c.y, alvo.x - c.x);
    c.vx = Math.cos(ang) * persegueVel; c.vy = Math.sin(ang) * persegueVel;
    ctx.mover(c, c.vx / 60, c.vy / 60);          // e nada de prender
    if (c.y > COVA.y2) fugiu = true;             // passou da cova — e segue andando
  }
  if (!fugiu) falhar('sem o grampo ele também não sai: a colisão sozinha já segurava e este teste é decorativo');
  else console.log(`  testemunha: com o grampo desligado ele chega a (${c.x.toFixed(2)},${c.y.toFixed(2)}), fora da cova`);
}

/* ---- 4. as quatro bordas e as diagonais, a partir de vários pontos ---- */
{
  const dirs = [];
  for (let k = 0; k < 24; k++) dirs.push(k / 24 * Math.PI * 2);
  const partidas = [[37, 9], [30, 3], [44, 3], [30, 16], [44, 16], [37, 15.5], [31.5, 8]];
  for (const [px, py] of partidas) {
    for (const ang of dirs) {
      const c = { cfg: { arena: COVA }, x: px, y: py, vx: 0, vy: 0, raio };
      for (let i = 0; i < 60 * 6; i++) {
        passo(c, ang, 30, 1 / 60);          // velocidade absurda de propósito
        if (!dentroDaCoveira(c)) {
          falhar(`saiu da arena partindo de (${px},${py}) rumo a ${ang.toFixed(2)} rad — parou em (${c.x.toFixed(2)},${c.y.toFixed(2)})`);
          i = 1e9;
        }
      }
    }
  }
  console.log(`  ${partidas.length} pontos de partida x ${dirs.length} direções a 30 tiles/s: contido`);
}

/* ---- 5. teleporte cru: mesmo largado fora, o grampo devolve para dentro ----
   (a máquina dele não teleporta hoje, mas o abraço e o enterrar escrevem
   c.x/c.y na mão do jogador — este é o caso que garante esses estados) */
{
  const fora = [[37, 19], [37, 25], [20, 22], [40, 28], [46, 9], [10, 50], [37, 0], [28, 9]];
  for (const [x, y] of fora) {
    const c = { cfg: { arena: COVA }, x, y, vx: 3, vy: 3, raio };
    ctx.prender(c);
    if (!dentroDaCoveira(c)) falhar(`largado em (${x},${y}) o grampo não devolveu (ficou em ${c.x},${c.y})`);
  }
  console.log(`  ${fora.length} posições fora da cova devolvidas pelo grampo`);
}

/* ---- 6. o grampo não briga com a parede: dentro da cova ele nunca encosta ---- */
{
  let mordeu = 0;
  for (let y = COVA.y1 + marg; y <= COVA.y2 - marg; y += .25) {
    for (let x = COVA.x1 + marg; x <= COVA.x2 - marg; x += .25) {
      const c = { cfg: { arena: COVA }, x, y, vx: 5, vy: 5, raio };
      ctx.prender(c);
      if (c.vx === 0 || c.vy === 0) mordeu++;
    }
  }
  if (mordeu) falhar(`o grampo mordeu ${mordeu} posições que já estavam dentro da cova`);
  else console.log('  dentro da cova o grampo é inerte: não disputa com a colisão de parede');
}

/* ---- 7. o jogador continua livre: o grampo só olha para quem tem cfg.arena ---- */
{
  const j = { x: 37, y: 22, vx: 4, vy: 4, raio: .42 };   // sem cfg: é o jogador
  ctx.prender(j);
  if (j.x !== 37 || j.y !== 22 || j.vx !== 4) falhar('o grampo mexeu em quem não tem arena declarada');
  else console.log('  quem não declara arena (jogador, mãos, outros chefes) passa intacto');
}

console.log(falhas === 0 ? '\nCOVEIRO OK — ele não sai da cova grande' : `\n${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
