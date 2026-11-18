"""/sky-over-loxley, Dark Nights (the deep session of 2026-11-18, D16, the one bold lane this winter;
the Chief's night-sky page, chief docs/builds/2026-11-17-sky-over-loxley/, as a page on the site).

What it is: the evening sky over the treehouse for every night in the table (sun, twilight, the
moon's place and light, a dark-sky score), drawn on a canvas the visitor drags through the evening;
the light for pictures; and "The darkest nights still open", the nights the engine says are open
ranked by how dark they are, each with a link to the booking page on those dates.

The pieces, and where each comes from:
  - scripts/site/sky/sky.json: the Chief's table, computed 2026-11-17 with a standard ephemeris
    (scripts/site/sky/compute.py; it needs the `ephem` package and the mirror, which the workshop
    does not have, so the table is data here) for the treehouse's own latitude and longitude,
    Nov 17, 2026 to Mar 13, 2027. The build stops when the table runs out within TABLE_DAYS of today:
    rerun compute.py where ephem is installed and replace sky.json.
  - live open nights: the page reads GET /v1/availability from the engine on load (as the
    booking calendar does); a night the engine lists is open at its rate and minimum, a night it
    does not list is taken. If the engine does not answer, the table's own snapshot of the
    calendar (as it stood at the table's as-of time) is shown and the note says so.
  - scripts/site/sky/facts.json: the wildlife and shower lines. An outside fact reaches the page
    only with its url, the source's own words and the day it was read (the rule of
    scripts/site/pseo/facts.json); the Chief's build named agencies without those, so until the
    Scout fills the rows the two sections ("Who is out tonight", "Nights the sky puts on a show")
    are not written at all.
THE WORDS are the Chief's, in TEMPLATE below, plus the few this module adds ("Taken", the live
note); the page's words hash (every visible sentence, the script's included) is printed at build for
Mick's yes. SHADOW: noindex, not in sitemap.xml, linked from nowhere until his word. The styles are
the Chief's, scoped under .sky so nothing of them reaches the rest of the page.
"""
import datetime as dt
import hashlib
import json
import os
import re
import sys
from html import escape

import build_v2 as B

SLUG = 'sky-over-loxley'
URL = f'https://loxleyforest.com/{SLUG}'
SKY_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'sky')
TABLE_DAYS = 14   # the build refuses when the table ends sooner than this many days from today
TITLE = 'The sky over Loxley | Loxley Forest'
DESC = ('Every night this winter over the treehouse deck: when the sun goes, when the bridge lights come on, '
        'where the moon stands, how dark it gets, and which of the darkest nights are still open.')


def table():
    return json.load(open(os.path.join(SKY_DIR, 'sky.json'), encoding='utf-8'))


def facts():
    return json.load(open(os.path.join(SKY_DIR, 'facts.json'), encoding='utf-8'))


def sourced(rows):
    """The rows an outside fact may be written from: every claim the line makes carries a source
    with its url, the source's own words and the day it was read (a quote may be empty only for
    the sky table's own, url "computed")."""
    def ok(s):
        return bool(s.get('url')) and bool(s.get('read')) and s.get('quote') is not None
    return [r for r in rows if r.get('sources') and all(ok(s) for s in r['sources'])]


def for_page(rows):
    """The rows as the page's script needs them: the words, the months, and each source's name and
    url; the quotes and notes stay in the data."""
    out = []
    for r in rows:
        row = {k: r[k] for k in r if k not in ('sources', 'held')}
        seen, srcs = set(), []
        for s in r['sources']:
            key = (s['name'], s['url'])
            if key in seen or s['url'] == 'computed':
                continue
            seen.add(key); srcs.append({'name': s['name'], 'url': s['url']})
        row['sources'] = srcs
        out.append(row)
    return out


