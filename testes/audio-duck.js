#!/usr/bin/env node
/* Valida que o mundo abaixa o volume quando alguém fala — inclusive no iPad.

   No Safari móvel (iPhone/iPad) `audio.volume` é só-leitura: escrever nele não
   dá erro, simplesmente não faz nada. O jogo então precisa mandar o clipe pelo
   Web Audio e mexer num GainNode. O teste roda o mesmo código em dois
   navegadores simulados — um com volume gravável, outro sem — e confere que o
   som que chega ao alto-falante é o mesmo nos dois.

   Uso:  node testes/audio-duck.js        (sai 1 se algo falhar)  */

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'castelo.html'), 'utf8');
const js = html.match(/<script>([\s\S]*)<\/script>/)[1];
const pega = re => { const m = js.match(re); if (!m) throw new Error('não achei: ' + re); return m[0]; };

const src = [
  pega(/let volumeNativoOk = null;[\s\S]*?\nfunction volumeAtual\(a\)\{.*?\}/),
  pega(/const sfxPool = \{\};[\s\S]*?\nfunction pegarSfx\(url\)\{[\s\S]*?\n\}/),
  pega(/const sfxVivos = \[\];/),
  pega(/const SFX_DUCK = [\d.]+;/),
  pega(/function tocarSfx\(url, vol, reserva\)\{[\s\S]*?\n\}/),
  pega(/function atualizarDuckSfx\(\)\{[\s\S]*?\n\}/),
].join('\n');

function rodar(nome, volumeGravavel) {
  const tocados = [];
  class FakeAudio {
    constructor(url) { this.url = url; this._v = 1; this.paused = true; this.ended = false; this.currentTime = 0; this.ouvintes = {}; }
    get volume() { return this._v; }
    set volume(v) { if (volumeGravavel) this._v = v; }    // no iPad, escrever aqui não faz nada
    addEventListener(ev, fn) { (this.ouvintes[ev] = this.ouvintes[ev] || []).push(fn); }
    play() { this.paused = false; tocados.push(this); return Promise.resolve(); }
  }
  // Web Audio mínimo: só o bastante para o roteamento e o ganho
  const ac = {
    state: 'running',
    destination: { tag: 'destino' },
    createGain: () => ({ gain: { value: 1 }, connect(d) { this.destino = d; } }),
    createMediaElementSource: el => ({ el, connect(d) { this.destino = d; } }),
    resume() {},
  };
  const ctx = { Audio: FakeAudio, ac, mp3Bus: null, masterGain: {}, iniAudio: () => true, dialogo: null, Math, console };
  new Function('ctx', `with(ctx){ ${src}
    ctx.tocarSfx = tocarSfx; ctx.atualizarDuckSfx = atualizarDuckSfx;
    ctx.SFX_DUCK = SFX_DUCK; ctx.falar = d => { dialogo = d; };
  }`)(ctx);
  ctx.mp3Bus = ctx.ac.createGain();

  const ouvido = a => a.__ganho ? a.__ganho.gain.value : a.volume;   // o que chega ao alto-falante
  const ultimo = () => tocados[tocados.length - 1];
  const casos = [];

  ctx.tocarSfx('grito.mp3', .9);                 // grito longo começa fora de diálogo
  const grito = ultimo();
  casos.push(['sem fala', ouvido(grito), .9]);

  ctx.falar({});                                 // a legenda abre com o grito ainda no ar
  ctx.atualizarDuckSfx();
  casos.push(['na fala, efeito já em curso', ouvido(grito), .9 * ctx.SFX_DUCK]);

  ctx.tocarSfx('clash.mp3', .9);                 // efeito que nasce durante a fala
  casos.push(['na fala, efeito novo', ouvido(ultimo()), .9 * ctx.SFX_DUCK]);

  ctx.falar(null);                               // fechou a fala: o mundo volta
  ctx.atualizarDuckSfx();
  casos.push(['depois da fala', ouvido(grito), .9]);

  let ok = true;
  console.log('\n== ' + nome + ' ==');
  casos.forEach(([o, teve, esperado]) => {
    const bom = Math.abs(teve - esperado) < .001;
    ok = ok && bom;
    console.log(`  ${bom ? 'ok   ' : 'FALHA'} ${o}: ouvido=${teve.toFixed(3)} esperado=${esperado.toFixed(3)}`);
  });
  return ok;
}

const tudoOk = [
  rodar('navegador com volume gravável', true),
  rodar('iPad — volume só-leitura', false),
].every(Boolean);

console.log('\n' + (tudoOk ? 'ok: o ducking funciona nos dois' : 'FALHOU'));
process.exit(tudoOk ? 0 : 1);
