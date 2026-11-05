// Lava e fuoco in WebGL. Lo shader gira a risoluzione ridotta (la lava è morbida per natura)
// così resta fluido anche sui telefoni di fascia media.

const VERT = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`;

const FRAG = `
precision mediump float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_zoom;   // caduta nel cratere: la lava si avvicina
uniform float u_fire;   // 0 = lava con crosta, 1 = fiamme che salgono
uniform float u_bright; // luminosità generale

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}
vec3 ramp(float x) {
  vec3 c = mix(vec3(0.05, 0.02, 0.02), vec3(0.45, 0.05, 0.02), smoothstep(0.0, 0.35, x));
  c = mix(c, vec3(1.0, 0.29, 0.08), smoothstep(0.3, 0.6, x));
  c = mix(c, vec3(1.0, 0.68, 0.26), smoothstep(0.6, 0.85, x));
  c = mix(c, vec3(1.0, 0.95, 0.75), smoothstep(0.88, 1.0, x));
  return c;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  float t = u_time;

  // Lava: flusso lento con crosta scura e crepe incandescenti.
  vec2 lp = uv * (3.2 / u_zoom) + vec2(0.0, t * 0.04);
  vec2 q = vec2(fbm(lp + t * 0.05), fbm(lp + vec2(5.2, 1.3) - t * 0.04));
  float r = fbm(lp + 3.5 * q + vec2(t * 0.08, -t * 0.03));
  float cracks = smoothstep(0.42, 0.78, r);
  vec3 lava = ramp(pow(cracks, 1.25));

  // Fuoco: lingue che salgono e si assottigliano verso l'alto.
  vec2 fp = vec2(uv.x * 2.4, uv.y * 1.4 - t * 1.1);
  float n = fbm(fp * 1.6 + vec2(0.0, fbm(fp * 0.8)));
  float h = clamp(0.55 - uv.y * 0.9, 0.0, 1.4);
  float flame = smoothstep(0.15, 1.0, n * h * 1.55);
  vec3 fire = ramp(flame) * smoothstep(0.0, 0.2, flame + 0.05);

  vec3 col = mix(lava, fire, u_fire);
  float vig = smoothstep(1.25, 0.25, length(uv * vec2(0.9, 1.0)));
  col *= mix(0.55, 1.0, vig) * u_bright;
  gl_FragColor = vec4(col, 1.0);
}
`;

export interface Lava {
  set(values: { zoom?: number; fire?: number; bright?: number }): void;
  start(): void;
  stop(): void;
  ok: boolean;
}

export function createLava(canvas: HTMLCanvasElement, scale = 0.5): Lava {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  const state = { zoom: 1, fire: 0, bright: 1 };
  if (!gl) return { set() {}, start() {}, stop() {}, ok: false };

  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return { set() {}, start() {}, stop() {}, ok: false };
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const u = {
    res: gl.getUniformLocation(prog, 'u_res'),
    time: gl.getUniformLocation(prog, 'u_time'),
    zoom: gl.getUniformLocation(prog, 'u_zoom'),
    fire: gl.getUniformLocation(prog, 'u_fire'),
    bright: gl.getUniformLocation(prog, 'u_bright'),
  };

  const resize = () => {
    const w = Math.max(1, Math.round(canvas.clientWidth * scale));
    const h = Math.max(1, Math.round(canvas.clientHeight * scale));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  };

  let raf = 0;
  let running = false;
  const t0 = performance.now();
  const frame = () => {
    resize();
    gl.uniform2f(u.res, canvas.width, canvas.height);
    gl.uniform1f(u.time, (performance.now() - t0) / 1000);
    gl.uniform1f(u.zoom, state.zoom);
    gl.uniform1f(u.fire, state.fire);
    gl.uniform1f(u.bright, state.bright);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (running) raf = requestAnimationFrame(frame);
  };

  return {
    ok: true,
    set(values) {
      Object.assign(state, values);
      if (!running) frame();
    },
    start() {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
  };
}