# ---- the Chief's styles, scoped -----------------------------------------------------------
CSS_SRC = r'''
.sky{--night:#0b1512;--panel:#12211c;--line:#24392f;--ink:#ece6d6;--soft:#a9b3a4;--faint:#6f7d72;--gold:#d9b46a;--ember:#f08a4b;--moon:#f3efdf;--good:#8fc49a;--mid:#d9b46a;--low:#b98f8a;--display:"Cormorant Garamond",Georgia,"Times New Roman",serif;--util:"Montserrat",system-ui,-apple-system,"Segoe UI",sans-serif;color-scheme:dark}
.sky{background:var(--night);color:var(--ink);font-family:var(--display);font-size:19px;line-height:1.45;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
.sky *{box-sizing:border-box}
.sky .wrap{max-width:880px;margin:0 auto;display:flex;flex-direction:column;gap:22px}
.sky .eyebrow{font-family:var(--util);font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:var(--gold);margin:0}
.sky h1{font-weight:500;font-size:clamp(34px,7vw,54px);line-height:1.02;margin:6px 0 0;text-wrap:balance;color:var(--ink);font-family:var(--display)}
.sky h1 em{color:var(--gold);font-style:italic}
.sky .lede{color:var(--soft);margin:8px 0 0;max-width:60ch}
.sky h2{font-weight:500;font-size:clamp(24px,4.6vw,32px);margin:0 0 4px;text-wrap:balance;color:var(--ink);font-family:var(--display)}
.sky .note{font-family:var(--util);font-size:12px;color:var(--faint);line-height:1.6;margin:0}
.sky .scene{position:relative;border:1px solid var(--line);background:#06100d;overflow:hidden}
.sky canvas{display:block;width:100%;height:auto;aspect-ratio:4/5;max-width:100%}
@media (min-width:700px){.sky canvas{aspect-ratio:16/10}}
.sky .stamp{position:absolute;left:14px;top:12px;font-family:var(--util);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink);text-shadow:0 1px 6px #000a}
.sky .stamp b{display:block;font-family:var(--display);font-weight:500;font-size:26px;letter-spacing:0;text-transform:none;margin-top:2px}
.sky .ctl{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.sky .ctl label{font-family:var(--util);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--soft)}
.sky input[type=range]{flex:1 1 220px;min-width:0;accent-color:var(--gold);height:32px}
.sky input[type=date]{font:500 15px var(--util);background:var(--panel);color:var(--ink);border:1px solid var(--line);padding:9px 10px;min-width:0;border-radius:0}
.sky button{font:600 11px var(--util);letter-spacing:.16em;text-transform:uppercase;color:var(--ink);background:var(--panel);border:1px solid var(--line);padding:11px 14px;cursor:pointer;border-radius:0}
.sky button:hover{border-color:var(--gold)} .sky button:focus-visible,.sky input:focus-visible,.sky a:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
.sky button.go{background:var(--gold);color:#1a140a;border-color:var(--gold)}
.sky .chips{display:flex;flex-wrap:wrap;gap:8px}
.sky .facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1px;background:var(--line);border:1px solid var(--line)}
.sky .fact{background:var(--panel);padding:14px 14px 16px;min-width:0}
.sky .fact .k{font-family:var(--util);font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--faint)}
.sky .fact .v{font-size:27px;line-height:1.1;margin-top:6px;font-variant-numeric:tabular-nums}
.sky .fact .s{font-family:var(--util);font-size:12px;color:var(--soft);margin-top:5px;line-height:1.45}
.sky #jumps button{border-color:var(--gold);color:var(--gold)}
.sky .photo{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1px;background:var(--line);border:1px solid var(--line)}
.sky .photo .col{background:var(--panel);padding:14px 14px 10px;min-width:0}
.sky .photo h3{font:600 11px var(--util);letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin:0 0 8px}
.sky .photo dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:7px 14px;align-items:baseline}
.sky .photo dt{font-family:var(--util);font-size:12px;color:var(--soft)}
.sky .photo dd{margin:0;font-size:21px;font-variant-numeric:tabular-nums;text-align:right}
.sky .photo .tip{font-family:var(--util);font-size:12px;color:var(--faint);line-height:1.5;margin:10px 0 6px}
.sky .sub{font:600 11px var(--util);letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin:14px 0 2px}
.sky .who{font:600 10px var(--util);letter-spacing:.12em;text-transform:uppercase;color:var(--faint);margin-top:5px}
.sky .best{color:var(--good)} .sky .fair{color:var(--mid)}
.sky .yearwrap{overflow-x:auto}
.sky .year{display:grid;grid-template-columns:minmax(118px,1.5fr) repeat(12,minmax(18px,1fr));gap:3px 2px;align-items:center;min-width:420px;font-family:var(--util);font-size:11px;color:var(--soft)}
.sky .year .hd{font-size:9.5px;letter-spacing:.08em;text-align:center;color:var(--faint)}
.sky .year .c{height:14px;background:#17251f}
.sky .year .c.on{background:#3d5a46} .sky .year .c.pk{background:var(--gold)} .sky .year .c.now{outline:1px solid var(--ink);outline-offset:1px}
.sky .key{display:inline-block;width:12px;height:10px;vertical-align:-1px;margin:0 4px 0 10px;background:#3d5a46} .sky .key.k-pk{background:var(--gold)} .sky .key.k-now{background:#17251f;outline:1px solid var(--ink)}
.sky .say{font-style:italic;font-size:clamp(20px,3.6vw,25px);color:var(--ink);margin:0;border-left:2px solid var(--gold);padding-left:14px;text-wrap:pretty}
.sky .list{display:flex;flex-direction:column;border-top:1px solid var(--line)}
.sky .row{display:grid;grid-template-columns:minmax(0,1.5fr) auto;gap:6px 14px;align-items:center;padding:13px 2px;border-bottom:1px solid var(--line)}
.sky .row .a{min-width:0}
.sky .row .t{font-size:22px;line-height:1.15}
.sky .row .m{font-family:var(--util);font-size:12px;color:var(--soft);line-height:1.5;margin-top:3px}
.sky .row .r{display:flex;flex-direction:column;align-items:flex-end;gap:6px}
.sky .score{font:600 12px var(--util);letter-spacing:.08em;padding:4px 9px;border:1px solid currentColor;font-variant-numeric:tabular-nums;white-space:nowrap}
.sky .s-hi{color:var(--good)} .sky .s-md{color:var(--mid)} .sky .s-lo{color:var(--low)}
.sky .row a,.sky .row button.pick{font:600 10.5px var(--util);letter-spacing:.14em;text-transform:uppercase;color:var(--gold);text-decoration:none;background:none;border:0;padding:4px 0;cursor:pointer;border-bottom:1px solid transparent}
.sky .row a:hover,.sky .row button.pick:hover{border-bottom-color:var(--gold)}
.sky .tag{font:600 10px var(--util);letter-spacing:.14em;text-transform:uppercase;color:var(--faint)}
.sky section{display:flex;flex-direction:column;gap:10px;padding:0;background:none}
.sky .live{font-family:var(--util);font-size:12px;color:var(--faint)}
@media (prefers-reduced-motion:reduce){.sky *{transition:none!important}}
'''

