import type { PaletteColor } from '~/types/pxls';

const STYLES_X = 16;
const STYLES_Y = 16;

export type ConvertMode = 'unconverted' | 'nearestCustom';

export interface TemplateOptions {
  use: boolean;
  url: string;
  x: number;
  y: number;
  /** Display width in board pixels; -1 means the source image width. */
  width: number;
  title: string;
  convertMode: ConvertMode;
  style: string | undefined;
}

/** Loose update object; accepts URL-style keys (`ox`, `tw`, `template`…). */
export type TemplateUpdate = Partial<
  Record<keyof TemplateOptions | 'ox' | 'oy' | 'tw' | 'template' | 'convert', unknown>
>;

const DEFAULTS: Omit<TemplateOptions, 'use'> = {
  url: '',
  x: 0,
  y: 0,
  width: -1,
  title: '',
  convertMode: 'unconverted',
  style: undefined,
};

// [url key, option key]
const URL_KEYS: [string, keyof TemplateOptions][] = [
  ['tw', 'width'],
  ['ox', 'x'],
  ['oy', 'y'],
  ['template', 'url'],
  ['title', 'title'],
  ['convert', 'convertMode'],
];

/**
 * Converts between URL-style keys and option keys.
 * `toOptions`: `{ tw: 5 }` → `{ width: 5 }`; otherwise the reverse.
 */
export function normalizeTemplateObj<T extends Record<string, unknown>>(object: T, toOptions = true): T {
  const target = object as Record<string, unknown>;
  for (const [urlKey, optionKey] of URL_KEYS) {
    const [from, to] = toOptions ? [urlKey, optionKey] : [optionKey, urlKey];
    if (from in target && target[to] == null) {
      target[to] = target[from];
      delete target[from];
    }
  }
  return object;
}

// Sites known to serve CORS-enabled images.
const SAFE_HOSTS = ['imgur.com', 'media.discordapp.net', 'pxlsfiddle.com', 'zaix.ru'];

