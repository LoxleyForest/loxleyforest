#!/usr/bin/env node
/* Checks Before the Bridge's generator (new.py) in a real browser, on pages it makes into a
   temporary folder (never private/): one made-up shape per row of SHAPES below.

   Run from the repo:  node scripts/before-the-bridge/check.js      (SHOTS=dir keeps screenshots
   and the print PDF of the first shape; OUT=dir keeps the pages)
   Needs playwright-core (scripts/logo/node_modules has it; or set PLAYWRIGHT_CORE) and the Chromium
   at ~/.cache/ms-playwright/chromium-1243 (never "playwright install").

   Nothing leaves this machine. The pages are served here as the site serves them, at
   /private/<folder>/ with /favicon.svg from the repo; every request to anywhere else is refused and
   counted, and a self-contained page makes none. The names are made up (Zqxv and Wjkp).

   For every shape it proves:
     - the page is written with noindex, no Tag Manager, no token, no comment but its header, and
       neither name in it;
     - every line held for Mick (HOLDS in new.py) is out of the page; and, for the rows marked
       "every hold set", that the page still prints on four sheets once Mick has said yes to them;
     - at 390 px: no sideways scroll, the three embedded fonts loaded, no script error, no outside
       request; "#for=Zqxv and Wjkp" greets them by name and asks questions 3 and 4 by name, and
       without it the page says "Hi,";
     - printed on US letter: one PDF page per sheet (four), nothing spilling over;
     - its question count is the one new.py printed.
   And that new.py refuses what it must. */
'use strict';
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

let chromium;
for (const p of [process.env.PLAYWRIGHT_CORE, path.join(__dirname, '..', 'logo', 'node_modules', 'playwright-core'), 'playwright-core']) {
  if (!p) continue;
  try { chromium = require(p).chromium; break; } catch (e) {}
}
if (!chromium) { console.error('playwright-core not found (set PLAYWRIGHT_CORE)'); process.exit(2); }

const EXE = process.env.CHROME || path.join(process.env.HOME, '.cache/ms-playwright/chromium-1243/chrome-linux64/chrome');
const NEW = path.join(__dirname, 'new.py');
const OUT = process.env.OUT || fs.mkdtempSync(path.join(os.tmpdir(), 'btb-check-'));
const SHOTS = process.env.SHOTS || '';
const NAMES = ['Zqxv', 'Wjkp'];
const ROOT = path.resolve(__dirname, '..', '..');
// The words each hold keeps out of the page until Mick says yes (HOLDS in new.py, template.html).
const HELD = { laurel_grove: 'The laurel grove', pizza_house: 'The dough, the sauce and the cheese are ours',
  children_overnight: 'stay the night' };
// new.py with every hold set, as it will run once Mick has said yes to them all. For layout only:
// these pages stay in the temporary folder.
const ALL_SET = "import sys; sys.path.insert(0, sys.argv.pop(1)); import new\n" +
  "for h in new.HOLDS.values(): h['yes'] = 'check.js, layout only'\n" +
  "sys.exit(new.main(sys.argv[1:]))";

// The site, as far as these pages reach it: /private/<folder>/ from OUT, /favicon.svg from the repo.
function serve() {
  const server = http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.split('?')[0]);
    let file = null;
    const m = /^\/private\/([\w-]+)\/(index\.html)?$/.exec(u);
    if (m) file = path.join(OUT, m[1], 'index.html');
    else if (u === '/favicon.svg') file = path.join(ROOT, 'favicon.svg');
    if (!file || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': file.endsWith('.svg') ? 'image/svg+xml' : 'text/html; charset=utf-8' });
    res.end(fs.readFileSync(file));
  });
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok(server)));
}