# ---- the Chief's markup; the two sections of outside facts are written only with sourced rows ----
TEMPLATE = '''
    <section class="lf-sec lf-dark sky" aria-labelledby="sky-h">
    <div class="wrap">
      <header>
        <p class="eyebrow">Loxley Forest · Dahlonega, Georgia · 34.53° N</p>
        <h1 id="sky-h">The sky over <em>Loxley</em></h1>
        <p class="lede">Every night through mid-March, worked out for the treehouse deck: when the sun goes, when the bridge lights come on, where the moon stands, and how dark it gets. Drag the evening forward and watch it happen.</p>
      </header>

      <div class="scene">
        <canvas id="sky" width="800" height="1000" aria-label="The evening sky over the treehouse for the chosen date and time"></canvas>
        <div class="stamp"><span id="stampDate"></span><b id="stampTime"></b></div>
      </div>

      <div class="ctl">
        <label for="time">Evening</label>
        <input type="range" id="time" min="960" max="1440" step="5" value="1260">
        <button class="go" id="play" type="button">Watch the evening</button>
      </div>
      <div class="ctl">
        <button id="prev" type="button" aria-label="Previous night">‹ Night before</button>
        <input type="date" id="date" aria-label="Choose a night">
        <button id="next" type="button" aria-label="Next night">Night after ›</button>
      </div>
      <div class="chips" id="jumps" aria-label="Jump the evening to a moment"></div>
      <div class="chips" id="chips"></div>

      <p class="say" id="say"></p>
      <div class="facts" id="facts"></div>

      <section>
        <h2>Light for pictures</h2>
        <p class="note">Golden hour is the sun within six degrees of the horizon: warm, low, long shadows. Blue hour is the short deep-blue window just outside it, when the bridge lights and the lit canvas balance the sky. Times are for the deck; a ridge or the canopy can take the sun a few minutes early.</p>
        <div class="photo" id="photo"></div>
      </section>
{WILD_SECTION}
      <section>
        <h2>The darkest nights still open</h2>
        <p class="note">Ranked by how much of 8 to 11 PM the moon is down, and how thin it is when it is up. <span id="asof"></span> The booking page is the authority.</p>
        <div class="list" id="best"></div>
      </section>
{SHOWS_SECTION}
      <p class="note">Sun and moon computed for the treehouse's own latitude and longitude with a standard ephemeris. Clouds are not in it: no one can promise weather. A dark-sky score of 100 means no moon at all between 8 and 11 PM.</p>
    </div>
    </section>
'''

WILD_SECTION = '''
      <section>
        <h2>Who is out tonight</h2>
        <p class="note">What a guest is most likely to hear or see on the chosen night, and when to listen. Nobody can promise an animal. Each line comes from a wildlife agency or a published study, named beside it; several are from the states next door, and none is yet the family's own record of this forest.</p>
        <div class="list" id="wild"></div>
        <h3 class="sub">The year in the forest</h3>
        <div class="yearwrap"><div class="year" id="year"></div></div>
        <p class="note"><span class="key k-on"></span> in season <span class="key k-pk"></span> at its best <span class="key k-now"></span> the month you picked</p>
      </section>'''

SHOWS_SECTION = '''
      <section>
        <h2>Nights the sky puts on a show</h2>
        <p class="note">Meteor showers on their usual peak nights (the exact hour shifts a little each year), with that night's moon over the deck.</p>
        <div class="list" id="shows"></div>
      </section>'''

