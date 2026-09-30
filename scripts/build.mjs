import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const { format } = await import('prettier');
const source = path.join(root, 'src');
const out = path.join(root, 'dist');
const version = JSON.parse(
  fs.readFileSync(path.join(source, 'manifest.json'), 'utf8'),
).version;
const css = ['content.css', 'effects.css', 'settings-ui.css']
  .map((file) => fs.readFileSync(path.join(source, file), 'utf8'))
  .join('\n');
const blackBars = fs.readFileSync(path.join(source, 'black-bars.js'), 'utf8');
const renderer = fs.readFileSync(
  path.join(source, 'ambient-renderer.js'),
  'utf8',
);
const core = fs.readFileSync(path.join(source, 'content.js'), 'utf8');
const settingsModule = fs.readFileSync(
  path.join(source, 'settings.js'),
  'utf8',
);
const key = 'aniAmbientSettingsV1';
fs.mkdirSync(out, { recursive: true });
const bridge = `
const listeners=new Set();
let cached={};
const emit=(oldValue,newValue)=>{
  const changes={};
  for(const key of Object.keys(newValue))if(oldValue[key]!==newValue[key])changes[key]={oldValue:oldValue[key],newValue:newValue[key]};
  for(const listener of listeners)listener(changes,'sync');
};
globalThis.AniAmbientStorage={
  get(defaults,callback){Promise.resolve(GM_getValue('${key}',{})).then(saved=>{cached={...defaults,...saved};callback(cached);});},
  set(values){const before=cached;cached={...cached,...values};Promise.resolve(GM_setValue('${key}',cached)).then(()=>emit(before,cached));},
  onChanged:{addListener(listener){listeners.add(listener);}}
};
if(typeof GM_addValueChangeListener==='function')GM_addValueChangeListener('${key}',(_key,oldValue,newValue,remote)=>{if(remote){cached=newValue||{};emit(oldValue||{},cached);}});
`;
const metadata = `// ==UserScript==
// @name         anigamer-ambilight｜動畫瘋環境光與沉浸版面
// @namespace    https://ani.gamer.com.tw/ani-ambientlight
// @version      ${version}
// @description  動畫瘋環境光與播放頁主題編輯器。可只用美化主題，獨立調整光暈、配色、字體與版型。非官方。
// @homepageURL  https://github.com/Hinataragi/anigamer-ambilight
// @supportURL   https://github.com/Hinataragi/anigamer-ambilight/issues
// @downloadURL  https://github.com/Hinataragi/anigamer-ambilight/releases/latest/download/anigamer-ambilight.user.js
// @updateURL    https://github.com/Hinataragi/anigamer-ambilight/releases/latest/download/anigamer-ambilight.user.js
// @license      MIT
// @match        https://ani.gamer.com.tw/*
// @run-at       document-start
// @inject-into  content
// @noframes
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// ==/UserScript==
`;
const license = fs.readFileSync(path.join(source, 'LICENSE'), 'utf8');
// 保留多行 CSS，讓安裝後的完整腳本也能閱讀與修改。
const styleLiteral =
  '`' +
  css.replaceAll('\\', '\\\\').replaceAll('`', '\\`').replaceAll('${', '\\${') +
  '`';
// Keep a stable DOM marker so installed scripts replace the older local
// preview on this development browser, instead of running two renderers.
const legacyGuard = `const reserve=()=>{if(!document.documentElement)return false;const marker=document.createElement('meta');marker.name='anigamer-ambilight-userscript';marker.dataset.aniPreview='installed';marker.dataset.aniV1='installed';document.documentElement.append(marker);return true;};if(!reserve()){const observer=new MutationObserver(()=>{if(reserve())observer.disconnect();});observer.observe(document,{childList:true,subtree:true});}`;
const bundled =
  metadata +
  `\n/* Inspired by WesselKroos/youtube-ambilight and iceorange-dev/bilibili-ambilight.\nhttps://github.com/WesselKroos/youtube-ambilight\nhttps://github.com/iceorange-dev/bilibili-ambilight\n${license}\n*/\n(()=>{\n'use strict';\n// 一、避免與舊版開發預覽重複執行\n${legacyGuard}\nconst start=()=>{\n// 二、使用者設定儲存\n${bridge}\n// 三、主題與設定介面樣式\nGM_addStyle(${styleLiteral});\n// 四、設定定義與表單\n${settingsModule}\n// 五、黑條辨識\n${blackBars}\n// 六、光暈渲染\n${renderer}\n// 七、頁面整合與生命週期\n${core}\nGM_registerMenuCommand('觀影設定',()=>document.querySelector('.ani-view-settings')?.click());\n};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();\n})();\n`;
fs.writeFileSync(
  path.join(out, 'ani-ambilight.user.js'),
  await format(bundled, {
    parser: 'babel',
    singleQuote: true,
    printWidth: 100,
  }),
);

const extension = path.join(out, 'extension');
fs.mkdirSync(extension, { recursive: true });
for (const file of [
  'manifest.json',
  'settings.js',
  'black-bars.js',
  'ambient-renderer.js',
  'content.js',
  'content.css',
  'effects.css',
  'settings-ui.css',
  'popup.html',
  'popup.js',
  'popup.css',
  'LICENSE.youtube-ambilight',
  'LICENSE.bilibili-ambilight',
  'LICENSE',
])
  fs.copyFileSync(path.join(source, file), path.join(extension, file));
// Firefox 暫時載入版共用原始碼，僅調整瀏覽器專用的 manifest 欄位。
const firefox = path.join(out, 'extension-firefox');
fs.cpSync(extension, firefox, { recursive: true });
const firefoxManifest = JSON.parse(
  fs.readFileSync(path.join(firefox, 'manifest.json'), 'utf8'),
);
delete firefoxManifest.minimum_chrome_version;
delete firefoxManifest.version_name;
firefoxManifest.browser_specific_settings = {
  gecko: {
    id: 'anigamer-ambilight@hinataragi',
    strict_min_version: '128.0',
    data_collection_permissions: { required: ['none'] },
  },
};
fs.writeFileSync(
  path.join(firefox, 'manifest.json'),
  JSON.stringify(firefoxManifest, null, 2),
);
console.log(
  'Built userscript, Chromium extension and Firefox temporary extension.',
);
