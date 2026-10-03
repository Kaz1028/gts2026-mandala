/* テーマ0: 多文化交流 🌏  —  UNITY IN DIVERSITY（国旗の雨＋虹＋4言語） */
window.GTS_THEME_FX['theme_4'] = async function () {
  const F = window.FX;
  F.begin('radial-gradient(ellipse at center,#10243f 0%,#05060f 78%)');

  // 導入: 世界の絵文字が降る + 琴の上昇
  F.rays('rgba(120,180,255,.10)', 9000);
  ['🌏','🌍','🌎','🎌','🤝'].forEach((e, i) => F.sleep(i * 80).then(() => F.rain(e, 6, 1.2)));
  [392,440,494,587,659].forEach((f, i) => F.pluck(f, i * 0.12, 0.28));
  F.riser(0.2, 1.6, 100, 700);

  await F.sleep(900);

  // リール（国旗）→ 揃い
  const reel = F.reels(['🇸🇬','🇯🇵','🇮🇳','🇨🇳','🇲🇾','🌏'], { win: '🌏', accent: '#5ab0ff', winColor: '#ffd700', top: '46%' });
  await reel.spin();
  reel.el.remove();

  // 当たり
  F.impact(0);
  F.gong(0.05, 0.45);
  F.screenShake(520);
  F.vignette('rgba(0,10,30,.5)', 5000);
  F.multiFlash(4, 110, 'white');
  F.shockwave(F.W()/2, F.H()/2, '#ffd700');
  F.borderGlow('#5ab0ff', 4000);
  // 虹色パーティクル
  ['#ff4d4d','#ff9a3d','#ffe14d','#4dff88','#4dd2ff','#9a7dff','#ff7ad9'].forEach((c, i) =>
    F.sleep(i * 40).then(() => F.burst(F.W()/2, F.H()/2, 26, c, 3.4)));
  F.confetti(80);

  await F.sleep(500);
  F.banner('テーマクリア<br>おめでとう！', { color: '#fff', glow: '#5ab0ff', size: 'min(11vw,62px)', top: '74%' });
  F.fanfare(0);
  // 4言語の挨拶が順に出る
  const greets = ['Hello!', '你好!', 'வணக்கம்!', 'Selamat!'];
  greets.forEach((g, i) => F.sleep(700 + i * 350).then(() => {
    if (F.aborted()) return;
    const el = F.layer(`left:50%;top:${24 + i * 12}%;transform:translate(-50%,-50%);z-index:9090;color:#ffd700;font-size:min(7vw,30px);font-weight:900;text-shadow:0 0 12px #ff8800;opacity:0;transition:opacity .3s;`);
    el.textContent = g; requestAnimationFrame(() => el.style.opacity = '1');
    F.pluck(660 + i * 80, 0, 0.25);
  }));

  await F.sleep(2600);
  F.confetti(60);
  await F.sleep(1800);
  F.end();
};
