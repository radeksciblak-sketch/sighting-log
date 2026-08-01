const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.YT_API_KEY;

const CHANNELS = [
  { name: "San Diego Zoo", id: "UCC5NfQ6Mf0dq_eEwv4P_hWA" },
  { name: "San Diego Zoo Kids", id: "UCY2PPrRnSwy6zypgRYK42og" },
  { name: "Nat Geo WILD", id: "UCDPk9MG2RexnOMGTD-YnSnA" },
  { name: "Wildlife Conservation Society", handle: "wildlifeconservationsociety" },
  { name: "BBC Earth", handle: "BBCEarth" },
  { name: "Chester Zoo", handle: "ChesterZoo" },
  { name: "ZSL London Zoo", handle: "ZSLLondonZoo" },
  { name: "Australia Zoo", handle: "AustraliaZoo" },
  { name: "Big Cat Rescue", handle: "BigCatRescue" },
  { name: "Smithsonian's National Zoo", handle: "SmithsoniansNationalZoo" },
  { name: "Latest Sightings", handle: "LatestSightings" }
];

const REFRESH_MS = 10 * 60 * 1000; // 10 minutes

let cache = [];
let lastRefreshed = null;
const uploadsIdCache = {};

async function fetchJSON(url) {
  const res = await fetch(url);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error?.message || ('HTTP ' + res.status));
  return body;
}

async function resolveUploadsId(ch) {
  const key = ch.id || ch.handle;
  if (uploadsIdCache[key]) return uploadsIdCache[key];
  const idParam = ch.id ? `id=${ch.id}` : `forHandle=${encodeURIComponent(ch.handle)}`;
  const data = await fetchJSON(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&${idParam}&key=${API_KEY}`
  );
  const item = data.items && data.items[0];
  if (!item) throw new Error('nie znaleziono kanału');
  const uploadsId = item.contentDetails.relatedPlaylists.uploads;
  uploadsIdCache[key] = uploadsId;
  return uploadsId;
}

async function refreshChannel(ch) {
  const uploadsId = await resolveUploadsId(ch);
  const data = await fetchJSON(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=1&playlistId=${uploadsId}&key=${API_KEY}`
  );
  const item = data.items && data.items[0];
  if (!item) throw new Error('brak filmów');
  const s = item.snippet;
  return {
    name: ch.name,
    title: s.title,
    link: 'https://www.youtube.com/watch?v=' + s.resourceId.videoId,
    thumb: (s.thumbnails && (s.thumbnails.medium || s.thumbnails.default)?.url) || '',
    published: s.publishedAt,
    error: null
  };
}

async function refreshAll() {
  if (!API_KEY) {
    cache = CHANNELS.map(ch => ({ name: ch.name, error: 'Brak YT_API_KEY na serwerze' }));
    lastRefreshed = new Date().toISOString();
    return;
  }
  const results = await Promise.all(
    CHANNELS.map(async (ch) => {
      try {
        return await refreshChannel(ch);
      } catch (e) {
        return { name: ch.name, error: e.message };
      }
    })
  );
  results.sort((a, b) => {
    if (!a.published) return 1;
    if (!b.published) return -1;
    return new Date(b.published) - new Date(a.published);
  });
  cache = results;
  lastRefreshed = new Date().toISOString();
  console.log('Odświeżono o', lastRefreshed);
}

refreshAll();
setInterval(refreshAll, REFRESH_MS);

app.get('/api/channels', (req, res) => {
  res.json({ items: cache, lastRefreshed });
});

app.get('/', (req, res) => {
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(PAGE_TEMPLATE);
});

