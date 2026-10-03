/* =====================================================================
   GTS2026 演出エンジン  (window.FX)
   パチンコ/パチスロ風の脳汁演出を構成するための共通部品集。
   各テーマ演出ファイル(theme0.js〜theme7.js)はこのFXだけに依存する。
   ===================================================================== */
(function () {
  const FX = {};

  /* ============ Audio ============ */
  let actx = null, comp = null, master = null;
  FX.ctx = function () {
    if (!actx) {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      comp = actx.createDynamicsCompressor();
      comp.threshold.value = -16; comp.knee.value = 18; comp.ratio.value = 10;
      comp.attack.value = 0.002; comp.release.value = 0.18;
      master = actx.createGain(); master.gain.value = 1;
      comp.connect(master); master.connect(actx.destination);
      FX.loadSamples(); // sfx/*.mp3 があれば読み込む
    }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  };
  FX.out = function () { FX.ctx(); return comp; };

  /* ---- 実音源(sfx/*.mp3)があれば使う。無ければ合成音にフォールバック ---- */
  FX._buffers = {};
  let samplesTried = false;
  FX.loadSamples = function () {
    if (samplesTried) return; samplesTried = true;
    ['spin', 'win', 'coin', 'impact', 'fever', 'reelstop'].forEach(name => {
      fetch('/sfx/' + name + '.mp3')
        .then(r => r.ok ? r.arrayBuffer() : Promise.reject())
        .then(buf => actx.decodeAudioData(buf))
        .then(decoded => { FX._buffers[name] = decoded; })
        .catch(() => {/* 無ければ合成音のまま */});
    });
  };
  FX.hasSample = (name) => !!FX._buffers[name];
  FX.playSample = function (name, vol = 1, delay = 0) {
    const b = FX._buffers[name];
    if (!b) return false;
    const c = FX.ctx(), s = c.createBufferSource(), g = c.createGain();
    s.buffer = b; g.gain.value = vol; s.connect(g); g.connect(FX.out());
    s.start(c.currentTime + delay);
    return true;
  };

  FX.tone = function (freq, type, dur, vol, delay = 0) {
    const c = FX.ctx(), o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(FX.out());
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, c.currentTime + delay);
    g.gain.linearRampToValueAtTime(vol, c.currentTime + delay + 0.008);
    g.gain.linearRampToValueAtTime(0, c.currentTime + delay + dur);
    o.start(c.currentTime + delay); o.stop(c.currentTime + delay + dur);
  };

  FX.noise = function (dur, vol, delay = 0, freq = 800, q = 0.5, type = 'bandpass') {
    const c = FX.ctx();
    const buf = c.createBuffer(1, Math.max(1, c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain();
    src.connect(f); f.connect(g); g.connect(FX.out());
    g.gain.setValueAtTime(vol, c.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + delay + dur);
    src.start(c.currentTime + delay);
  };

  FX.kick = function (delay = 0, vol = 1.4) {
    const c = FX.ctx(), o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(FX.out());
    o.frequency.setValueAtTime(220, c.currentTime + delay);
    o.frequency.exponentialRampToValueAtTime(32, c.currentTime + delay + 0.14);
    g.gain.setValueAtTime(vol, c.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + 0.5);
    o.start(c.currentTime + delay); o.stop(c.currentTime + delay + 0.5);
  };
  FX.snare = function (delay = 0, vol = 0.8) { FX.noise(0.22, vol, delay, 1800, 0.4); };
  FX.hat   = function (delay = 0, vol = 0.4) { FX.noise(0.05, vol, delay, 9000, 1, 'highpass'); };

  FX.metal = function (freq, delay = 0, vol = 0.18) {
    [1, 2.756, 4.103].forEach(r => {
      const c = FX.ctx(), o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.value = freq * r;
      o.connect(g); g.connect(FX.out());
      g.gain.setValueAtTime(vol, c.currentTime + delay);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + 0.4);
      o.start(c.currentTime + delay); o.stop(c.currentTime + delay + 0.4);
    });
  };

  FX.brass = function (root, delay = 0, dur = 0.7, vol = 0.18) {
    [1, 1.26, 1.5, 2].forEach(r => [-10, 0, 10].forEach(det => {
      const c = FX.ctx(), o = c.createOscillator(), g = c.createGain();
      o.type = 'sawtooth'; o.frequency.value = root * r; o.detune.value = det;
      o.connect(g); g.connect(FX.out());
      g.gain.setValueAtTime(0, c.currentTime + delay);
      g.gain.linearRampToValueAtTime(vol, c.currentTime + delay + 0.025);
      g.gain.linearRampToValueAtTime(0, c.currentTime + delay + dur);
      o.start(c.currentTime + delay); o.stop(c.currentTime + delay + dur);
    }));
  };

  // 琴/三味線風の弦はじき（アジアらしさ）
  FX.pluck = function (freq, delay = 0, vol = 0.3) {
    const c = FX.ctx(), o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain();
    o.type = 'triangle'; o2.type = 'triangle';
    o.frequency.value = freq; o2.frequency.value = freq * 2.01; o2.detune.value = 6;
    o.connect(g); o2.connect(g); g.connect(FX.out());
    g.gain.setValueAtTime(vol, c.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + 0.6);
    o.start(c.currentTime + delay); o.stop(c.currentTime + delay + 0.6);
    o2.start(c.currentTime + delay); o2.stop(c.currentTime + delay + 0.6);
  };

  // 銅鑼（ゴング）— アジアの大当たり感
  FX.gong = function (delay = 0, vol = 0.5) {
    const c = FX.ctx();
    [1, 1.48, 2.09, 2.96, 3.71].forEach((r, i) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.value = 90 * r;
      o.connect(g); g.connect(FX.out());
      g.gain.setValueAtTime(vol * (1 - i * 0.15), c.currentTime + delay);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + 2.2 - i * 0.2);
      o.start(c.currentTime + delay); o.stop(c.currentTime + delay + 2.4);
    });
    FX.noise(0.4, vol * 0.5, delay, 400, 0.3);
  };

  FX.chord = function (freqs, delay = 0, dur = 0.6, vol = 0.12, type = 'sawtooth') {
    freqs.forEach(f => FX.tone(f, type, dur, vol, delay));
  };

  FX.riser = function (delay = 0, dur = 1.5, fromF = 80, toF = 800, vol = 0.22) {
    const c = FX.ctx(), o = c.createOscillator(), g = c.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(fromF, c.currentTime + delay);
    o.frequency.exponentialRampToValueAtTime(toF, c.currentTime + delay + dur);
    o.connect(g); g.connect(FX.out());
    g.gain.setValueAtTime(0, c.currentTime + delay);
    g.gain.linearRampToValueAtTime(vol, c.currentTime + delay + dur * 0.9);
    g.gain.linearRampToValueAtTime(0, c.currentTime + delay + dur);
    o.start(c.currentTime + delay); o.stop(c.currentTime + delay + dur);
    // ホワイトノイズのスウェル
    FX.noise(dur, vol * 0.6, delay, 1200, 0.4, 'highpass');
  };

  FX.impact = function (delay = 0, vol = 1.0) {
    if (FX.playSample('impact', vol, delay)) { FX.kick(delay, 1.2 * vol); return; } // 実音源＋サブのみ
    FX.kick(delay, 1.8 * vol);
    const c = FX.ctx(), o = c.createOscillator(), g = c.createGain();
    o.type = 'triangle'; o.frequency.value = 48;
    o.connect(g); g.connect(FX.out());
    g.gain.setValueAtTime(0.5 * vol, c.currentTime + delay);
    g.gain.linearRampToValueAtTime(0, c.currentTime + delay + 1.0);
    o.start(c.currentTime + delay); o.stop(c.currentTime + delay + 1.0);
    FX.noise(0.35, 0.9 * vol, delay, 300, 0.4, 'lowpass');
  };

  FX.reelSpinSfx = function (count = 20, step = 0.06) {
    if (FX.playSample('spin', 0.9)) return;
    for (let i = 0; i < count; i++) FX.noise(0.05, 0.14, i * step, 600 + i * 25, 1);
  };
  FX.reelStopSfx = function (delay = 0) {
    if (FX.playSample('reelstop', 0.9, delay)) return;
    FX.kick(delay, 0.9); FX.metal(1200, delay, 0.15);
  };

  // 上昇ファンファーレ（脳汁メロディ）
  FX.fanfare = function (delay = 0) {
    if (FX.playSample('win', 1.0, delay)) return;
    const mel = [[392,.18],[523,.18],[659,.22],[784,.28],[988,.18],[1047,.5],[988,.12],[1047,.12],[1319,.7]];
    let t = delay;
    mel.forEach(([f, d]) => { FX.brass(f, t, d * 0.9, 0.22); FX.tone(f, 'square', d * 0.7, 0.08, t); t += d * 0.8; });
    [0,.2,.4,.5,.6,.7,.8,.9].forEach((tt, i) => { FX.kick(delay + tt, 1.0 + i * 0.04); if (i % 2) FX.snare(delay + tt + .1, .7); });
  };
  // フィーバー/ジャックポット専用（あれば実音源）
  FX.fever = function (delay = 0) {
    if (FX.playSample('fever', 1.0, delay)) return true;
    return false;
  };

  /* ============ DOM オーバーレイ ============ */
  let root = null, canvas = null, pctx = null, hint = null;
  let particles = [], running = false, aborted = false;

  function ensureRoot() {
    if (root) return root;
    root = document.createElement('div');
    root.id = 'fxRoot';
    root.style.cssText = 'position:fixed;inset:0;z-index:9000;display:none;overflow:hidden;font-family:"Mochiy Pop One","Noto Sans JP",sans-serif;';
    canvas = document.createElement('canvas');
    canvas.id = 'fxCanvas';
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:9050;';
    root.appendChild(canvas);
    pctx = canvas.getContext('2d');
    hint = document.createElement('div');
    hint.textContent = 'タップでスキップ';
    hint.style.cssText = 'position:absolute;bottom:24px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,.6);font-size:12px;z-index:9100;letter-spacing:1px;';
    root.appendChild(hint);
    document.body.appendChild(root);
    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resize(); window.addEventListener('resize', resize);
    root.addEventListener('click', () => { FX.skip(); });
    return root;
  }

  FX.W = () => window.innerWidth;
  FX.H = () => window.innerHeight;
  FX.sleep = (ms) => new Promise(res => {
    const id = setTimeout(res, ms);
    FX._timers.push(id);
  });
  FX._timers = [];

  FX.begin = function (bg) {
    ensureRoot();
    aborted = false;
    FX._timers = [];
    root.style.display = 'block';
    root.style.background = bg || 'radial-gradient(ellipse at center,#0a0a18 0%,#000 75%)';
    root.querySelectorAll('.fx-layer').forEach(e => e.remove());
    if (master) { master.gain.cancelScheduledValues(FX.ctx().currentTime); master.gain.value = 1; }
  };

  FX.end = function () {
    if (!root) return;
    root.style.display = 'none';
    root.querySelectorAll('.fx-layer').forEach(e => e.remove());
    particles = [];
    if (pctx) pctx.clearRect(0, 0, canvas.width, canvas.height);
    // canvas-confetti が body 直下に残す紙吹雪を消す
    if (typeof window.confetti === 'function' && window.confetti.reset) window.confetti.reset();
  };

  FX.skip = function () {
    aborted = true;
    FX._timers.forEach(id => clearTimeout(id));
    FX._timers = [];
    if (master) {
      const c = FX.ctx();
      master.gain.cancelScheduledValues(c.currentTime);
      master.gain.setValueAtTime(master.gain.value, c.currentTime);
      master.gain.linearRampToValueAtTime(0, c.currentTime + 0.15);
    }
    setTimeout(FX.end, 200);
  };
  FX.aborted = () => aborted;

  // レイヤー要素を作るヘルパ
  FX.layer = function (css) {
    ensureRoot();
    const el = document.createElement('div');
    el.className = 'fx-layer';
    el.style.cssText = 'position:absolute;' + (css || '');
    root.appendChild(el);
    return el;
  };

  /* ============ パーティクル ============ */
  // canvas上の絵文字は端末ネイティブ font になるため、Noto Emoji の SVG を
  // 画像として読み込み drawImage で描画する（著作権配慮・全端末同一表示）。
  const _emojiImgCache = {};
  function emojiToFile(e) {
    const cps = [];
    for (const ch of e) { const c = ch.codePointAt(0); if (c !== 0xFE0F) cps.push(c.toString(16)); }
    return cps.join('_');
  }
  function getEmojiImg(e) {
    if (_emojiImgCache[e]) return _emojiImgCache[e];
    const img = new Image();
    img.src = '/emoji/' + emojiToFile(e) + '.svg';
    _emojiImgCache[e] = img;
    return img;
  }

  function loop() {
    running = particles.length > 0 && !aborted;
    if (!running) { pctx.clearRect(0, 0, canvas.width, canvas.height); return; }
    requestAnimationFrame(loop);
    pctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter(p => p.life > 0);
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy; p.vy += p.g; p.life -= p.decay;
      p.rot = (p.rot || 0) + (p.vr || 0);
      pctx.globalAlpha = Math.max(0, p.life);
      if (p.emoji) {
        const im = getEmojiImg(p.emoji);
        if (im.complete && im.naturalWidth) {
          pctx.save(); pctx.translate(p.x, p.y); pctx.rotate(p.rot);
          pctx.drawImage(im, -p.size / 2, -p.size / 2, p.size, p.size);
          pctx.restore();
        }
        // 未ロード時は描画しない（ネイティブ絵文字を出さない）
      } else {
        pctx.fillStyle = p.color; pctx.shadowColor = p.color; pctx.shadowBlur = 10;
        pctx.beginPath(); pctx.arc(p.x, p.y, Math.max(0.5, p.size * p.life), 0, Math.PI * 2); pctx.fill();
      }
    }
    pctx.globalAlpha = 1; pctx.shadowBlur = 0;
  }
  function pushP(p) { particles.push(p); if (!running) { running = true; requestAnimationFrame(loop); } }

  FX.burst = function (x, y, count, color, speed = 3) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, s = (1 + Math.random() * 3) * speed;
      pushP({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - speed, g: 0.12, life: 1, decay: 0.012 + Math.random() * 0.02, size: 3 + Math.random() * 5, color });
    }
  };

  // canvas-confetti があれば本物のクラッカーを使う
  const hasConfetti = () => typeof window.confetti === 'function';
  FX.confetti = function (count, colors) {
    colors = colors || ['#ff4d4d', '#ffd700', '#4dd2ff', '#4dff88', '#ff7ad9', '#fff'];
    if (hasConfetti()) {
      // 左右の砲台から大量発射
      window.confetti({ particleCount: Math.round(count * 0.6), spread: 70, startVelocity: 55, origin: { x: 0.1, y: 0.9 }, angle: 60, colors, zIndex: 9200, scalar: 1.1 });
      window.confetti({ particleCount: Math.round(count * 0.6), spread: 70, startVelocity: 55, origin: { x: 0.9, y: 0.9 }, angle: 120, colors, zIndex: 9200, scalar: 1.1 });
      window.confetti({ particleCount: Math.round(count * 0.5), spread: 100, startVelocity: 45, origin: { x: 0.5, y: 0.4 }, colors, zIndex: 9200, scalar: 1.2 });
      return;
    }
    for (let i = 0; i < count; i++) {
      pushP({
        x: Math.random() * FX.W(), y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 3, g: 0.03,
        life: 1, decay: 0.004 + Math.random() * 0.004, size: 6 + Math.random() * 7,
        color: colors[i % colors.length], rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3
      });
    }
  };

  // 金貨シャワー（紙吹雪を金色＋円形で）
  FX.coinShower = function (count = 120) {
    FX.playSample('coin', 0.8); // コイン音(あれば)
    if (hasConfetti()) {
      const gold = ['#ffd700', '#ffcf3a', '#fff6c0', '#ffaa00', '#e8a200'];
      const fire = () => {
        window.confetti({ particleCount: 14, spread: 55, startVelocity: 40, origin: { x: 0.5, y: 1.05 }, angle: 90, colors: gold, zIndex: 9200, shapes: ['circle'], scalar: 1.3, gravity: 1.1 });
      };
      let n = 0; const iv = setInterval(() => { if (aborted || ++n > 12) return clearInterval(iv); fire(); }, 130);
      return;
    }
    FX.confetti(count, ['#ffd700', '#ffcf3a', '#fff6c0']);
  };

  FX.rain = function (emoji, count, spread = 1) {
    for (let i = 0; i < count; i++) {
      pushP({
        x: Math.random() * FX.W(), y: -30 - Math.random() * 300,
        vx: (Math.random() - 0.5) * 2 * spread, vy: 2 + Math.random() * 4, g: 0.02,
        life: 1, decay: 0.003 + Math.random() * 0.003, size: 22 + Math.random() * 18,
        emoji, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.1
      });
    }
  };

  FX.fountain = function (x, y, count, color, up = 14) {
    for (let i = 0; i < count; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 0.7;
      const s = up * (0.5 + Math.random() * 0.6);
      pushP({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 0.4, life: 1, decay: 0.012, size: 3 + Math.random() * 4, color });
    }
  };

  /* ============ フラッシュ / グロー / 衝撃波 ============ */
  FX.flash = function (color = 'white', dur = 160, opacity = 0.85) {
    const el = FX.layer(`inset:0;background:${color};opacity:${opacity};z-index:9080;pointer-events:none;transition:opacity ${dur}ms;`);
    requestAnimationFrame(() => { el.style.opacity = '0'; });
    setTimeout(() => el.remove(), dur + 50);
  };
  FX.multiFlash = function (times, interval, color) {
    for (let i = 0; i < times; i++) FX.sleep(i * interval).then(() => { if (!aborted) FX.flash(color, interval * 0.8, 0.85); });
  };
  FX.borderGlow = function (color = '#00e5ff', ms = 1500) {
    const el = FX.layer(`inset:0;z-index:9060;pointer-events:none;box-shadow:inset 0 0 80px ${color}, inset 0 0 160px ${color}77;opacity:0;transition:opacity .3s;`);
    requestAnimationFrame(() => el.style.opacity = '1');
    FX.sleep(ms).then(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 350); });
  };
  FX.shockwave = function (x, y, color = '#fff') {
    x = x ?? FX.W() / 2; y = y ?? FX.H() / 2;
    const el = FX.layer(`left:${x}px;top:${y}px;width:20px;height:20px;border-radius:50%;border:5px solid ${color};transform:translate(-50%,-50%) scale(0);opacity:.9;z-index:9070;pointer-events:none;transition:transform .6s cubic-bezier(.2,.8,.3,1),opacity .6s;`);
    requestAnimationFrame(() => { el.style.transform = 'translate(-50%,-50%) scale(18)'; el.style.opacity = '0'; });
    setTimeout(() => el.remove(), 650);
  };

  // 回転する放射光（背景）
  FX.rays = function (color = 'rgba(255,220,120,.12)', ms = 4000) {
    const el = FX.layer(`inset:0;z-index:9040;pointer-events:none;background:repeating-conic-gradient(from 0deg at 50% 50%, ${color} 0deg 8deg, transparent 8deg 16deg);opacity:0;transition:opacity .5s;animation:fxSpin 12s linear infinite;`);
    ensureKeyframes();
    requestAnimationFrame(() => el.style.opacity = '1');
    FX.sleep(ms).then(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 550); });
  };

  let kfDone = false;
  function ensureKeyframes() {
    if (kfDone) return; kfDone = true;
    const s = document.createElement('style');
    s.textContent = `
      @keyframes fxSpin { to { transform: rotate(360deg); } }
      @keyframes fxZoomIn { 0%{transform:translate(-50%,-50%) scale(0) rotate(-8deg);opacity:0} 60%{transform:translate(-50%,-50%) scale(1.18) rotate(3deg);opacity:1} 100%{transform:translate(-50%,-50%) scale(1) rotate(0);opacity:1} }
      @keyframes fxPulse { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-50%,-50%) scale(1.06)} }
      @keyframes fxFloat { 0%,100%{transform:translate(-50%,-50%) scale(1) rotate(-2deg)} 50%{transform:translate(-50%,calc(-50% - 18px)) scale(1.04) rotate(2deg)} }
      @keyframes fxShake { 0%,100%{transform:translate(-50%,-50%)} 25%{transform:translate(calc(-50% - 6px),-50%)} 75%{transform:translate(calc(-50% + 6px),-50%)} }
      @keyframes fxSlideUp { from{transform:translate(-50%,40px);opacity:0} to{transform:translate(-50%,0);opacity:1} }
      @keyframes fxScreenShake { 0%,100%{transform:translate(0,0)} 10%{transform:translate(-8px,4px)} 30%{transform:translate(7px,-6px)} 50%{transform:translate(-6px,7px)} 70%{transform:translate(6px,4px)} 90%{transform:translate(-4px,-3px)} }
      @keyframes fxSweep { 0%{transform:translate(-120%,0) skewX(-20deg)} 100%{transform:translate(220%,0) skewX(-20deg)} }
      @keyframes fxTextPop { 0%{transform:translate(-50%,-50%) scale(.3);opacity:0;filter:blur(8px)} 55%{transform:translate(-50%,-50%) scale(1.25);opacity:1;filter:blur(0)} 100%{transform:translate(-50%,-50%) scale(1);opacity:1} }
      @keyframes fxTextPopC { 0%{transform:scale(.3);opacity:0;filter:blur(8px)} 55%{transform:scale(1.25);opacity:1;filter:blur(0)} 100%{transform:scale(1);opacity:1} }
      @keyframes fxPulseC { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
    `;
    document.head.appendChild(s);
  }

  // 画面全体を揺らす（脳汁の鉄板）
  FX.screenShake = function (ms = 500) {
    const el = root || document.body;
    el.style.animation = `fxScreenShake ${Math.min(ms, 600)}ms cubic-bezier(.36,.07,.19,.97)`;
    setTimeout(() => { el.style.animation = ''; }, ms + 30);
  };

  // 光のスイープ（カードや画面を横切る光）
  FX.lightSweep = function (ms = 800) {
    const el = FX.layer('inset:0;z-index:9075;pointer-events:none;overflow:hidden;');
    const bar = document.createElement('div');
    bar.style.cssText = `position:absolute;top:-20%;left:0;width:35%;height:140%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent);animation:fxSweep ${ms}ms ease-out forwards;`;
    el.appendChild(bar);
    setTimeout(() => el.remove(), ms + 100);
  };

  // ビネット（周辺減光で中央を引き立てる）
  FX.vignette = function (color = 'rgba(0,0,0,.55)', ms = 4000) {
    const el = FX.layer(`inset:0;z-index:9043;pointer-events:none;background:radial-gradient(ellipse at center, transparent 35%, ${color} 100%);opacity:0;transition:opacity .5s;`);
    requestAnimationFrame(() => el.style.opacity = '1');
    FX.sleep(ms).then(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 550); });
  };

  /* ============ バナーテキスト ============ */
  // 大きく光る中央テキスト。anim: 'zoom'|'slide'|'shake'
  FX.banner = function (text, opts = {}) {
    ensureKeyframes();
    const color = opts.color || '#ffd700';
    const glow = opts.glow || '#ff8800';
    const size = opts.size || 'min(13vw,86px)';
    const top = opts.top || '50%';
    const anim = opts.anim || 'zoom';
    const sub = opts.sub || '';
    const font = opts.font || "'Reggae One','Mochiy Pop One',sans-serif";
    // 極太の黒フチ（パチンコ文字の定番）
    const stroke = '-3px -3px 0 #1a1a1a,3px -3px 0 #1a1a1a,-3px 3px 0 #1a1a1a,3px 3px 0 #1a1a1a,0 5px 0 rgba(0,0,0,.6)';
    const el = FX.layer(`left:50%;top:${top};transform:translate(-50%,-50%);z-index:9085;width:94vw;text-align:center;pointer-events:none;`);
    el.innerHTML = `<div style="display:inline-block;font-family:${font};font-size:${size};color:${color};letter-spacing:1px;line-height:1.1;
        text-shadow:${stroke},0 0 18px ${glow},0 0 38px ${glow},0 0 70px ${glow};white-space:normal;word-break:keep-all;
        -webkit-text-stroke:1px rgba(0,0,0,.3);">${text}</div>
      ${sub ? `<div style="font-family:'RocknRoll One',sans-serif;font-size:min(5.5vw,26px);color:#fff;margin-top:10px;text-shadow:-2px -2px 0 #1a1a1a,2px -2px 0 #1a1a1a,-2px 2px 0 #1a1a1a,2px 2px 0 #1a1a1a,0 0 14px ${glow};letter-spacing:3px;">${sub}</div>` : ''}`;
    const inner = el.firstElementChild;
    if (anim === 'zoom') inner.style.animation = 'fxTextPopC .55s cubic-bezier(.34,1.56,.64,1) forwards, fxPulseC 1.4s ease-in-out .55s infinite';
    else if (anim === 'shake') inner.style.animation = 'fxTextPopC .45s forwards';
    else if (anim === 'slide') { el.style.animation = 'fxSlideUp .4s ease forwards'; }
    FX.lightSweep(700);
    return el;
  };

  // 確率表示 "1/420000" 風
  FX.probText = function (text, opts = {}) {
    return FX.banner(text, Object.assign({ color: '#fff', glow: '#00e5ff', size: 'min(15vw,100px)', top: '34%', anim: 'shake' }, opts));
  };

  /* ============ リール ============ */
  // symbols: 表示する記号配列。最後の要素が「当たり目」になるよう自動調整。
  FX.reels = function (symbols, opts = {}) {
    ensureKeyframes();
    const n = opts.count || 3;
    const winSym = opts.win != null ? opts.win : symbols[symbols.length - 1];
    const colW = opts.colW || 'min(26vw,120px)';
    const cellH = opts.cellH || 'min(13vw,58px)';
    const accent = opts.accent || '#00e5ff';
    const winColor = opts.winColor || '#ffd700';
    const wrap = FX.layer(`left:50%;top:${opts.top || '50%'};transform:translate(-50%,-50%);z-index:9085;display:flex;gap:8px;`);
    const strips = [];
    // 各列の数列：ランダム+末尾に winSym
    for (let i = 0; i < n; i++) {
      const col = document.createElement('div');
      col.style.cssText = `width:${colW};height:calc(${cellH}*3);border:2px solid ${accent}66;border-radius:8px;background:rgba(0,8,16,.85);overflow:hidden;position:relative;box-shadow:0 0 14px ${accent}55,inset 0 0 18px rgba(0,0,0,.8);`;
      const strip = document.createElement('div');
      strip.style.cssText = 'position:absolute;top:0;left:0;width:100%;display:flex;flex-direction:column;align-items:center;';
      const seq = [];
      for (let k = 0; k < 9; k++) seq.push(symbols[Math.floor(Math.random() * symbols.length)]);
      seq.push(winSym); // index 9
      seq.forEach(sym => {
        const cell = document.createElement('div');
        const isWin = sym === winSym;
        cell.style.cssText = `width:100%;height:${cellH};display:flex;align-items:center;justify-content:center;font-size:calc(${cellH}*0.62);font-weight:900;color:${isWin ? winColor : accent};text-shadow:0 0 8px ${isWin ? winColor : accent};`;
        cell.textContent = sym;
        strip.appendChild(cell);
      });
      // 中央ライン
      const line = document.createElement('div');
      line.style.cssText = `position:absolute;top:50%;left:0;width:100%;height:2px;background:linear-gradient(90deg,transparent,${accent},transparent);transform:translateY(-50%);`;
      col.appendChild(strip); col.appendChild(line); wrap.appendChild(col);
      strips.push(strip);
    }
    function spinCol(strip, dur, delay) {
      return new Promise(res => {
        const id = setTimeout(() => {
          if (aborted) return res();
          const cellPx = strip.firstElementChild.offsetHeight || 54;
          let elapsed = 0, speed = 6, pos = 0;
          const slowAt = dur * 0.62;
          const timer = setInterval(() => {
            if (aborted) { clearInterval(timer); return res(); }
            elapsed += 16;
            if (elapsed > slowAt) speed = Math.max(0.6, speed * 0.94);
            pos += speed;
            const total = cellPx * 10;
            if (pos >= total) pos -= total;
            strip.style.top = `-${pos}px`;
            if (elapsed >= dur) {
              clearInterval(timer);
              const target = cellPx * 8; // index9(win)を中央段に
              strip.style.transition = 'top .18s cubic-bezier(.25,1.5,.5,1)';
              strip.style.top = `-${target}px`;
              setTimeout(() => { strip.style.transition = ''; res(); }, 220);
            }
          }, 16);
        }, delay);
        FX._timers.push(id);
      });
    }
    return {
      el: wrap,
      spin: function () {
        FX.reelSpinSfx(22);
        return Promise.all(strips.map((s, i) => spinCol(s, 1700 + i * 480, i * 220)));
      }
    };
  };

  /* ============ 花火 ============ */
  FX.firework = function (x, y, color) {
    if (hasConfetti()) {
      const ox = (x ?? FX.W() / 2) / FX.W(), oy = (y ?? FX.H() / 2) / FX.H();
      window.confetti({ particleCount: 90, spread: 360, startVelocity: 32, ticks: 90, gravity: 0.9, decay: 0.92, origin: { x: ox, y: oy }, colors: color ? [color, '#fff'] : undefined, zIndex: 9200, scalar: 1.1 });
    } else {
      FX.burst(x, y, 36, color, 4);
    }
    FX.tone(1200 + Math.random() * 600, 'sine', 0.25, 0.05, 0);   // ヒュー
    FX.noise(0.18, 0.18, 0.0, 2500, 0.6, 'highpass');             // パァン
    FX.kick(0, 0.4);
  };
  FX.fireworksShow = function (ms = 3000) {
    const start = Date.now();
    const colors = ['#ff4d4d', '#ffd700', '#4dd2ff', '#4dff88', '#ff7ad9', '#fff'];
    (function shoot() {
      if (aborted || Date.now() - start > ms) return;
      FX.firework(FX.W() * (0.15 + Math.random() * 0.7), FX.H() * (0.12 + Math.random() * 0.4), colors[Math.floor(Math.random() * colors.length)]);
      const id = setTimeout(shoot, 230 + Math.random() * 280);
      FX._timers.push(id);
    })();
  };

  /* ============ 便利: PUSHボタン点滅 ============ */
  FX.pushButton = function (ms = 1200) {
    ensureKeyframes();
    const el = FX.layer(`left:50%;top:62%;transform:translate(-50%,-50%);z-index:9088;text-align:center;pointer-events:none;`);
    el.innerHTML = `<div style="width:min(34vw,150px);height:min(34vw,150px);border-radius:50%;
      background:radial-gradient(circle at 40% 35%,#fff,#ffcf3a 45%,#e07b00);border:5px solid #fff;
      box-shadow:0 0 30px #ffcf3a,0 0 60px #ff8800;display:flex;align-items:center;justify-content:center;
      font-size:min(8vw,34px);font-weight:900;color:#7a3b00;animation:fxPulse .4s ease-in-out infinite;">PUSH</div>`;
    FX.sleep(ms).then(() => { el.style.transition = 'opacity .2s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 250); });
    return FX.sleep(ms);
  };

  /* ============ 中央に大きくアートを出す ============ */
  // html: SVG文字列 or <img>。zoom-inで登場し、グロー付き。
  FX.placeArt = function (html, opts = {}) {
    ensureKeyframes();
    const size = opts.size || 'min(60vw,360px)';
    const top = opts.top || '46%';
    const glow = opts.glow || '#36c6ff';
    const float = opts.float !== false;
    const el = FX.layer(`left:50%;top:${top};transform:translate(-50%,-50%) scale(0);z-index:9086;width:${size};height:${size};pointer-events:none;filter:drop-shadow(0 0 24px ${glow}) drop-shadow(0 0 50px ${glow}aa);`);
    el.innerHTML = html;
    el.style.animation = `fxZoomIn .6s cubic-bezier(.34,1.56,.64,1) forwards${float ? ', fxFloat 3s ease-in-out .6s infinite' : ''}`;
    return el;
  };

  /* ============ アート集（Google Noto Emoji / OFL・Apache-2.0） ============ */
  // 著作権配慮のため、独自イラストではなく Noto Emoji の SVG を使用する。
  FX.art = {
    // マーライオン代替（ライオン 🦁）
    merlion: function () {
      return `<img src="/emoji/1f981.svg" alt="🦁" style="width:100%;height:100%;object-fit:contain;display:block">`;
    },
    // 王冠 👑
    crown: function () {
      return `<img src="/emoji/1f451.svg" alt="👑" style="width:100%;height:100%;object-fit:contain;display:block">`;
    }
  };

  window.FX = FX;
  window.GTS_THEME_FX = window.GTS_THEME_FX || {};
})();
