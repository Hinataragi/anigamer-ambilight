import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=file=>fs.readFileSync('src/'+file,'utf8');
const context=vm.createContext({});vm.runInContext(source('black-bars.js'),context);
const fixture=({left=0,right=0,top=0,bottom=0,black=false,uniform=false}={})=>{
 const data=new Uint8ClampedArray(96*54*4);
 for(let y=0;y<54;y++)for(let x=0;x<96;x++){const i=(y*96+x)*4;const active=x>=left&&x<96-right&&y>=top&&y<54-bottom;const value=black||!active?0:uniform?80:50+((x*11+y*7)%180);data[i]=data[i+1]=data[i+2]=value;data[i+3]=255;}
 return data;
};
const detect=options=>JSON.parse(JSON.stringify(context.AniAmbientBlackBars.detect(fixture(options),96,54,20)));
const empty={left:0,top:0,right:0,bottom:0};
assert.deepEqual(detect({}),empty);
for(const fixture of [{top:7,bottom:7},{left:12,right:12},{left:21,right:21},{left:33,right:33},{top:5,bottom:5,left:9,right:9}])assert.deepEqual(detect(fixture),{...empty,...fixture});
assert.deepEqual(detect({black:true}),empty);
assert.deepEqual(detect({uniform:true}),empty);
assert.deepEqual(detect({top:9,bottom:0}),empty);
const subtitle=fixture({top:7,bottom:7});for(let x=36;x<60;x++)for(let y=49;y<52;y++){const i=(y*96+x)*4;subtitle[i]=subtitle[i+1]=subtitle[i+2]=230;}
assert.deepEqual(JSON.parse(JSON.stringify(context.AniAmbientBlackBars.detect(subtitle,96,54,20))),empty,'Text inside black bars must remain visible');
console.log('Passed: 9-category navigation/back/Escape, independent font scope, presets/defaults, opt-in coverage, aspect-ratio fixtures, dark-scene rejection and subtitle preservation.');
