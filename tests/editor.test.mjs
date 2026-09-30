import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const {JSDOM}=require('jsdom');
const dom=new JSDOM('<body><div class="top_sky"><div class="sky"><div class="container-player"></div></div></div><div id="BH_background"><div class="container-player"><section class="player"><div class="videoframe"><div class="video"><div id="video-container"><div id="ani_video" class="video-js"><video class="vjs-tech"></video><div class="vjs-control-bar"></div></div></div></div></div><div class="subtitle"></div></section><div class="anime-title"><div class="season"><ul><li><a href="#">1</a></li></ul></div></div></div></div></body>',{url:'https://ani.gamer.com.tw/animeVideo.php?sn=48204',runScripts:'outside-only',pretendToBeVisual:true});
const fixtures=dom.window.document.querySelector('#BH_background .container-player');
fixtures.insertAdjacentHTML('beforeend','<section class="data">資料</section><div class="old_list">相關動畫</div><div class="animate-theme-list"><div class="theme-extend-block">新聞</div></div><div id="w-post-box">留言</div>');
const w=dom.window;w.matchMedia=()=>({matches:false,addEventListener(){}});
w.HTMLCanvasElement.prototype.getContext=()=>({});w.AniAmbientRenderer={create:()=>({kind:'gpu',draw:()=>true,destroy(){},clear(){}})};
let mutations=0;const OriginalObserver=w.MutationObserver;
w.MutationObserver=class extends OriginalObserver{constructor(fn){super((entries,observer)=>{mutations++;if(mutations>100)throw new Error('Observer feedback loop');fn(entries,observer);});}};
for(const file of ['settings.js','content.js'])w.eval(fs.readFileSync('src/'+file,'utf8'));
const panel=w.document.querySelector('.ani-view-settings-panel'),change=(key,value)=>{const e=panel.querySelector(`[data-setting="${key}"]`);if(e.type==='checkbox')e.checked=value;else e.value=value;e.dispatchEvent(new w.Event('input',{bubbles:true}));};
assert.equal(panel.querySelector('[data-effect-choice="balanced"]').getAttribute('aria-pressed'),'true','Fresh defaults match natural extension');
panel.querySelector('[data-effect-choice="soft"]').click();
assert.equal(panel.querySelector('[data-effect-choice="soft"]').getAttribute('aria-pressed'),'true');
panel.querySelector('[data-category="light"]').click();
panel.querySelector('[data-reset-category]').click();
assert.equal(panel.querySelector('[data-setting="method"]').value,w.AniAmbientSettings.defaults.method);
assert.equal(panel.querySelector('[data-setting="blur"]').value,String(w.AniAmbientSettings.defaults.blur));
change('textSize',18);change('headerOpacity',50);
panel.querySelector('[data-category="surfaces"]').click();panel.querySelector('[data-reset-category]').click();
assert.equal(panel.querySelector('[data-setting="headerOpacity"]').value,String(w.AniAmbientSettings.defaults.headerOpacity));
assert.equal(panel.querySelector('[data-setting="textSize"]').value,'18','Category reset preserves unrelated fields');
assert.equal(w.AniAmbientSettings.normalize({customFontName:'Name;url(test)'}).customFontName,'Nameurltest');
await new Promise(resolve=>setTimeout(resolve,25));assert.ok(mutations<20,'Paused native player must remain idle');
assert.equal(panel.querySelector('[data-setting="watchWidth"]').disabled,true);
assert.equal(w.document.body.classList.contains('ani-custom-watch-width'),false);
change('customWatchWidth',true);assert.equal(panel.querySelector('[data-setting="watchWidth"]').disabled,false);change('customWatchWidth',false);
assert.equal(w.document.body.classList.contains('ani-theater-layout'),false,'Native layout is the default');
change('playerLayout','columns');assert.equal(w.document.body.classList.contains('ani-theater-layout'),true);
const frame=w.document.querySelector('.videoframe'),box=frame.querySelector('.video');frame.classList.add('vjs-fullwindow');box.classList.add('fullwindow');
await new Promise(resolve=>setTimeout(resolve,25));assert.equal(w.document.body.classList.contains('ani-theater-layout'),false,'Native theater mode must take priority');
frame.classList.remove('vjs-fullwindow');box.classList.remove('fullwindow');await new Promise(resolve=>setTimeout(resolve,25));assert.equal(w.document.body.classList.contains('ani-theater-layout'),true);
change('episodesLayout',false);assert.equal(w.document.querySelector('.ani-episode-shelf'),null);assert.ok(w.document.querySelector('.anime-title .season'));
change('navLayout',false);assert.equal(w.document.body.classList.contains('ani-layout-nav'),false);assert.equal(w.document.body.classList.contains('ani-layout-info'),true);
for(const key of ['cinema','charcoal','paper','forest','violet','reading']){panel.querySelector(`[data-theme-preset="${key}"]`).click();assert.equal(panel.querySelector(`[data-theme-preset="${key}"]`).getAttribute('aria-pressed'),'true');assert.equal(panel.querySelector('[data-setting="playerLayout"]').value,'columns');assert.equal(panel.querySelector('[data-setting="customWatchWidth"]').checked,false);}

