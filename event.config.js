// 公開設定。パスワード・秘密鍵は書かないでください。
(function(root) {
  const config = {
    organizationName: '青年会議所',
    eventName: 'GTS2026',
    description: 'Singapore — マンダラチャートシステム',
    emblem: '🦁',
    teamCount: 22,
    loginPrefix: 'GTS2026_',
    primaryColor: '#c4131f',
    darkColor: '#8c0a14'
  };
  if (typeof module === 'object' && module.exports) module.exports = config;
  else root.EVENT_CONFIG = config;
})(typeof window !== 'undefined' ? window : globalThis);