# The words this module adds to the Chief's: the live note and the taken night's tag.
WORDS = {
    'live': 'Open nights and nightly rates as the calendar stands now.',
    'snapshot': 'Open nights and nightly rates as the calendar stood at {asof} ET; the calendar did not answer just now.',
    'taken': 'Taken',
}

SCRIPT = r'''
<script>
(function () {
const DATA=__DATA__, WILD=__WILD__, SHOWS=__SHOWS__, WORDS=__WORDS__, API=__API__, UNIT=__UNIT__;
const days=DATA.days, byDate=Object.fromEntries(days.map(d=>[d.d,d]));
const $=id=>document.getElementById(id);
const fmtD=(iso,o)=>new Date(iso+'T12:00:00').toLocaleDateString('en-US',o||{weekday:'short',month:'short',day:'numeric'});
const fmtT=m=>{m=Math.round(m);let h=Math.floor(m/60)%24,mm=m%60,ap=h>=12?'PM':'AM';h=h%12||12;return h+':'+String(mm).padStart(2,'0')+' '+ap};
const todayIso=(()=>{const p=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());return byDate[p]?p:days[0].d})();
let cur=todayIso, playing=null, live=false;
const lerp=(a,b,t)=>a+(b-a)*t, clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function at(day,min){const x=clamp((min-960)/60,0,8), i=Math.min(7,Math.floor(x)), t=x-i, a=day.h[i], b=day.h[i+1];
  let az1=a[1],az2=b[1]; if(az2-az1>180)az1+=360; if(az1-az2>180)az2+=360;
  return {alt:lerp(a[0],b[0],t), az:(lerp(az1,az2,t)+360)%360, sun:lerp(a[2],b[2],t)}}
let seed=20261114; const rnd=()=>(seed=(seed*1664525+1013904223)>>>0)/4294967296;
const stars=Array.from({length:520},()=>({x:rnd(),y:Math.pow(rnd(),1.25),m:rnd(),tw:rnd()*6.28}));
const mix=(c1,c2,t)=>c1.map((v,i)=>Math.round(lerp(v,c2[i],t)));
const rgb=c=>`rgb(${c[0]},${c[1]},${c[2]})`;
function skyCols(s){const stops=[[6,[86,140,186],[196,205,190]],[0,[58,82,128],[238,150,92]],[-4,[30,44,86],[214,108,84]],[-9,[14,24,52],[70,62,96]],[-14,[8,14,30],[22,30,52]],[-18,[5,9,18],[10,18,26]]];
  if(s>=stops[0][0])return [stops[0][1],stops[0][2]];
  for(let i=0;i<stops.length-1;i++){const a=stops[i],b=stops[i+1];if(s<=a[0]&&s>=b[0]){const t=(a[0]-s)/(a[0]-b[0]);return [mix(a[1],b[1],t),mix(a[2],b[2],t)]}}
  const l=stops[stops.length-1];return [l[1],l[2]]}
function draw(){
  const cv=$('sky'), wide=matchMedia('(min-width:700px)').matches, dpr=Math.min(2,window.devicePixelRatio||1);
  const cssW=cv.clientWidth||400, cssH=cssW*(wide?10/16:5/4); const W=Math.round(cssW*dpr),H=Math.round(cssH*dpr);
  if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H}
  const g=cv.getContext('2d'), day=byDate[cur], min=+$('time').value, p=at(day,min);
  const hz=H*0.74;
  const [top,bot]=skyCols(p.sun); const gr=g.createLinearGradient(0,0,0,hz); gr.addColorStop(0,rgb(top)); gr.addColorStop(1,rgb(bot)); g.fillStyle=gr; g.fillRect(0,0,W,H);
  const moonUp=p.alt>0, moonF=moonUp?day.il/100*clamp(p.alt/12,0.25,1):0, vis=clamp((-p.sun-5)/9,0,1);
  for(const s of stars){const a=vis*(1-0.35*s.m)-s.m*moonF*0.95; if(a<=0.02)continue; const r=(0.6+1.3*(1-s.m))*dpr*(0.8+0.2*Math.sin(s.tw+min/9));
    g.globalAlpha=clamp(a,0,1); g.fillStyle='#f6f2e4'; g.beginPath(); g.arc(s.x*W,s.y*hz*0.96,r,0,6.283); g.fill()}
  g.globalAlpha=1;
  if(moonUp){const x=clamp((p.az-80)/200,0.04,0.96)*W, y=hz-clamp(p.alt/78,0,1)*(hz-H*0.07), r=Math.max(13*dpr,W*0.032), k=day.il/100;
    const halo=g.createRadialGradient(x,y,r*0.6,x,y,r*(2.2+3*k)); halo.addColorStop(0,`rgba(243,239,223,${0.10+0.22*k})`); halo.addColorStop(1,'rgba(243,239,223,0)'); g.fillStyle=halo; g.beginPath(); g.arc(x,y,r*(2.2+3*k),0,6.283); g.fill();
    g.save(); g.beginPath(); g.arc(x,y,r,0,6.283); g.clip(); g.fillStyle='rgba(40,48,58,0.9)'; g.fillRect(x-r,y-r,2*r,2*r);
    g.fillStyle='#f3efdf'; const dir=day.wx?1:-1; g.beginPath(); g.arc(x,y,r,-Math.PI/2,Math.PI/2,dir<0);
    const rx=r*Math.abs(1-2*k); g.ellipse(x,y,rx,r,0,Math.PI/2,-Math.PI/2,(k>0.5)?(dir<0):(dir>0)); g.fill(); g.restore()}
  const ridge=(y0,amp,f,col)=>{g.fillStyle=col; g.beginPath(); g.moveTo(0,H); for(let i=0;i<=60;i++){const x=i/60*W; g.lineTo(x,y0-amp*(Math.sin(i*f)+0.6*Math.sin(i*f*2.3+1.7)+0.3*Math.sin(i*f*5.1+0.4)))} g.lineTo(W,H); g.fill()};
  const dusk=clamp((p.sun+18)/20,0,1);
  ridge(hz,H*0.018,0.21,rgb(mix([9,18,16],[40,58,62],dusk))); ridge(hz+H*0.07,H*0.03,0.33,rgb(mix([6,13,11],[24,38,36],dusk)));
  g.fillStyle=rgb(mix([4,9,8],[14,24,22],dusk)); for(const [tx,tw] of [[0.06,0.022],[0.9,0.03],[0.97,0.02]]){g.fillRect(tx*W,H*0.1,tw*W,H*0.9)}
  const lit=clamp((-(p.sun)+1)/5,0,1), cx=W*0.66, base=H*0.80, ch=H*0.27, cw=W*(wide?0.11:0.17);
  const cone=(x,w,h,alpha)=>{const gl=g.createLinearGradient(x,base-h,x,base); gl.addColorStop(0,`rgba(${lerp(210,255,lit)|0},${lerp(205,190,lit)|0},${lerp(190,120,lit)|0},${alpha})`); gl.addColorStop(1,`rgba(${lerp(190,244,lit)|0},${lerp(185,128,lit)|0},${lerp(170,62,lit)|0},${alpha})`);
    g.fillStyle=gl; g.beginPath(); g.moveTo(x,base-h); g.lineTo(x+w,base); g.lineTo(x-w,base); g.closePath(); g.fill()};
  if(lit>0){const gw=g.createRadialGradient(cx,base-ch*0.4,4,cx,base-ch*0.4,cw*3.2); gw.addColorStop(0,`rgba(240,138,75,${0.30*lit})`); gw.addColorStop(1,'rgba(240,138,75,0)'); g.fillStyle=gw; g.fillRect(cx-cw*3.4,base-ch*1.5,cw*6.8,ch*2.2)}
  cone(cx-cw*0.95,cw*0.6,ch*0.62,0.9); cone(cx,cw,ch,1);
  g.fillStyle='#1a120c'; g.fillRect(cx-cw*1.7,base,cw*3.1,H*0.012); g.fillRect(cx-cw*0.1,base,cw*0.14,H*0.2); g.fillRect(cx+cw*1.1,base,cw*0.1,H*0.2);
  const bx0=-W*0.02, by0=H*0.865, bx1=cx-cw*1.7, by1=base+H*0.006, sag=H*0.03;
  const bp=t=>[lerp(bx0,bx1,t), lerp(by0,by1,t)+Math.sin(t*Math.PI)*sag];
  g.strokeStyle='#22180f'; g.lineWidth=Math.max(2,H*0.006); g.beginPath(); for(let i=0;i<=40;i++){const [x,y]=bp(i/40); i?g.lineTo(x,y):g.moveTo(x,y)} g.stroke();
  g.lineWidth=Math.max(1,H*0.002); g.beginPath(); for(let i=0;i<=40;i++){const [x,y]=bp(i/40); i?g.lineTo(x,y-H*0.045):g.moveTo(x,y-H*0.045)} g.stroke();
  const on=clamp((min-(day.ssm-6))/22,0,1);
  for(let i=1;i<26;i++){const [x,y]=bp(i/26), yy=y-H*0.045+Math.sin(i*2.1)*H*0.004; g.strokeStyle='#22180f'; g.beginPath(); g.moveTo(x,y); g.lineTo(x,yy); g.stroke();
    if(on>0){const a=on*(0.75+0.25*Math.sin(i*1.7+min/7)); const gl=g.createRadialGradient(x,yy,0,x,yy,H*0.022); gl.addColorStop(0,`rgba(255,214,140,${0.9*a})`); gl.addColorStop(1,'rgba(255,214,140,0)'); g.fillStyle=gl; g.beginPath(); g.arc(x,yy,H*0.022,0,6.283); g.fill();
      g.fillStyle=`rgba(255,238,200,${a})`; g.beginPath(); g.arc(x,yy,Math.max(1.4,H*0.0032),0,6.283); g.fill()}}
  $('stampDate').textContent=fmtD(cur,{weekday:'long',month:'long',day:'numeric'}); $('stampTime').textContent=fmtT(min);
}
function scoreClass(s){return s>=80?'s-hi':s>=45?'s-md':'s-lo'}
function moonLine(d){const ph=d.il<=3?'New moon':d.il>=97?'Full moon':(d.wx?'Waxing':'Waning')+' moon, '+d.il+'% lit';
  const mv=d.mr?('rises '+d.mr):d.ms?('sets '+d.ms):(d.h[5][0]>0?'up all evening':'down all evening'); return ph+', '+mv}
function moonAge(d){const i=days.indexOf(d); let f=null,nw=null;
  for(let k=0;k<45&&i+k<days.length;k++){const x=days[i+k]; if(f===null&&x.il>=99)f=k; if(nw===null&&x.il<=1)nw=k}
  const say=(k,w)=>k===0?w+' tonight':k===1?w+' tomorrow':w+' in '+k+' nights';
  return [f!==null?say(f,'Full moon'):'',nw!==null?say(nw,'New moon'):''].filter(Boolean).join('; ')+'.'}
const fill=(s,d)=>String(s).replace(/\{(\w+)\}/g,(m,k)=>d[k]!==undefined&&d[k]!==null?d[k]:m);
const moonUpEve=d=>[4,5,6,7].filter(i=>d.h[i][0]>0).length;
// A line's words for the night: an "inside" sentence only between its dates (the rut map's week), a
// moon tail when the moon is over half lit and up for the evening (the whip-poor-will).
function words(w,d){
  const pre=w.inside&&d.d>=w.inside.from&&d.d<=w.inside.to?fill(w.inside.text,d)+' ':'';
  const tail=w.moon_tail?(d.il>50&&moonUpEve(d)>=2?w.moon_tail.yes:w.moon_tail.no):'';
  return pre+fill(w.what,d)+tail;
}
const who=w=>(w.sources||[]).map(s=>`<a href="${s.url}" target="_blank" rel="noopener">${s.name}</a>`).join('; ');
function wild(){
  if(!WILD.length||!$('wild'))return;
  const d=byDate[cur], mo=+cur.slice(5,7);
  const on=WILD.filter(w=>w.months.includes(mo)).sort((a,b)=>(b.peak.includes(mo)?1:0)-(a.peak.includes(mo)?1:0));
  $('wild').innerHTML=on.map(w=>`<div class="row"><div class="a"><div class="t">${w.name}</div><div class="m"><b>${fill(w.when,d)}</b> ${words(w,d)}</div><div class="who">${who(w)}</div></div><div class="r"><span class="tag ${w.peak.includes(mo)?'best':'fair'}">${w.peak.includes(mo)?'At its best':'In season'}</span></div></div>`).join('');
  const M='JFMAMJJASOND';
  $('year').innerHTML='<span></span>'+[...M].map(x=>`<span class="hd">${x}</span>`).join('')+WILD.map(w=>`<span>${w.name}</span>`+Array.from({length:12},(_,i)=>`<span class="c${w.months.includes(i+1)?' on':''}${w.peak.includes(i+1)?' pk':''}${i+1===mo?' now':''}" title="${w.name}"></span>`).join('')).join('');
}
function sentence(d){
  const up=[4,5,6,7].filter(i=>d.h[i][0]>0).length;
  if(d.il>=93&&up>=3)return 'A full moon night. The holler goes silver and you can cross the bridge by moonlight alone.';
  if(d.sc>=95)return 'No moon in the evening sky. This is as dark as the forest gets: the kind of night the Milky Way shows.';
  if(d.mr&&up<=2)return 'Dark until the moon comes up at '+d.mr+'. Stars first from the deck, then moonrise through the trees.';
  if(d.ms&&up<=2)return 'The moon is gone by '+d.ms+'. The second half of the evening belongs to the stars.';
  if(d.sc>=60)return 'A thin moon and a mostly dark sky. Good stargazing once full dark arrives at '+d.dk+'.';
  return 'A bright moon rides over the deck tonight. Fewer stars, and a forest you can see into.';
}
function stateWord(d){return d.st==='open'?'Open':WORDS.taken}
function facts(){
  const d=byDate[cur];
  $('facts').innerHTML=[
    ['Sunset',d.ss,'Bridge lights come on about then. First stars near '+d.cv+'.'],
    ['Full dark',d.dk,'The last twilight is gone.'],
    ['The moon',d.il+'% lit',moonLine(d)+'. '+moonAge(d)],
    ['Dark-sky score',d.sc+' / 100',d.st?(stateWord(d)+(d.st==='open'&&d.rate?' · $'+Math.round(d.rate/100)+' a night before tax':'')):'']
  ].map(f=>`<div class="fact"><div class="k">${f[0]}</div><div class="v">${f[1]}</div><div class="s">${f[2]}</div></div>`).join('');
  $('say').textContent=sentence(d); $('date').value=cur; wild();
  const nxt=fmtD(addDays(cur,1),{weekday:'long'});
  $('photo').innerHTML=`<div class="col"><h3>This evening</h3><dl><dt>Golden hour</dt><dd>${d.gs} to ${d.ge}</dd><dt>Sunset</dt><dd>${d.ss}</dd><dt>Blue hour</dt><dd>${d.ge} to ${d.be}</dd><dt>Full dark</dt><dd>${d.dk}</dd></dl><p class="tip">Be on the bridge by ${d.gs}. The lit canvas against a blue sky is the frame between ${d.ge} and ${d.be}.</p></div>
  <div class="col"><h3>${nxt} morning</h3><dl><dt>Blue hour</dt><dd>${d.mb} to ${d.mg}</dd><dt>Sunrise</dt><dd>${d.sr}</dd><dt>Golden hour</dt><dd>${d.mg} to ${d.mge}</dd></dl><p class="tip">First light reaches the canopy before the deck. Coffee on the deck by ${d.mg}.</p></div>`;
  const J=[['Golden hour',d.gsm+15],['Sunset',d.ssm],['Blue hour',d.gem+5],['Full dark',d.dkm+10]]; if(d.mrm&&d.mrm>=960)J.push(['Moonrise',Math.min(1440,d.mrm+25)]);
  $('jumps').innerHTML=J.map(j=>`<button type="button" data-m="${j[1]}">${j[0]}</button>`).join('');
  $('jumps').querySelectorAll('button').forEach(b=>b.onclick=()=>{stop(); $('time').value=b.dataset.m; draw()});
}
function setDate(iso,keepTime){ if(!byDate[iso])return; cur=iso; if(!keepTime)$('time').value=Math.min(1440,Math.max(960,byDate[iso].dkm+75)); facts(); draw() }
function addDays(iso,n){const t=new Date(iso+'T12:00:00'); t.setDate(t.getDate()+n); return t.toISOString().slice(0,10)}
function bookUrl(d){return '/book?checkIn='+d.d+'&checkOut='+addDays(d.d,Math.max(1,d.min||1))+'&src=sky'}
function rowHtml(d,title,extra){
  const act=d.st==='open'?`<a href="${bookUrl(d)}">See this night ›</a>`:`<span class="tag">${WORDS.taken}</span>`;
  return `<div class="row"><div class="a"><div class="t">${title}</div><div class="m">${extra?extra+' · ':''}${moonLine(d)} · full dark ${d.dk}${d.st==='open'&&d.rate?' · $'+Math.round(d.rate/100)+' a night'+(d.min>1?', '+d.min+' nights at least':''):''}</div></div>
  <div class="r"><span class="score ${scoreClass(d.sc)}">${d.sc}</span><button class="pick" type="button" data-d="${d.d}">Show the sky</button>${act}</div></div>`;
}
function lists(){
  const fut=days.filter(d=>d.d>=todayIso);
  const best=fut.filter(d=>d.st==='open').sort((a,b)=>b.sc-a.sc||a.d.localeCompare(b.d));
  const seen=new Set(), top=[]; for(const d of best){const wk=d.d.slice(0,7)+'-'+Math.floor(new Date(d.d+'T12:00:00').getDate()/7); const fri=[5,6].includes(new Date(d.d+'T12:00:00').getDay()); const key=wk+(fri?'w':'d'); if(seen.has(key))continue; seen.add(key); top.push(d); if(top.length>=8)break}
  top.sort((a,b)=>a.d.localeCompare(b.d));
  $('best').innerHTML=top.map(d=>rowHtml(d,fmtD(d.d,{weekday:'long',month:'long',day:'numeric'}))).join('');
  if($('shows')){const shows=SHOWS.filter(s=>byDate[s.date]&&s.date>=todayIso);
    $('shows').innerHTML=shows.map(s=>rowHtml(byDate[s.date],s.name+', '+fmtD(s.date),s.line)).join('')}
  document.querySelectorAll('.sky button.pick').forEach(b=>b.onclick=()=>{setDate(b.dataset.d); $('sky').scrollIntoView({behavior:'smooth',block:'center'})});
}
function chips(){
  const c=[[todayIso,'Tonight'],['2026-11-28','Sat Nov 28'],['2026-12-24','Christmas Eve'],['2026-12-31','New Year’s Eve'],['2027-02-14','Valentine’s']].filter(x=>byDate[x[0]]);
  $('chips').innerHTML=c.map(x=>`<button type="button" data-d="${x[0]}">${x[1]}</button>`).join('');
  $('chips').querySelectorAll('button').forEach(b=>b.onclick=()=>setDate(b.dataset.d));
}
function stop(){ if(playing){cancelAnimationFrame(playing); playing=null; $('play').textContent='Watch the evening'} }
$('play').onclick=()=>{ if(playing){stop();return} const t0=performance.now(), from=Math.max(960,byDate[cur].gsm-10); $('play').textContent='Pause';
  const step=now=>{const m=from+(now-t0)/1000*28; if(m>=1440){$('time').value=1440; draw(); stop(); return} $('time').value=Math.round(m); draw(); playing=requestAnimationFrame(step)}; playing=requestAnimationFrame(step)};
$('time').oninput=()=>{stop(); draw()};
$('prev').onclick=()=>setDate(addDays(cur,-1),true); $('next').onclick=()=>setDate(addDays(cur,1),true);
$('date').min=days[0].d; $('date').max=days[days.length-1].d; $('date').onchange=e=>setDate(e.target.value,true);
// The open nights, live from the engine (the calendar the booking page reads); the table's own snapshot
// stands until it answers, and stays if it does not, with the note saying which it is.
function asof(){ $('asof').textContent=live?WORDS.live:WORDS.snapshot.replace('{asof}',new Date(DATA.asof).toLocaleString('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})) }
function applyLive(nights){
  const by={}; (nights||[]).forEach(n=>{ if(n&&n.night) by[n.night]=n });
  days.forEach(d=>{ const n=by[d.d]; if(n){ d.st='open'; d.rate=n.rate_cents||null; d.min=n.min_stay||1 } else { d.st='taken'; d.rate=null } });
  live=true; asof(); lists(); facts();
}
addEventListener('resize',draw);
chips(); asof(); lists(); setDate(cur);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(draw);
try {
  fetch(API+'/v1/availability?unit='+encodeURIComponent(UNIT),{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{ if(j&&Array.isArray(j.nights)) applyLive(j.nights) }).catch(function(){});
} catch (e) {}
})();
</script>
'''


