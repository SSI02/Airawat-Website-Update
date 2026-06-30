/* ============================================================
   WEBGL PLASMA — flowing teal/blue domain-warped noise.
   Renders into any <canvas data-shader>. Pure WebGL1 (no deps).
   Falls back silently to the CSS gradient backdrop if unsupported.
   ============================================================ */

const VERT = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2  u_res;
uniform float u_time;

// hash + value noise
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i+vec2(0.0,0.0)), hash(i+vec2(1.0,0.0)), u.x),
             mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0; float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for(int i=0;i<5;i++){ v += a*noise(p); p = m*p; a *= 0.5; }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  vec2 st = (gl_FragCoord.xy - 0.5*u_res.xy) / u_res.y;
  float t = u_time * 0.07;                         // calmer, slower flow

  // domain warping
  vec2 q = vec2(fbm(st*1.7 + t), fbm(st*1.7 + vec2(5.2,1.3) - t));
  vec2 r = vec2(fbm(st*1.7 + 2.4*q + vec2(1.7,9.2) + t*0.9),
                fbm(st*1.7 + 2.4*q + vec2(8.3,2.8) - t*0.8));
  float f = fbm(st*1.8 + 2.8*r);

  // LIGHT theme: near-white base with teal/blue tints flowing through it
  vec3 bg   = vec3(0.965, 0.972, 0.980);
  vec3 teal = vec3(0.34, 0.80, 0.71);
  vec3 blue = vec3(0.45, 0.60, 1.0);

  vec3 col = bg;
  col = mix(col, blue, smoothstep(0.32, 0.95, f) * 0.62);
  col = mix(col, teal, smoothstep(0.42, 1.05, f + 0.18*length(r)) * 0.68);

  // gentle vignette so edges fall to the light bg
  float vig = smoothstep(1.3, 0.2, length(st));
  col = mix(bg, col, vig);

  // subtle grain
  col += (hash(gl_FragCoord.xy + t) - 0.5) * 0.015;

  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.warn('shader compile failed', gl.getShaderInfoLog(s));
    return null;
  }
  return s;
}

function setup(canvas) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;

  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'u_res');
  const uTime = gl.getUniformLocation(prog, 'u_time');

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = null, running = false, t0 = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.floor(canvas.clientWidth * dpr);
    const h = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    gl.uniform2f(uRes, w, h);
  }

  function frame(now) {
    if (!t0) t0 = now;
    resize();
    gl.uniform1f(uTime, (now - t0) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (running) raf = requestAnimationFrame(frame);
  }

  function start() { if (!running && !reduced) { running = true; raf = requestAnimationFrame(frame); } }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }

  window.addEventListener('resize', resize);
  resize();

  if (reduced) { frame(0); return { start, stop }; } // one static frame

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? start() : stop())), { threshold: 0.01 })
      .observe(canvas);
  } else { start(); }

  return { start, stop };
}

export function initShaderHero() {
  document.querySelectorAll('canvas[data-shader]').forEach((c) => {
    try { setup(c); } catch (e) { /* fallback = CSS gradient already behind */ }
  });
}
