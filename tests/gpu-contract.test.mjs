import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
// Validate allocation/API scheduling, not shader pixels or browser acceleration.
const calls=[];
const constants=new Map();
const gl=new Proxy({}, {get(_target,name){
  if(String(name).match(/^[A-Z0-9_]+$/)){if(!constants.has(name))constants.set(name,constants.size+1);return constants.get(name);}
  if(name==='getShaderParameter'||name==='getProgramParameter')return()=>true;
  if(name==='checkFramebufferStatus')return()=>gl.FRAMEBUFFER_COMPLETE;
  if(name==='getExtension')return key=>key==='EXT_disjoint_timer_query_webgl2'?{TIME_ELAPSED_EXT:1001,GPU_DISJOINT_EXT:1002}:{UNMASKED_RENDERER_WEBGL:999};
  if(name==='getParameter')return key=>key===1002?false:'ANGLE (NVIDIA GPU)';
  if(name==='getQueryParameter')return(_query,key)=>key===gl.QUERY_RESULT_AVAILABLE?true:6000000;
  if(name==='getUniformLocation')return(_p,key)=>key;
  if(name==='getAttribLocation')return()=>0;
  if(String(name).startsWith('create'))return()=>({});
  return(...args)=>calls.push({name,args});
}});
const listeners=new Map();
const canvas={width:640,height:360,getContext:type=>type==='webgl2'?gl:null,addEventListener:(key,fn)=>listeners.set(key,fn),removeEventListener:key=>listeners.delete(key)};
const context=vm.createContext({performance,console});
vm.runInContext(fs.readFileSync('src/ambient-renderer.js','utf8'),context);
const renderer=context.AniAmbientRenderer.create(canvas);
assert.equal(renderer.kind,'gpu');assert.equal(renderer.acceleration,'hardware');
const settings={radius:80,saturation:100,intensity:95,smoothing:0,method:'contour'};
const source={width:1280,height:720};
renderer.draw(source,[80,50,480,270],[0,0,1,1],settings);
renderer.draw(source,[80,50,480,270],[0,0,1,1],{...settings,method:'diffuse'});
assert.equal(calls.filter(c=>c.name==='texImage2D'&&c.args.length===6).length,1);
assert.equal(calls.filter(c=>c.name==='texSubImage2D').length,1);
assert.equal(calls.filter(c=>c.name==='framebufferTexture2D').length,0);
assert.equal(calls.filter(c=>c.name==='blitFramebuffer').length,0);
assert.deepEqual(calls.filter(c=>c.name==='uniform1i'&&c.args[0]==='method').map(c=>c.args[1]),[1,2]);
for(const [method,value] of [['project',3],['radial',4],['band',5],['stretch',6],['swirl',7]]){renderer.draw(source,[80,50,480,270],[0,0,1,1],{...settings,method});assert.equal(calls.filter(c=>c.name==='uniform1i'&&c.args[0]==='method').at(-1).args[1],value);}
renderer.draw(source,[80,50,480,270],[0,0,1,1],{...settings,method:'band',bandWidth:80});assert.equal(calls.filter(c=>c.name==='uniform1f'&&c.args[0]==='shapeAmount').at(-1).args[1],.8);
renderer.draw(source,[80,50,480,270],[0,0,1,1],{...settings,method:'reflect',smoothing:20});
assert.equal(calls.filter(c=>c.name==='framebufferTexture2D').length,2);
assert.equal(calls.filter(c=>c.name==='blitFramebuffer').length,1);
for(let i=0;i<18;i++)renderer.draw(source,[80,50,480,270],[0,0,1,1],settings);
assert.ok(renderer.gpuCost>0,'Completed timer queries should contribute GPU cost');
assert.equal(calls.filter(c=>c.name==='beginQuery').length,calls.filter(c=>c.name==='endQuery').length,'GPU queries must be balanced');
assert.equal(calls.filter(c=>c.name==='finish').length,0,'Never block waiting for the GPU');
listeners.get('webglcontextlost')({preventDefault(){}});
assert.equal(renderer.draw(source,[0,0,480,270],[0,0,1,1],settings),false);
renderer.destroy();assert.equal(listeners.size,0);
// 模擬第二個 shader 編譯失敗與 program 連結失敗，確認降級前沒有遺留資源。
for(const failure of ['compile','link']) {
  const released=[]; let shaderCount=0;
  const broken=new Proxy(gl,{get(target,key){
    if(key==='getShaderParameter')return()=>failure!=='compile'||++shaderCount<2;
    if(key==='getProgramParameter')return()=>failure!=='link';
    if(key==='getShaderInfoLog'||key==='getProgramInfoLog')return()=>failure;
    if(key==='deleteShader'||key==='deleteProgram')return()=>released.push(key);
    return target[key];
  }});
  const fallbackCanvas={...canvas,getContext:type=>type==='webgl2'?broken:null};
  context.AniAmbientRenderer.create(fallbackCanvas);
  assert.equal(released.filter(key=>key==='deleteShader').length,2);
  assert.equal(released.filter(key=>key==='deleteProgram').length,1);
}
console.log('Passed GPU API contract: texture reuse, direct drawing without history buffers, selectable methods, optional history, context-loss fallback. No actual GLSL/browser/GPU benchmark performed.');