assert.equal(w.AniAmbientSettings.defaults.quickCollapse,true);
assert.equal(w.AniAmbientSettings.defaults.commentArrangement,'single');
change('commentArrangement','double');assert.ok(w.document.body.classList.contains('ani-comments-double'));
change('commentArrangement','single');assert.equal(w.document.body.classList.contains('ani-comments-double'),false);
assert.ok(w.document.querySelector('.ani-watch-tools').previousElementSibling.matches('section.player'),'Viewing tools follow the native player');
assert.equal(w.AniAmbientSettings.defaults.hideDanmuScrollbar,true);
assert.ok(w.document.querySelector('.ani-region-fold-control'),'Default page provides fold controls');
panel.querySelector('[data-method-choice="radial"]').click();assert.equal(panel.querySelector('[data-setting="method"]').value,'radial');
w.document.querySelector('.ani-focus-toggle').click();assert.equal(w.document.body.classList.contains('ani-focus-mode'),true);
w.document.querySelector('.ani-focus-toggle').click();assert.equal(w.document.body.classList.contains('ani-focus-mode'),false);
w.document.querySelector('.ani-danmu-toggle').click();assert.equal(w.document.body.classList.contains('ani-hide-danmu'),true);
w.document.querySelector('.ani-danmu-toggle').click();assert.equal(w.document.body.classList.contains('ani-hide-danmu'),false);
const custom=panel.querySelector('[data-setting="customFontName"]');custom.value='Noto Sans TC';custom.dispatchEvent(new w.Event('change',{bubbles:true}));assert.equal(custom.value,'Noto Sans TC');
assert.equal(panel.querySelector('[data-setting="hideDuringAds"]'),null);
change('quickCollapse',false);
change('episodesLayout',true);change('episodeStyle','collapse');
const shelf=w.document.querySelector('.ani-episode-shelf'),episodeButton=shelf.querySelector('.ani-region-toggle'),season=shelf.querySelector('.season');
assert.equal(season.hidden,true);assert.equal(episodeButton.getAttribute('aria-expanded'),'false');
episodeButton.click();assert.equal(season.hidden,false);assert.equal(episodeButton.getAttribute('aria-expanded'),'true');
change('episodeStyle','wrap');assert.equal(shelf.querySelector('.ani-region-toggle'),null);assert.equal(season.hidden,false);
for(const [flag,selector] of [['foldInfo','section.data'],['foldRelated','.old_list'],['foldNews','.animate-theme-list'],['foldComments','#w-post-box']]){
  change(flag,true);const target=w.document.querySelector(selector),button=w.document.querySelector('[aria-controls="'+target.id+'"]');
  assert.ok(button,'Enabled section must provide a control');button.click();assert.equal(target.hidden,true);assert.equal(button.getAttribute('aria-expanded'),'false');
  change(flag,false);assert.equal(target.hidden,false);assert.equal(button.isConnected,false);
}
for(const key of ['showInfo','showRelated','showNews','showComments'])change(key,false);
assert.ok(w.document.body.classList.contains('ani-hide-comments'));
await new Promise(resolve=>setTimeout(resolve,25));assert.ok(mutations<50);
assert.equal(panel.querySelectorAll('[data-category]').length,9);
panel.querySelector('[data-category-shortcut="light"]').click();
assert.equal(panel.querySelector('[data-settings-page="light"]').hidden,false);
assert.equal(panel.querySelector('[data-category-shortcut="light"]').getAttribute('aria-current'),'page');
panel.querySelector('[data-category-shortcut="themes"]').click();
assert.equal(panel.querySelector('[data-settings-page="themes"]').hidden,false);
assert.equal(panel.querySelector('[data-category-shortcut="light"]').hasAttribute('aria-current'),false);
change('method','band');assert.equal(panel.querySelector('[data-setting="bandWidth"]').closest('.ani-setting-row').hidden,false);
assert.equal(panel.querySelector('[data-setting="projectionDepth"]').closest('.ani-setting-row').hidden,true);
const performancePreset=panel.querySelector('[data-performance-preset]');performancePreset.value='smooth';performancePreset.dispatchEvent(new w.Event('input',{bubbles:true}));
assert.equal(panel.querySelector('[data-setting="renderWidth"]').value,'960');assert.equal(panel.querySelector('[data-setting="fps"]').value,'0');assert.equal(panel.querySelector('[data-setting="smoothing"]').value,'0');
assert.equal(panel.querySelectorAll('[data-reset-setting]').length,Object.keys(w.AniAmbientSettings.defaults).length);
for(const input of panel.querySelectorAll('[data-settings-overview] [data-setting]')) {
  assert.equal(input.getAttribute('aria-label'),input.closest('label').querySelector('span').textContent);
}
assert.deepEqual([...panel.querySelectorAll('.ani-method-group')].map(group=>group.querySelectorAll('[data-method-choice]').length),[4,2,2]);
assert.equal(dom.window.AniAmbientSettings.defaults.settingsOpacity,70);
assert.equal(dom.window.AniAmbientSettings.normalize({method:'swirl',swirlAmount:65}).swirlAmount,65);
const originalBase=w.document.body.style.getPropertyValue('--ani-base');
const hexField=panel.querySelector('[data-setting="customBase"]');
hexField.value='#abc';hexField.dispatchEvent(new w.Event('change',{bubbles:true}));
assert.equal(hexField.value,'#aabbcc');
change('customPalette',true);
assert.equal(w.document.body.style.getPropertyValue('--ani-base'),'#aabbcc');
assert.equal(w.AniAmbientSettings.normalize({customBase:'url(bad)'}).customBase,'#0b1017');
change('customPalette',false);
assert.equal(w.document.body.style.getPropertyValue('--ani-base'),originalBase);
assert.equal(w.document.body.classList.contains('ani-footer-glow'),true);
change('footerGlow',false);assert.equal(w.document.body.classList.contains('ani-footer-glow'),false);
change('footerGlow',true);
for(const button of panel.querySelectorAll('[data-method-choice]')){
  button.click();assert.equal(panel.querySelector('[data-setting="method"]').value,button.dataset.methodChoice);
  assert.equal(panel.querySelectorAll('[data-method-choice][aria-pressed="true"]').length,1);
}
// 舊版與較新備份都保留已知欄位，新增欄位補預設；未知欄位不套用。
const importInput=panel.querySelector('[data-import-file]');
for(const backup of [{version:1,settings:{intensity:75}}, {format:'anigamer-ambilight',version:2,scriptVersion:'2.0.0',settings:{intensity:80,futureSetting:999}}]) {
  Object.defineProperty(importInput,'files',{configurable:true,value:[{size:100,text:async()=>JSON.stringify(backup)}]});
  importInput.dispatchEvent(new w.Event('change'));
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(panel.querySelector('[data-setting="intensity"]').value,String(backup.settings.intensity));
  assert.equal(panel.querySelector('[data-setting="swirlAmount"]').value,'35');
  assert.match(panel.querySelector('.ani-settings-status').textContent,/已匯入/);
}
dom.window.close();console.log('Passed: native geometry, bounded observer, reversible layouts, themes, per-setting reset, eight grouped methods, old and newer backup import.');
