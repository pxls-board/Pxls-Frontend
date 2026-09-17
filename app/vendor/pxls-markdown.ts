import './crel-global';
import * as bundled from './pxlsMarkdown.min.js';

// The vendored file is UMD: loaded as an ES module (dev) it sets
// `window.pxlsMarkdown`; bundled as CommonJS (build) it exports it instead.
const w = window as unknown as { pxlsMarkdown?: unknown };
w.pxlsMarkdown ??= (bundled as { default?: unknown }).default;
