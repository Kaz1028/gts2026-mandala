/* テーマ2: 観光・文化体験 🦁  —  MERLION CITY（マリーナベイ＋マーライオン放水＋花火）
   シンガポールの象徴を全部盛りした最強演出 */
window.GTS_THEME_FX['theme_0'] = async function () {
  const F = window.FX;
  F.begin('linear-gradient(180deg,#0a1430 0%,#13284f 45%,#1b3a6b 100%)');

  // ===== 夜景: マリーナベイ・サンズ風スカイライン =====
  const sky = F.layer('left:0;bottom:0;width:100%;height:46%;z-index:9041;pointer-events:none;');
  sky.innerHTML = `
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMax meet" style="width:100%;height:100%;">
      <defs>
        <linearGradient id="bld" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#2b4a7a"/><stop offset="100%" stop-color="#0c1830"/>
        </linearGradient>
      </defs>
      <!-- ビル群 -->
      <rect x="20"  y="120" width="22" height="80" fill="url(#bld)"/>
      <rect x="48"  y="95"  width="18" height="105" fill="url(#bld)"/>
      <rect x="70"  y="135" width="20" height="65" fill="url(#bld)"/>
      <rect x="300" y="110" width="20" height="90" fill="url(#bld)"/>
      <rect x="326" y="130" width="22" height="70" fill="url(#bld)"/>
      <rect x="354" y="100" width="18" height="100" fill="url(#bld)"/>
      <!-- マリーナベイサンズ 3タワー + 船 -->
      <rect x="150" y="80" width="12" height="120" fill="url(#bld)"/>
      <rect x="194" y="70" width="12" height="130" fill="url(#bld)"/>
      <rect x="238" y="80" width="12" height="120" fill="url(#bld)"/>
      <path d="M140 70 Q200 40 260 70 L260 82 Q200 56 140 82 Z" fill="#3a5d92"/>
      <!-- 窓の光 -->
      ${Array.from({length:40}).map(()=>`<rect x="${20+Math.random()*350}" y="${75+Math.random()*120}" width="2" height="2" fill="#ffe89a" opacity="${0.4+Math.random()*0.6}"/>`).join('')}
    </svg>`;

  // 水面
  const water = F.layer('left:0;bottom:0;width:100%;height:22%;z-index:9042;pointer-events:none;background:linear-gradient(180deg,rgba(40,90,160,.5),rgba(10,30,70,.9));');

  // 導入: 波の音(ノイズ)＋琴
  F.noise(1.2, 0.18, 0, 500, 0.3, 'lowpass');
  [392,494,587,784].forEach((f,i)=>F.pluck(f, i*0.14, 0.26));
  F.rays('rgba(120,200,255,.08)', 10000);

  await F.sleep(900);

  // リール（シンガポール記号）
  const reel = F.reels(['🦁','🌴','🏙️','🦀','🎆','🦁'], { win:'🦁', accent:'#36c6ff', winColor:'#ffd700', top:'40%' });
  await reel.spin();
  reel.el.remove();

  // ===== マーライオン登場 + 放水 =====
  F.impact(0, 1.2);
  F.gong(0.05, 0.55);
  F.screenShake(550);
  F.multiFlash(4, 120, '#bfe8ff');
  F.shockwave(F.W()/2, F.H()*0.42, '#ffd700');
  F.borderGlow('#36c6ff', 6000);
  F.vignette('rgba(0,10,30,.6)', 6000);

  // 本格マーライオンSVG
  const merlion = F.placeArt(F.art.merlion(), { size: 'min(58vw,330px)', top: '40%', glow: '#36c6ff' });

  // 放水（口の位置から噴水）
  let spraying = true;
  (function spray(){
    if (!spraying || F.aborted()) return;
    F.fountain(F.W()/2, F.H()*0.34, 7, '#aee4ff', 17);
    const id=setTimeout(spray, 55); F._timers.push(id);
  })();
  F.noise(2.8, 0.12, 0, 3000, 0.4, 'highpass'); // 水音
  F.sleep(3200).then(()=>{ spraying = false; });

  await F.sleep(800);
  F.banner('テーマクリア<br>おめでとう！', { sub:'建国記念日 制覇！', color:'#fff', glow:'#36c6ff', size:'min(11vw,62px)', top:'74%' });
  F.fanfare(0);

  // 花火連発
  F.fireworksShow(4000);
  await F.sleep(1400);
  F.confetti(120, ['#36c6ff','#ffd700','#ffffff','#ff7ad9']);

  await F.sleep(2600);
  F.end();
};
