/* テーマ7: 社会貢献 💚  —  FOR THE FUTURE（地球＋ハート＋緑の光） */
window.GTS_THEME_FX['theme_7'] = async function () {
  const F = window.FX;
  F.begin('radial-gradient(ellipse at center,#06231a 0%,#02110c 80%)');
  F.rays('rgba(80,255,160,.12)', 9000);

  // 導入: ハートが舞う + 温かい上昇
  ['💚','🌏','♻️','✨'].forEach((e,i)=>F.sleep(i*90).then(()=>F.rain(e, 5, 1.1)));
  [392,494,587,659].forEach((f,i)=>F.pluck(f, i*0.14, 0.26));
  F.riser(0.2, 1.6, 100, 640);

  await F.sleep(950);

  const reel = F.reels(['💚','🌏','♻️','🕊️','⭐','💚'], { win:'💚', accent:'#4dffa0', winColor:'#ffe14d', top:'46%' });
  await reel.spin();
  reel.el.remove();

  F.impact(0, 1.0);
  F.gong(0.05, 0.45);
  F.screenShake(480);
  F.vignette('rgba(0,18,12,.5)', 5000);
  F.multiFlash(4, 110, '#d0ffe6');
  F.shockwave(F.W()/2, F.H()/2, '#4dffa0');
  F.borderGlow('#4dffa0', 4500);

  // 地球が輝く
  const earth = F.layer(`left:50%;top:46%;transform:translate(-50%,-50%) scale(0);z-index:9085;font-size:min(34vw,220px);filter:drop-shadow(0 0 26px #4dffa0);transition:transform .7s cubic-bezier(.34,1.56,.64,1);`);
  earth.textContent = '🌏';
  requestAnimationFrame(() => earth.style.transform = 'translate(-50%,-50%) scale(1)');
  earth.style.animation = 'fxFloat 3s ease-in-out 0.7s infinite';

  // ハートが地球から放射
  for (let i = 0; i < 12; i++) F.sleep(700 + i * 60).then(() => {
    if (F.aborted()) return;
    F.burst(F.W()/2, F.H()*0.46, 4, ['#4dffa0','#7dffb0','#ffe14d'][i % 3], 3.5);
  });
  F.confetti(60, ['#4dffa0','#7dffb0','#ffe14d','#ffffff']);

  await F.sleep(1100);
  F.banner('テーマクリア<br>おめでとう！', { color:'#d0ffe6', glow:'#4dffa0', size:'min(11vw,62px)', top:'74%' });
  F.fanfare(0);

  await F.sleep(2500);
  F.confetti(60, ['#4dffa0','#7dffb0','#ffe14d','#ffffff']);
  await F.sleep(1800);
  F.end();
};