// [label, new.py arguments, every hold set]. Made-up stays: the dates only shape the words.
const SHAPES = [
  ['The Vow on the deck, two girls, pizza, spring', '--check-in 2027-04-16 --check-out 2027-04-18 --package the-vow --site deck --alcohol --house-photographs --no-waterfall --children 2 --children-are girls --cake --pizza-night', false],
  ['The Vow, the two of them, own photographer, fall', '--check-in 2027-10-08 --check-out 2027-10-10 --package the-vow --site fire-circle --no-alcohol --own-photographer --waterfall', false],
  ['The Crossing, one boy, pizza, winter', '--check-in 2027-02-12 --check-out 2027-02-14 --package the-crossing --alcohol --house-photographs --no-waterfall --children 1 --children-are boys --pizza-night', false],
  ['The Crossing, the two of them, pizza, no alcohol, summer', '--check-in 2027-07-09 --check-out 2027-07-11 --package the-crossing --no-alcohol --own-photographer --waterfall --pizza-night', false],
  ['The Vow, one night, one child', '--check-in 2027-03-05 --check-out 2027-03-06 --package the-vow --site fire-circle --no-alcohol --own-photographer --no-waterfall --children 1', false],
  ['the fullest second sheet: own photographer, either site, bridge open, winter', '--check-in 2027-01-15 --check-out 2027-01-17 --package the-vow --site either --bridge-open --alcohol --own-photographer --waterfall', false],
  ['the fullest third sheet: The Crossing, six children, pizza', '--check-in 2027-06-04 --check-out 2027-06-07 --package the-crossing --site fire-circle --alcohol --own-photographer --waterfall --children 6 --pizza-night', false],
  ['the fullest second sheet, every hold set', '--check-in 2027-01-15 --check-out 2027-01-17 --package the-vow --site either --bridge-open --alcohol --own-photographer --waterfall', true],
  ['the fullest third sheet, every hold set', '--check-in 2027-06-04 --check-out 2027-06-07 --package the-crossing --site fire-circle --alcohol --own-photographer --waterfall --children 6 --pizza-night', true],
  ['The Crossing, the two of them, pizza, every hold set', '--check-in 2027-07-09 --check-out 2027-07-11 --package the-crossing --no-alcohol --own-photographer --waterfall --pizza-night', true],
];
const REFUSALS = [
  ['the waterfall package', '--check-in 2027-06-04 --check-out 2027-06-07 --package the-falls --alcohol --house-photographs --no-waterfall'],
  ['the bridge left open on the bridge', '--check-in 2027-03-05 --check-out 2027-03-07 --package the-crossing --site bridge --bridge-open --alcohol --house-photographs --no-waterfall'],
  ['a ceremony outside the stay', '--check-in 2027-04-16 --check-out 2027-04-18 --ceremony 2027-04-18 --package the-vow --site deck --alcohol --house-photographs --no-waterfall'],
  ['seven children', '--check-in 2027-04-16 --check-out 2027-04-18 --package the-vow --site deck --alcohol --house-photographs --no-waterfall --children 7'],
  ['no answer on alcohol', '--check-in 2027-04-16 --check-out 2027-04-18 --package the-vow --site deck --house-photographs --no-waterfall'],
  ['no call on the waterfall row', '--check-in 2027-04-16 --check-out 2027-04-18 --package the-vow --site deck --alcohol --house-photographs'],
  ['The Vow with no site', '--check-in 2027-04-16 --check-out 2027-04-18 --package the-vow --alcohol --house-photographs --no-waterfall'],
];

let bad = 0;

function make(args, allSet) {
  const argv = [...args.split(' '), '--out', OUT, '--for', NAMES.join(' and ')];
  const out = allSet ? execFileSync('python3', ['-c', ALL_SET, __dirname, ...argv], { encoding: 'utf8' })
    : execFileSync('python3', [NEW, ...argv], { encoding: 'utf8' });
  const file = /^made\s+(.*)$/m.exec(out)[1].trim();
  const qs = +/(\d+) questions/.exec(out)[1];
  const pages = +/(\d+) print pages/.exec(out)[1];
  return { file, qs, pages, out };
}

