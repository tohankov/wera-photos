// Sets of a group: every component of the WERA composition (cat/ds_comp_all.json) — ours / visible, main photo already without background (PNG, transparent corners).
// Input for vt/setblock_plan.js.   node vt/comp_state.js <all.json> <tree.json [{id, path}] of the group sections> <out.json>
//   node comp_state.js <all.json> <tree.json> <out.json>
const fs=require('fs');const sharp=require('C:/Users/Techlight/Desktop/wera-photos/tools/node_modules/sharp');const T='C:/Users/Techlight/Desktop/wera-photos/tools/';
const C=require(T+'cat/ds_comp_all.json');const W=require(T+'../inventory/wera/pages.json');const [, ,ALL,TREE,OUT]=process.argv;const A=JSON.parse(fs.readFileSync(ALL,'utf8'));const L=Object.fromEntries(A.map(p=>[p.article,p]));const CM=require('./catmatch.js')(A);
const ids=new Set(JSON.parse(fs.readFileSync(TREE,'utf8')).map(x=>+x.id));const secs=p=>[p.parent&&(p.parent.id||p.parent),...(p.alt_parent||[]).map(x=>x.id||x)].map(Number);
const inG=p=>secs(p).some(s=>ids.has(s));const st=fs.existsSync(OUT)?JSON.parse(fs.readFileSync(OUT,'utf8')):{sets:{},img:{}};const save=()=>fs.writeFileSync(OUT,JSON.stringify(st,null,1));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const transp=async a=>{if(st.img[a]!==undefined)return st.img[a];const p=L[a];const u=(p.images||[])[0];if(!u){return st.img[a]='no photo'}
 if(!/\.png$/i.test(u)){return st.img[a]='jpg'}await sleep(400);const r=await fetch(u,{headers:{'user-agent':'Mozilla/5.0'}});if(!r.ok)return st.img[a]='HTTP '+r.status;
 const {data,info}=await sharp(Buffer.from(await r.arrayBuffer())).ensureAlpha().raw().toBuffer({resolveWithObject:true});const W=info.width,H=info.height;
 const c=[0,W-1,(H-1)*W,H*W-1].map(i=>data[i*4+3]);st.img[a]=c.every(x=>x<10)?'cut':'png white';save();return st.img[a]};
// owner 10.11.2026: Wera 2go 2 modules get a block — composition only on wera.de (no datasheet table)
const WEXTRA=new Set(['05004351001']);
(async()=>{const sets=A.filter(p=>+p.display_in_showcase===1&&inG(p)&&(WEXTRA.has(p.article)||C[p.article]&&C[p.article].some(g=>g.items&&g.items.length)));
 for(const s of sets){const comps=[];const seen=new Set();for(const g of C[s.article]||[])for(const x of g.items||[]){const k=x.art||g.head+'|'+x.size;if(seen.has(k))continue;seen.add(k);
   // owner 10.11.2026: no article — our product by series + size + length (vt/catmatch.js, full match only)
   if(!x.art&&!/KNIPEX/.test(g.head)){const m=CM.match(g.code,x.size);if(m){const p=L[m];seen.add(m);comps.push({art:m,via:'catalog',head:g.head,vis:+p.display_in_showcase,state:await transp(m),grp:secs(p).some(z=>ids.has(z))});continue}}
   if(!x.art){comps.push({head:g.head,state:/KNIPEX/.test(g.head)?'knipex':'no article'});continue}
   const p=L[x.art];if(!p){comps.push({art:x.art,state:'not ours'});continue}
   comps.push({art:x.art,vis:+p.display_in_showcase,state:await transp(x.art),grp:secs(p).some(z=>ids.has(z))});}
  // owner 10.11.2026: the datasheet ≠ wera.de -> the block takes the wera.de composition; its articles are checked here too
  const wp=W.pages[W.art[s.article]];for(const i of (wp&&wp.setItems)||[])for(const x of i.rows){if(!x.art||seen.has(x.art))continue;seen.add(x.art);const p=L[x.art];
   comps.push(p?{art:x.art,via:'wera.de',vis:+p.display_in_showcase,state:await transp(x.art),grp:secs(p).some(z=>ids.has(z))}:{art:x.art,via:'wera.de',state:'not ours'});}
  st.sets[s.article]={name:s.mod_title.ua,comps};save();}
 const sum={};for(const [a,v] of Object.entries(st.sets)){const bad=v.comps.filter(c=>!['cut','knipex'].includes(c.state));v.ready=!bad.length;sum[v.ready?'ready':'wait']=(sum[v.ready?'ready':'wait']||0)+1}save();console.log(sets.length,'sets',sum);})();
