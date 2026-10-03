/* テーマ1: リーダーシップ 👑  —  pachinko_garo.html 準拠の777スロット→ねこ登場
   保留ボール→リール回転→777揃い→大フラッシュ→ねこマーライオン登場 */
window.GTS_THEME_FX['theme_5'] = async function () {
  const F = window.FX;
  F.begin('radial-gradient(ellipse at center,#001a1a 0%,#000 72%)');
  F.rays('rgba(0,200,255,.10)', 11000);

  // ===== 保留ボール（上部に4つ） =====
  const holds = F.layer('left:50%;top:8%;transform:translateX(-50%);z-index:9085;display:flex;gap:10px;');
  const balls = [];
  for (let i = 0; i < 4; i++) {
    const b = document.createElement('div');
    b.style.cssText = 'width:min(9vw,36px);height:min(9vw,36px);border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff,#ff4400,#aa0000);box-shadow:0 0 12px #ff4400,0 0 25px #ff0000;border:2px solid rgba(255,68,0,.8);';
    holds.appendChild(b); balls.push(b);
  }

  // 導入: リール回転音
  F.reelSpinSfx(22);
  F.riser(0.1, 1.6, 90, 600);

  await F.sleep(700);

  // ===== 777リール =====
  const reel = F.reels(['3','7','1','5','2','9','7'], { win: '7', accent: '#00e5ff', winColor: '#ffd700', top: '48%' });
  // 停止ごとのフラッシュ＆ドシン
  F.sleep(1900).then(() => { if (!F.aborted()) { F.flash('#00e5ff', 250, 0.6); F.reelStopSfx(); } });
  F.sleep(2400).then(() => { if (!F.aborted()) { F.flash('#00e5ff', 250, 0.6); F.reelStopSfx(); } });
  await reel.spin();

  // ===== 777揃い！ =====
  F.fever(0);            // フィーバー音(あれば)
  F.impact(0, 1.3);
  F.gong(0.05, 0.5);
  F.screenShake(600);
  F.multiFlash(5, 100, 'white');
  F.shockwave(F.W() / 2, F.H() / 2, '#ffd700');
  F.shockwave(F.W() / 2, F.H() / 2, '#00e5ff');
  F.borderGlow('#ffd700', 5500);
  F.vignette('rgba(20,10,0,.6)', 5500);
  F.confetti(100, ['#ffd700', '#00e5ff', '#ffffff']);

  // 保留ボールが金色に変化
  balls.forEach((b, i) => F.sleep(300 + i * 250).then(() => {
    if (F.aborted()) return;
    b.style.background = 'radial-gradient(circle at 35% 35%,#fff,#ffd700,#ff8800)';
    b.style.boxShadow = '0 0 14px #ffd700,0 0 28px #ffaa00';
    b.style.borderColor = 'rgba(255,215,0,.85)';
    F.metal(1500 + i * 150, 0, 0.12);
  }));

  await F.sleep(1100);
  reel.el.remove();

  // 巨大王冠が降臨
  const crown = F.placeArt(F.art.crown(), { size: 'min(50vw,300px)', top: '38%', glow: '#ffd700', float: false });
  crown.style.animation = 'fxZoomIn .6s cubic-bezier(.34,1.56,.64,1) forwards, fxFloat 3s ease-in-out .6s infinite';
  F.metal(1400, 0, .25); F.kick(0, 1.2);
  F.coinShower();

  await F.sleep(900);
  F.banner('テーマクリア<br>おめでとう！', { color: '#ffd700', glow: '#ff4400', size: 'min(11vw,62px)', top: '74%' });
  F.fanfare(0);

  await F.sleep(2400);
  F.confetti(80, ['#ffd700', '#00e5ff', '#ffffff']);
  await F.sleep(1700);
  F.end();
};
