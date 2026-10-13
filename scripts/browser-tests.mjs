import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
// # Optional local smoke test for maintainers: start dev first; never use a text-based food selector.
const executablePath=process.env.PLAYWRIGHT_EXECUTABLE_PATH || (existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined);
const browser=await chromium.launch({headless:true,executablePath});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
const report={viewports:[],holdingUnlock:false,errors};
try{
  await page.goto(process.env.GAME_URL||'http://localhost:5173/');await page.getByRole('button',{name:/开始游戏/}).click();
  assert.equal(await page.locator('details').count(),0);
  for(const size of [{width:320,height:568},{width:375,height:812},{width:390,height:844},{width:393,height:852},{width:430,height:932}]){
    await page.setViewportSize(size);
    const r=await page.evaluate(()=>({width:innerWidth,height:innerHeight,scrollWidth:document.body.scrollWidth,scrollHeight:document.body.scrollHeight,toolbarBottom:document.querySelector('.tool-bar').getBoundingClientRect().bottom}));
    assert.equal(r.width,r.scrollWidth);assert.equal(r.height,r.scrollHeight);assert(r.toolbarBottom<=r.height);report.viewports.push(r);
  }
  assert.equal(await page.locator('[data-holding]').count(),3);
  await page.getByRole('button',{name:'语音解锁暂存格',exact:true}).click();await page.getByText('“蒋雨童最棒”',{exact:true}).waitFor();
  // # Mock success exercises UI/state wiring; this does not validate an actual microphone or speech service.
  await page.getByRole('button',{name:/模拟识别成功/}).click();await page.locator('[data-holding="3"]').waitFor();
  assert.equal(await page.locator('[data-holding]').count(),4);assert.equal(await page.getByRole('button',{name:'语音解锁暂存格',exact:true}).count(),0);report.holdingUnlock=true;
  await mkdir('test-results',{recursive:true});await page.screenshot({path:'test-results/game-v1.3.jpg'});assert.deepEqual(errors,[]);
  await writeFile('test-results/browser-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
