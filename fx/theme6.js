/* テーマ6: 自己成長 🌱  —  GROWTH（芽→大樹＋日の出グラデーション） */
window.GTS_THEME_FX['theme_1'] = async function () {
  const F = window.FX;
  F.begin('linear-gradient(180deg,#0a1020 0%,#142a1a 70%,#1a3a22 100%)');

  // 導入: 朝日が昇るグラデ + やわらかな上昇
  const sun = F.layer(`left:50%;bottom:-30%;transform:translate(-50%,0);width:min(70vw,360px);height:min(70vw,360px);border-radius:50%;z-index:9041;
    background:radial-gradient(circle,#fff3b0 0%,#ffcf6a 40%,rgba(255,180,80,0) 70%);transition:bottom 2.2s ease;`);
  requestAnimationFrame(() => sun.style.bottom = '10%');
  [330,392,440,523,587].forEach((f,i)=>F.pluck(f, i*0.16, 0.24));
  F.riser(0.2, 1.8, 90, 560);
  F.rain('🌿', 5, 1);

  await F.sleep(1000);

  const reel = F.reels(['🌱','🌿','🌳','🌸','⭐','🌱'], { win:'🌱', accent:'#7dff9a', winColor:'#ffe14d', top:'46%' });
  await reel.spin();
  reel.el.remove();

  F.impact(0, 1.0);
  F.gong(0.05, 0.4);
  F.screenShake(480);
  F.vignette('rgba(0,20,10,.5)', 5000);
  F.multiFlash(4, 110, '#eaffd0');
  F.shockwave(F.W()/2, F.H()/2, '#7dff9a');
  F.borderGlow('#7dff9a', 4200);

  // 芽 → 大樹へ成長
  const tree = F.layer(`left:50%;top:50%;transform:translate(-50%,-50%) scale(.1);z-index:9085;font-size:min(34vw,220px);filter:drop-shadow(0 0 22px #7dff9a);transition:transform 1.1s cubic-bezier(.34,1.4,.5,1);`);
  tree.textContent = '🌱';
  requestAnimationFrame(() => tree.style.transform = 'translate(-50%,-50%) scale(.7)');
  F.sleep(700).then(() => { tree.textContent = '🌳'; tree.style.transform = 'translate(-50%,-50%) scale(1.1)'; F.kick(0, 1.2); F.burst(F.W()/2, F.H()*0.42, 50, '#7dff9a', 3); });
  F.confetti(50, ['#7dff9a','#ffe14d','#ff9ad9','#ffffff']);

  await F.sleep(1300);
  F.banner('テーマクリア<br>おめでとう！', { color:'#eaffd0', glow:'#7dff9a', size:'min(11vw,62px)', top:'74%' });
  F.fanfare(0);

  await F.sleep(2400);
  F.confetti(50, ['#7dff9a','#ffe14d','#ff9ad9','#ffffff']);
  await F.sleep(1700);
  F.end();
};
