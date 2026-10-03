// 公開設定。パスワード・秘密鍵は書かないでください。
(function(root) {
  const config = {
    organizationName: '○○青年会議所',
    eventName: 'まちの魅力発見ラリー',
    description: '仲間と歩いて、地域の魅力を見つけよう',
    emblem: '🌱',
    teamCount: 12,
    loginPrefix: 'LOCAL_',
    primaryColor: '#16834a',
    darkColor: '#0d512d'
  };
  if (typeof module === 'object' && module.exports) module.exports = config;
  else root.EVENT_CONFIG = config;
})(typeof window !== 'undefined' ? window : globalThis);
