/* テーマ4: チームワーク 🤝  —  TEAM POWER（6つの手が集結＋大花火） */
window.GTS_THEME_FX['theme_6'] = async function () {
  const F = window.FX;
  F.begin('radial-gradient(ellipse at center,#0d2a2a 0%,#04130f 80%)');
  F.rays('rgba(80,255,180,.10)', 9000);

  // 導入: 6人ぶんのパルス音
  for (let i = 0; i < 6; i++) F.sleep(i * 130).then(() => { F.pluck(440 + i * 70, 0, 0.25); F.burst(F.W()*(0.2+i*0.12), F.H()*0.5, 8, '#4dff88', 2); });
  F.riser(0.1, 1.5, 100, 700);

  await F.sleep(1000);

  const reel = F.reels(['🤝','💪','🙌','⭐','🔥','🤝'], { win:'🤝', accent:'#4dff88', winColor:'#ffd700', top:'46%' });
  await reel.spin();
  reel.el.remove();

  F.impact(0, 1.1);
  F.gong(0.05, 0.5);
  F.screenShake(520);
  F.vignette('rgba(0,20,15,.5)', 5000);
  F.multiFlash(5, 100, 'white');
  F.shockwave(F.W()/2, F.H()/2, '#4dff88');
  F.borderGlow('#4dff88', 4500);

  // 6つの手が中央に集まる
  const hands = ['🙌','✋','🤚','👏','🙌','✋'];
  hands.forEach((h, i) => {
    const ang = (i / 6) * Math.PI * 2;
    const sx = F.W()/2 + Math.cos(ang) * F.W()*0.5;
    const sy = F.H()/2 + Math.sin(ang) * F.H()*0.5;
    const el = F.layer(`left:${sx}px;top:${sy}px;transform:translate(-50%,-50%) scale(.6);z-index:9085;font-size:min(16vw,90px);transition:left .6s,top .6s,transform .6s;`);
    el.textContent = h;
    F.sleep(60).then(() => { el.style.left = '50%'; el.style.top = '46%'; el.style.transform = 'translate(-50%,-50%) scale(1.1)'; });
    F.sleep(60 + i * 30).then(() => F.kick(0, 0.6));
  });

  await F.sleep(800);
  F.banner('テーマクリア<br>おめでとう！', { color:'#fff', glow:'#4dff88', size:'min(11vw,62px)', top:'74%' });
  F.fanfare(0);
  F.fireworksShow(3200);

  await F.sleep(2700);
  F.fireworksShow(1600);
  await F.sleep(1700);
  F.end();
};