(async () => {
  const server = await serve();
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ executablePath: EXE });
  for (const [label, args, allSet] of SHAPES) {
    let failed = 0;
    const fail = (why) => { bad++; failed++; console.log(`  FAIL ${label}: ${why}`); };
    let m;
    try { m = make(args, allSet); } catch (e) { fail('new.py refused: ' + (e.stderr || e.message)); continue; }
    const src = fs.readFileSync(m.file, 'utf8');
    const bare = src.replace(/base64,[A-Za-z0-9+/=]+/g, 'base64,');
    if (!/<meta name="robots" content="noindex/.test(bare)) fail('no noindex');
    if (/googletagmanager|GTM-/.test(bare)) fail('Tag Manager on a private page');
    if (/\{\{|\}\}|\bHER\b|\bHIM\b/.test(bare)) fail('a name token is left in the page');
    for (const n of NAMES) if (bare.includes(n)) fail(`the name ${n} is in the file`);
    if (/[\u2013\u2014]/.test(bare)) fail('a dash the house does not use');
    if ((bare.match(/<!--/g) || []).length !== 1 || /MICK RATIFIES/i.test(bare)) fail('a comment beyond the header is in the page');
    if (/https?:\/\/(?!loxleyforest\.com)/.test(bare.replace(/<!--[\s\S]*?-->/g, ''))) fail('the page names an outside address');
    const children = / --children [1-9]/.test(args), pizza = / --pizza-night/.test(args);
    let met = 0;
    for (const [k, words] of Object.entries(HELD)) {
      const meets = k === 'laurel_grove' || (k === 'pizza_house' && pizza) || (k === 'children_overnight' && children);
      met += meets ? 1 : 0;
      if (!allSet && bare.includes(words)) fail(`held words in the page: ${words}`);
      if (allSet && meets && !bare.includes(words)) fail(`with every hold set, ${words} is not in the page`);
    }
    const named_holds = (m.out.match(/^held\s/gm) || []).length;
    if (named_holds !== (allSet ? 0 : met)) fail(`new.py named ${named_holds} holds, the page met ${allSet ? 0 : met}`);

    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    const outside = [], errors = [];
    await page.route('**/*', (r) => {
      const u = r.request().url();
      if (u.startsWith(origin + '/') || u.startsWith('data:')) return r.continue();
      outside.push(u); return r.abort();
    });
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (c) => { if (c.type() === 'error') errors.push(c.text()); });
    const url = `${origin}/private/${path.basename(path.dirname(m.file))}/`;

    await page.goto(url + '#for=' + encodeURIComponent(NAMES.join(' and ')));
    await page.evaluate(() => document.fonts.ready);
    const named = await page.evaluate(() => ({
      to: document.getElementById('to').textContent,
      q3: document.getElementById('q-other').textContent,
      q4: document.getElementById('q-back').textContent,
      sideways: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      fonts: [...document.fonts].map((f) => `${f.family} ${f.style} ${f.status}`),
      qs: document.querySelectorAll('.q .n').length,
      sheets: document.querySelectorAll('.sheet').length,
    }));
    if (named.to !== 'Zqxv and Wjkp,') fail(`greeting reads ${JSON.stringify(named.to)}`);
    if (named.q3 !== 'Wjkp, what is something about Zqxv that nobody else notices?') fail(`question 3 reads ${JSON.stringify(named.q3)}`);
    if (named.q4 !== 'Zqxv, the same question about Wjkp.') fail(`question 4 reads ${JSON.stringify(named.q4)}`);
    if (named.sideways > 0) fail(`${named.sideways}px of sideways scroll at 390`);
    if (named.fonts.length !== 3 || named.fonts.some((f) => !f.endsWith('loaded'))) fail('fonts: ' + named.fonts.join(', '));
    if (named.qs !== m.qs) fail(`${named.qs} questions on the page, new.py said ${m.qs}`);
    if (SHOTS && label === SHAPES[0][0]) {
      fs.mkdirSync(SHOTS, { recursive: true });
      await page.screenshot({ path: path.join(SHOTS, 'example-390-first-screen.png') });
      await page.screenshot({ path: path.join(SHOTS, 'example-390-full.png'), fullPage: true });
    }

    await page.goto(url);
    const plain = await page.evaluate(() => [document.getElementById('to').textContent, document.getElementById('q-other').textContent]);
    if (plain[0] !== 'Hi,') fail(`without names the greeting reads ${JSON.stringify(plain[0])}`);
    if (!/^One of you first/.test(plain[1])) fail(`without names question 3 reads ${JSON.stringify(plain[1])}`);

    await page.emulateMedia({ media: 'print' });
    const pdf = await page.pdf({ format: 'Letter', preferCSSPageSize: true, printBackground: true });
    const pdfPages = (pdf.toString('latin1').match(/\/Type\s*\/Page(?!s)/g) || []).length;
    if (pdfPages !== 4 || pdfPages !== named.sheets || pdfPages !== m.pages) fail(`${pdfPages} print pages for ${named.sheets} sheets (new.py said ${m.pages})`);
    if (SHOTS && label === SHAPES[0][0]) fs.writeFileSync(path.join(SHOTS, 'example-letter.pdf'), pdf);

    if (outside.length) fail('outside requests: ' + outside.join(' '));
    if (errors.length) fail('script errors: ' + errors.join(' | '));
    await ctx.close();
    if (!failed) console.log(`  ok   ${label}: ${named.qs} questions, ${pdfPages} print pages, sideways ${named.sideways}px, ${outside.length} outside requests`);
  }
  await browser.close();
  server.close();

  for (const [label, args] of REFUSALS) {
    const r = spawnSync('python3', [NEW, ...args.split(' '), '--out', OUT], { encoding: 'utf8' });
    if (r.status === 0) { bad++; console.log(`  FAIL refused ${label}: new.py made a page it should refuse`); }
    else console.log(`  ok   refused ${label}: ${(r.stderr.trim().split('\n').pop() || '').slice(0, 110)}`);
  }

  console.log(`check before-the-bridge: ${SHAPES.length} shapes, ${REFUSALS.length} refusals, ${bad} failed (pages in ${OUT})`);
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
