import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true,
  args: ['--no-sandbox','--disable-dev-shm-usage','--window-size=1280,800'] });
const p = await b.newPage();
await p.setViewport({ width: 1280, height: 800 });
await p.goto('http://localhost:4173', { waitUntil: 'networkidle0' });
const rec = await p.screencast({ path: 'video/build/live-ui.webm' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
await sleep(1200);
// clear prefilled input and type the demo question like a person
await p.evaluate(() => { document.querySelector('#q').value = ''; });
await p.type('#q', 'Should Meridian Roast switch its oat-milk supplier, and to whom, and why?', { delay: 45 });
await sleep(600);
await p.click('#ask');
await p.waitForFunction(() => document.body.innerText.includes('verified claims'), { timeout: 30000 });
await sleep(2500);
await p.screenshot({ path: '/tmp/deck-answer.png' });
// expand the first evidence trail
await p.evaluate(() => document.querySelector('details summary').click());
await sleep(1800);
await p.screenshot({ path: '/tmp/deck-evidence.png' });
await p.evaluate(() => window.scrollBy(0, 300));
await sleep(1500);
await rec.stop();
await b.close();
console.log('capture done');
