#!/usr/bin/env node
/* Guarda o colombário do piso 3, que tem duas exigências que brigam entre si:

   1. chegar ao Sacristão TEM que ser uma travessia de labirinto — nada de
      atravessar a galeria dos nichos em linha reta desde a escada;
   2. a galeria em frente à parede de nichos TEM que continuar corrida, de x7 a
      x32, senão não dá para andar rente às 40 lápides lendo os nomes.

   E, de quebra, nenhum enfeite pode acabar dentro de pedra quando a semente do
   labirinto mudar: estátua precisa de parede nas costas, braseiro/vulto/mão
   precisam de chão. Este teste refaz a planta a partir do próprio castelo.html
   e cobra as três coisas.

   Uso:  node testes/colombario.js        (sai 1 se algo falhar)  */

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'castelo.html'), 'utf8');
const js = html.match(/<script>([\s\S]*)<\/script>/)[1];
const pega = re => { const m = js.match(re); if (!m) throw new Error('não achei: ' + re); return m[0]; };

const ctx = { Math, console, Uint8Array };
new Function('ctx', `with(ctx){
  ${pega(/function gerarLabirinto\(cols, linhas, semente, braid\)\{[\s\S]*?\n\}/)}
  ctx.gerarLabirinto = gerarLabirinto;
}`)(ctx);

/* a planta do colombário, montada com o MESMO trecho que o jogo usa: em vez de
   copiar os números para cá, o teste lê o bloco do construtor e roda os cavar()
   dele contra um mapa de mentira — assim mexer no jogo mexe no teste junto */
const bloco = pega(/const lab = gerarLabirinto\(10, 2,[\s\S]*?cavar\(31,47,32,47\);/);
const chao = new Set();
new Function('ctx', `with(ctx){ ${bloco} }`)({
  gerarLabirinto: ctx.gerarLabirinto,
  cavar: (x1, y1, x2, y2) => { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) chao.add(x + ',' + y); },
});
const eChao = (x, y) => chao.has(Math.floor(x) + ',' + Math.floor(y));

/* os enfeites, lidos do castelo.html para não desencontrarem do jogo */
const nums = re => { const m = js.match(re); return m ? m[0] : ''; };
const pares = txt => [...txt.matchAll(/\{?\s*x:?\s*([\d.]+)\s*,\s*y:?\s*([\d.]+)/g)].map(m => [+m[1], +m[2]]);
const listas = txt => [...txt.matchAll(/\[\s*([\d.]+)\s*,\s*([\d.]+)\s*\]/g)].map(m => [+m[1], +m[2]]);

const estatuas = [...js.matchAll(/'estatua-\d+',\s*([\d.]+),\s*([\d.]+),/g)].map(m => [+m[1], +m[2]]);
const vultos = pares(nums(/criarVultos\(\[[\s\S]*?\]\);/));
const maos = pares(nums(/criarMaos\(\[[\s\S]*?\]\);/)).filter(([x, y]) => y >= 44);
const luzes = listas(nums(/\[\[9\.5,5\.6\][\s\S]*?\]\.forEach/)).filter(([x, y]) => y >= 44 && x <= 34);

const NO_COLOMBARIO = ([x, y]) => y >= 44 && y <= 53 && x >= 3 && x <= 33;
let falhas = 0;
const cobrar = (ok, o) => { if (!ok) { falhas++; console.log('  FALHA: ' + o); } };

console.log('colombário — chão: ' + chao.size + ' tiles');

// 1. a galeria em frente aos nichos, corrida de x7 a x32
for (let x = 7; x <= 32; x++) for (const y of [45, 46]) cobrar(eChao(x, y), `a galeria tem buraco em ${x},${y} — não dá para ler as lápides andando`);

// 2. a escada de oeste NÃO pode desembocar na galeria
cobrar(!eChao(6, 45) && !eChao(6, 46), 'a cela da escada abriu para a galeria: dá para chegar ao Sacristão em linha reta');

// 3. só existe UMA subida do labirinto para a galeria, e ela fica no fundo leste
const subidas = [];
for (let x = 4; x <= 32; x++) if (eChao(x, 47)) subidas.push(x);
cobrar(subidas.join() === '4,5,31,32', 'as passagens de y47 mudaram (' + subidas.join() + '): esperava só a descida da escada (4,5) e a subida do Sacristão (31,32)');

// 4. a travessia até o Sacristão: longa, e passando pelas duas fiadas do labirinto
const dist = (() => {
  const d = new Map([['5,45', 0]]), fila = [[5, 45]];
  while (fila.length) {
    const [x, y] = fila.shift(), n = d.get(x + ',' + y);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = (x + dx) + ',' + (y + dy);
      if (!chao.has(k) || d.has(k)) continue;
      d.set(k, n + 1); fila.push([x + dx, y + dy]);
    }
  }
  return d;
})();
const ateSacristao = dist.get('31,45');
cobrar(ateSacristao != null, 'o Sacristão ficou inalcançável desde a escada');
cobrar(ateSacristao >= 40, `da escada ao Sacristão são só ${ateSacristao} passos — isso não é labirinto`);
console.log('  da escada ao Sacristão: ' + ateSacristao + ' passos (em linha reta seriam 26)');
cobrar(dist.size === chao.size, `${chao.size - dist.size} tiles do colombário ficaram ilhados`);

