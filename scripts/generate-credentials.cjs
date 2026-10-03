const fs = require('node:fs'), path = require('node:path');
const { randomBytes } = require('node:crypto');
// Teams log in by choosing their number, so only the admin login and token key are generated.
const secret = () => randomBytes(24).toString('base64url');
const dir = path.resolve(__dirname,'../.private');
fs.mkdirSync(dir,{recursive:true});
const out = fs.mkdtempSync(path.join(dir,'setup-'));
const env = ['JWT_SECRET='+randomBytes(48).toString('hex'),'ADMIN_ID=admin','ADMIN_PASSWORD='+secret(),
  'POSTGRES_URL=','BLOB_READ_WRITE_TOKEN=',''].join('\n');
fs.writeFileSync(path.join(out,'setup.env'),env,{mode:0o600,flag:'wx'});
console.log('設定用ファイル: '+path.join(out,'setup.env'));
console.log('非公開ファイルです。DB接続・Blobは別途設定してください。');
