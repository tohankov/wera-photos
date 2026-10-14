// node pdfjpg.js file.pdf outPrefix -> extracts DCTDecode images, prints WxH per file
const fs=require('fs');const [,,f,pre]=process.argv;const b=fs.readFileSync(f);const s=b.toString('latin1');
let re=/<<([^]*?)>>\s*stream\r?\n/g,m,n=0;
while((m=re.exec(s))){const d=m[1];if(!/DCTDecode/.test(d)||!/Subtype\s*\/Image/.test(d))continue;
 const start=m.index+m[0].length;const len=+(/\/Length (\d+)/.exec(d)||[])[1];const end=len?start+len:s.indexOf('endstream',start);
 const w=(/\/Width (\d+)/.exec(d)||[])[1],h=(/\/Height (\d+)/.exec(d)||[])[1];n++;
 const out=`${pre}_${n}_${w}x${h}.jpg`;fs.writeFileSync(out,b.subarray(start,end));console.log(out);}
