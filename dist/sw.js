const CACHE = 'rapitugas-shell-v1';
const ASSETS = ['./', './index.html', './tokens.css', './style.css', './app.mjs', './parser.mjs', './icon.svg', './manifest.webmanifest'];
const ROOT = new URL('./', self.location.href).href;
const PATHS = new Set(ASSETS.map(path=>new URL(path,ROOT).pathname));
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('rapitugas-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin||!PATHS.has(url.pathname))return;
  event.respondWith(caches.open(CACHE).then(async cache=>{
    const cached=await cache.match(url.pathname,{ignoreSearch:true});
    if(cached)return cached;
    return fetch(event.request);
  }));
});
