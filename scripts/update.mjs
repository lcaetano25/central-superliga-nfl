import {readFile,writeFile,mkdir} from 'node:fs/promises';
const A='https://api.sleeper.app/v1',j=async p=>{const r=await fetch(A+p);if(!r.ok)throw new Error(r.status+' '+p);return r.json()};
const cfg=JSON.parse(await readFile('config.json','utf8')),st=await j('/state/nfl'),week=st.week;
await mkdir('data',{recursive:true});
let C={at:0,p:{}};try{C=JSON.parse(await readFile('data/players.json','utf8'))}catch{}
const raw=[],need=new Set();
for(const t of cfg.teams){
 const u=await j('/user/'+t.username);let ls=await j(`/user/${u.user_id}/leagues/nfl/${st.season}`);
 if(t.leagues?.length)ls=ls.filter(l=>t.leagues.includes(l.league_id));
 for(const l of ls){const q=x=>j(`/league/${l.league_id}/${x}`);
  const [ro,us,ma]=await Promise.all([q('rosters'),q('users'),q('matchups/'+week)]);
  ro.forEach(r=>(r.players||[]).forEach(i=>need.add(i)));raw.push({u,l,ro,us,ma});}}
if(C.v!==2||Date.now()-C.at>864e5||[...need].some(i=>!C.p[i])){
 const all=await j('/players/nfl'),p={};
 for(const i of need){const x=all[i];p[i]=x?{f:x.position==='DEF'?'':`${x.first_name} ${x.last_name}`,n:x.position==='DEF'?`${x.first_name} ${x.last_name}`:`${(x.first_name||'?')[0]}. ${x.last_name}`,pos:x.position,tm:x.team,inj:x.injury_status||null}:{n:i}}
 C={v:2,at:Date.now(),p};await writeFile('data/players.json',JSON.stringify(C));}
const get=async u=>{try{const r=await fetch(u,{headers:{'user-agent':'central-superliga'}});return r.ok?r:null}catch{return null}};
const PJ={},SC={},byes={};
{const r=await get(`https://api.sleeper.app/projections/nfl/${st.season}/${week}?season_type=regular&`+['QB','RB','WR','TE','K','DEF'].map(p=>'position[]='+p).join('&'));
 if(r){const d=await r.json();(Array.isArray(d)?d:Object.entries(d).map(([k,v])=>({player_id:k,...v}))).forEach(x=>{PJ[x.player_id]=x.stats||x})}}
{const r=await get(`https://api.sleeper.app/schedule/nfl/regular/${st.season}`);
 if(r){const g=await r.json(),T=new Set(),pl={};(Array.isArray(g)?g:[]).forEach(x=>{T.add(x.home);T.add(x.away);(pl[x.week]??=new Set()).add(x.home).add(x.away);if(x.week==week){SC[x.home]={o:'vs '+x.away};SC[x.away]={o:'@ '+x.home}}});
  T.forEach(t=>{for(let w=1;w<=18;w++)if(pl[w]&&!pl[w].has(t)){byes[t]=w;break}})}}
const proj=(i,sc,pos)=>{const s=PJ[i];if(!s)return null;if(pos==='K'||pos==='DEF')return s.pts_std??null;let t=0;for(const k in sc)if(typeof s[k]==='number')t+=s[k]*sc[k];return Math.round(t*100)/100};
const nob=['BN','IR','TAXI'],fp=(s,k='fpts')=>s[k]+(s[k+'_decimal']||0)/100;
const out={updated:new Date().toISOString(),week,season:st.season,teams:[]};
for(const {u,l,ro,us,ma} of raw){
 const nm=r=>{const o=us.find(x=>x.user_id===r.owner_id);return o?.metadata?.team_name||o?.display_name||'Time '+r.roster_id};
 const slots=l.roster_positions.filter(x=>!nob.includes(x));
 const me=ro.find(r=>r.owner_id===u.user_id||(r.co_owners||[]).includes(u.user_id));
 const side=(r,m)=>{const pt=m?.players_points||{},P=i=>{const c=C.p[i]||{n:i};return {id:i,...c,f:undefined,pts:pt[i]??null,proj:proj(i,sc,c.pos),opp:SC[c.tm]?.o??null,bye:byes[c.tm]===week}};
  const S=r.starters||[],R=r.reserve||[],T=r.taxi||[];
  return {team:nm(r),total:m?.points??null,starters:S.map((i,k)=>({slot:slots[k],...(i==='0'?{n:'(vazio)'}:P(i))})),bench:(r.players||[]).filter(i=>!S.includes(i)&&!R.includes(i)&&!T.includes(i)).map(P),ir:R.map(P)}};
 const mm=ma.find(m=>m.roster_id===me?.roster_id),om=mm?.matchup_id!=null?ma.find(m=>m.matchup_id===mm.matchup_id&&m.roster_id!==me.roster_id):null,or=om&&ro.find(r=>r.roster_id===om.roster_id);
 const s=l.settings,sc=l.scoring_settings;
 const b={name:l.name,id:l.league_id,
  standings:ro.map(r=>({team:nm(r),w:r.settings.wins,l:r.settings.losses,t:r.settings.ties,pf:fp(r.settings),pa:fp(r.settings,'fpts_against'),me:r===me})).sort((a,c)=>c.w-a.w||c.pf-a.pf),
  me:me?side(me,mm):null,opp:or?side(or,om):null,
  cfg:{teams:s.num_teams,pos:l.roster_positions,res:s.reserve_slots,trade:s.trade_deadline,playoff:s.playoff_week_start,pteams:s.playoff_teams,waiver:s.waiver_budget,
   score:sc}};
 let t=out.teams.find(x=>x.user===u.display_name);if(!t)out.teams.push(t={user:u.display_name,uid:u.user_id,leagues:[]});t.leagues.push(b)}
