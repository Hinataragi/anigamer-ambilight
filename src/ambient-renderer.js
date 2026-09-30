(() => {
  'use strict';

  // Everything is placed in viewport pixels; the video itself remains untouched.
  const VERTEX = `#version 300 es
    in vec2 position;
    void main() { gl_Position = vec4(position, 0., 1.); }
  `;
  const FRAGMENT = `#version 300 es
    precision highp float;
    uniform sampler2D frame;
    uniform vec2 resolution;
    uniform vec4 bounds;
    uniform vec4 crop;
    uniform float spread;
    uniform float saturation;
    uniform float strength;
    uniform float softness;
    uniform float detailAmount;
    uniform float contrast;
    uniform float remoteBrightness;
    uniform int method;
    uniform sampler2D history;
    uniform float historyMix;
    uniform float shapeAmount;
    out vec4 result;

    vec2 reflectOnce(vec2 q) {
      // Start at the actual edge. Compress the reflection farther out so that
      // a second complete face or subtitle cannot tile across the background.
      vec2 low = max(-q, 0.);
      vec2 high = max(q - 1., 0.);
      return clamp(q, 0., 1.) + low / (1. + low * (0.4 + shapeAmount * 2.8))
        - high / (1. + high * (0.4 + shapeAmount * 2.8));
    }
    vec3 readFrame(vec2 uv, float level) {
      vec2 halfPixel=.5 / vec2(textureSize(frame,0));
      return textureLod(frame, clamp(crop.xy + uv * crop.zw,
        crop.xy + halfPixel, crop.xy + crop.zw - halfPixel), level).rgb;
    }
    void main() {
      vec2 p = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y);
      vec2 q = (p - bounds.xy) / bounds.zw;
      vec2 outside = max(max(-q, q - 1.), 0.) * bounds.zw;
      float distance = length(outside);
      // 影片中央不繪製。邊緣保留兩個畫布像素的底襯，避免低解析度
      // 畫布放大插值時混入透明像素，露出一條暗縫；原影片尺寸不變。
      if(distance < .001){
        float inset=min(min(p.x-bounds.x,bounds.x+bounds.z-p.x),
          min(p.y-bounds.y,bounds.y+bounds.w-p.y));
        result=inset<=2.?vec4(readFrame(clamp(q,0.,1.),0.),1.):vec4(0.);
        return;
      }
      float size = min(bounds.z, bounds.w);
      float reach = max(90., size * (.34 + spread * .012));
      float t = distance / reach;
      vec2 edge=clamp(q,0.,1.);
      // Expanding rectangles project toward the centre along both axes.
      // Scale is 1 at the seam, preserving alignment without axial streaks.
      float projectionScale=1.+distance/max(size*(.8-shapeAmount*.6),1.);
      vec2 projected=clamp(.5+(q-.5)/projectionScale,0.,1.);
      vec2 uv = (method==3||method==4)?projected:method==0?reflectOnce(q):edge;
      if(method==7){
        // 旋轉從接縫外逐漸增加，接縫取樣仍與影片邊緣相接。
        float angle=shapeAmount*1.6*smoothstep(0.,reach,distance);
        vec2 centered=projected-.5;
        uv=clamp(.5+mat2(cos(angle),sin(angle),-sin(angle),cos(angle))*centered,0.,1.);
      }
      if(method==6){
        vec2 inward=sign(vec2(.5)-edge)*min(outside/bounds.zw*(.03+shapeAmount*.42),vec2(.32));
        uv=clamp(edge+inward,0.,1.);
      }
      float lod = clamp(log2(1. + distance * (.004 + softness * .32)), 0., 6.5);
      vec2 blur = vec2(distance * softness * .15) / bounds.zw;
      vec3 detail = readFrame(uv, lod) * .40;
      if(softness>.001){
        detail += readFrame(uv + vec2(blur.x, 0.), lod) * .15;
        detail += readFrame(uv - vec2(blur.x, 0.), lod) * .15;
        detail += readFrame(uv + vec2(0., blur.y), lod) * .15;
        detail += readFrame(uv - vec2(0., blur.y), lod) * .15;
      }else{detail*=2.5;}
      vec3 field = readFrame(uv, 7.);
      vec3 color = mix(field, detail, exp(-t * (1. + (1. - detailAmount) * 4.)));
      if(method==1){
        // Extrapolate a short, bounded edge gradient instead of duplicating
        // faces/subtitles. The tangent coordinate stays aligned with the video.
        vec2 inward=clamp(edge+sign(vec2(.5)-edge)*vec2(greaterThan(outside,vec2(0.)))*.015,0.,1.);
        vec3 boundary=readFrame(edge,0.);
        vec3 gradient=clamp(boundary-readFrame(inward,0.),vec3(-.08),vec3(.08));
        vec3 continuation=clamp(boundary+gradient*min(distance/12.,2.)*(shapeAmount*2.),0.,1.);
        color=mix(continuation,color,smoothstep(0.,reach*.8,distance));
      }else if(method==2){
        color=mix(readFrame(edge,0.),readFrame(edge,clamp(2.+shapeAmount*4.+t*3.,2.,7.)),smoothstep(0.,48.,distance));
      }else if(method==4){
        // Euclidean edge distance rounds all four corners. Increasing the
        // isotropic footprint softens the radial field without axial bands.
        color=mix(readFrame(edge,0.),readFrame(projected,clamp(1.+shapeAmount*4.+t*4.,1.,7.)),smoothstep(0.,60.,distance));
      }
      if(method==5){color=readFrame(edge,clamp(softness*5.,0.,5.));}
      float seam = smoothstep(0.,24.,distance);
      vec3 raw = color;
      float luma = dot(color, vec3(.2126, .7152, .0722));
      color = clamp(mix(vec3(luma), color, saturation), 0., 1.);
      color = clamp((color - .5) * contrast + .5,0.,1.);
      color *= remoteBrightness;
      color = mix(raw,color,seam);
      // The near seam is continuous; the remote light remains a quiet backdrop.
      float alpha = (.78 * exp(-t * 2.1) + .19 * exp(-t * .32)) * strength;
      if(method==5)alpha=exp(-distance/max(12.,reach*(.08+shapeAmount*.55)))*strength;
      alpha = mix(1.,alpha,seam);
      vec4 current = vec4(color, alpha);
      result = historyMix>0. ? mix(current, texture(history,gl_FragCoord.xy / resolution), historyMix * seam) : current;
    }
  `;

  // ── 二、WebGL 2 渲染、材質重用與非阻塞耗時計量 ──
  function createGPU(canvas) {
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
    });
    if (!gl) return null;
    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const message = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(message);
      }
      return shader;
    };
    const program = gl.createProgram();
    const shaders = [];
    // 初始化失敗也清掉已配置的資源，讓降級渲染不留下 GPU 物件。
    try {
      shaders.push(compile(gl.VERTEX_SHADER, VERTEX));
      shaders.push(compile(gl.FRAGMENT_SHADER, FRAGMENT));
      shaders.forEach((shader) => gl.attachShader(program, shader));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw new Error(gl.getProgramInfoLog(program));
    } catch (error) {
      shaders.forEach((shader) => gl.deleteShader(shader));
      gl.deleteProgram(program);
      throw error;
    }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl.LINEAR_MIPMAP_LINEAR,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const uniforms = Object.fromEntries(
      [
        'resolution',
        'bounds',
        'crop',
        'spread',
        'saturation',
        'strength',
        'softness',
        'detailAmount',
        'contrast',
        'remoteBrightness',
        'method',
        'history',
        'historyMix',
        'shapeAmount',
        'frame',
      ].map((name) => [name, gl.getUniformLocation(program, name)]),
    );
    let acceleration = 'unknown';
    try {
      const debug = gl.getExtension('WEBGL_debug_renderer_info');
      if (debug) {
        const adapter = String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL));
        acceleration =
          /swiftshader|llvmpipe|software|softpipe|microsoft basic render/i.test(
            adapter,
          )
            ? 'software'
            : 'hardware';
      }
    } catch {
      /* Privacy settings may hide the adapter. */
    }
    const histories = [0, 1].map(() => {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
      );
      return { texture, buffer: gl.createFramebuffer() };
    });
    const timerExtension = gl.getExtension('EXT_disjoint_timer_query_webgl2');
    const timer = timerExtension?.TIME_ELAPSED_EXT ? timerExtension : null;
    const pendingQueries = [];
    let gpuCost = 0,
      timedFrames = 0;
    let dimensions = '',
      geometry = '',
      historyValid = false,
      historyIndex = 0,
      lastTime = 0,
      sourceSize = '';
    let lost = false;
    const onLost = (event) => {
      event.preventDefault();
      lost = true;
    };
    const onRestore = () => {
      lost = true;
    };
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestore);
    return {
      kind: 'gpu',
      acceleration,
      get gpuCost() {
        return gpuCost;
      },
      draw(source, box, crop, settings) {
        if (lost) return false;
        // Poll only completed queries; never block waiting for GPU completion.
        if (timer) {
          while (
            pendingQueries.length &&
            gl.getQueryParameter(pendingQueries[0], gl.QUERY_RESULT_AVAILABLE)
          ) {
            const query = pendingQueries.shift();
            if (!gl.getParameter(timer.GPU_DISJOINT_EXT)) {
              const ms = gl.getQueryParameter(query, gl.QUERY_RESULT) / 1e6;
              if (Number.isFinite(ms))
                gpuCost = gpuCost ? gpuCost * 0.7 + ms * 0.3 : ms;
            } else gpuCost = 0;
            gl.deleteQuery(query);
          }
        }

        const smoothing = settings.smoothing ?? 0;
        const size = `${canvas.width}:${canvas.height}`;
        if (smoothing > 0 && size !== dimensions) {
          for (const item of histories) {
            gl.bindTexture(gl.TEXTURE_2D, item.texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(
              gl.TEXTURE_2D,
              gl.TEXTURE_WRAP_S,
              gl.CLAMP_TO_EDGE,
            );
            gl.texParameteri(
              gl.TEXTURE_2D,
              gl.TEXTURE_WRAP_T,
              gl.CLAMP_TO_EDGE,
            );
            gl.texImage2D(
              gl.TEXTURE_2D,
              0,
              gl.RGBA,
              canvas.width,
              canvas.height,
              0,
              gl.RGBA,
              gl.UNSIGNED_BYTE,
              null,
            );
            gl.bindFramebuffer(gl.FRAMEBUFFER, item.buffer);
            gl.framebufferTexture2D(
              gl.FRAMEBUFFER,
              gl.COLOR_ATTACHMENT0,
              gl.TEXTURE_2D,
              item.texture,
              0,
            );
            if (
              gl.checkFramebufferStatus(gl.FRAMEBUFFER) !==
              gl.FRAMEBUFFER_COMPLETE
            )
              return false;
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
          }
          dimensions = size;
          historyValid = false;
        }
        const position =
          box.map((v) => Math.round(v)).join(':') + crop.join(':');
        if (position !== geometry) {
          geometry = position;
          historyValid = false;
        }
        const now = performance.now(),
          elapsed = lastTime ? now - lastTime : 1000;
        lastTime = now;
        gl.bindFramebuffer(
          gl.FRAMEBUFFER,
          smoothing > 0 ? histories[1 - historyIndex].buffer : null,
        );
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        const nextSourceSize = `${source.videoWidth || source.width}:${source.videoHeight || source.height}`;
        if (nextSourceSize !== sourceSize) {
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            source,
          );
          sourceSize = nextSourceSize;
        } else
          gl.texSubImage2D(
            gl.TEXTURE_2D,
            0,
            0,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            source,
          );
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
        gl.uniform4f(uniforms.bounds, ...box);
        gl.uniform4f(uniforms.crop, ...crop);
        gl.uniform1f(uniforms.spread, settings.radius);
        gl.uniform1f(uniforms.saturation, settings.saturation / 100);
        gl.uniform1f(uniforms.strength, (settings.intensity ?? 85) / 100);
        gl.uniform1f(uniforms.softness, (settings.blur ?? 25) / 100);
        gl.uniform1f(uniforms.detailAmount, (settings.detail ?? 85) / 100);
        gl.uniform1f(uniforms.contrast, (settings.contrast ?? 100) / 100);
        gl.uniform1f(
          uniforms.remoteBrightness,
          (settings.backgroundBrightness ?? 100) / 100,
        );
        gl.uniform1i(
          uniforms.method,
          settings.method === 'swirl'
            ? 7
            : settings.method === 'stretch'
              ? 6
              : settings.method === 'band'
                ? 5
                : settings.method === 'radial'
                  ? 4
                  : settings.method === 'project'
                    ? 3
                    : settings.method === 'diffuse'
                      ? 2
                      : settings.method === 'contour'
                        ? 1
                        : 0,
        );
        const shapeKey = {
          project: 'projectionDepth',
          radial: 'radialRoundness',
          contour: 'contourStrength',
          reflect: 'reflectCompression',
          diffuse: 'diffusionDepth',
          band: 'bandWidth',
          stretch: 'stretchDepth',
          swirl: 'swirlAmount',
        }[settings.method];
        gl.uniform1f(uniforms.shapeAmount, (settings[shapeKey] ?? 50) / 100);
        gl.uniform1i(uniforms.frame, 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, histories[historyIndex].texture);
        gl.uniform1i(uniforms.history, 1);
        gl.uniform1f(
          uniforms.historyMix,
          historyValid && smoothing > 0
            ? Math.exp(-elapsed / (smoothing * 4))
            : 0,
        );
        const measure =
          timer && pendingQueries.length < 2 && ++timedFrames % 12 === 0
            ? gl.createQuery()
            : null;
        if (measure) gl.beginQuery(timer.TIME_ELAPSED_EXT, measure);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        if (smoothing > 0) {
          gl.bindFramebuffer(
            gl.READ_FRAMEBUFFER,
            histories[1 - historyIndex].buffer,
          );
          gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
          gl.blitFramebuffer(
            0,
            0,
            canvas.width,
            canvas.height,
            0,
            0,
            canvas.width,
            canvas.height,
            gl.COLOR_BUFFER_BIT,
            gl.NEAREST,
          );
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          historyIndex = 1 - historyIndex;
          historyValid = true;
        } else historyValid = false;
        // Submit promptly before the caller performs occasional CPU sampling.
        // flush is non-blocking; never wait for GPU completion with finish().
        if (measure) {
          gl.endQuery(timer.TIME_ELAPSED_EXT);
          pendingQueries.push(measure);
        }
        gl.flush?.();
        return true;
      },
      clear() {
        historyValid = false;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
      },
      destroy() {
        for (const query of pendingQueries) gl.deleteQuery(query);
        canvas.removeEventListener('webglcontextlost', onLost);
        canvas.removeEventListener('webglcontextrestored', onRestore);
        gl.deleteTexture(texture);
        gl.deleteBuffer(buffer);
        histories.forEach((item) => {
          gl.deleteTexture(item.texture);
          gl.deleteFramebuffer(item.buffer);
        });
        shaders.forEach((shader) => gl.deleteShader(shader));
        gl.deleteProgram(program);
      },
    };
  }

  // ── 三、Canvas 備援：不支援 WebGL 時保留基本效果 ──
  function createCPU(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const frame = document.createElement('canvas');
    frame.width = 384;
    frame.height = 216;
    const frameCtx = frame.getContext('2d');
    const previous = document.createElement('canvas');
    const previousCtx = previous.getContext('2d');
    let lastTime = 0,
      geometry = '';
    return {
      kind: 'canvas',
      acceleration: 'unknown',
      draw(source, box, crop, settings) {
        const [x, y, w, h] = box;
        if (w < 1 || h < 1) return true;
        const sw = source.videoWidth || source.width,
          sh = source.videoHeight || source.height;
        frameCtx.drawImage(
          source,
          crop[0] * sw,
          crop[1] * sh,
          crop[2] * sw,
          crop[3] * sh,
          0,
          0,
          384,
          216,
        );
        const position = box.map(Math.round).join(':') + crop.join(':');
        const now = performance.now(),
          elapsed = lastTime ? now - lastTime : 1000;
        const blend =
          position === geometry && settings.smoothing > 0
            ? Math.exp(-elapsed / (settings.smoothing * 4))
            : 0;
        if (
          blend > 0 &&
          (previous.width !== canvas.width || previous.height !== canvas.height)
        ) {
          previous.width = canvas.width;
          previous.height = canvas.height;
          lastTime = 0;
        } else if (blend > 0) {
          previousCtx.clearRect(0, 0, previous.width, previous.height);
          previousCtx.drawImage(canvas, 0, 0);
        }
        geometry = position;
        lastTime = now;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const shapeKey = {
          project: 'projectionDepth',
          radial: 'radialRoundness',
          contour: 'contourStrength',
          reflect: 'reflectCompression',
          diffuse: 'diffusionDepth',
          band: 'bandWidth',
          stretch: 'stretchDepth',
          swirl: 'swirlAmount',
        }[settings.method];
        const shape = (settings[shapeKey] ?? 50) / 100;
        const reach =
          Math.min(w, h) * (0.34 + settings.radius * 0.012) * (0.5 + shape);
        // Four clipped reflections preserve both spatial axes, including corners.
        const mx = Math.min(w, Math.max(reach, canvas.width));
        const my = Math.min(h, Math.max(reach, canvas.height));
        if (['project', 'radial', 'swirl'].includes(settings.method)) {
          ctx.save();
          ctx.filter = `blur(${settings.method === 'radial' ? 4 + shape * 16 : 2}px)`;
          for (let layer = 10; layer >= 1; layer--) {
            const scale = 1 + ((layer / 10) * reach) / (Math.min(w, h) * 0.5);
            ctx.globalAlpha = 0.2;
            ctx.save();
            if (settings.method === 'swirl') {
              ctx.translate(x + w / 2, y + h / 2);
              ctx.rotate(shape * 1.6 * (layer / 10) ** 2);
              ctx.translate(-x - w / 2, -y - h / 2);
            }
            ctx.drawImage(
              frame,
              x - (w * (scale - 1)) / 2,
              y - (h * (scale - 1)) / 2,
              w * scale,
              h * scale,
            );
            ctx.restore();
          }
          ctx.restore();
        } else
          for (let j = -1; j <= 1; j++)
            for (let i = -1; i <= 1; i++) {
              if (i === 0 && j === 0) continue;
              ctx.save();
              const soften =
                settings.method === 'diffuse'
                  ? 0.8
                  : (settings.blur ?? 25) / 100;
              ctx.filter = `blur(${Math.max(0, (reach * (soften + (100 - (settings.detail ?? 85)) / 100)) / 12)}px) saturate(${settings.saturation}%) contrast(${settings.contrast ?? 100}%) brightness(${settings.backgroundBrightness ?? 100}%)`;
              if (settings.method === 'reflect') {
                ctx.translate(
                  x + i * w + (i !== 0 ? w : 0),
                  y + j * h + (j !== 0 ? h : 0),
                );
                ctx.scale(i !== 0 ? -1 : 1, j !== 0 ? -1 : 1);
                ctx.drawImage(frame, 0, 0, w, h);
              } else {
                const strip =
                  settings.method === 'stretch'
                    ? Math.max(1, Math.round((0.03 + shape * 0.3) * 216))
                    : 1;
                const sx = i < 0 ? 0 : i > 0 ? 384 - strip : 0,
                  sy = j < 0 ? 0 : j > 0 ? 216 - strip : 0;
                ctx.drawImage(
                  frame,
                  sx,
                  sy,
                  i === 0 ? 384 : strip,
                  j === 0 ? 216 : strip,
                  x + i * w,
                  y + j * h,
                  w,
                  h,
                );
              }
              ctx.restore();
            }
        ctx.save();
        ctx.globalCompositeOperation = 'destination-in';
        const gradient = ctx.createRadialGradient(
          x + w / 2,
          y + h / 2,
          Math.min(w, h) * 0.2,
          x + w / 2,
          y + h / 2,
          Math.max(mx, my) * 1.6,
        );
        const intensity = (settings.intensity ?? 85) / 100;
        gradient.addColorStop(0, `rgba(0,0,0,${intensity})`);
        gradient.addColorStop(1, `rgba(0,0,0,${intensity * 0.17})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        // 與 GPU 使用相同的兩像素底襯，只消除畫布接縫，不裁切影片。
        ctx.drawImage(frame, x, y, w, h);
        ctx.clearRect(x + 2, y + 2, Math.max(0, w - 4), Math.max(0, h - 4));
        if (blend > 0) {
          ctx.save();
          ctx.globalAlpha = blend;
          ctx.drawImage(previous, 0, 0);
          ctx.restore();
          ctx.clearRect(x + 2, y + 2, Math.max(0, w - 4), Math.max(0, h - 4));
        }
        return true;
      },
      clear() {
        lastTime = 0;
        geometry = '';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      },
      destroy() {
        frame.width = frame.height = previous.width = previous.height = 1;
      },
    };
  }

  // ── 四、統一入口：GPU 不可用時讓呼叫端切換相容畫布 ──
  globalThis.AniAmbientRenderer = {
    create(canvas, preferCPU = false) {
      if (!preferCPU) {
        try {
          const gpu = createGPU(canvas);
          if (gpu) return gpu;
        } catch (error) {
          console.warn('[動畫瘋環境光] GPU renderer unavailable', error);
        }
        // Canvas contexts cannot change type; the caller replaces this canvas.
        if (canvas.getContext('webgl2')) return null;
      }
      return createCPU(canvas);
    },
  };
})();
