const fs = require('node:fs'), path = require('node:path');
const { randomBytes } = require('node:crypto');
const { config } = require('../api/lib/event-config');
const secret = () => randomBytes(24).toString('base64url');
const teams = Array.from({length: config.teamCount}, (_,i) => ({team_number:i+1,password:secret()}));
const dir = path.resolve(__dirname,'../.private');
fs.mkdirSync(dir,{recursive:true});
const out = fs.mkdtempSync(path.join(dir,'setup-'));
const env = ['JWT_SECRET='+randomBytes(48).toString('hex'),'ADMIN_ID=admin','ADMIN_PASSWORD='+secret(),
  "TEAM_CREDENTIALS_JSON='"+JSON.stringify(teams)+"'",'POSTGRES_URL=','BLOB_READ_WRITE_TOKEN=',''].join('\n');
fs.writeFileSync(path.join(out,'setup.env'),env,{mode:0o600,flag:'wx'});
fs.writeFileSync(path.join(out,'teams.csv'),'\uFEFFチーム番号,ログインID,パスワード\n'+teams.map(t=>[t.team_number,config.loginPrefix+t.team_number,t.password].join(',')).join('\n')+'\n',{mode:0o600,flag:'wx'});
console.log('設定用ファイル: '+path.join(out,'setup.env'));
console.log('個別配布用の一覧: '+path.join(out,'teams.csv'));
console.log('非公開ファイルです。DB接続・Blobは別途設定してください。既存チームは更新しません。');