out.byes=byes;out.news=[];
const who={};out.teams.forEach(tm=>tm.leagues.forEach(l=>[l.me,l.opp].forEach(s=>s&&[...s.starters,...s.bench,...s.ir].forEach(p=>{const f=C.p[p.id]?.f;if(f)who[f.toLowerCase()]=p.n}))));
const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/<[^>]+>|&[a-z#0-9]+;/g,' ').toLowerCase();
const cd=s=>(s||'').replace(/<!\[CDATA\[|\]\]>/g,'').replace(/&amp;/g,'&').replace(/&#39;|&apos;/g,"'").replace(/&quot;/g,'"').trim();
for(const [src,url] of [['ESPN','https://www.espn.com/espn/rss/nfl/news'],['CBS Sports','https://www.cbssports.com/rss/headlines/nfl/']]){
 const r=await get(url);if(!r)continue;const x=await r.text();
 for(const m of x.matchAll(/<item>([\s\S]*?)<\/item>/g)){const g=k=>cd((m[1].match(new RegExp('<'+k+'>([\\s\\S]*?)</'+k+'>'))||[])[1]);
  const t=g('title'),h=norm(t+' '+g('description')),p=Object.keys(who).filter(f=>h.includes(norm(f))).map(f=>who[f]);
  if(p.length)out.news.push({t,u:g('link'),s:src,d:g('pubDate'),p})}}
out.news.sort((a,b)=>Date.parse(b.d)-Date.parse(a.d));out.news=out.news.slice(0,40);
await writeFile('data/data.json',JSON.stringify(out));
if(cfg.superligaCsv){try{
 const txt=await (await fetch(cfg.superligaCsv)).text(),rows=txt.trim().split(/\r?\n/).slice(1).map(l=>{const r=l.split(',').slice(-13);return {id:r[0],s:+r[1],lg:r[2]}});
 let LM={};try{LM=JSON.parse(await readFile('data/leagues.json','utf8'))}catch{}
 const key=s=>s.toUpperCase().replace(/[^A-Z0-9]/g,''),labels=[...new Set(rows.map(r=>r.lg))].filter(x=>x&&!/^DES/i.test(x));
 const pool=async(a,n,f)=>{const q=[...a];await Promise.all(Array.from({length:n},async()=>{while(q.length)await f(q.shift())}))};
 await pool(labels.filter(l=>!LM[l]),8,async lb=>{const m=rows.find(r=>r.lg===lb),m2=lb.match(/^(\d+)\s+(\w+)$/),want=m2?key(m2[2]+m2[1]):key(lb);
  try{const ls=await j(`/user/${m.id}/leagues/nfl/${st.season}`),f=ls.find(l=>key((l.name.match(/\[([^\]]+)\]/)||[])[1]||'')===want);if(f)LM[lb]=f.league_id}catch{}});
 await writeFile('data/leagues.json',JSON.stringify(LM));
 const byId=Object.fromEntries(rows.map(r=>[r.id,r])),R=[];
 await pool(Object.entries(LM),8,async([lb,id])=>{try{const [ro,us]=await Promise.all([j(`/league/${id}/rosters`),j(`/league/${id}/users`)]);
  ro.forEach(r=>{const u=us.find(x=>x.user_id===r.owner_id),c=byId[r.owner_id],s=r.settings;R.push({id:r.owner_id,u:u?.display_name||'?',t:u?.metadata?.team_name||'',l:lb,s:c?c.s:null,w:s.wins,d:s.losses,pf:fp(s),pa:fp(s,'fpts_against')})})}catch{}});
 R.sort((a,b)=>b.pf-a.pf);R.forEach((r,i)=>r.p=i+1);
 await writeFile('data/ranking.json',JSON.stringify({updated:out.updated,total:R.length,rows:R}));console.log('ranking',R.length)
}catch(e){console.log('ranking falhou',e.message)}}
console.log('ok',out.teams.length,'time(s)');
