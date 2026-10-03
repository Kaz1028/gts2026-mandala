/* テーマ5: ビジネス交流 💼  —  JACKPOT DEAL（金貨の雨＋$リール＋ジャックポット） */
window.GTS_THEME_FX['theme_3'] = async function () {
  const F = window.FX;
  F.begin('radial-gradient(ellipse at center,#1a1405 0%,#0a0800 80%)');
  F.rays('rgba(255,215,0,.16)', 9000);

  // 導入: コインのチャリンチャリン + 金貨の雨
  for (let i = 0; i < 8; i++) F.sleep(i * 70).then(() => F.metal(1600 + Math.random() * 600, 0, 0.12));
  F.rain('🪙', 8, 1.4); F.rain('💰', 4, 1);
  F.riser(0.1, 1.6, 100, 720);

  await F.sleep(950);

  // $リール
  const reel = F.reels(['$','7','💎','$','💰','$'], { win:'$', accent:'#ffd700', winColor:'#fff6c0', top:'46%' });
  await reel.spin();
  reel.el.remove();

  // JACKPOT
  F.fever(0);            // フィーバー音(あれば)
  F.impact(0, 1.2);
  F.gong(0.05, 0.5);
  F.screenShake(560);
  F.vignette('rgba(25,18,0,.55)', 5000);
  F.multiFlash(6, 95, '#fff2b0');
  F.shockwave(F.W()/2, F.H()/2, '#ffd700');
  F.borderGlow('#ffd700', 5000);

  // 金貨が噴き上がる
  let spouting = true;
  (function spout(){
    if (!spouting || F.aborted()) return;
    F.fountain(F.W()/2, F.H()*0.85, 6, '#ffd700', 18);
    const id=setTimeout(spout, 70); F._timers.push(id);
  })();
  F.sleep(3000).then(()=>{ spouting = false; });
  F.confetti(90, ['#ffd700','#ffcf3a','#fff6c0','#ffaa00']);

  await F.sleep(1000);
  F.banner('テーマクリア<br>おめでとう！', { color:'#fff', glow:'#ffd700', size:'min(11vw,62px)', top:'74%' });
  F.fanfare(0);

  await F.sleep(2500);
  F.confetti(80, ['#ffd700','#ffcf3a','#fff6c0','#ffaa00']);
  await F.sleep(1800);
  F.end();
};
