const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { validateEventConfig, config } = require('../api/lib/event-config');
const { validateMissionConfig } = require('../api/lib/mission-config');
const sampleConfig = require('../examples/community-event/event.config');
const sampleMissions = require('../examples/community-event/missions.json');
const root = path.resolve(__dirname, '..');
const clone = value => JSON.parse(JSON.stringify(value));
function load(file, overrides, context = {}) {
  const filename = path.join(root, file);
  const nativeRequire = createRequire(filename);
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
    module, exports: module.exports, __dirname: path.dirname(filename), process, console,
    require: id => Object.hasOwn(overrides, id) ? overrides[id] : nativeRequire(id),
    ...context,
  }, { filename });
  return module.exports;
}

test('default and community settings validate in Node and browser', () => {
  for (const [file,c] of [['event.config.js',config],['examples/community-event/event.config.js',sampleConfig]]) {
    assert.equal(validateEventConfig(c), c);
    const window = {};
    vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'), { window });
    assert.deepEqual(clone(window.EVENT_CONFIG), c);
  }
  for (const [key,value] of [['teamCount',0],['teamCount',101],['teamCount',1.5],['loginPrefix','bad prefix'],['eventName',''],['primaryColor','red']])
    assert.throws(() => validateEventConfig({...config,[key]:value}), /event.config.js/);
});

test('mission validation catches changes that would break rendering or scoring', () => {
  for (const c of [require('../missions.json'), sampleMissions]) assert.equal(validateMissionConfig(c), c);
  for (const change of [
    c => c.themes.pop(),
    c => { c.themes[0].id = 'new'; },
    c => { c.themes[0].missions[1].id = c.themes[0].missions[0].id; },
    c => { c.themes[0].missions[0].type = 'unknown'; },
    c => { c.themes[0].missions[0].points = -1; },
    c => { c.themes[0].missions[0].stars = 4; },
    c => { c.ranks[0].minPct = 10; },
    c => { c.ranks[1].minPct = 0; },
  ]) {
    const c = clone(sampleMissions); change(c);
    assert.throws(() => validateMissionConfig(c), /missions.json/);
  }
  const data = load('api/lib/mandalaData.js', {'../../missions.json': sampleMissions});
  assert.equal(data.TOTAL_MISSIONS, 24);
  assert.equal(data.TOTAL_POINTS, 48);
  assert.equal(data.getRank(48).rank.name, sampleMissions.ranks.at(-1).name);
  assert.equal(data.getRank(100).pct,100);
});

test('custom team count and prefix control seeds and admin boundaries', async () => {
  const event = {...sampleConfig,teamCount:50,loginPrefix:'JC_'};
  const seeds = load('api/lib/config.js', {'./event-config': {config:event}}, {process:{env:{}}});
  assert.equal(seeds.getSeedTeams().length, 50);
  assert.equal(seeds.getSeedTeams()[49].login_id, 'JC_50');
  const auth = {verifyToken:()=>({role:'admin'}),cors(){}};
  for (const file of ['api/admin-team-num.js','api/admin-reset.js','api/admin-delete-team.js']) {
    let calls = 0;
    const handler = load(file, {
      './lib/event-config': {config:event}, './lib/auth': auth,
      './lib/db': {async getTeamDetail(){calls++; return {subs:[],benefits:[]};}, async deleteTeam(){calls++;return 1;}},
      '@vercel/postgres': {async sql(){calls++; return {rowCount:0};}},
    });
    async function call(n) {
      const res = {code:200,status(n){this.code=n;return this;},json(){return this;},end(){return this;}};
      await handler({method:'POST',query:{num:String(n)},body:{team_number:n}},res);
      return res.code;
    }
    assert.equal(await call(51),400);
    assert.equal(calls,0);
    assert.equal(await call(50),200);
    assert.ok(calls>0);
  }
});

test('branding inserts text safely and updates colors and title', () => {
  const node = {dataset:{event:'eventName'},textContent:''};
  const colors = {};
  const document = {title:'Old — ログイン',querySelectorAll:()=>[node],documentElement:{style:{setProperty:(k,v)=>{colors[k]=v;}}}};
  const custom = {...sampleConfig,eventName:'<img src=x onerror=alert(1)>'};
  vm.runInNewContext(fs.readFileSync(path.join(root,'event-branding.js'),'utf8'),{document,window:{EVENT_CONFIG:custom}});
  assert.equal(node.textContent,custom.eventName);
  assert.equal(document.title,custom.eventName+' — ログイン');
  assert.equal(colors['--red'],custom.primaryColor);
});

test('credential generator creates independent admin secrets without logging them', () => {
  const outputs = new Map(), logs = [];
  let folders=0;
  const fakeFS = {
    mkdirSync(){},
    mkdtempSync(prefix){assert.ok(prefix.includes('.private'));return prefix+(++folders);},
    writeFileSync(file,data,options){assert.equal(options.flag,'wx');assert.equal(options.mode,0o600);outputs.set(file,data);},
  };
  const overrides = {'node:fs':fakeFS,'../api/lib/event-config':{config:sampleConfig}};
  for(let i=0;i<2;i++) load('scripts/generate-credentials.cjs',overrides,{console:{log:s=>logs.push(s)}});
  assert.equal(outputs.size,2);
  const passwords=[];
  for (const [file,data] of outputs) {
    if (!file.endsWith('setup.env')) continue;
    const values = Object.fromEntries(data.trim().split('\n').map(line=>[line.slice(0,line.indexOf('=')),line.slice(line.indexOf('=')+1)]));
    assert.ok(!('TEAM_CREDENTIALS_JSON' in values));
    assert.ok(values.JWT_SECRET.length>=32);
    passwords.push(values.ADMIN_PASSWORD);
    assert.ok(!logs.join('\n').includes(values.JWT_SECRET));
  }
  assert.equal(new Set(passwords).size,passwords.length);
  for(const password of passwords) {
    assert.ok(password.length>=16);
    assert.ok(!logs.join('\n').includes(password));
  }
});
