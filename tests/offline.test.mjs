import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
const root=new URL('../dist/',import.meta.url);

test('service worker precaches all runtime assets, serves them without network, and avoids unrelated requests',async()=>{
  const handlers=new Map(),cached=new Map();let network=0,claimed=false;
  const origin='https://rapitugas.example';
  const cache={
    async addAll(urls){for(const url of urls){const name=url==='./'?'index.html':url.replace('./','');cached.set(new URL(url,origin+'/').pathname,await fs.readFile(new URL(name,root),'utf8'));}},
    async match(url){return cached.get(new URL(url,origin).pathname);}
  };
  const self={location:{href:origin+'/sw.js',origin},addEventListener:(type,fn)=>handlers.set(type,fn),clients:{claim:async()=>{claimed=true;}}};
  vm.runInNewContext(await fs.readFile(new URL('sw.js',root),'utf8'),{self,URL,caches:{open:async()=>cache,keys:async()=>['rapitugas-shell-v1'],delete:async()=>true},fetch:async()=>{network++;throw new Error('offline');}});
  let work;handlers.get('install')({waitUntil:p=>{work=p;}});await work;
  handlers.get('activate')({waitUntil:p=>{work=p;}});await work;assert.equal(claimed,true);
  const html=await fs.readFile(new URL('index.html',root),'utf8');
  const assetRefs=[...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(m=>m[1]).filter(p=>!p.startsWith('http')&&!p.startsWith('#')&&p!=='./');
  for(const asset of ['/',...assetRefs,'parser.mjs']){
    let response;handlers.get('fetch')({request:{method:'GET',url:new URL(asset,origin+'/').href},respondWith:p=>{response=p;}});
    assert.ok(await response,asset+' must work offline');
  }
  assert.equal(network,0);
  let handled=false;handlers.get('fetch')({request:{method:'GET',url:origin+'/auth/private'},respondWith:()=>{handled=true;}});assert.equal(handled,false);
});

test('all styles, scripts, fonts and icons are local; no remote runtime dependencies',async()=>{
  const html=await fs.readFile(new URL('index.html',root),'utf8');
  assert.doesNotMatch(html,/<(?:script|link)[^>]+(?:src|href)=["']https?:/i);
  const css=await fs.readFile(new URL('style.css',root),'utf8');assert.doesNotMatch(css,/@import|url\(["']?https?:/i);
  const js=await fs.readFile(new URL('app.mjs',root),'utf8');assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=/);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'HTML IDs must be unique');
  const usedIds=[...js.matchAll(/\$\('([^']+)'\)/g)].map(m=>m[1]);for(const id of usedIds)assert.ok(ids.includes(id),'missing DOM id '+id);
  const references=[...html.matchAll(/(?:aria-labelledby|aria-describedby)="([^"]+)"/g)].flatMap(m=>m[1].split(' '));
  for(const id of references)assert.ok(ids.includes(id),'missing accessible description '+id);
});
