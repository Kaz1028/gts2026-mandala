const { config } = require('../api/lib/event-config');
const data = require('../api/lib/mandalaData');
console.log('設定OK: ' + config.eventName + ' / ' + config.teamCount + 'チーム / ' + data.TOTAL_MISSIONS + 'ミッション / ' + data.TOTAL_POINTS + '点');
