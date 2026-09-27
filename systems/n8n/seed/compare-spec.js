// Prints differences between systems/n8n/tables/*.json and systems/N8N-SPEC.md section 1. Usage: node systems/n8n/seed/compare-spec.js
'use strict';
const fs=require('fs'),path=require('path');const R=path.resolve(__dirname,'../../..');
const md=fs.readFileSync(path.join(R,'systems/N8N-SPEC.md'),'utf8');
const sec=md.split(/^### 1\.\d+ /m).slice(1);let diffs=0;
for(const s of sec){const t=(s.match(/^`(\w+)`/)||[])[1];if(!t)continue;
 const cols=[];for(const m of s.split(/^---$/m)[0].matchAll(/`(\w+)`\s*\|?\s*(Boolean|Date|Number|String)\b/g))cols.push([m[1],m[2]]);
 const f=path.join(R,'systems/n8n/tables',t+'.json');if(!fs.existsSync(f)){console.log(`MISSING table ${t}`);diffs++;continue;}
 const mine=JSON.parse(fs.readFileSync(f)).columns.map(c=>[c.name,c.type]);
 const a=cols.map(c=>c.join(':')).join(','),b=mine.map(c=>c.join(':')).join(',');
 if(a!==b){diffs++;console.log(`DIFF ${t}\n spec: ${a}\n mine: ${b}`);}else console.log(`OK ${t} (${mine.length} cols)`);}
for(const f of fs.readdirSync(path.join(R,'systems/n8n/tables')))for(const c of JSON.parse(fs.readFileSync(path.join(R,'systems/n8n/tables',f))).columns)if(!/^(Boolean|Date|Number|String)$/.test(c.type)){diffs++;console.log(`BAD TYPE ${f} ${c.name} ${c.type}`);}
console.log(diffs?`${diffs} difference(s)`:'no differences');process.exit(diffs?1:0);
