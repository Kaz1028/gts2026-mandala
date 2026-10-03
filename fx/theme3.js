/* テーマ3: 食文化体験 🍜  —  HAWKER FEAST（チリクラブ＋ラクサ＋屋台グルメ） */
window.GTS_THEME_FX['theme_2'] = async function () {
  const F = window.FX;
  F.begin('radial-gradient(ellipse at center,#3a0d0d 0%,#1a0505 80%)');
  F.rays('rgba(255,120,60,.14)', 9000);

  // 導入: グルメが降る + 食欲をそそる上昇
  ['🦀','🍜','🍗','🥟','🍤','🌶️'].forEach((e,i)=>F.sleep(i*70).then(()=>F.rain(e, 5, 1)));
  F.riser(0.1, 1.5, 110, 660);
  [330,392,440,523].forEach((f,i)=>F.tone(f,'triangle',0.3,0.12,i*0.12));

  await F.sleep(900);

  const reel = F.reels(['🦀','🍜','🍗','🥟','🍤','🦀'], { win:'🦀', accent:'#ff7a3d', winColor:'#ffd24d', top:'46%' });
  await reel.spin();
  reel.el.remove();

  // 当たり: チリクラブ（赤×金）
  F.impact(0, 1.1);
  F.gong(0.05, 0.45);
  F.screenShake(520);
  F.vignette('rgba(30,5,0,.5)', 5000);
  F.multiFlash(4, 110, '#ffd9a0');
  F.shockwave(F.W()/2, F.H()/2, '#ff5722');
  F.borderGlow('#ff7a3d', 4200);

  const crab = F.layer(`left:50%;top:42%;transform:translate(-50%,-50%) scale(0) rotate(-20deg);z-index:9085;font-size:min(36vw,230px);filter:drop-shadow(0 0 24px #ff5722);transition:transform .6s cubic-bezier(.34,1.56,.64,1);`);
  crab.textContent = '🦀';
  requestAnimationFrame(() => crab.style.transform = 'translate(-50%,-50%) scale(1) rotate(0deg)');
  crab.style.animation = 'fxShake .12s linear .6s 8';

  ['#ff4d4d','#ff8c1a','#ffd24d','#fff'].forEach((c,i)=>F.sleep(i*50).then(()=>F.burst(F.W()/2,F.H()*0.42,30,c,3.2)));
  F.confetti(60, ['#ff4d4d','#ff8c1a','#ffd24d']);

  await F.sleep(900);
  F.banner('テーマクリア<br>おめでとう！', { color:'#ffd24d', glow:'#ff5722', size:'min(11vw,62px)', top:'74%' });
  F.fanfare(0);

  await F.sleep(2400);
  F.confetti(60, ['#ff4d4d','#ff8c1a','#ffd24d']);
  await F.sleep(1700);
  F.end();
};