def words_sha256(page_html):
    """Every sentence a visitor can read on the page: the markup's text, the script's string
    literals and the words block, as one canonical string."""
    body = re.search(r'<main id="main">(.*?)</main>', page_html, re.S).group(1)
    text = re.sub(r'<script\b.*?</script>', ' ', body, flags=re.S)
    text = re.sub(r'<[^>]+>', ' ', text)
    strings = re.findall(r"'((?:[^'\\]|\\.){4,})'", SCRIPT) + re.findall(r'`((?:[^`\\]|\\.){4,})`', SCRIPT)
    canon = ' '.join(text.split()) + '\n' + '\n'.join(strings) + '\n' + json.dumps(WORDS, sort_keys=True)
    return hashlib.sha256(canon.encode('utf-8')).hexdigest()


def page_sky():
    data = table()
    today = dt.date.today()
    last = dt.date.fromisoformat(data['days'][-1]['d'])
    if (last - today).days < TABLE_DAYS:
        raise SystemExit(f'sky: the table ends {last} , within {TABLE_DAYS} days of today: rerun scripts/site/sky/compute.py where ephem is installed and replace sky.json')
    f = facts()
    wild_rows, show_rows = sourced(f['wildlife']), sourced(f['showers'])
    head, gtm = sys.modules['lfpage_gift'].head_for(TITLE, DESC, URL, noindex=True)
    body = TEMPLATE.replace('{WILD_SECTION}', WILD_SECTION if wild_rows else '').replace('{SHOWS_SECTION}', SHOWS_SECTION if show_rows else '')
    js = (SCRIPT.replace('__DATA__', json.dumps(data, separators=(',', ':')).replace('</', '<\\/'))
          .replace('__WILD__', json.dumps(wild_rows, ensure_ascii=False).replace('</', '<\\/'))
          .replace('__SHOWS__', json.dumps(show_rows, ensure_ascii=False).replace('</', '<\\/'))
          .replace('__WORDS__', json.dumps(WORDS, ensure_ascii=False))
          .replace('__API__', json.dumps(B.API)).replace('__UNIT__', json.dumps(B.UNIT)))
    body = f'    <style>{CSS_SRC.strip()}</style>\n' + body + js
    print(f'sky: {len(data["days"])} nights to {last}; {len(wild_rows)} of {len(f["wildlife"])} wildlife rows and '
          f'{len(show_rows)} of {len(f["showers"])} shower rows sourced (unsourced rows are not written)')
    return SLUG + '.html', head, gtm, body, '/book', False


PAGES = [page_sky]