// 5. cada enfeite no seu lugar
estatuas.filter(NO_COLOMBARIO).forEach(([x, y]) => {
  cobrar(eChao(x, y), `estátua ${x},${y} está dentro de parede`);
  cobrar(!eChao(x, y - 1), `estátua ${x},${y} ficou sem parede nas costas — de pé no meio do corredor`);
});
[['braseiro', luzes], ['vulto', vultos], ['mão', maos]].forEach(([nome, lista]) =>
  lista.filter(NO_COLOMBARIO).forEach(([x, y]) => cobrar(eChao(x, y), `${nome} ${x},${y} está dentro de parede`)));
console.log(`  conferidos: ${estatuas.filter(NO_COLOMBARIO).length} estátuas, ${luzes.filter(NO_COLOMBARIO).length} braseiros, ${vultos.filter(NO_COLOMBARIO).length} vultos, ${maos.filter(NO_COLOMBARIO).length} mãos`);

/* 6. os vultos da galeria: desde 11/08 a sombra sobe entre as lápides também.
      Quem mora dentro de uma janela de zona nunca se ergue — é o que fazia a
      faixa acesa das três velas —, e quem mora perto demais do Sacristão sobe
      no meio da conversa com ele. */
const zona = js.match(/\{x:3, y:44, larg:31[^}]*\}/)[0];
const janela = js.match(/\{x:3, y:44, larg:31[\s\S]{0,200}?janela:\{([^}]*)\}/);
const naGaleria = vultos.filter(([x, y]) => y >= 45 && y <= 46 && x >= 7 && x <= 32);
cobrar(!/janela:/.test(zona) && !janela, 'a zona do colombário voltou a ter janela: onde há fogo o vulto afunda, e a galeria fica sem sombra nenhuma');
cobrar(naGaleria.length >= 3, `só ${naGaleria.length} vulto(s) moram na galeria dos nichos — o pedido foi que eles acessassem o corredor`);
/* a conversa em si está a salvo — abrir diálogo põe `pausado = true` e o mundo
   inteiro congela. O que não pode é uma sombra MORAR em cima do Sacristão: casa
   é para onde o vulto sempre volta, e uma delas ali tornaria impossível chegar
   perto dele na metade escura. Vulto que sobe no labirinto e vem atrás de você
   até as lápides é justamente o que se pediu — esse pode. */
const [SX, SY] = [31.8, 45.7];                                   // onde o Sacristão reza
const acampado = naGaleria.filter(([x, y]) => Math.hypot(x - SX, y - SY) < 7);
cobrar(!acampado.length, `vulto morando em ${acampado.map(p => p.join(',')).join(' / ')}: acampou em cima do Sacristão`);
console.log(`  galeria: ${naGaleria.length} vultos entre as lápides, nenhum com casa em cima do Sacristão`);

// 7. a parede de nichos: 40 vãos, 40 mortos, nenhum nome repetido
const COL = +js.match(/const COL = (\d+), FIA = (\d+)/)[1], FIA = +js.match(/const COL = \d+, FIA = (\d+)/)[1];
const mortos = [...js.match(/const MORTOS = \[[\s\S]*?\n    \];/)[0].matchAll(/\['([^']+)','([^']+)'\]/g)].map(m => m[1] + ' ' + m[2]);
cobrar(COL * FIA === 40, `a parede tem ${COL}x${FIA} = ${COL * FIA} nichos, e o pedido foi 40 (os antigos 10 pela metade)`);
cobrar(mortos.length >= COL * FIA, `${mortos.length} mortos para ${COL * FIA} nichos: algum nome vai se repetir na parede`);
cobrar(new Set(mortos).size === mortos.length, 'a lista de mortos tem nome repetido');
console.log(`  parede de nichos: ${COL}x${FIA} = ${COL * FIA} vãos, ${mortos.length} mortos sem repetição`);

console.log(falhas ? `\nCOLOMBÁRIO COM ${falhas} FALHA(S)` : '\nCOLOMBÁRIO OK');
process.exit(falhas ? 1 : 0);