const PAGE_TEMPLATE = `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Sighting Log — na żywo</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
:root{
  --ink:#1F2E24; --parchment:#EDE6D6; --parchment-dim:#E2D9C4;
  --ochre:#C08A3E; --rust:#A8432B; --olive:#6B7455; --card:#F7F3E8; --line:#cfc4a6;
}
*{box-sizing:border-box;}
body{margin:0;background:var(--parchment);color:var(--ink);font-family:'Inter',sans-serif;padding:32px 20px 60px;}
.wrap{max-width:900px;margin:0 auto;}
header{margin-bottom:20px;border-bottom:2px solid var(--ink);padding-bottom:18px;}
.eyebrow{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--olive);margin-bottom:6px;display:flex;gap:10px;align-items:center;}
.dot{width:7px;height:7px;border-radius:50%;background:#3f8a4c;display:inline-block;animation:pulse 2s infinite;}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.35;}}
h1{font-family:'Fraunces',serif;font-weight:700;font-size:clamp(30px,5vw,44px);margin:0 0 6px;}
.sub{font-size:14px;color:#454f3d;max-width:62ch;line-height:1.5;}
.log{display:flex;flex-direction:column;gap:14px;margin-top:22px;}
.entry{display:grid;grid-template-columns:120px 1fr;gap:16px;align-items:center;background:var(--card);border:1.5px solid var(--ink);border-radius:3px;padding:14px;}
.thumb{width:120px;height:68px;object-fit:cover;border-radius:2px;border:1px solid var(--line);background:var(--parchment-dim);}
.meta-eyebrow{font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--olive);text-transform:uppercase;letter-spacing:.08em;margin-bottom:2px;}
.video-title{font-family:'Fraunces',serif;font-size:16.5px;line-height:1.25;margin:2px 0 4px;}
.video-title a{color:var(--ink);text-decoration:none;border-bottom:1px solid var(--line);}
.video-title a:hover{border-color:var(--ink);}
.timestamp{font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:#6b6450;}
.status.err{font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--rust);}
.footnote{margin-top:26px;font-family:'IBM Plex Mono',monospace;font-size:11px;color:#8a8368;border-top:1px solid var(--line);padding-top:14px;}
@media (max-width:560px){.entry{grid-template-columns:84px 1fr;}.thumb{width:84px;height:48px;}}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div class="eyebrow"><span class="dot"></span>Na żywo — serwer odświeża co 10 minut</div>
    <h1>Sighting Log</h1>
    <div class="sub">Ta strona działa cały czas na serwerze, nawet gdy nie masz otwartego czatu ani karty przeglądarki gdzieś indziej — wystarczy ją odwiedzić.</div>
  </header>
  <div class="log" id="log"><p style="font-family:'IBM Plex Mono',monospace;color:#8a8368;">Ładowanie…</p></div>
  <div class="footnote" id="footnote"></div>
</div>
<script>
function fmtTime(iso){
  if (!iso) return '';
  const d = new Date(iso), diff = Date.now() - d.getTime(), day = 86400000;
  if (diff < 3600000) return Math.max(1,Math.round(diff/60000)) + " min temu";
  if (diff < day) return Math.round(diff/3600000) + " godz. temu";
  if (diff < day*30) return Math.round(diff/day) + " dni temu";
  return d.toLocaleDateString('pl-PL',{year:'numeric',month:'short',day:'numeric'});
}
function esc(s){ const d=document.createElement('div'); d.textContent=s||''; return d.innerHTML; }
async function load(){
  try{
    const res = await fetch('/api/channels');
    const data = await res.json();
    const log = document.getElementById('log');
    log.innerHTML = data.items.map(function(it){
      if (it.error){
        return '<div class="entry"><div class="thumb"></div><div><div class="meta-eyebrow">'+esc(it.name)+'</div><div class="status err">'+esc(it.error)+'</div></div></div>';
      }
      return '<div class="entry"><img class="thumb" src="'+esc(it.thumb)+'" alt="" loading="lazy"/><div><div class="meta-eyebrow">'+esc(it.name)+'</div><div class="video-title"><a href="'+esc(it.link)+'" target="_blank" rel="noopener">'+esc(it.title)+'</a></div><div class="timestamp">'+fmtTime(it.published)+'</div></div></div>';
    }).join('');
    document.getElementById('footnote').textContent = data.lastRefreshed ? ('Ostatnie odświeżenie serwera: ' + fmtTime(data.lastRefreshed)) : '';
  }catch(e){
    document.getElementById('log').innerHTML = '<p style="color:#A8432B;font-family:\\'IBM Plex Mono\\',monospace;">Nie udało się połączyć z serwerem.</p>';
  }
}
load();
setInterval(load, 60000);
</script>
</body>
</html>`;

app.listen(PORT, () => console.log('Nasłuchuję na porcie ' + PORT));