/** Template overlay: loading, WebGL rasterization, dragging and URL sync. */
export const useTemplateStore = defineStore('template', () => {
  const settings = useSettings();

  const options = reactive<TemplateOptions>({ use: false, ...DEFAULTS });
  const imageError = ref('');
  const styleError = ref('');
  const loading = ref(false);
  const dragging = ref(false);
  const dragEnabled = ref(false);
  const pixelated = ref(false);
  const sourceNaturalWidth = ref(0);
  const layout = reactive({ width: 0, internalWidth: 0, internalHeight: 0 });

  // markRaw: Pinia would otherwise wrap these DOM nodes in reactive proxies.
  const canvas = markRaw(document.createElement('canvas'));
  const sourceImage = markRaw(new Image());
  const styleImage = markRaw(new Image());
  sourceImage.crossOrigin = '';
  styleImage.crossOrigin = '';

  const corsProxy: { base: string | undefined; param: string | null } = { base: undefined, param: null };

  let queued: Record<string, unknown> = {};
  let queueTimer: ReturnType<typeof setTimeout> | null = null;

  const gl: {
    context: WebGLRenderingContext | null;
    textures: { source: WebGLTexture | null; downscaled: WebGLTexture | null; style: WebGLTexture | null };
    framebuffers: { intermediate: WebGLFramebuffer | null };
    programs: { downscaling: Record<ConvertMode, WebGLProgram | null>; stylize: WebGLProgram | null };
  } = {
    context: null,
    textures: { source: null, downscaled: null, style: null },
    framebuffers: { intermediate: null },
    programs: { downscaling: { unconverted: null, nearestCustom: null }, stylize: null },
  };

  const usesStyle = () => !!options.style;
  const getSourceWidth = () => sourceImage.naturalWidth;
  const getSourceHeight = () => sourceImage.naturalHeight;
  const getAspectRatio = () => (getSourceWidth() === 0 ? 1 : getSourceHeight() / getSourceWidth());
  const getDisplayWidth = () => Math.round(options.width >= 0 ? options.width : getSourceWidth());
  const getDisplayHeight = () => Math.round(getDisplayWidth() * getAspectRatio());
  const getStyleWidth = () => styleImage.naturalWidth / STYLES_X;
  const getStyleHeight = () => styleImage.naturalHeight / STYLES_Y;
  const getInternalWidth = () => getDisplayWidth() * getStyleWidth();
  const getInternalHeight = () => getDisplayHeight() * getStyleHeight();
  const getWidthRatio = () =>
    usesStyle() ? getInternalWidth() / getDisplayWidth() : getSourceWidth() / getDisplayWidth();

  async function cors(location: string | undefined): Promise<string | undefined> {
    if (!location) return location;
    let url: URL;
    try {
      url = new URL(location);
    } catch {
      return location;
    }

    const safeHosts = [...SAFE_HOSTS, window.location.host];
    if (url.protocol === 'data:' || safeHosts.some((host) => url.hostname.endsWith(host))) {
      return url.href;
    }

    try {
      const response = await fetch(url.href, { method: 'HEAD' });
      if (response.ok) return url.href;
    } catch {
      // fall through to the proxy
    }

    // The browser can't reach it directly (possibly CORS), so go through the
    // proxy. Servers that reject HEAD also end up here, which is fine.
    return corsProxy.param
      ? `${corsProxy.base}?${corsProxy.param}=${encodeURIComponent(url.href)}`
      : `${corsProxy.base}/${url.href}`;
  }

  async function fetchAsDataUrl(url: string): Promise<string> {
    const response = await fetch(url, { method: 'GET', credentials: 'omit' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  async function loadImage() {
    if (corsProxy.base === undefined || !options.url) return;
    loading.value = true;
    imageError.value = '';
    try {
      const src = await cors(options.url);
      sourceImage.src = await fetchAsDataUrl(src!);
    } catch (error) {
      imageError.value = `Error loading template image: ${error}`;
      loading.value = false;
    }
  }

  async function loadStyleImage(style: string | undefined) {
    styleError.value = '';
    if (!style) return;
    try {
      const src = await cors(style);
      styleImage.src = await fetchAsDataUrl(src!);
    } catch (error) {
      styleError.value = `Error loading style image: ${error}`;
    }
  }

  function queueUpdate(changes: TemplateUpdate) {
    Object.assign(queued, normalizeTemplateObj({ ...changes } as Record<string, unknown>, true));
    if (queueTimer !== null) clearTimeout(queueTimer);
    queueTimer = setTimeout(() => {
      const pending = queued;
      queued = {};
      queueTimer = null;
      update(pending);
    }, 200);
  }

  function update(input: TemplateUpdate) {
    const incoming = normalizeTemplateObj({ ...input } as Record<string, unknown>, true);
    if (!Object.keys(incoming).length) return;

    const query = useQueryStore();
    const board = useBoardStore();

    const decodeSafe = (value: string) => {
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    };

    const rawUrl = incoming.url as string | null | undefined;
    const urlUpdated = rawUrl != null && rawUrl !== options.url && decodeSafe(rawUrl) !== options.url;
    if (typeof rawUrl === 'string' && rawUrl.length > 0) {
      incoming.url = decodeSafe(rawUrl);
    }
    if (typeof incoming.title === 'string' && incoming.title.length > 0) {
      incoming.title = decodeSafe(incoming.title);
    }

    // Enabling a new template after disabling one with V shouldn't keep the old size/position.
    if (urlUpdated && !options.use) {
      for (const key of ['width', 'x', 'y', 'convertMode'] as const) {
        if (!(key in incoming)) incoming[key] = DEFAULTS[key];
      }
    }

    const merged: Record<string, unknown> = { ...DEFAULTS, ...options, ...incoming };
    for (const key of Object.keys(DEFAULTS) as (keyof typeof DEFAULTS)[]) {
      const value = merged[key];
      if (value == null || (typeof value === 'number' && Number.isNaN(value))) {
        merged[key] = DEFAULTS[key];
      }
    }
    for (const key of ['x', 'y', 'width'] as const) {
      merged[key] = Number(merged[key]);
      if (Number.isNaN(merged[key])) merged[key] = DEFAULTS[key];
    }
    if (!(String(merged.convertMode) in gl.programs.downscaling)) {
      merged.convertMode = DEFAULTS.convertMode;
    }

    const newConvertMode = merged.convertMode !== options.convertMode;
    const previousStyle = options.style;
    Object.assign(options, {
      use: merged.use !== false,
      url: String(merged.url ?? ''),
      x: merged.x,
      y: merged.y,
      width: merged.width,
      title: String(merged.title ?? ''),
      convertMode: merged.convertMode,
      style: (merged.style as string | undefined) || undefined,
    });

    if (options.url.length === 0 || merged.use === false) {
      options.use = false;
      board.update(true);
      for (const key of ['template', 'ox', 'oy', 'tw', 'title', 'convert']) {
        query.remove(key, true);
      }
    } else {
      options.use = true;
      if (urlUpdated) {
        void loadImage();
      }
      if (!loading.value && (isDirty() || newConvertMode)) {
        rasterize();
      }
      for (const [optionKey, urlKey] of [
        ['url', 'template'],
        ['x', 'ox'],
        ['y', 'oy'],
        ['width', 'tw'],
        ['title', 'title'],
        ['convertMode', 'convert'],
      ] as const) {
        query.set(urlKey, options[optionKey], true);
      }
    }

    if (options.style !== previousStyle || (options.style && !styleImage.src)) {
      void loadStyleImage(options.style);
    }

    useUiStore().refreshTitle();
    pixelated.value = board.getScale() >= getWidthRatio();
    pxlsEvents.emit('template', {
      use: options.use,
      url: options.url,
      x: options.x,
      y: options.y,
      width: options.width,
      title: options.title,
      convertMode: options.convertMode,
    });
  }

  function isDirty() {
    return (
      layout.width !== getDisplayWidth() || canvas.width !== getInternalWidth() || canvas.height !== getInternalHeight()
    );
  }

  function updateSize() {
    layout.width = getDisplayWidth();
    canvas.width = getInternalWidth();
    canvas.height = getInternalHeight();
    layout.internalWidth = canvas.width;
    layout.internalHeight = canvas.height;
  }

  /** Draws the template onto the JS-rendered viewport canvas. */
  function drawOnto(ctx: CanvasRenderingContext2D, pxlX: number, pxlY: number) {
    if (!options.use) return;
    const scale = useBoardStore().getScale();
    let width = canvas.width;
    let height = canvas.height;
    if (options.width !== -1) {
      height *= options.width / width;
      width = options.width;
    }
    ctx.globalAlpha = settings.board.template.opacity.get();
    ctx.drawImage(canvas, (options.x - pxlX) * scale, (options.y - pxlY) * scale, width * scale, height * scale);
  }

  // ---- WebGL -------------------------------------------------------------

  function createShader(context: WebGLRenderingContext, type: number, source: string) {
    const shader = context.createShader(type)!;
    context.shaderSource(shader, source);
    context.compileShader(shader);
    if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
      throw new Error(`Failed to compile WebGL template shader:\n\n${context.getShaderInfoLog(shader)}`);
    }
    return shader;
  }

  function createProgram(context: WebGLRenderingContext, vertexSource: string, fragmentSource: string) {
    const program = context.createProgram()!;
    context.attachShader(program, createShader(context, context.VERTEX_SHADER, vertexSource));
    context.attachShader(program, createShader(context, context.FRAGMENT_SHADER, fragmentSource));
    context.linkProgram(program);
    if (!context.getProgramParameter(program, context.LINK_STATUS)) {
      throw new Error(`Failed to link WebGL template program:\n\n${context.getProgramInfoLog(program)}`);
    }
    return program;
  }

  function createTexture(context: WebGLRenderingContext) {
    const texture = context.createTexture();
    context.bindTexture(context.TEXTURE_2D, texture);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.NEAREST);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.NEAREST);
    return texture;
  }

  function initGl(palette: PaletteColor[]) {
    const context = canvas.getContext('webgl', { premultipliedAlpha: false });
    gl.context = context;
    if (!context) {
      console.info('WebGL is unsupported on this system');
      return;
    }

    context.clearColor(0, 0, 0, 0);
    context.pixelStorei(context.UNPACK_FLIP_Y_WEBGL, true);
    gl.textures.source = createTexture(context);
    gl.textures.downscaled = createTexture(context);
    gl.framebuffers.intermediate = context.createFramebuffer();
    context.bindFramebuffer(context.FRAMEBUFFER, gl.framebuffers.intermediate);
    context.framebufferTexture2D(
      context.FRAMEBUFFER,
      context.COLOR_ATTACHMENT0,
      context.TEXTURE_2D,
      gl.textures.downscaled,
      0,
    );
    gl.textures.style = createTexture(context);
    loadStyleTexture(false);

    const vertexBuffer = context.createBuffer();
    context.bindBuffer(context.ARRAY_BUFFER, vertexBuffer);
    context.bufferData(context.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, -1, 1, 1]), context.STATIC_DRAW);

    const identityVertexShader = `
      attribute vec2 a_Pos;
      varying vec2 v_TexCoord;
      void main() {
        v_TexCoord = a_Pos * vec2(0.5, 0.5) + vec2(0.5, 0.5);
        gl_Position = vec4(a_Pos, 0.0, 1.0);
      }
    `;
    const paletteDefs = `
      #define PALETTE_LENGTH ${palette.length}
      #define PALETTE_MAXSIZE 255.0
      #define PALETTE_TRANSPARENT (PALETTE_MAXSIZE - 1.0) / PALETTE_MAXSIZE
      #define PALETTE_UNKNOWN 1.0
    `;
    // A simple colorspace storing brightness, red/green-ness and
    // blue/yellow-ness. It's close to how people perceive color difference.
    const diffCustom = `
      #define LUMA_WEIGHTS vec3(0.299, 0.587, 0.114)
      vec3 rgb2Custom(vec3 rgb) {
        return vec3(
          length(rgb * LUMA_WEIGHTS),
          rgb.r - rgb.g,
          rgb.b - (rgb.r + rgb.g) / 2.0
        );
      }
      float diffCustom(vec3 col1, vec3 col2) {
        return length(rgb2Custom(col1) - rgb2Custom(col2));
      }
    `;
    const downscalingFragmentShader = (comparisonFunctionName: string | null) => `
      precision mediump float;
      // GLES has no dynamic loops: loop to an upper bound and break early.
      #define MAX_SAMPLE_SIZE 16.0
      ${paletteDefs}
      ${comparisonFunctionName !== null ? '#define CONVERT_COLORS' : ''}
      #define HIGHEST_DIFF 999999.9
      uniform sampler2D u_Template;
      uniform vec2 u_TexelSize;
      uniform vec2 u_SampleSize;
      uniform vec3 u_Palette[PALETTE_LENGTH];
      varying vec2 v_TexCoord;
      const float epsilon = 1.0 / 128.0;
      // The alpha channel indexes the palette.
      const vec4 transparentColor = vec4(0.0, 0.0, 0.0, PALETTE_TRANSPARENT);
      ${diffCustom}
      void main () {
        vec4 color = vec4(0.0);
        vec2 actualSampleSize = min(u_SampleSize, vec2(MAX_SAMPLE_SIZE));
        vec2 sampleTexSize = u_TexelSize / actualSampleSize;
        // Move from the fragment center to the center of the first sample texel.
        vec2 sampleOrigin = v_TexCoord - sampleTexSize * (actualSampleSize / 2.0 - 0.5);
        float sampleCount = 0.0;
        for(float x = 0.0; x < MAX_SAMPLE_SIZE; x++) {
          if(x >= u_SampleSize.x) {
            break;
          }
          for(float y = 0.0; y < MAX_SAMPLE_SIZE; y++) {
            if(y >= u_SampleSize.y) {
              break;
            }
            vec2 pos = sampleOrigin + sampleTexSize * vec2(x, y);
            vec4 sample = texture2D(u_Template, pos);
            // pxlsfiddle stores scale information in the alpha channel of the
            // first pixel; skip that subtexel unless its alpha is exactly 0 or 1.
            if(x == 0.0 && y == 0.0
              && pos.x < u_TexelSize.x && (1.0 - pos.y) < u_TexelSize.y
              && sample.a != 1.0) {
              continue;
            }
            if(sample.a == 0.0) {
              continue;
            }
            color += sample;
            sampleCount++;
          }
        }
        if(sampleCount == 0.0) {
          gl_FragColor = transparentColor;
          return;
        }
        color /= sampleCount;
        #ifdef CONVERT_COLORS
          float bestDiff = HIGHEST_DIFF;
          int bestIndex = int(PALETTE_MAXSIZE);
          vec3 bestColor = vec3(0.0);
          for(int i = 0; i < PALETTE_LENGTH; i++) {
            float diff = ${comparisonFunctionName}(color.rgb, u_Palette[i]);
            if(diff < bestDiff) {
              bestDiff = diff;
              bestIndex = i;
              bestColor = u_Palette[i];
            }
          }
          gl_FragColor = vec4(bestColor, float(bestIndex) / PALETTE_MAXSIZE);
        #else
          for(int i = 0; i < PALETTE_LENGTH; i++) {
            if(all(lessThan(abs(u_Palette[i] - color.rgb), vec3(epsilon)))) {
              gl_FragColor = vec4(u_Palette[i], float(i) / PALETTE_MAXSIZE);
              return;
            }
          }
          gl_FragColor = vec4(color.rgb, PALETTE_UNKNOWN);
        #endif
      }
    `;

    gl.programs.downscaling.unconverted = createProgram(context, identityVertexShader, downscalingFragmentShader(null));
    gl.programs.downscaling.nearestCustom = createProgram(
      context,
      identityVertexShader,
      downscalingFragmentShader('diffCustom'),
    );

    const int2rgb = (value: number) => [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
    const paletteBuffer = new Float32Array(
      palette.flatMap((entry) => int2rgb(parseInt(entry.value, 16)).map((channel) => channel / 255)),
    );
    for (const program of Object.values(gl.programs.downscaling)) {
      if (!program) continue;
      context.useProgram(program);
      const position = context.getAttribLocation(program, 'a_Pos');
      context.vertexAttribPointer(position, 2, context.FLOAT, false, 0, 0);
      context.enableVertexAttribArray(position);
      context.uniform1i(context.getUniformLocation(program, 'u_Template'), 0);
      context.uniform3fv(context.getUniformLocation(program, 'u_Palette'), paletteBuffer);
    }

    gl.programs.stylize = createProgram(
      context,
      identityVertexShader,
      `
      precision mediump float;
      #define STYLES_X float(${STYLES_X})
      #define STYLES_Y float(${STYLES_Y})
      ${paletteDefs}
      uniform sampler2D u_Template;
      uniform sampler2D u_Style;
      uniform vec2 u_TexelSize;
      varying vec2 v_TexCoord;
      const vec2 styleSize = vec2(1.0 / STYLES_X, 1.0 / STYLES_Y);
      void main () {
        vec4 templateSample = texture2D(u_Template, v_TexCoord);
        float index = floor(templateSample.a * PALETTE_MAXSIZE + 0.5);
        vec2 indexCoord = vec2(mod(index, STYLES_X), STYLES_Y - floor(index / STYLES_Y) - 1.0);
        vec2 subTexCoord = mod(v_TexCoord, u_TexelSize) / u_TexelSize;
        vec2 styleCoord = (indexCoord + subTexCoord) * styleSize;

        vec4 styleMask = vec4(1.0, 1.0, 1.0, texture2D(u_Style, styleCoord).a);
        gl_FragColor = vec4(templateSample.rgb, templateSample.a == PALETTE_TRANSPARENT ? 0.0 : 1.0) * styleMask;
      }
    `,
    );
    context.useProgram(gl.programs.stylize);
    const stylePosition = context.getAttribLocation(gl.programs.stylize, 'a_Pos');
    context.vertexAttribPointer(stylePosition, 2, context.FLOAT, false, 0, 0);
    context.enableVertexAttribArray(stylePosition);
    context.uniform1i(context.getUniformLocation(gl.programs.stylize, 'u_Template'), 0);
    context.uniform1i(context.getUniformLocation(gl.programs.stylize, 'u_Style'), 1);
  }

  function loadStyleTexture(redraw = true) {
    const context = gl.context;
    if (context && styleImage.naturalWidth !== 0 && styleImage.naturalHeight !== 0) {
      context.activeTexture(context.TEXTURE1);
      context.bindTexture(context.TEXTURE_2D, gl.textures.style);
      context.texImage2D(context.TEXTURE_2D, 0, context.ALPHA, context.ALPHA, context.UNSIGNED_BYTE, styleImage);
      if (redraw) stylize();
    }
  }

  function rasterize() {
    downscale();
    stylize();
  }

  function downscale() {
    const context = gl.context;
    const width = getDisplayWidth();
    const height = getDisplayHeight();
    if (!context || width === 0 || height === 0) return;

    // Size the framebuffer's texture before rendering into it.
    context.activeTexture(context.TEXTURE0);
    context.bindTexture(context.TEXTURE_2D, gl.textures.downscaled);
    context.texImage2D(
      context.TEXTURE_2D,
      0,
      context.RGBA,
      width,
      height,
      0,
      context.RGBA,
      context.UNSIGNED_BYTE,
      null,
    );

    context.bindFramebuffer(context.FRAMEBUFFER, gl.framebuffers.intermediate);
    context.clear(context.COLOR_BUFFER_BIT);
    context.viewport(0, 0, width, height);

    const program = gl.programs.downscaling[options.convertMode];
    if (!program) return;
    context.useProgram(program);
    context.uniform2f(
      context.getUniformLocation(program, 'u_SampleSize'),
      Math.max(1, getSourceWidth() / getDisplayWidth()),
      Math.max(1, getSourceHeight() / getDisplayHeight()),
    );
    context.uniform2f(context.getUniformLocation(program, 'u_TexelSize'), 1 / width, 1 / height);

    context.bindTexture(context.TEXTURE_2D, gl.textures.source);
    context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, context.RGBA, context.UNSIGNED_BYTE, sourceImage);
    context.drawArrays(context.TRIANGLE_STRIP, 0, 4);
  }

  function stylize() {
    updateSize();
    const context = gl.context;
    const width = getInternalWidth();
    const height = getInternalHeight();
    if (!context || width === 0 || height === 0) return;

    context.bindFramebuffer(context.FRAMEBUFFER, null);
    context.clear(context.COLOR_BUFFER_BIT);
    context.viewport(0, 0, width, height);
    context.useProgram(gl.programs.stylize);
    context.uniform2f(
      context.getUniformLocation(gl.programs.stylize!, 'u_TexelSize'),
      1 / getDisplayWidth(),
      1 / getDisplayHeight(),
    );
    context.activeTexture(context.TEXTURE0);
    context.bindTexture(context.TEXTURE_2D, gl.textures.downscaled);
    context.activeTexture(context.TEXTURE1);
    context.bindTexture(context.TEXTURE_2D, gl.textures.style);
    context.drawArrays(context.TRIANGLE_STRIP, 0, 4);
  }

  // ---- Dragging ------------------------------------------------------------

  const dragStart = { x: 0, y: 0 };

  function startDrag(event: PointerEvent | MouseEvent) {
    if (!(event.ctrlKey || event.altKey)) return;
    event.preventDefault();
    event.stopPropagation();
    dragging.value = true;
    dragStart.x = event.clientX;
    dragStart.y = event.clientY;
  }

  function moveDrag(event: PointerEvent | MouseEvent) {
    if (!dragging.value) return;
    event.preventDefault();
    if (!event.ctrlKey && !event.altKey) {
      stopDragging();
      return;
    }
    const board = useBoardStore();
    const from = board.fromScreen(dragStart.x, dragStart.y);
    const to = board.fromScreen(event.clientX, event.clientY);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const x = options.x + dx;
    const y = options.y + dy;
    update({ x, y });
    useQueryStore().set({ ox: x, oy: y }, true);
    if (dx !== 0) dragStart.x = event.clientX;
    if (dy !== 0) dragStart.y = event.clientY;
  }

  function endDrag(event: PointerEvent | MouseEvent) {
    if (!dragging.value) return;
    event.preventDefault();
    event.stopPropagation();
    dragging.value = false;
  }

  function stopDragging() {
    if (options.use) {
      dragEnabled.value = false;
      dragging.value = false;
    }
  }

  // ---- Lifecycle -----------------------------------------------------------

  function init() {
    sourceImage.addEventListener('load', () => {
      loading.value = false;
      sourceNaturalWidth.value = sourceImage.naturalWidth;
      rasterize();
      pixelated.value = Number(useQueryStore().get('scale')) > getWidthRatio();
    });
    sourceImage.addEventListener('error', () => {
      loading.value = false;
      const { $i18n } = useNuxtApp();
      imageError.value = $i18n.t('There was an error getting the image');
      update({ use: false });
    });
    styleImage.addEventListener('load', () => loadStyleTexture(!loading.value));

    settings.board.template.style.source.listen((style) => {
      // The CORS proxy isn't known before /info loads; loading earlier can't work
      // and would trash the URL template, so just remember the value for now.
      if (corsProxy.base === undefined) {
        options.style = style || undefined;
      } else {
        update({ style: style || undefined });
      }
    });
  }

  function webinit(palette: PaletteColor[], corsBase: string, corsParam: string) {
    initGl(palette);
    corsProxy.base = corsBase;
    corsProxy.param = corsParam;
    void loadImage();
    void loadStyleImage(options.style);
    if (!loading.value) rasterize();
  }

  function adjustOpacity(delta: number) {
    const opacity = settings.board.template.opacity.get();
    settings.board.template.opacity.set(clamp(opacity + delta, 0, 1));
  }

  return {
    options,
    imageError,
    styleError,
    loading,
    dragging,
    dragEnabled,
    pixelated,
    layout,
    sourceNaturalWidth,
    canvas,
    sourceImage,
    init,
    webinit,
    update,
    queueUpdate,
    normalizeTemplateObj,
    drawOnto,
    usesStyle,
    getOptions: () => options,
    getDisplayWidth,
    getDisplayHeight,
    getSourceWidth,
    getWidthRatio,
    setPixelated: (value = true) => {
      pixelated.value = value;
    },
    startDrag,
    moveDrag,
    endDrag,
    stopDragging,
    adjustOpacity,
  };
});
