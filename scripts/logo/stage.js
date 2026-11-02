// Build a stage page: the animated stacked lockup on forest green at a given frame size.
const fs = require('fs');
const LK = require('./lockups.js');
const X = require('./engrave.js');
function stagePage({ w, h, ew, fit = 0.86, file, url = false }) {
  const st = LK.stacked('dark', { ew, split: true, id: 'stg' });
  if (url) { st.h += 50; st.inner += `<g class="url" opacity="0">${LK.tagline('LOXLEYFOREST.COM', 17, 0.34, st.w / 2, st.h - 20, '#f7f3ed')}</g>`; }
  const scale = Math.min((w * fit) / st.w, (h * fit) / st.h);
  const cfg = { E: { W: X.W, H: X.H, big: X.S.big, small: X.S.small, deckY: X.S.deckY, deckX0: X.S.deckX0, deckX1: X.S.deckX1 }, wm: st.parts.wm, manual: true };
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden;background:#1a2e1a}
#wrap{position:absolute;left:50%;top:50%;width:${st.w}px;height:${st.h}px;transform:translate(-50%,-50%) scale(${scale.toFixed(4)})}
#stage{overflow:visible;display:block}
</style></head><body><div id="wrap"><svg id="stage" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${st.w} ${st.h}" width="${st.w}" height="${st.h}">${st.inner}</svg></div>
<script>window.LF_CFG=${JSON.stringify(cfg)};</script><script>${fs.readFileSync(__dirname + '/anim.js', 'utf8')}</script></body></html>`;
  fs.writeFileSync(file, html);
  return { scale, st };
}
module.exports = { stagePage };
if (require.main === module) {
  for (const url of [false, true]) {
    const k = url ? '-url' : '';
    stagePage({ w: 1080, h: 1920, ew: 780, fit: 0.9, url, file: __dirname + `/out/stage-v${k}.html` });
    stagePage({ w: 1080, h: 1080, ew: 380, url, file: __dirname + `/out/stage-s${k}.html` });
    stagePage({ w: 1920, h: 1080, ew: 330, url, file: __dirname + `/out/stage-h${k}.html` });
  }
}
