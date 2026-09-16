import process from 'node:process';globalThis._importMeta_=globalThis._importMeta_||{url:"file:///_entry.js",env:process.env};import http from 'node:http';
import https from 'node:https';
import { EventEmitter } from 'node:events';
import { Buffer as Buffer$1 } from 'node:buffer';
import { promises, existsSync } from 'node:fs';
import { resolve as resolve$1, dirname as dirname$1, join } from 'node:path';
import { createHash } from 'node:crypto';
import { createRouterMatcher } from 'vue-router';
import { fileURLToPath } from 'node:url';

const suspectProtoRx = /"(?:_|\\u0{2}5[Ff]){2}(?:p|\\u0{2}70)(?:r|\\u0{2}72)(?:o|\\u0{2}6[Ff])(?:t|\\u0{2}74)(?:o|\\u0{2}6[Ff])(?:_|\\u0{2}5[Ff]){2}"\s*:/;
const suspectConstructorRx = /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/;
const JsonSigRx = /^\s*["[{]|^\s*-?\d{1,16}(\.\d{1,17})?([Ee][+-]?\d+)?\s*$/;
function jsonParseTransform(key, value) {
  if (key === "__proto__" || key === "constructor" && value && typeof value === "object" && "prototype" in value) {
    warnKeyDropped(key);
    return;
  }
  return value;
}
function warnKeyDropped(key) {
  console.warn(`[destr] Dropping "${key}" key to prevent prototype pollution.`);
}
function destr(value, options = {}) {
  if (typeof value !== "string") {
    return value;
  }
  if (value[0] === '"' && value[value.length - 1] === '"' && value.indexOf("\\") === -1) {
    return value.slice(1, -1);
  }
  const _value = value.trim();
  if (_value.length <= 9) {
    switch (_value.toLowerCase()) {
      case "true": {
        return true;
      }
      case "false": {
        return false;
      }
      case "undefined": {
        return void 0;
      }
      case "null": {
        return null;
      }
      case "nan": {
        return Number.NaN;
      }
      case "infinity": {
        return Number.POSITIVE_INFINITY;
      }
      case "-infinity": {
        return Number.NEGATIVE_INFINITY;
      }
    }
  }
  if (!JsonSigRx.test(value)) {
    if (options.strict) {
      throw new SyntaxError("[destr] Invalid JSON");
    }
    return value;
  }
  try {
    if (suspectProtoRx.test(value) || suspectConstructorRx.test(value)) {
      if (options.strict) {
        throw new Error("[destr] Possible prototype pollution");
      }
      return JSON.parse(value, jsonParseTransform);
    }
    return JSON.parse(value);
  } catch (error) {
    if (options.strict) {
      throw error;
    }
    return value;
  }
}

const HASH_RE = /#/g;
const AMPERSAND_RE = /&/g;
const SLASH_RE = /\//g;
const EQUAL_RE = /=/g;
const IM_RE = /\?/g;
const PLUS_RE = /\+/g;
const ENC_CARET_RE = /%5e/gi;
const ENC_BACKTICK_RE = /%60/gi;
const ENC_PIPE_RE = /%7c/gi;
const ENC_SPACE_RE = /%20/gi;
const ENC_SLASH_RE = /%2f/gi;
const ENC_ENC_SLASH_RE = /%252f/gi;
function encode(text) {
  return encodeURI("" + text).replace(ENC_PIPE_RE, "|");
}
function encodeQueryValue(input) {
  return encode(typeof input === "string" ? input : JSON.stringify(input)).replace(PLUS_RE, "%2B").replace(ENC_SPACE_RE, "+").replace(HASH_RE, "%23").replace(AMPERSAND_RE, "%26").replace(ENC_BACKTICK_RE, "`").replace(ENC_CARET_RE, "^").replace(SLASH_RE, "%2F");
}
function encodeQueryKey(text) {
  return encodeQueryValue(text).replace(EQUAL_RE, "%3D");
}
function encodePath(text) {
  return encode(text).replace(HASH_RE, "%23").replace(IM_RE, "%3F").replace(ENC_ENC_SLASH_RE, "%2F").replace(AMPERSAND_RE, "%26").replace(PLUS_RE, "%2B");
}
function decode$1(text = "") {
  try {
    return decodeURIComponent("" + text);
  } catch {
    return "" + text;
  }
}
function decodePath(text) {
  return decode$1(text.replace(ENC_SLASH_RE, "%252F"));
}
function decodeQueryKey(text) {
  return decode$1(text.replace(PLUS_RE, " "));
}
function decodeQueryValue(text) {
  return decode$1(text.replace(PLUS_RE, " "));
}

function parseQuery(parametersString = "") {
  const object = /* @__PURE__ */ Object.create(null);
  if (parametersString[0] === "?") {
    parametersString = parametersString.slice(1);
  }
  for (const parameter of parametersString.split("&")) {
    const s = parameter.match(/([^=]+)=?(.*)/) || [];
    if (s.length < 2) {
      continue;
    }
    const key = decodeQueryKey(s[1]);
    if (key === "__proto__" || key === "constructor") {
      continue;
    }
    const value = decodeQueryValue(s[2] || "");
    if (object[key] === void 0) {
      object[key] = value;
    } else if (Array.isArray(object[key])) {
      object[key].push(value);
    } else {
      object[key] = [object[key], value];
    }
  }
  return object;
}
function encodeQueryItem(key, value) {
  if (typeof value === "number" || typeof value === "boolean") {
    value = String(value);
  }
  if (!value) {
    return encodeQueryKey(key);
  }
  if (Array.isArray(value)) {
    return value.map(
      (_value) => `${encodeQueryKey(key)}=${encodeQueryValue(_value)}`
    ).join("&");
  }
  return `${encodeQueryKey(key)}=${encodeQueryValue(value)}`;
}
function stringifyQuery(query) {
  return Object.keys(query).filter((k) => query[k] !== void 0).map((k) => encodeQueryItem(k, query[k])).filter(Boolean).join("&");
}

const PROTOCOL_STRICT_REGEX = /^[\s\w\0+.-]{2,}:([/\\]{1,2})/;
const PROTOCOL_REGEX = /^[\s\w\0+.-]{2,}:([/\\]{2})?/;
const PROTOCOL_RELATIVE_REGEX = /^([/\\]\s*){2,}[^/\\]/;
const TRAILING_SLASH_RE = /\/$|\/\?|\/#/;
const JOIN_LEADING_SLASH_RE = /^\.?\//;
function hasProtocol(inputString, opts = {}) {
  if (typeof opts === "boolean") {
    opts = { acceptRelative: opts };
  }
  if (opts.strict) {
    return PROTOCOL_STRICT_REGEX.test(inputString);
  }
  return PROTOCOL_REGEX.test(inputString) || (opts.acceptRelative ? PROTOCOL_RELATIVE_REGEX.test(inputString) : false);
}
function hasTrailingSlash(input = "", respectQueryAndFragment) {
  if (!respectQueryAndFragment) {
    return input.endsWith("/");
  }
  return TRAILING_SLASH_RE.test(input);
}
function withoutTrailingSlash(input = "", respectQueryAndFragment) {
  if (!respectQueryAndFragment) {
    return (hasTrailingSlash(input) ? input.slice(0, -1) : input) || "/";
  }
  if (!hasTrailingSlash(input, true)) {
    return input || "/";
  }
  let path = input;
  let fragment = "";
  const fragmentIndex = input.indexOf("#");
  if (fragmentIndex !== -1) {
    path = input.slice(0, fragmentIndex);
    fragment = input.slice(fragmentIndex);
  }
  const [s0, ...s] = path.split("?");
  const cleanPath = s0.endsWith("/") ? s0.slice(0, -1) : s0;
  return (cleanPath || "/") + (s.length > 0 ? `?${s.join("?")}` : "") + fragment;
}
function withTrailingSlash(input = "", respectQueryAndFragment) {
  if (!respectQueryAndFragment) {
    return input.endsWith("/") ? input : input + "/";
  }
  if (hasTrailingSlash(input, true)) {
    return input || "/";
  }
  let path = input;
  let fragment = "";
  const fragmentIndex = input.indexOf("#");
  if (fragmentIndex !== -1) {
    path = input.slice(0, fragmentIndex);
    fragment = input.slice(fragmentIndex);
    if (!path) {
      return fragment;
    }
  }
  const [s0, ...s] = path.split("?");
  return s0 + "/" + (s.length > 0 ? `?${s.join("?")}` : "") + fragment;
}
function hasLeadingSlash(input = "") {
  return input.startsWith("/");
}
function withLeadingSlash(input = "") {
  return hasLeadingSlash(input) ? input : "/" + input;
}
function withBase(input, base) {
  if (isEmptyURL(base) || hasProtocol(input)) {
    return input;
  }
  const _base = withoutTrailingSlash(base);
  if (input.startsWith(_base)) {
    const nextChar = input[_base.length];
    if (!nextChar || nextChar === "/" || nextChar === "?") {
      return input;
    }
  }
  return joinURL(_base, input);
}
function withoutBase(input, base) {
  if (isEmptyURL(base)) {
    return input;
  }
  const _base = withoutTrailingSlash(base);
  if (!input.startsWith(_base)) {
    return input;
  }
  const nextChar = input[_base.length];
  if (nextChar && nextChar !== "/" && nextChar !== "?") {
    return input;
  }
  const trimmed = input.slice(_base.length).replace(/^\/+/, "");
  return "/" + trimmed;
}
function withQuery(input, query) {
  const parsed = parseURL(input);
  const mergedQuery = { ...parseQuery(parsed.search), ...query };
  parsed.search = stringifyQuery(mergedQuery);
  return stringifyParsedURL(parsed);
}
function getQuery$1(input) {
  return parseQuery(parseURL(input).search);
}
function isEmptyURL(url) {
  return !url || url === "/";
}
function isNonEmptyURL(url) {
  return url && url !== "/";
}
function joinURL(base, ...input) {
  let url = base || "";
  for (const segment of input.filter((url2) => isNonEmptyURL(url2))) {
    if (url) {
      const _segment = segment.replace(JOIN_LEADING_SLASH_RE, "");
      url = withTrailingSlash(url) + _segment;
    } else {
      url = segment;
    }
  }
  return url;
}
function joinRelativeURL(..._input) {
  const JOIN_SEGMENT_SPLIT_RE = /\/(?!\/)/;
  const input = _input.filter(Boolean);
  const segments = [];
  let segmentsDepth = 0;
  for (const i of input) {
    if (!i || i === "/") {
      continue;
    }
    for (const [sindex, s] of i.split(JOIN_SEGMENT_SPLIT_RE).entries()) {
      if (!s || s === ".") {
        continue;
      }
      if (s === "..") {
        if (segments.length === 1 && hasProtocol(segments[0])) {
          continue;
        }
        segments.pop();
        segmentsDepth--;
        continue;
      }
      if (sindex === 1 && segments[segments.length - 1]?.endsWith(":/")) {
        segments[segments.length - 1] += "/" + s;
        continue;
      }
      segments.push(s);
      segmentsDepth++;
    }
  }
  let url = segments.join("/");
  if (segmentsDepth >= 0) {
    if (input[0]?.startsWith("/") && !url.startsWith("/")) {
      url = "/" + url;
    } else if (input[0]?.startsWith("./") && !url.startsWith("./")) {
      url = "./" + url;
    }
  } else {
    url = "../".repeat(-1 * segmentsDepth) + url;
  }
  if (input[input.length - 1]?.endsWith("/") && !url.endsWith("/")) {
    url += "/";
  }
  return url;
}

const protocolRelative = Symbol.for("ufo:protocolRelative");
function parseURL(input = "", defaultProto) {
  const _specialProtoMatch = input.match(
    /^[\s\0]*(blob:|data:|javascript:|vbscript:)(.*)/i
  );
  if (_specialProtoMatch) {
    const [, _proto, _pathname = ""] = _specialProtoMatch;
    return {
      protocol: _proto.toLowerCase(),
      pathname: _pathname,
      href: _proto + _pathname,
      auth: "",
      host: "",
      search: "",
      hash: ""
    };
  }
  if (!hasProtocol(input, { acceptRelative: true })) {
    return parsePath(input);
  }
  const [, protocol = "", auth, hostAndPath = ""] = input.replace(/\\/g, "/").match(/^[\s\0]*([\w+.-]{2,}:)?\/\/([^/@]+@)?(.*)/) || [];
  let [, host = "", path = ""] = hostAndPath.match(/([^#/?]*)(.*)?/) || [];
  if (protocol === "file:") {
    path = path.replace(/\/(?=[A-Za-z]:)/, "");
  }
  const { pathname, search, hash } = parsePath(path);
  return {
    protocol: protocol.toLowerCase(),
    auth: auth ? auth.slice(0, Math.max(0, auth.length - 1)) : "",
    host,
    pathname,
    search,
    hash,
    [protocolRelative]: !protocol
  };
}
function parsePath(input = "") {
  const [pathname = "", search = "", hash = ""] = (input.match(/([^#?]*)(\?[^#]*)?(#.*)?/) || []).splice(1);
  return {
    pathname,
    search,
    hash
  };
}
function stringifyParsedURL(parsed) {
  const pathname = parsed.pathname || "";
  const search = parsed.search ? (parsed.search.startsWith("?") ? "" : "?") + parsed.search : "";
  const hash = parsed.hash || "";
  const auth = parsed.auth ? parsed.auth + "@" : "";
  const host = parsed.host || "";
  const proto = parsed.protocol || parsed[protocolRelative] ? (parsed.protocol || "") + "//" : "";
  return proto + auth + host + pathname + search + hash;
}

const NullObject = /* @__PURE__ */ (() => {
  const C = function() {
  };
  C.prototype = /* @__PURE__ */ Object.create(null);
  return C;
})();
function parse(str, options) {
  if (typeof str !== "string") {
    throw new TypeError("argument str must be a string");
  }
  const obj = new NullObject();
  const opt = {};
  const dec = opt.decode || decode;
  let index = 0;
  while (index < str.length) {
    const eqIdx = str.indexOf("=", index);
    if (eqIdx === -1) {
      break;
    }
    let endIdx = str.indexOf(";", index);
    if (endIdx === -1) {
      endIdx = str.length;
    } else if (endIdx < eqIdx) {
      index = str.lastIndexOf(";", eqIdx - 1) + 1;
      continue;
    }
    const key = str.slice(index, eqIdx).trim();
    if (opt?.filter && !opt?.filter(key)) {
      index = endIdx + 1;
      continue;
    }
    if (void 0 === obj[key]) {
      let val = str.slice(eqIdx + 1, endIdx).trim();
      if (val.codePointAt(0) === 34) {
        val = val.slice(1, -1);
      }
      obj[key] = tryDecode(val, dec);
    }
    index = endIdx + 1;
  }
  return obj;
}
function decode(str) {
  return str.includes("%") ? decodeURIComponent(str) : str;
}
function tryDecode(str, decode2) {
  try {
    return decode2(str);
  } catch {
    return str;
  }
}

const fieldContentRegExp = /^[\u0009\u0020-\u007E\u0080-\u00FF]+$/;
function serialize$1(name, value, options) {
  const opt = options || {};
  const enc = opt.encode || encodeURIComponent;
  if (typeof enc !== "function") {
    throw new TypeError("option encode is invalid");
  }
  if (!fieldContentRegExp.test(name)) {
    throw new TypeError("argument name is invalid");
  }
  const encodedValue = enc(value);
  if (encodedValue && !fieldContentRegExp.test(encodedValue)) {
    throw new TypeError("argument val is invalid");
  }
  let str = name + "=" + encodedValue;
  if (void 0 !== opt.maxAge && opt.maxAge !== null) {
    const maxAge = opt.maxAge - 0;
    if (Number.isNaN(maxAge) || !Number.isFinite(maxAge)) {
      throw new TypeError("option maxAge is invalid");
    }
    str += "; Max-Age=" + Math.floor(maxAge);
  }
  if (opt.domain) {
    if (!fieldContentRegExp.test(opt.domain)) {
      throw new TypeError("option domain is invalid");
    }
    str += "; Domain=" + opt.domain;
  }
  if (opt.path) {
    if (!fieldContentRegExp.test(opt.path)) {
      throw new TypeError("option path is invalid");
    }
    str += "; Path=" + opt.path;
  }
  if (opt.expires) {
    if (!isDate(opt.expires) || Number.isNaN(opt.expires.valueOf())) {
      throw new TypeError("option expires is invalid");
    }
    str += "; Expires=" + opt.expires.toUTCString();
  }
  if (opt.httpOnly) {
    str += "; HttpOnly";
  }
  if (opt.secure) {
    str += "; Secure";
  }
  if (opt.priority) {
    const priority = typeof opt.priority === "string" ? opt.priority.toLowerCase() : opt.priority;
    switch (priority) {
      case "low": {
        str += "; Priority=Low";
        break;
      }
      case "medium": {
        str += "; Priority=Medium";
        break;
      }
      case "high": {
        str += "; Priority=High";
        break;
      }
      default: {
        throw new TypeError("option priority is invalid");
      }
    }
  }
  if (opt.sameSite) {
    const sameSite = typeof opt.sameSite === "string" ? opt.sameSite.toLowerCase() : opt.sameSite;
    switch (sameSite) {
      case true: {
        str += "; SameSite=Strict";
        break;
      }
      case "lax": {
        str += "; SameSite=Lax";
        break;
      }
      case "strict": {
        str += "; SameSite=Strict";
        break;
      }
      case "none": {
        str += "; SameSite=None";
        break;
      }
      default: {
        throw new TypeError("option sameSite is invalid");
      }
    }
  }
  if (opt.partitioned) {
    str += "; Partitioned";
  }
  return str;
}
function isDate(val) {
  return Object.prototype.toString.call(val) === "[object Date]" || val instanceof Date;
}

function parseSetCookie(setCookieValue, options) {
  const parts = (setCookieValue || "").split(";").filter((str) => typeof str === "string" && !!str.trim());
  const nameValuePairStr = parts.shift() || "";
  const parsed = _parseNameValuePair(nameValuePairStr);
  const name = parsed.name;
  let value = parsed.value;
  try {
    value = options?.decode === false ? value : (options?.decode || decodeURIComponent)(value);
  } catch {
  }
  const cookie = {
    name,
    value
  };
  for (const part of parts) {
    const sides = part.split("=");
    const partKey = (sides.shift() || "").trimStart().toLowerCase();
    const partValue = sides.join("=");
    switch (partKey) {
      case "expires": {
        cookie.expires = new Date(partValue);
        break;
      }
      case "max-age": {
        cookie.maxAge = Number.parseInt(partValue, 10);
        break;
      }
      case "secure": {
        cookie.secure = true;
        break;
      }
      case "httponly": {
        cookie.httpOnly = true;
        break;
      }
      case "samesite": {
        cookie.sameSite = partValue;
        break;
      }
      default: {
        cookie[partKey] = partValue;
      }
    }
  }
  return cookie;
}
function _parseNameValuePair(nameValuePairStr) {
  let name = "";
  let value = "";
  const nameValueArr = nameValuePairStr.split("=");
  if (nameValueArr.length > 1) {
    name = nameValueArr.shift();
    value = nameValueArr.join("=");
  } else {
    value = nameValuePairStr;
  }
  return { name, value };
}

const NODE_TYPES = {
  NORMAL: 0,
  WILDCARD: 1,
  PLACEHOLDER: 2
};

function createRouter$1(options = {}) {
  const ctx = {
    options,
    rootNode: createRadixNode(),
    staticRoutesMap: {}
  };
  const normalizeTrailingSlash = (p) => options.strictTrailingSlash ? p : p.replace(/\/$/, "") || "/";
  if (options.routes) {
    for (const path in options.routes) {
      insert(ctx, normalizeTrailingSlash(path), options.routes[path]);
    }
  }
  return {
    ctx,
    lookup: (path) => lookup(ctx, normalizeTrailingSlash(path)),
    insert: (path, data) => insert(ctx, normalizeTrailingSlash(path), data),
    remove: (path) => remove(ctx, normalizeTrailingSlash(path))
  };
}
function lookup(ctx, path) {
  const staticPathNode = ctx.staticRoutesMap[path];
  if (staticPathNode) {
    return staticPathNode.data;
  }
  const sections = path.split("/");
  const params = {};
  let paramsFound = false;
  let wildcardNode = null;
  let node = ctx.rootNode;
  let wildCardParam = null;
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    if (node.wildcardChildNode !== null) {
      wildcardNode = node.wildcardChildNode;
      wildCardParam = sections.slice(i).join("/");
    }
    const nextNode = node.children.get(section);
    if (nextNode === void 0) {
      if (node && node.placeholderChildren.length > 1) {
        const remaining = sections.length - i;
        node = node.placeholderChildren.find((c) => c.maxDepth === remaining) || null;
      } else {
        node = node.placeholderChildren[0] || null;
      }
      if (!node) {
        break;
      }
      if (node.paramName) {
        params[node.paramName] = section;
      }
      paramsFound = true;
    } else {
      node = nextNode;
    }
  }
  if ((node === null || node.data === null) && wildcardNode !== null) {
    node = wildcardNode;
    params[node.paramName || "_"] = wildCardParam;
    paramsFound = true;
  }
  if (!node) {
    return null;
  }
  if (paramsFound) {
    return {
      ...node.data,
      params: paramsFound ? params : void 0
    };
  }
  return node.data;
}
function insert(ctx, path, data) {
  let isStaticRoute = true;
  const sections = path.split("/");
  let node = ctx.rootNode;
  let _unnamedPlaceholderCtr = 0;
  const matchedNodes = [node];
  for (const section of sections) {
    let childNode;
    if (childNode = node.children.get(section)) {
      node = childNode;
    } else {
      const type = getNodeType(section);
      childNode = createRadixNode({ type, parent: node });
      node.children.set(section, childNode);
      if (type === NODE_TYPES.PLACEHOLDER) {
        childNode.paramName = section === "*" ? `_${_unnamedPlaceholderCtr++}` : section.slice(1);
        node.placeholderChildren.push(childNode);
        isStaticRoute = false;
      } else if (type === NODE_TYPES.WILDCARD) {
        node.wildcardChildNode = childNode;
        childNode.paramName = section.slice(
          3
          /* "**:" */
        ) || "_";
        isStaticRoute = false;
      }
      matchedNodes.push(childNode);
      node = childNode;
    }
  }
  for (const [depth, node2] of matchedNodes.entries()) {
    node2.maxDepth = Math.max(matchedNodes.length - depth, node2.maxDepth || 0);
  }
  node.data = data;
  if (isStaticRoute === true) {
    ctx.staticRoutesMap[path] = node;
  }
  return node;
}
function remove(ctx, path) {
  let success = false;
  const sections = path.split("/");
  let node = ctx.rootNode;
  for (const section of sections) {
    node = node.children.get(section);
    if (!node) {
      return success;
    }
  }
  if (node.data) {
    const lastSection = sections.at(-1) || "";
    node.data = null;
    if (Object.keys(node.children).length === 0 && node.parent) {
      node.parent.children.delete(lastSection);
      node.parent.wildcardChildNode = null;
      node.parent.placeholderChildren = [];
    }
    success = true;
  }
  return success;
}
function createRadixNode(options = {}) {
  return {
    type: options.type || NODE_TYPES.NORMAL,
    maxDepth: 0,
    parent: options.parent || null,
    children: /* @__PURE__ */ new Map(),
    data: options.data || null,
    paramName: options.paramName || null,
    wildcardChildNode: null,
    placeholderChildren: []
  };
}
function getNodeType(str) {
  if (str.startsWith("**")) {
    return NODE_TYPES.WILDCARD;
  }
  if (str[0] === ":" || str === "*") {
    return NODE_TYPES.PLACEHOLDER;
  }
  return NODE_TYPES.NORMAL;
}

function toRouteMatcher(router) {
  const table = _routerNodeToTable("", router.ctx.rootNode);
  return _createMatcher(table, router.ctx.options.strictTrailingSlash);
}
function _createMatcher(table, strictTrailingSlash) {
  return {
    ctx: { table },
    matchAll: (path) => _matchRoutes(path, table, strictTrailingSlash)
  };
}
function _createRouteTable() {
  return {
    static: /* @__PURE__ */ new Map(),
    wildcard: /* @__PURE__ */ new Map(),
    dynamic: /* @__PURE__ */ new Map()
  };
}
function _matchRoutes(path, table, strictTrailingSlash) {
  if (strictTrailingSlash !== true && path.endsWith("/")) {
    path = path.slice(0, -1) || "/";
  }
  const matches = [];
  for (const [key, value] of _sortRoutesMap(table.wildcard)) {
    if (path === key || path.startsWith(key + "/")) {
      matches.push(value);
    }
  }
  for (const [key, value] of _sortRoutesMap(table.dynamic)) {
    if (path.startsWith(key + "/")) {
      const subPath = "/" + path.slice(key.length).split("/").splice(2).join("/");
      matches.push(..._matchRoutes(subPath, value));
    }
  }
  const staticMatch = table.static.get(path);
  if (staticMatch) {
    matches.push(staticMatch);
  }
  return matches.filter(Boolean);
}
function _sortRoutesMap(m) {
  return [...m.entries()].sort((a, b) => a[0].length - b[0].length);
}
function _routerNodeToTable(initialPath, initialNode) {
  const table = _createRouteTable();
  function _addNode(path, node) {
    if (path) {
      if (node.type === NODE_TYPES.NORMAL && !(path.includes("*") || path.includes(":"))) {
        if (node.data) {
          table.static.set(path, node.data);
        }
      } else if (node.type === NODE_TYPES.WILDCARD) {
        table.wildcard.set(path.replace("/**", ""), node.data);
      } else if (node.type === NODE_TYPES.PLACEHOLDER) {
        const subTable = _routerNodeToTable("", node);
        if (node.data) {
          subTable.static.set("/", node.data);
        }
        table.dynamic.set(path.replace(/\/\*|\/:\w+/, ""), subTable);
        return;
      }
    }
    for (const [childPath, child] of node.children.entries()) {
      _addNode(`${path}/${childPath}`.replace("//", "/"), child);
    }
  }
  _addNode(initialPath, initialNode);
  return table;
}

function isPlainObject(value) {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== null && prototype !== Object.prototype && Object.getPrototypeOf(prototype) !== null) {
    return false;
  }
  if (Symbol.iterator in value) {
    return false;
  }
  if (Symbol.toStringTag in value) {
    return Object.prototype.toString.call(value) === "[object Module]";
  }
  return true;
}

function _defu(baseObject, defaults, namespace = ".", merger) {
  if (!isPlainObject(defaults)) {
    return _defu(baseObject, {}, namespace, merger);
  }
  const object = { ...defaults };
  for (const key of Object.keys(baseObject)) {
    if (key === "__proto__" || key === "constructor") {
      continue;
    }
    const value = baseObject[key];
    if (value === null || value === void 0) {
      continue;
    }
    if (merger && merger(object, key, value, namespace)) {
      continue;
    }
    if (Array.isArray(value) && Array.isArray(object[key])) {
      object[key] = [...value, ...object[key]];
    } else if (isPlainObject(value) && isPlainObject(object[key])) {
      object[key] = _defu(
        value,
        object[key],
        (namespace ? `${namespace}.` : "") + key.toString(),
        merger
      );
    } else {
      object[key] = value;
    }
  }
  return object;
}
function createDefu(merger) {
  return (...arguments_) => (
    // eslint-disable-next-line unicorn/no-array-reduce
    arguments_.reduce((p, c) => _defu(p, c, "", merger), {})
  );
}
const defu = createDefu();
const defuFn = createDefu((object, key, currentValue) => {
  if (object[key] !== void 0 && typeof currentValue === "function") {
    object[key] = currentValue(object[key]);
    return true;
  }
});

function o(n){throw new Error(`${n} is not implemented yet!`)}let i$1 = class i extends EventEmitter{__unenv__={};readableEncoding=null;readableEnded=true;readableFlowing=false;readableHighWaterMark=0;readableLength=0;readableObjectMode=false;readableAborted=false;readableDidRead=false;closed=false;errored=null;readable=false;destroyed=false;static from(e,t){return new i(t)}constructor(e){super();}_read(e){}read(e){}setEncoding(e){return this}pause(){return this}resume(){return this}isPaused(){return  true}unpipe(e){return this}unshift(e,t){}wrap(e){return this}push(e,t){return  false}_destroy(e,t){this.removeAllListeners();}destroy(e){return this.destroyed=true,this._destroy(e),this}pipe(e,t){return {}}compose(e,t){throw new Error("Method not implemented.")}[Symbol.asyncDispose](){return this.destroy(),Promise.resolve()}async*[Symbol.asyncIterator](){throw o("Readable.asyncIterator")}iterator(e){throw o("Readable.iterator")}map(e,t){throw o("Readable.map")}filter(e,t){throw o("Readable.filter")}forEach(e,t){throw o("Readable.forEach")}reduce(e,t,r){throw o("Readable.reduce")}find(e,t){throw o("Readable.find")}findIndex(e,t){throw o("Readable.findIndex")}some(e,t){throw o("Readable.some")}toArray(e){throw o("Readable.toArray")}every(e,t){throw o("Readable.every")}flatMap(e,t){throw o("Readable.flatMap")}drop(e,t){throw o("Readable.drop")}take(e,t){throw o("Readable.take")}asIndexedPairs(e){throw o("Readable.asIndexedPairs")}};let l$1 = class l extends EventEmitter{__unenv__={};writable=true;writableEnded=false;writableFinished=false;writableHighWaterMark=0;writableLength=0;writableObjectMode=false;writableCorked=0;closed=false;errored=null;writableNeedDrain=false;writableAborted=false;destroyed=false;_data;_encoding="utf8";constructor(e){super();}pipe(e,t){return {}}_write(e,t,r){if(this.writableEnded){r&&r();return}if(this._data===void 0)this._data=e;else {const s=typeof this._data=="string"?Buffer$1.from(this._data,this._encoding||t||"utf8"):this._data,a=typeof e=="string"?Buffer$1.from(e,t||this._encoding||"utf8"):e;this._data=Buffer$1.concat([s,a]);}this._encoding=t,r&&r();}_writev(e,t){}_destroy(e,t){}_final(e){}write(e,t,r){const s=typeof t=="string"?this._encoding:"utf8",a=typeof t=="function"?t:typeof r=="function"?r:void 0;return this._write(e,s,a),true}setDefaultEncoding(e){return this}end(e,t,r){const s=typeof e=="function"?e:typeof t=="function"?t:typeof r=="function"?r:void 0;if(this.writableEnded)return s&&s(),this;const a=e===s?void 0:e;if(a){const u=t===s?void 0:t;this.write(a,u);}return this.writableEnded=true,this.writableFinished=true,this.emit("close"),this.emit("finish"),s&&s(),this}cork(){}uncork(){}destroy(e){return this.destroyed=true,delete this._data,this.removeAllListeners(),this}compose(e,t){throw new Error("Method not implemented.")}[Symbol.asyncDispose](){return Promise.resolve()}};const c=class{allowHalfOpen=true;_destroy;constructor(e=new i$1,t=new l$1){Object.assign(this,e),Object.assign(this,t),this._destroy=m(e._destroy,t._destroy);}};function _(){return Object.assign(c.prototype,i$1.prototype),Object.assign(c.prototype,l$1.prototype),c}function m(...n){return function(...e){for(const t of n)t(...e);}}const g=_();class A extends g{__unenv__={};bufferSize=0;bytesRead=0;bytesWritten=0;connecting=false;destroyed=false;pending=false;localAddress="";localPort=0;remoteAddress="";remoteFamily="";remotePort=0;autoSelectFamilyAttemptedAddresses=[];readyState="readOnly";constructor(e){super();}write(e,t,r){return  false}connect(e,t,r){return this}end(e,t,r){return this}setEncoding(e){return this}pause(){return this}resume(){return this}setTimeout(e,t){return this}setNoDelay(e){return this}setKeepAlive(e,t){return this}address(){return {}}unref(){return this}ref(){return this}destroySoon(){this.destroy();}resetAndDestroy(){const e=new Error("ERR_SOCKET_CLOSED");return e.code="ERR_SOCKET_CLOSED",this.destroy(e),this}}class y extends i$1{aborted=false;httpVersion="1.1";httpVersionMajor=1;httpVersionMinor=1;complete=true;connection;socket;headers={};trailers={};method="GET";url="/";statusCode=200;statusMessage="";closed=false;errored=null;readable=false;constructor(e){super(),this.socket=this.connection=e||new A;}get rawHeaders(){const e=this.headers,t=[];for(const r in e)if(Array.isArray(e[r]))for(const s of e[r])t.push(r,s);else t.push(r,e[r]);return t}get rawTrailers(){return []}setTimeout(e,t){return this}get headersDistinct(){return p(this.headers)}get trailersDistinct(){return p(this.trailers)}}function p(n){const e={};for(const[t,r]of Object.entries(n))t&&(e[t]=(Array.isArray(r)?r:[r]).filter(Boolean));return e}class w extends l$1{statusCode=200;statusMessage="";upgrading=false;chunkedEncoding=false;shouldKeepAlive=false;useChunkedEncodingByDefault=false;sendDate=false;finished=false;headersSent=false;strictContentLength=false;connection=null;socket=null;req;_headers={};constructor(e){super(),this.req=e;}assignSocket(e){e._httpMessage=this,this.socket=e,this.connection=e,this.emit("socket",e),this._flush();}_flush(){this.flushHeaders();}detachSocket(e){}writeContinue(e){}writeHead(e,t,r){e&&(this.statusCode=e),typeof t=="string"&&(this.statusMessage=t,t=void 0);const s=r||t;if(s&&!Array.isArray(s))for(const a in s)this.setHeader(a,s[a]);return this.headersSent=true,this}writeProcessing(){}setTimeout(e,t){return this}appendHeader(e,t){e=e.toLowerCase();const r=this._headers[e],s=[...Array.isArray(r)?r:[r],...Array.isArray(t)?t:[t]].filter(Boolean);return this._headers[e]=s.length>1?s:s[0],this}setHeader(e,t){return this._headers[e.toLowerCase()]=t,this}setHeaders(e){for(const[t,r]of Object.entries(e))this.setHeader(t,r);return this}getHeader(e){return this._headers[e.toLowerCase()]}getHeaders(){return this._headers}getHeaderNames(){return Object.keys(this._headers)}hasHeader(e){return e.toLowerCase()in this._headers}removeHeader(e){delete this._headers[e.toLowerCase()];}addTrailers(e){}flushHeaders(){}writeEarlyHints(e,t){typeof t=="function"&&t();}}const E=(()=>{const n=function(){};return n.prototype=Object.create(null),n})();function R(n={}){const e=new E,t=Array.isArray(n)||H(n)?n:Object.entries(n);for(const[r,s]of t)if(s){if(e[r]===void 0){e[r]=s;continue}e[r]=[...Array.isArray(e[r])?e[r]:[e[r]],...Array.isArray(s)?s:[s]];}return e}function H(n){return typeof n?.entries=="function"}function v(n={}){if(n instanceof Headers)return n;const e=new Headers;for(const[t,r]of Object.entries(n))if(r!==void 0){if(Array.isArray(r)){for(const s of r)e.append(t,String(s));continue}e.set(t,String(r));}return e}const S=new Set([101,204,205,304]);async function b(n,e){const t=new y,r=new w(t);t.url=e.url?.toString()||"/";let s;if(!t.url.startsWith("/")){const d=new URL(t.url);s=d.host,t.url=d.pathname+d.search+d.hash;}t.method=e.method||"GET",t.headers=R(e.headers||{}),t.headers.host||(t.headers.host=e.host||s||"localhost"),t.connection.encrypted=t.connection.encrypted||e.protocol==="https",t.body=e.body||null,t.__unenv__=e.context,await n(t,r);let a=r._data;(S.has(r.statusCode)||t.method.toUpperCase()==="HEAD")&&(a=null,delete r._headers["content-length"]);const u={status:r.statusCode,statusText:r.statusMessage,headers:r._headers,body:a};return t.destroy(),r.destroy(),u}async function C(n,e,t={}){try{const r=await b(n,{url:e,...t});return new Response(r.body,{status:r.status,statusText:r.statusText,headers:v(r.headers)})}catch(r){return new Response(r.toString(),{status:Number.parseInt(r.statusCode||r.code)||500,statusText:r.statusText})}}

function hasProp(obj, prop) {
  try {
    return prop in obj;
  } catch {
    return false;
  }
}

class H3Error extends Error {
  static __h3_error__ = true;
  statusCode = 500;
  fatal = false;
  unhandled = false;
  statusMessage;
  data;
  cause;
  constructor(message, opts = {}) {
    super(message, opts);
    if (opts.cause && !this.cause) {
      this.cause = opts.cause;
    }
  }
  toJSON() {
    const obj = {
      message: this.message,
      statusCode: sanitizeStatusCode(this.statusCode, 500)
    };
    if (this.statusMessage) {
      obj.statusMessage = sanitizeStatusMessage(this.statusMessage);
    }
    if (this.data !== void 0) {
      obj.data = this.data;
    }
    return obj;
  }
}
function createError$1(input) {
  if (typeof input === "string") {
    return new H3Error(input);
  }
  if (isError(input)) {
    return input;
  }
  const err = new H3Error(input.message ?? input.statusMessage ?? "", {
    cause: input.cause || input
  });
  if (hasProp(input, "stack")) {
    try {
      Object.defineProperty(err, "stack", {
        get() {
          return input.stack;
        }
      });
    } catch {
      try {
        err.stack = input.stack;
      } catch {
      }
    }
  }
  if (input.data) {
    err.data = input.data;
  }
  if (input.statusCode) {
    err.statusCode = sanitizeStatusCode(input.statusCode, err.statusCode);
  } else if (input.status) {
    err.statusCode = sanitizeStatusCode(input.status, err.statusCode);
  }
  if (input.statusMessage) {
    err.statusMessage = input.statusMessage;
  } else if (input.statusText) {
    err.statusMessage = input.statusText;
  }
  if (err.statusMessage) {
    const originalMessage = err.statusMessage;
    const sanitizedMessage = sanitizeStatusMessage(err.statusMessage);
    if (sanitizedMessage !== originalMessage) {
      console.warn(
        "[h3] Please prefer using `message` for longer error messages instead of `statusMessage`. In the future, `statusMessage` will be sanitized by default."
      );
    }
  }
  if (input.fatal !== void 0) {
    err.fatal = input.fatal;
  }
  if (input.unhandled !== void 0) {
    err.unhandled = input.unhandled;
  }
  return err;
}
function sendError(event, error, debug) {
  if (event.handled) {
    return;
  }
  const h3Error = isError(error) ? error : createError$1(error);
  const responseBody = {
    statusCode: h3Error.statusCode,
    statusMessage: h3Error.statusMessage,
    stack: [],
    data: h3Error.data
  };
  if (debug) {
    responseBody.stack = (h3Error.stack || "").split("\n").map((l) => l.trim());
  }
  if (event.handled) {
    return;
  }
  const _code = Number.parseInt(h3Error.statusCode);
  setResponseStatus(event, _code, h3Error.statusMessage);
  event.node.res.setHeader("content-type", MIMES.json);
  event.node.res.end(JSON.stringify(responseBody, void 0, 2));
}
function isError(input) {
  return input?.constructor?.__h3_error__ === true;
}

function getQuery(event) {
  return getQuery$1(event.path || "");
}
function getRouterParams(event, opts = {}) {
  let params = event.context.params || {};
  if (opts.decode) {
    params = { ...params };
    for (const key in params) {
      params[key] = decode$1(params[key]);
    }
  }
  return params;
}
function getRouterParam(event, name, opts = {}) {
  const params = getRouterParams(event, opts);
  return params[name];
}
function isMethod(event, expected, allowHead) {
  if (typeof expected === "string") {
    if (event.method === expected) {
      return true;
    }
  } else if (expected.includes(event.method)) {
    return true;
  }
  return false;
}
function assertMethod(event, expected, allowHead) {
  if (!isMethod(event, expected)) {
    throw createError$1({
      statusCode: 405,
      statusMessage: "HTTP method is not allowed."
    });
  }
}
function getRequestHeaders(event) {
  const _headers = {};
  for (const key in event.node.req.headers) {
    const val = event.node.req.headers[key];
    _headers[key] = Array.isArray(val) ? val.filter(Boolean).join(", ") : val;
  }
  return _headers;
}
function getRequestHeader(event, name) {
  const headers = getRequestHeaders(event);
  const value = headers[name.toLowerCase()];
  return value;
}
function getRequestHost$1(event, opts = {}) {
  if (opts.xForwardedHost) {
    const _header = event.node.req.headers["x-forwarded-host"];
    const xForwardedHost = (_header || "").split(",").shift()?.trim();
    if (xForwardedHost) {
      return xForwardedHost;
    }
  }
  return event.node.req.headers.host || "localhost";
}
function getRequestProtocol(event, opts = {}) {
  if (opts.xForwardedProto !== false && event.node.req.headers["x-forwarded-proto"] === "https") {
    return "https";
  }
  return event.node.req.connection?.encrypted ? "https" : "http";
}
function getRequestURL(event, opts = {}) {
  const host = getRequestHost$1(event, opts);
  const protocol = getRequestProtocol(event, opts);
  const path = (event.node.req.originalUrl || event.path).replace(
    /^[/\\]+/g,
    "/"
  );
  return new URL(path, `${protocol}://${host}`);
}

const RawBodySymbol = Symbol.for("h3RawBody");
const PayloadMethods$1 = ["PATCH", "POST", "PUT", "DELETE"];
function readRawBody(event, encoding = "utf8") {
  assertMethod(event, PayloadMethods$1);
  const _rawBody = event._requestBody || event.web?.request?.body || event.node.req[RawBodySymbol] || event.node.req.rawBody || event.node.req.body;
  if (_rawBody) {
    const promise2 = Promise.resolve(_rawBody).then((_resolved) => {
      if (Buffer.isBuffer(_resolved)) {
        return _resolved;
      }
      if (typeof _resolved.pipeTo === "function") {
        return new Promise((resolve, reject) => {
          const chunks = [];
          _resolved.pipeTo(
            new WritableStream({
              write(chunk) {
                chunks.push(chunk);
              },
              close() {
                resolve(Buffer.concat(chunks));
              },
              abort(reason) {
                reject(reason);
              }
            })
          ).catch(reject);
        });
      } else if (typeof _resolved.pipe === "function") {
        return new Promise((resolve, reject) => {
          const chunks = [];
          _resolved.on("data", (chunk) => {
            chunks.push(chunk);
          }).on("end", () => {
            resolve(Buffer.concat(chunks));
          }).on("error", reject);
        });
      }
      if (_resolved.constructor === Object) {
        return Buffer.from(JSON.stringify(_resolved));
      }
      if (_resolved instanceof URLSearchParams) {
        return Buffer.from(_resolved.toString());
      }
      if (_resolved instanceof FormData) {
        return new Response(_resolved).bytes().then((uint8arr) => Buffer.from(uint8arr));
      }
      return Buffer.from(_resolved);
    });
    return encoding ? promise2.then((buff) => buff.toString(encoding)) : promise2;
  }
  if (!Number.parseInt(event.node.req.headers["content-length"] || "") && !/\bchunked\b/i.test(
    String(event.node.req.headers["transfer-encoding"] ?? "")
  )) {
    return Promise.resolve(void 0);
  }
  const promise = event.node.req[RawBodySymbol] = new Promise(
    (resolve, reject) => {
      const bodyData = [];
      event.node.req.on("error", (err) => {
        reject(err);
      }).on("data", (chunk) => {
        bodyData.push(chunk);
      }).on("end", () => {
        resolve(Buffer.concat(bodyData));
      });
    }
  );
  const result = encoding ? promise.then((buff) => buff.toString(encoding)) : promise;
  return result;
}
function getRequestWebStream(event) {
  if (!PayloadMethods$1.includes(event.method)) {
    return;
  }
  const bodyStream = event.web?.request?.body || event._requestBody;
  if (bodyStream) {
    return bodyStream;
  }
  const _hasRawBody = RawBodySymbol in event.node.req || "rawBody" in event.node.req || "body" in event.node.req || "__unenv__" in event.node.req;
  if (_hasRawBody) {
    return new ReadableStream({
      async start(controller) {
        const _rawBody = await readRawBody(event, false);
        if (_rawBody) {
          controller.enqueue(_rawBody);
        }
        controller.close();
      }
    });
  }
  return new ReadableStream({
    start: (controller) => {
      event.node.req.on("data", (chunk) => {
        controller.enqueue(chunk);
      });
      event.node.req.on("end", () => {
        controller.close();
      });
      event.node.req.on("error", (err) => {
        controller.error(err);
      });
    }
  });
}

function handleCacheHeaders(event, opts) {
  const cacheControls = ["public", ...opts.cacheControls || []];
  let cacheMatched = false;
  if (opts.maxAge !== void 0) {
    cacheControls.push(`max-age=${+opts.maxAge}`, `s-maxage=${+opts.maxAge}`);
  }
  if (opts.modifiedTime) {
    const modifiedTime = new Date(opts.modifiedTime);
    const ifModifiedSince = event.node.req.headers["if-modified-since"];
    event.node.res.setHeader("last-modified", modifiedTime.toUTCString());
    if (ifModifiedSince && new Date(ifModifiedSince) >= modifiedTime) {
      cacheMatched = true;
    }
  }
  if (opts.etag) {
    event.node.res.setHeader("etag", opts.etag);
    const ifNonMatch = event.node.req.headers["if-none-match"];
    if (ifNonMatch === opts.etag) {
      cacheMatched = true;
    }
  }
  event.node.res.setHeader("cache-control", cacheControls.join(", "));
  if (cacheMatched) {
    event.node.res.statusCode = 304;
    if (!event.handled) {
      event.node.res.end();
    }
    return true;
  }
  return false;
}

const MIMES = {
  html: "text/html",
  json: "application/json"
};

const DISALLOWED_STATUS_CHARS = /[^\u0009\u0020-\u007E]/g;
function sanitizeStatusMessage(statusMessage = "") {
  return statusMessage.replace(DISALLOWED_STATUS_CHARS, "");
}
function sanitizeStatusCode(statusCode, defaultStatusCode = 200) {
  if (!statusCode) {
    return defaultStatusCode;
  }
  if (typeof statusCode === "string") {
    statusCode = Number.parseInt(statusCode, 10);
  }
  if (statusCode < 100 || statusCode > 999) {
    return defaultStatusCode;
  }
  return statusCode;
}

function getDistinctCookieKey(name, opts) {
  return [name, opts.domain || "", opts.path || "/"].join(";");
}

function parseCookies(event) {
  return parse(event.node.req.headers.cookie || "");
}
function getCookie(event, name) {
  return parseCookies(event)[name];
}
function setCookie(event, name, value, serializeOptions = {}) {
  if (!serializeOptions.path) {
    serializeOptions = { path: "/", ...serializeOptions };
  }
  const newCookie = serialize$1(name, value, serializeOptions);
  const currentCookies = splitCookiesString(
    event.node.res.getHeader("set-cookie")
  );
  if (currentCookies.length === 0) {
    event.node.res.setHeader("set-cookie", newCookie);
    return;
  }
  const newCookieKey = getDistinctCookieKey(name, serializeOptions);
  event.node.res.removeHeader("set-cookie");
  for (const cookie of currentCookies) {
    const parsed = parseSetCookie(cookie);
    const key = getDistinctCookieKey(parsed.name, parsed);
    if (key === newCookieKey) {
      continue;
    }
    event.node.res.appendHeader("set-cookie", cookie);
  }
  event.node.res.appendHeader("set-cookie", newCookie);
}
function splitCookiesString(cookiesString) {
  if (Array.isArray(cookiesString)) {
    return cookiesString.flatMap((c) => splitCookiesString(c));
  }
  if (typeof cookiesString !== "string") {
    return [];
  }
  const cookiesStrings = [];
  let pos = 0;
  let start;
  let ch;
  let lastComma;
  let nextStart;
  let cookiesSeparatorFound;
  const skipWhitespace = () => {
    while (pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos))) {
      pos += 1;
    }
    return pos < cookiesString.length;
  };
  const notSpecialChar = () => {
    ch = cookiesString.charAt(pos);
    return ch !== "=" && ch !== ";" && ch !== ",";
  };
  while (pos < cookiesString.length) {
    start = pos;
    cookiesSeparatorFound = false;
    while (skipWhitespace()) {
      ch = cookiesString.charAt(pos);
      if (ch === ",") {
        lastComma = pos;
        pos += 1;
        skipWhitespace();
        nextStart = pos;
        while (pos < cookiesString.length && notSpecialChar()) {
          pos += 1;
        }
        if (pos < cookiesString.length && cookiesString.charAt(pos) === "=") {
          cookiesSeparatorFound = true;
          pos = nextStart;
          cookiesStrings.push(cookiesString.slice(start, lastComma));
          start = pos;
        } else {
          pos = lastComma + 1;
        }
      } else {
        pos += 1;
      }
    }
    if (!cookiesSeparatorFound || pos >= cookiesString.length) {
      cookiesStrings.push(cookiesString.slice(start));
    }
  }
  return cookiesStrings;
}

const defer = typeof setImmediate === "undefined" ? (fn) => fn() : setImmediate;
function send(event, data, type) {
  if (type) {
    defaultContentType(event, type);
  }
  return new Promise((resolve) => {
    defer(() => {
      if (!event.handled) {
        event.node.res.end(data);
      }
      resolve();
    });
  });
}
function sendNoContent(event, code) {
  if (event.handled) {
    return;
  }
  if (!code && event.node.res.statusCode !== 200) {
    code = event.node.res.statusCode;
  }
  const _code = sanitizeStatusCode(code, 204);
  if (_code === 204) {
    event.node.res.removeHeader("content-length");
  }
  event.node.res.writeHead(_code);
  event.node.res.end();
}
function setResponseStatus(event, code, text) {
  if (code) {
    event.node.res.statusCode = sanitizeStatusCode(
      code,
      event.node.res.statusCode
    );
  }
  if (text) {
    event.node.res.statusMessage = sanitizeStatusMessage(text);
  }
}
function getResponseStatus(event) {
  return event.node.res.statusCode;
}
function getResponseStatusText(event) {
  return event.node.res.statusMessage;
}
function defaultContentType(event, type) {
  if (type && event.node.res.statusCode !== 304 && !event.node.res.getHeader("content-type")) {
    event.node.res.setHeader("content-type", type);
  }
}
function sendRedirect(event, location, code = 302) {
  event.node.res.statusCode = sanitizeStatusCode(
    code,
    event.node.res.statusCode
  );
  event.node.res.setHeader("location", location);
  const encodedLoc = location.replace(/"/g, "%22");
  const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`;
  return send(event, html, MIMES.html);
}
function getResponseHeader(event, name) {
  return event.node.res.getHeader(name);
}
function setResponseHeaders(event, headers) {
  for (const [name, value] of Object.entries(headers)) {
    event.node.res.setHeader(
      name,
      value
    );
  }
}
const setHeaders = setResponseHeaders;
function setResponseHeader(event, name, value) {
  event.node.res.setHeader(name, value);
}
function appendResponseHeader(event, name, value) {
  let current = event.node.res.getHeader(name);
  if (!current) {
    event.node.res.setHeader(name, value);
    return;
  }
  if (!Array.isArray(current)) {
    current = [current.toString()];
  }
  event.node.res.setHeader(name, [...current, value]);
}
function removeResponseHeader(event, name) {
  return event.node.res.removeHeader(name);
}
function isStream(data) {
  if (!data || typeof data !== "object") {
    return false;
  }
  if (typeof data.pipe === "function") {
    if (typeof data._read === "function") {
      return true;
    }
    if (typeof data.abort === "function") {
      return true;
    }
  }
  if (typeof data.pipeTo === "function") {
    return true;
  }
  return false;
}
function isWebResponse(data) {
  return typeof Response !== "undefined" && data instanceof Response;
}
function sendStream(event, stream) {
  if (!stream || typeof stream !== "object") {
    throw new Error("[h3] Invalid stream provided.");
  }
  event.node.res._data = stream;
  if (!event.node.res.socket) {
    event._handled = true;
    return Promise.resolve();
  }
  if (hasProp(stream, "pipeTo") && typeof stream.pipeTo === "function") {
    return stream.pipeTo(
      new WritableStream({
        write(chunk) {
          event.node.res.write(chunk);
        }
      })
    ).then(() => {
      event.node.res.end();
    });
  }
  if (hasProp(stream, "pipe") && typeof stream.pipe === "function") {
    return new Promise((resolve, reject) => {
      stream.pipe(event.node.res);
      if (stream.on) {
        stream.on("end", () => {
          event.node.res.end();
          resolve();
        });
        stream.on("error", (error) => {
          reject(error);
        });
      }
      event.node.res.on("close", () => {
        if (stream.abort) {
          stream.abort();
        }
      });
    });
  }
  throw new Error("[h3] Invalid or incompatible stream provided.");
}
function sendWebResponse(event, response) {
  for (const [key, value] of response.headers) {
    if (key === "set-cookie") {
      event.node.res.appendHeader(key, splitCookiesString(value));
    } else {
      event.node.res.setHeader(key, value);
    }
  }
  if (response.status) {
    event.node.res.statusCode = sanitizeStatusCode(
      response.status,
      event.node.res.statusCode
    );
  }
  if (response.statusText) {
    event.node.res.statusMessage = sanitizeStatusMessage(response.statusText);
  }
  if (response.redirected) {
    event.node.res.setHeader("location", response.url);
  }
  if (!response.body) {
    event.node.res.end();
    return;
  }
  return sendStream(event, response.body);
}

const PayloadMethods = /* @__PURE__ */ new Set(["PATCH", "POST", "PUT", "DELETE"]);
const ignoredHeaders = /* @__PURE__ */ new Set([
  "transfer-encoding",
  "accept-encoding",
  "connection",
  "keep-alive",
  "upgrade",
  "expect",
  "host",
  "accept"
]);
async function proxyRequest(event, target, opts = {}) {
  let body;
  let duplex;
  if (PayloadMethods.has(event.method)) {
    if (opts.streamRequest) {
      body = getRequestWebStream(event);
      duplex = "half";
    } else {
      body = await readRawBody(event, false).catch(() => void 0);
    }
  }
  const method = opts.fetchOptions?.method || event.method;
  const fetchHeaders = mergeHeaders$1(
    getProxyRequestHeaders(event, { host: target.startsWith("/") }),
    opts.fetchOptions?.headers,
    opts.headers
  );
  return sendProxy(event, target, {
    ...opts,
    fetchOptions: {
      method,
      body,
      duplex,
      ...opts.fetchOptions,
      headers: fetchHeaders
    }
  });
}
async function sendProxy(event, target, opts = {}) {
  let response;
  try {
    response = await _getFetch(opts.fetch)(target, {
      headers: opts.headers,
      ignoreResponseError: true,
      // make $ofetch.raw transparent
      ...opts.fetchOptions
    });
  } catch (error) {
    throw createError$1({
      status: 502,
      statusMessage: "Bad Gateway",
      cause: error
    });
  }
  event.node.res.statusCode = sanitizeStatusCode(
    response.status,
    event.node.res.statusCode
  );
  event.node.res.statusMessage = sanitizeStatusMessage(response.statusText);
  const cookies = [];
  for (const [key, value] of response.headers.entries()) {
    if (key === "content-encoding") {
      continue;
    }
    if (key === "content-length") {
      continue;
    }
    if (key === "set-cookie") {
      cookies.push(...splitCookiesString(value));
      continue;
    }
    event.node.res.setHeader(key, value);
  }
  if (cookies.length > 0) {
    event.node.res.setHeader(
      "set-cookie",
      cookies.map((cookie) => {
        if (opts.cookieDomainRewrite) {
          cookie = rewriteCookieProperty(
            cookie,
            opts.cookieDomainRewrite,
            "domain"
          );
        }
        if (opts.cookiePathRewrite) {
          cookie = rewriteCookieProperty(
            cookie,
            opts.cookiePathRewrite,
            "path"
          );
        }
        return cookie;
      })
    );
  }
  if (opts.onResponse) {
    await opts.onResponse(event, response);
  }
  if (response._data !== void 0) {
    return response._data;
  }
  if (event.handled) {
    return;
  }
  if (opts.sendStream === false) {
    const data = new Uint8Array(await response.arrayBuffer());
    return event.node.res.end(data);
  }
  if (response.body) {
    for await (const chunk of response.body) {
      event.node.res.write(chunk);
    }
  }
  return event.node.res.end();
}
function getProxyRequestHeaders(event, opts) {
  const headers = /* @__PURE__ */ Object.create(null);
  const reqHeaders = getRequestHeaders(event);
  for (const name in reqHeaders) {
    if (!ignoredHeaders.has(name) || name === "host" && opts?.host) {
      headers[name] = reqHeaders[name];
    }
  }
  return headers;
}
function fetchWithEvent(event, req, init, options) {
  return _getFetch(options?.fetch)(req, {
    ...init,
    context: init?.context || event.context,
    headers: {
      ...getProxyRequestHeaders(event, {
        host: typeof req === "string" && req.startsWith("/")
      }),
      ...init?.headers
    }
  });
}
function _getFetch(_fetch) {
  if (_fetch) {
    return _fetch;
  }
  if (globalThis.fetch) {
    return globalThis.fetch;
  }
  throw new Error(
    "fetch is not available. Try importing `node-fetch-native/polyfill` for Node.js."
  );
}
function rewriteCookieProperty(header, map, property) {
  const _map = typeof map === "string" ? { "*": map } : map;
  return header.replace(
    new RegExp(`(;\\s*${property}=)([^;]+)`, "gi"),
    (match, prefix, previousValue) => {
      let newValue;
      if (previousValue in _map) {
        newValue = _map[previousValue];
      } else if ("*" in _map) {
        newValue = _map["*"];
      } else {
        return match;
      }
      return newValue ? prefix + newValue : "";
    }
  );
}
function mergeHeaders$1(defaults, ...inputs) {
  const _inputs = inputs.filter(Boolean);
  if (_inputs.length === 0) {
    return defaults;
  }
  const merged = new Headers(defaults);
  for (const input of _inputs) {
    const entries = Array.isArray(input) ? input : typeof input.entries === "function" ? input.entries() : Object.entries(input);
    for (const [key, value] of entries) {
      if (value !== void 0) {
        merged.set(key, value);
      }
    }
  }
  return merged;
}

class H3Event {
  "__is_event__" = true;
  // Context
  node;
  // Node
  web;
  // Web
  context = {};
  // Shared
  // Request
  _method;
  _path;
  _headers;
  _requestBody;
  // Response
  _handled = false;
  // Hooks
  _onBeforeResponseCalled;
  _onAfterResponseCalled;
  constructor(req, res) {
    this.node = { req, res };
  }
  // --- Request ---
  get method() {
    if (!this._method) {
      this._method = (this.node.req.method || "GET").toUpperCase();
    }
    return this._method;
  }
  get path() {
    return this._path || this.node.req.url || "/";
  }
  get headers() {
    if (!this._headers) {
      this._headers = _normalizeNodeHeaders(this.node.req.headers);
    }
    return this._headers;
  }
  // --- Respoonse ---
  get handled() {
    return this._handled || this.node.res.writableEnded || this.node.res.headersSent;
  }
  respondWith(response) {
    return Promise.resolve(response).then(
      (_response) => sendWebResponse(this, _response)
    );
  }
  // --- Utils ---
  toString() {
    return `[${this.method}] ${this.path}`;
  }
  toJSON() {
    return this.toString();
  }
  // --- Deprecated ---
  /** @deprecated Please use `event.node.req` instead. */
  get req() {
    return this.node.req;
  }
  /** @deprecated Please use `event.node.res` instead. */
  get res() {
    return this.node.res;
  }
}
function isEvent(input) {
  return hasProp(input, "__is_event__");
}
function createEvent(req, res) {
  return new H3Event(req, res);
}
function _normalizeNodeHeaders(nodeHeaders) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(nodeHeaders)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(name, item);
      }
    } else if (value) {
      headers.set(name, value);
    }
  }
  return headers;
}

function defineEventHandler(handler) {
  if (typeof handler === "function") {
    handler.__is_handler__ = true;
    return handler;
  }
  const _hooks = {
    onRequest: _normalizeArray(handler.onRequest),
    onBeforeResponse: _normalizeArray(handler.onBeforeResponse)
  };
  const _handler = (event) => {
    return _callHandler(event, handler.handler, _hooks);
  };
  _handler.__is_handler__ = true;
  _handler.__resolve__ = handler.handler.__resolve__;
  _handler.__websocket__ = handler.websocket;
  return _handler;
}
function _normalizeArray(input) {
  return input ? Array.isArray(input) ? input : [input] : void 0;
}
async function _callHandler(event, handler, hooks) {
  if (hooks.onRequest) {
    for (const hook of hooks.onRequest) {
      await hook(event);
      if (event.handled) {
        return;
      }
    }
  }
  const body = await handler(event);
  const response = { body };
  if (hooks.onBeforeResponse) {
    for (const hook of hooks.onBeforeResponse) {
      await hook(event, response);
    }
  }
  return response.body;
}
const eventHandler = defineEventHandler;
function isEventHandler(input) {
  return hasProp(input, "__is_handler__");
}
function toEventHandler(input, _, _route) {
  return input;
}
function defineLazyEventHandler(factory) {
  let _promise;
  let _resolved;
  const resolveHandler = () => {
    if (_resolved) {
      return Promise.resolve(_resolved);
    }
    if (!_promise) {
      _promise = Promise.resolve(factory()).then((r) => {
        const handler2 = r.default || r;
        if (typeof handler2 !== "function") {
          throw new TypeError(
            "Invalid lazy handler result. It should be a function:",
            handler2
          );
        }
        _resolved = { handler: toEventHandler(r.default || r) };
        return _resolved;
      });
    }
    return _promise;
  };
  const handler = eventHandler((event) => {
    if (_resolved) {
      return _resolved.handler(event);
    }
    return resolveHandler().then((r) => r.handler(event));
  });
  handler.__resolve__ = resolveHandler;
  return handler;
}
const lazyEventHandler = defineLazyEventHandler;

function createApp(options = {}) {
  const stack = [];
  const handler = createAppEventHandler(stack, options);
  const resolve = createResolver(stack);
  handler.__resolve__ = resolve;
  const getWebsocket = cachedFn(() => websocketOptions(resolve, options));
  const app = {
    // @ts-expect-error
    use: (arg1, arg2, arg3) => use(app, arg1, arg2, arg3),
    resolve,
    handler,
    stack,
    options,
    get websocket() {
      return getWebsocket();
    }
  };
  return app;
}
function use(app, arg1, arg2, arg3) {
  if (Array.isArray(arg1)) {
    for (const i of arg1) {
      use(app, i, arg2, arg3);
    }
  } else if (Array.isArray(arg2)) {
    for (const i of arg2) {
      use(app, arg1, i, arg3);
    }
  } else if (typeof arg1 === "string") {
    app.stack.push(
      normalizeLayer({ ...arg3, route: arg1, handler: arg2 })
    );
  } else if (typeof arg1 === "function") {
    app.stack.push(normalizeLayer({ ...arg2, handler: arg1 }));
  } else {
    app.stack.push(normalizeLayer({ ...arg1 }));
  }
  return app;
}
function createAppEventHandler(stack, options) {
  const spacing = options.debug ? 2 : void 0;
  return eventHandler(async (event) => {
    event.node.req.originalUrl = event.node.req.originalUrl || event.node.req.url || "/";
    const _rawReqUrl = event.node.req.url || "/";
    const _reqPath = _decodePath(event._path || _rawReqUrl);
    event._path = _reqPath;
    const _needsRawUrl = _reqPath !== _rawReqUrl;
    let _layerPath;
    if (options.onRequest) {
      await options.onRequest(event);
    }
    for (const layer of stack) {
      if (layer.route.length > 1) {
        if (!_reqPath.startsWith(layer.route)) {
          continue;
        }
        _layerPath = _reqPath.slice(layer.route.length) || "/";
      } else {
        _layerPath = _reqPath;
      }
      if (layer.match && !layer.match(_layerPath, event)) {
        continue;
      }
      event._path = _layerPath;
      event.node.req.url = _needsRawUrl ? layer.route.length > 1 ? _rawReqUrl.slice(layer.route.length) || "/" : _rawReqUrl : _layerPath;
      const val = await layer.handler(event);
      const _body = val === void 0 ? void 0 : await val;
      if (_body !== void 0) {
        const _response = { body: _body };
        if (options.onBeforeResponse) {
          event._onBeforeResponseCalled = true;
          await options.onBeforeResponse(event, _response);
        }
        await handleHandlerResponse(event, _response.body, spacing);
        if (options.onAfterResponse) {
          event._onAfterResponseCalled = true;
          await options.onAfterResponse(event, _response);
        }
        return;
      }
      if (event.handled) {
        if (options.onAfterResponse) {
          event._onAfterResponseCalled = true;
          await options.onAfterResponse(event, void 0);
        }
        return;
      }
    }
    if (!event.handled) {
      throw createError$1({
        statusCode: 404,
        statusMessage: `Cannot find any path matching ${event.path || "/"}.`
      });
    }
    if (options.onAfterResponse) {
      event._onAfterResponseCalled = true;
      await options.onAfterResponse(event, void 0);
    }
  });
}
function createResolver(stack) {
  return async (path) => {
    let _layerPath;
    for (const layer of stack) {
      if (layer.route === "/" && !layer.handler.__resolve__) {
        continue;
      }
      if (!path.startsWith(layer.route)) {
        continue;
      }
      _layerPath = path.slice(layer.route.length) || "/";
      if (layer.match && !layer.match(_layerPath, void 0)) {
        continue;
      }
      let res = { route: layer.route, handler: layer.handler };
      if (res.handler.__resolve__) {
        const _res = await res.handler.__resolve__(_layerPath);
        if (!_res) {
          continue;
        }
        res = {
          ...res,
          ..._res,
          route: joinURL(res.route || "/", _res.route || "/")
        };
      }
      return res;
    }
  };
}
function normalizeLayer(input) {
  let handler = input.handler;
  if (handler.handler) {
    handler = handler.handler;
  }
  if (input.lazy) {
    handler = lazyEventHandler(handler);
  } else if (!isEventHandler(handler)) {
    handler = toEventHandler(handler, void 0, input.route);
  }
  return {
    route: withoutTrailingSlash(input.route),
    match: input.match,
    handler
  };
}
function handleHandlerResponse(event, val, jsonSpace) {
  if (val === null) {
    return sendNoContent(event);
  }
  if (val) {
    if (isWebResponse(val)) {
      return sendWebResponse(event, val);
    }
    if (isStream(val)) {
      return sendStream(event, val);
    }
    if (val.buffer) {
      return send(event, val);
    }
    if (val.arrayBuffer && typeof val.arrayBuffer === "function") {
      return val.arrayBuffer().then((arrayBuffer) => {
        return send(event, Buffer.from(arrayBuffer), val.type);
      });
    }
    if (val instanceof Error) {
      throw createError$1(val);
    }
    if (typeof val.end === "function") {
      return true;
    }
  }
  const valType = typeof val;
  if (valType === "string") {
    return send(event, val, MIMES.html);
  }
  if (valType === "object" || valType === "boolean" || valType === "number") {
    return send(event, JSON.stringify(val, void 0, jsonSpace), MIMES.json);
  }
  if (valType === "bigint") {
    return send(event, val.toString(), MIMES.json);
  }
  throw createError$1({
    statusCode: 500,
    statusMessage: `[h3] Cannot send ${valType} as response.`
  });
}
function cachedFn(fn) {
  let cache;
  return () => {
    if (!cache) {
      cache = fn();
    }
    return cache;
  };
}
function _decodePath(url) {
  const qIndex = url.indexOf("?");
  const path = qIndex === -1 ? url : url.slice(0, qIndex);
  const query = qIndex === -1 ? "" : url.slice(qIndex);
  const decodedPath = path.includes("%25") ? decodePath(path.replace(/%25/g, "%2525")) : decodePath(path);
  return decodedPath + query;
}
function websocketOptions(evResolver, appOptions) {
  return {
    ...appOptions.websocket,
    async resolve(info) {
      const url = info.request?.url || info.url || "/";
      const { pathname } = typeof url === "string" ? parseURL(url) : url;
      const resolved = await evResolver(pathname);
      return resolved?.handler?.__websocket__ || {};
    }
  };
}

const RouterMethods = [
  "connect",
  "delete",
  "get",
  "head",
  "options",
  "post",
  "put",
  "trace",
  "patch"
];
function createRouter(opts = {}) {
  const _router = createRouter$1({});
  const routes = {};
  let _matcher;
  const router = {};
  const addRoute = (path, handler, method) => {
    let route = routes[path];
    if (!route) {
      routes[path] = route = { path, handlers: {} };
      _router.insert(path, route);
    }
    if (Array.isArray(method)) {
      for (const m of method) {
        addRoute(path, handler, m);
      }
    } else {
      route.handlers[method] = toEventHandler(handler);
    }
    return router;
  };
  router.use = router.add = (path, handler, method) => addRoute(path, handler, method || "all");
  for (const method of RouterMethods) {
    router[method] = (path, handle) => router.add(path, handle, method);
  }
  const matchHandler = (path = "/", method = "get") => {
    const qIndex = path.indexOf("?");
    if (qIndex !== -1) {
      path = path.slice(0, Math.max(0, qIndex));
    }
    const matched = _router.lookup(path);
    if (!matched || !matched.handlers) {
      return {
        error: createError$1({
          statusCode: 404,
          name: "Not Found",
          statusMessage: `Cannot find any route matching ${path || "/"}.`
        })
      };
    }
    let handler = matched.handlers[method] || matched.handlers.all;
    if (!handler) {
      if (!_matcher) {
        _matcher = toRouteMatcher(_router);
      }
      const _matches = _matcher.matchAll(path).reverse();
      for (const _match of _matches) {
        if (_match.handlers[method]) {
          handler = _match.handlers[method];
          matched.handlers[method] = matched.handlers[method] || handler;
          break;
        }
        if (_match.handlers.all) {
          handler = _match.handlers.all;
          matched.handlers.all = matched.handlers.all || handler;
          break;
        }
      }
    }
    if (!handler) {
      return {
        error: createError$1({
          statusCode: 405,
          name: "Method Not Allowed",
          statusMessage: `Method ${method} is not allowed on this route.`
        })
      };
    }
    return { matched, handler };
  };
  const isPreemptive = opts.preemptive || opts.preemtive;
  router.handler = eventHandler((event) => {
    const match = matchHandler(
      event.path,
      event.method.toLowerCase()
    );
    if ("error" in match) {
      if (isPreemptive) {
        throw match.error;
      } else {
        return;
      }
    }
    event.context.matchedRoute = match.matched;
    const params = match.matched.params || {};
    event.context.params = params;
    return Promise.resolve(match.handler(event)).then((res) => {
      if (res === void 0 && isPreemptive) {
        return null;
      }
      return res;
    });
  });
  router.handler.__resolve__ = async (path) => {
    path = withLeadingSlash(path);
    const match = matchHandler(path);
    if ("error" in match) {
      return;
    }
    let res = {
      route: match.matched.path,
      handler: match.handler
    };
    if (match.handler.__resolve__) {
      const _res = await match.handler.__resolve__(path);
      if (!_res) {
        return;
      }
      res = { ...res, ..._res };
    }
    return res;
  };
  return router;
}
function toNodeListener(app) {
  const toNodeHandle = async function(req, res) {
    const event = createEvent(req, res);
    try {
      await app.handler(event);
    } catch (_error) {
      const error = createError$1(_error);
      if (!isError(_error)) {
        error.unhandled = true;
      }
      setResponseStatus(event, error.statusCode, error.statusMessage);
      if (app.options.onError) {
        await app.options.onError(error, event);
      }
      if (event.handled) {
        return;
      }
      if (error.unhandled || error.fatal) {
        console.error("[h3]", error.fatal ? "[fatal]" : "[unhandled]", error);
      }
      if (app.options.onBeforeResponse && !event._onBeforeResponseCalled) {
        await app.options.onBeforeResponse(event, { body: error });
      }
      await sendError(event, error, !!app.options.debug);
      if (app.options.onAfterResponse && !event._onAfterResponseCalled) {
        await app.options.onAfterResponse(event, { body: error });
      }
    }
  };
  return toNodeHandle;
}

function flatHooks(configHooks, hooks = {}, parentName) {
  for (const key in configHooks) {
    const subHook = configHooks[key];
    const name = parentName ? `${parentName}:${key}` : key;
    if (typeof subHook === "object" && subHook !== null) {
      flatHooks(subHook, hooks, name);
    } else if (typeof subHook === "function") {
      hooks[name] = subHook;
    }
  }
  return hooks;
}
const defaultTask = { run: (function_) => function_() };
const _createTask = () => defaultTask;
const createTask = typeof console.createTask !== "undefined" ? console.createTask : _createTask;
function serialTaskCaller(hooks, args) {
  const name = args.shift();
  const task = createTask(name);
  return hooks.reduce(
    (promise, hookFunction) => promise.then(() => task.run(() => hookFunction(...args))),
    Promise.resolve()
  );
}
function parallelTaskCaller(hooks, args) {
  const name = args.shift();
  const task = createTask(name);
  return Promise.all(hooks.map((hook) => task.run(() => hook(...args))));
}
function callEachWith(callbacks, arg0) {
  for (const callback of [...callbacks]) {
    callback(arg0);
  }
}

class Hookable {
  constructor() {
    this._hooks = {};
    this._before = void 0;
    this._after = void 0;
    this._deprecatedMessages = void 0;
    this._deprecatedHooks = {};
    this.hook = this.hook.bind(this);
    this.callHook = this.callHook.bind(this);
    this.callHookWith = this.callHookWith.bind(this);
  }
  hook(name, function_, options = {}) {
    if (!name || typeof function_ !== "function") {
      return () => {
      };
    }
    const originalName = name;
    let dep;
    while (this._deprecatedHooks[name]) {
      dep = this._deprecatedHooks[name];
      name = dep.to;
    }
    if (dep && !options.allowDeprecated) {
      let message = dep.message;
      if (!message) {
        message = `${originalName} hook has been deprecated` + (dep.to ? `, please use ${dep.to}` : "");
      }
      if (!this._deprecatedMessages) {
        this._deprecatedMessages = /* @__PURE__ */ new Set();
      }
      if (!this._deprecatedMessages.has(message)) {
        console.warn(message);
        this._deprecatedMessages.add(message);
      }
    }
    if (!function_.name) {
      try {
        Object.defineProperty(function_, "name", {
          get: () => "_" + name.replace(/\W+/g, "_") + "_hook_cb",
          configurable: true
        });
      } catch {
      }
    }
    this._hooks[name] = this._hooks[name] || [];
    this._hooks[name].push(function_);
    return () => {
      if (function_) {
        this.removeHook(name, function_);
        function_ = void 0;
      }
    };
  }
  hookOnce(name, function_) {
    let _unreg;
    let _function = (...arguments_) => {
      if (typeof _unreg === "function") {
        _unreg();
      }
      _unreg = void 0;
      _function = void 0;
      return function_(...arguments_);
    };
    _unreg = this.hook(name, _function);
    return _unreg;
  }
  removeHook(name, function_) {
    if (this._hooks[name]) {
      const index = this._hooks[name].indexOf(function_);
      if (index !== -1) {
        this._hooks[name].splice(index, 1);
      }
      if (this._hooks[name].length === 0) {
        delete this._hooks[name];
      }
    }
  }
  deprecateHook(name, deprecated) {
    this._deprecatedHooks[name] = typeof deprecated === "string" ? { to: deprecated } : deprecated;
    const _hooks = this._hooks[name] || [];
    delete this._hooks[name];
    for (const hook of _hooks) {
      this.hook(name, hook);
    }
  }
  deprecateHooks(deprecatedHooks) {
    Object.assign(this._deprecatedHooks, deprecatedHooks);
    for (const name in deprecatedHooks) {
      this.deprecateHook(name, deprecatedHooks[name]);
    }
  }
  addHooks(configHooks) {
    const hooks = flatHooks(configHooks);
    const removeFns = Object.keys(hooks).map(
      (key) => this.hook(key, hooks[key])
    );
    return () => {
      for (const unreg of removeFns.splice(0, removeFns.length)) {
        unreg();
      }
    };
  }
  removeHooks(configHooks) {
    const hooks = flatHooks(configHooks);
    for (const key in hooks) {
      this.removeHook(key, hooks[key]);
    }
  }
  removeAllHooks() {
    for (const key in this._hooks) {
      delete this._hooks[key];
    }
  }
  callHook(name, ...arguments_) {
    arguments_.unshift(name);
    return this.callHookWith(serialTaskCaller, name, ...arguments_);
  }
  callHookParallel(name, ...arguments_) {
    arguments_.unshift(name);
    return this.callHookWith(parallelTaskCaller, name, ...arguments_);
  }
  callHookWith(caller, name, ...arguments_) {
    const event = this._before || this._after ? { name, args: arguments_, context: {} } : void 0;
    if (this._before) {
      callEachWith(this._before, event);
    }
    const result = caller(
      name in this._hooks ? [...this._hooks[name]] : [],
      arguments_
    );
    if (result instanceof Promise) {
      return result.finally(() => {
        if (this._after && event) {
          callEachWith(this._after, event);
        }
      });
    }
    if (this._after && event) {
      callEachWith(this._after, event);
    }
    return result;
  }
  beforeEach(function_) {
    this._before = this._before || [];
    this._before.push(function_);
    return () => {
      if (this._before !== void 0) {
        const index = this._before.indexOf(function_);
        if (index !== -1) {
          this._before.splice(index, 1);
        }
      }
    };
  }
  afterEach(function_) {
    this._after = this._after || [];
    this._after.push(function_);
    return () => {
      if (this._after !== void 0) {
        const index = this._after.indexOf(function_);
        if (index !== -1) {
          this._after.splice(index, 1);
        }
      }
    };
  }
}
function createHooks() {
  return new Hookable();
}

const s=globalThis.Headers,i=globalThis.AbortController,l=globalThis.fetch||(()=>{throw new Error("[node-fetch-native] Failed to fetch: `globalThis.fetch` is not available!")});

class FetchError extends Error {
  constructor(message, opts) {
    super(message, opts);
    this.name = "FetchError";
    if (opts?.cause && !this.cause) {
      this.cause = opts.cause;
    }
  }
}
function createFetchError(ctx) {
  const errorMessage = ctx.error?.message || ctx.error?.toString() || "";
  const method = ctx.request?.method || ctx.options?.method || "GET";
  const url = ctx.request?.url || String(ctx.request) || "/";
  const requestStr = `[${method}] ${JSON.stringify(url)}`;
  const statusStr = ctx.response ? `${ctx.response.status} ${ctx.response.statusText}` : "<no response>";
  const message = `${requestStr}: ${statusStr}${errorMessage ? ` ${errorMessage}` : ""}`;
  const fetchError = new FetchError(
    message,
    ctx.error ? { cause: ctx.error } : void 0
  );
  for (const key of ["request", "options", "response"]) {
    Object.defineProperty(fetchError, key, {
      get() {
        return ctx[key];
      }
    });
  }
  for (const [key, refKey] of [
    ["data", "_data"],
    ["status", "status"],
    ["statusCode", "status"],
    ["statusText", "statusText"],
    ["statusMessage", "statusText"]
  ]) {
    Object.defineProperty(fetchError, key, {
      get() {
        return ctx.response && ctx.response[refKey];
      }
    });
  }
  return fetchError;
}

const payloadMethods = new Set(
  Object.freeze(["PATCH", "POST", "PUT", "DELETE"])
);
function isPayloadMethod(method = "GET") {
  return payloadMethods.has(method.toUpperCase());
}
function isJSONSerializable(value) {
  if (value === void 0) {
    return false;
  }
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean" || t === null) {
    return true;
  }
  if (t !== "object") {
    return false;
  }
  if (Array.isArray(value)) {
    return true;
  }
  if (value.buffer) {
    return false;
  }
  if (value instanceof FormData || value instanceof URLSearchParams) {
    return false;
  }
  return value.constructor && value.constructor.name === "Object" || typeof value.toJSON === "function";
}
const textTypes = /* @__PURE__ */ new Set([
  "image/svg",
  "application/xml",
  "application/xhtml",
  "application/html"
]);
const JSON_RE = /^application\/(?:[\w!#$%&*.^`~-]*\+)?json(;.+)?$/i;
function detectResponseType(_contentType = "") {
  if (!_contentType) {
    return "json";
  }
  const contentType = _contentType.split(";").shift() || "";
  if (JSON_RE.test(contentType)) {
    return "json";
  }
  if (contentType === "text/event-stream") {
    return "stream";
  }
  if (textTypes.has(contentType) || contentType.startsWith("text/")) {
    return "text";
  }
  return "blob";
}
function resolveFetchOptions(request, input, defaults, Headers) {
  const headers = mergeHeaders(
    input?.headers ?? request?.headers,
    defaults?.headers,
    Headers
  );
  let query;
  if (defaults?.query || defaults?.params || input?.params || input?.query) {
    query = {
      ...defaults?.params,
      ...defaults?.query,
      ...input?.params,
      ...input?.query
    };
  }
  return {
    ...defaults,
    ...input,
    query,
    params: query,
    headers
  };
}
function mergeHeaders(input, defaults, Headers) {
  if (!defaults) {
    return new Headers(input);
  }
  const headers = new Headers(defaults);
  if (input) {
    for (const [key, value] of Symbol.iterator in input || Array.isArray(input) ? input : new Headers(input)) {
      headers.set(key, value);
    }
  }
  return headers;
}
async function callHooks(context, hooks) {
  if (hooks) {
    if (Array.isArray(hooks)) {
      for (const hook of hooks) {
        await hook(context);
      }
    } else {
      await hooks(context);
    }
  }
}

const retryStatusCodes = /* @__PURE__ */ new Set([
  408,
  // Request Timeout
  409,
  // Conflict
  425,
  // Too Early (Experimental)
  429,
  // Too Many Requests
  500,
  // Internal Server Error
  502,
  // Bad Gateway
  503,
  // Service Unavailable
  504
  // Gateway Timeout
]);
const nullBodyResponses = /* @__PURE__ */ new Set([101, 204, 205, 304]);
function createFetch(globalOptions = {}) {
  const {
    fetch = globalThis.fetch,
    Headers = globalThis.Headers,
    AbortController = globalThis.AbortController
  } = globalOptions;
  async function onError(context) {
    const isAbort = context.error && context.error.name === "AbortError" && !context.options.timeout || false;
    if (context.options.retry !== false && !isAbort) {
      let retries;
      if (typeof context.options.retry === "number") {
        retries = context.options.retry;
      } else {
        retries = isPayloadMethod(context.options.method) ? 0 : 1;
      }
      const responseCode = context.response && context.response.status || 500;
      if (retries > 0 && (Array.isArray(context.options.retryStatusCodes) ? context.options.retryStatusCodes.includes(responseCode) : retryStatusCodes.has(responseCode))) {
        const retryDelay = typeof context.options.retryDelay === "function" ? context.options.retryDelay(context) : context.options.retryDelay || 0;
        if (retryDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
        return $fetchRaw(context.request, {
          ...context.options,
          retry: retries - 1
        });
      }
    }
    const error = createFetchError(context);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(error, $fetchRaw);
    }
    throw error;
  }
  const $fetchRaw = async function $fetchRaw2(_request, _options = {}) {
    const context = {
      request: _request,
      options: resolveFetchOptions(
        _request,
        _options,
        globalOptions.defaults,
        Headers
      ),
      response: void 0,
      error: void 0
    };
    if (context.options.method) {
      context.options.method = context.options.method.toUpperCase();
    }
    if (context.options.onRequest) {
      await callHooks(context, context.options.onRequest);
      if (!(context.options.headers instanceof Headers)) {
        context.options.headers = new Headers(
          context.options.headers || {}
          /* compat */
        );
      }
    }
    if (typeof context.request === "string") {
      if (context.options.baseURL) {
        context.request = withBase(context.request, context.options.baseURL);
      }
      if (context.options.query) {
        context.request = withQuery(context.request, context.options.query);
        delete context.options.query;
      }
      if ("query" in context.options) {
        delete context.options.query;
      }
      if ("params" in context.options) {
        delete context.options.params;
      }
    }
    if (context.options.body && isPayloadMethod(context.options.method)) {
      if (isJSONSerializable(context.options.body)) {
        const contentType = context.options.headers.get("content-type");
        if (typeof context.options.body !== "string") {
          context.options.body = contentType === "application/x-www-form-urlencoded" ? new URLSearchParams(
            context.options.body
          ).toString() : JSON.stringify(context.options.body);
        }
        if (!contentType) {
          context.options.headers.set("content-type", "application/json");
        }
        if (!context.options.headers.has("accept")) {
          context.options.headers.set("accept", "application/json");
        }
      } else if (
        // ReadableStream Body
        "pipeTo" in context.options.body && typeof context.options.body.pipeTo === "function" || // Node.js Stream Body
        typeof context.options.body.pipe === "function"
      ) {
        if (!("duplex" in context.options)) {
          context.options.duplex = "half";
        }
      }
    }
    let abortTimeout;
    if (!context.options.signal && context.options.timeout) {
      const controller = new AbortController();
      abortTimeout = setTimeout(() => {
        const error = new Error(
          "[TimeoutError]: The operation was aborted due to timeout"
        );
        error.name = "TimeoutError";
        error.code = 23;
        controller.abort(error);
      }, context.options.timeout);
      context.options.signal = controller.signal;
    }
    try {
      context.response = await fetch(
        context.request,
        context.options
      );
    } catch (error) {
      context.error = error;
      if (context.options.onRequestError) {
        await callHooks(
          context,
          context.options.onRequestError
        );
      }
      return await onError(context);
    } finally {
      if (abortTimeout) {
        clearTimeout(abortTimeout);
      }
    }
    const hasBody = (context.response.body || // https://github.com/unjs/ofetch/issues/324
    // https://github.com/unjs/ofetch/issues/294
    // https://github.com/JakeChampion/fetch/issues/1454
    context.response._bodyInit) && !nullBodyResponses.has(context.response.status) && context.options.method !== "HEAD";
    if (hasBody) {
      const responseType = (context.options.parseResponse ? "json" : context.options.responseType) || detectResponseType(context.response.headers.get("content-type") || "");
      switch (responseType) {
        case "json": {
          const data = await context.response.text();
          const parseFunction = context.options.parseResponse || destr;
          context.response._data = parseFunction(data);
          break;
        }
        case "stream": {
          context.response._data = context.response.body || context.response._bodyInit;
          break;
        }
        default: {
          context.response._data = await context.response[responseType]();
        }
      }
    }
    if (context.options.onResponse) {
      await callHooks(
        context,
        context.options.onResponse
      );
    }
    if (!context.options.ignoreResponseError && context.response.status >= 400 && context.response.status < 600) {
      if (context.options.onResponseError) {
        await callHooks(
          context,
          context.options.onResponseError
        );
      }
      return await onError(context);
    }
    return context.response;
  };
  const $fetch = async function $fetch2(request, options) {
    const r = await $fetchRaw(request, options);
    return r._data;
  };
  $fetch.raw = $fetchRaw;
  $fetch.native = (...args) => fetch(...args);
  $fetch.create = (defaultOptions = {}, customGlobalOptions = {}) => createFetch({
    ...globalOptions,
    ...customGlobalOptions,
    defaults: {
      ...globalOptions.defaults,
      ...customGlobalOptions.defaults,
      ...defaultOptions
    }
  });
  return $fetch;
}

function createNodeFetch() {
  const useKeepAlive = JSON.parse(process.env.FETCH_KEEP_ALIVE || "false");
  if (!useKeepAlive) {
    return l;
  }
  const agentOptions = { keepAlive: true };
  const httpAgent = new http.Agent(agentOptions);
  const httpsAgent = new https.Agent(agentOptions);
  const nodeFetchOptions = {
    agent(parsedURL) {
      return parsedURL.protocol === "http:" ? httpAgent : httpsAgent;
    }
  };
  return function nodeFetchWithKeepAlive(input, init) {
    return l(input, { ...nodeFetchOptions, ...init });
  };
}
const fetch$1 = globalThis.fetch ? (...args) => globalThis.fetch(...args) : createNodeFetch();
const Headers$1 = globalThis.Headers || s;
const AbortController = globalThis.AbortController || i;
createFetch({ fetch: fetch$1, Headers: Headers$1, AbortController });

function wrapToPromise(value) {
  if (!value || typeof value.then !== "function") {
    return Promise.resolve(value);
  }
  return value;
}
function asyncCall(function_, ...arguments_) {
  try {
    return wrapToPromise(function_(...arguments_));
  } catch (error) {
    return Promise.reject(error);
  }
}
function isPrimitive(value) {
  const type = typeof value;
  return value === null || type !== "object" && type !== "function";
}
function isPureObject(value) {
  const proto = Object.getPrototypeOf(value);
  return !proto || proto.isPrototypeOf(Object);
}
function stringify(value) {
  if (isPrimitive(value)) {
    return String(value);
  }
  if (isPureObject(value) || Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (typeof value.toJSON === "function") {
    return stringify(value.toJSON());
  }
  throw new Error("[unstorage] Cannot stringify value!");
}
const BASE64_PREFIX = "base64:";
function serializeRaw(value) {
  if (typeof value === "string") {
    return value;
  }
  return BASE64_PREFIX + base64Encode(value);
}
function deserializeRaw(value) {
  if (typeof value !== "string") {
    return value;
  }
  if (!value.startsWith(BASE64_PREFIX)) {
    return value;
  }
  return base64Decode(value.slice(BASE64_PREFIX.length));
}
function base64Decode(input) {
  if (globalThis.Buffer) {
    return Buffer.from(input, "base64");
  }
  return Uint8Array.from(
    globalThis.atob(input),
    (c) => c.codePointAt(0)
  );
}
function base64Encode(input) {
  if (globalThis.Buffer) {
    return Buffer.from(input).toString("base64");
  }
  return globalThis.btoa(String.fromCodePoint(...input));
}

const storageKeyProperties = [
  "has",
  "hasItem",
  "get",
  "getItem",
  "getItemRaw",
  "set",
  "setItem",
  "setItemRaw",
  "del",
  "remove",
  "removeItem",
  "getMeta",
  "setMeta",
  "removeMeta",
  "getKeys",
  "clear",
  "mount",
  "unmount"
];
function prefixStorage(storage, base) {
  base = normalizeBaseKey(base);
  if (!base) {
    return storage;
  }
  const nsStorage = { ...storage };
  for (const property of storageKeyProperties) {
    nsStorage[property] = (key = "", ...args) => (
      // @ts-ignore
      storage[property](base + key, ...args)
    );
  }
  nsStorage.getKeys = (key = "", ...arguments_) => storage.getKeys(base + key, ...arguments_).then((keys) => keys.map((key2) => key2.slice(base.length)));
  nsStorage.keys = nsStorage.getKeys;
  nsStorage.getItems = async (items, commonOptions) => {
    const prefixedItems = items.map(
      (item) => typeof item === "string" ? base + item : { ...item, key: base + item.key }
    );
    const results = await storage.getItems(prefixedItems, commonOptions);
    return results.map((entry) => ({
      key: entry.key.slice(base.length),
      value: entry.value
    }));
  };
  nsStorage.setItems = async (items, commonOptions) => {
    const prefixedItems = items.map((item) => ({
      key: base + item.key,
      value: item.value,
      options: item.options
    }));
    return storage.setItems(prefixedItems, commonOptions);
  };
  return nsStorage;
}
function normalizeKey$1(key) {
  if (!key) {
    return "";
  }
  return key.split("?")[0]?.replace(/[/\\]/g, ":").replace(/:+/g, ":").replace(/^:|:$/g, "") || "";
}
function joinKeys(...keys) {
  return normalizeKey$1(keys.join(":"));
}
function normalizeBaseKey(base) {
  base = normalizeKey$1(base);
  return base ? base + ":" : "";
}
function filterKeyByDepth(key, depth) {
  if (depth === void 0) {
    return true;
  }
  let substrCount = 0;
  let index = key.indexOf(":");
  while (index > -1) {
    substrCount++;
    index = key.indexOf(":", index + 1);
  }
  return substrCount <= depth;
}
function filterKeyByBase(key, base) {
  if (base) {
    return key.startsWith(base) && key[key.length - 1] !== "$";
  }
  return key[key.length - 1] !== "$";
}

function defineDriver$1(factory) {
  return factory;
}

const DRIVER_NAME$1 = "memory";
const memory = defineDriver$1(() => {
  const data = /* @__PURE__ */ new Map();
  return {
    name: DRIVER_NAME$1,
    getInstance: () => data,
    hasItem(key) {
      return data.has(key);
    },
    getItem(key) {
      return data.get(key) ?? null;
    },
    getItemRaw(key) {
      return data.get(key) ?? null;
    },
    setItem(key, value) {
      data.set(key, value);
    },
    setItemRaw(key, value) {
      data.set(key, value);
    },
    removeItem(key) {
      data.delete(key);
    },
    getKeys() {
      return [...data.keys()];
    },
    clear() {
      data.clear();
    },
    dispose() {
      data.clear();
    }
  };
});

function createStorage(options = {}) {
  const context = {
    mounts: { "": options.driver || memory() },
    mountpoints: [""],
    watching: false,
    watchListeners: [],
    unwatch: {}
  };
  const getMount = (key) => {
    for (const base of context.mountpoints) {
      if (key.startsWith(base)) {
        return {
          base,
          relativeKey: key.slice(base.length),
          driver: context.mounts[base]
        };
      }
    }
    return {
      base: "",
      relativeKey: key,
      driver: context.mounts[""]
    };
  };
  const getMounts = (base, includeParent) => {
    return context.mountpoints.filter(
      (mountpoint) => mountpoint.startsWith(base) || includeParent && base.startsWith(mountpoint)
    ).map((mountpoint) => ({
      relativeBase: base.length > mountpoint.length ? base.slice(mountpoint.length) : void 0,
      mountpoint,
      driver: context.mounts[mountpoint]
    }));
  };
  const onChange = (event, key) => {
    if (!context.watching) {
      return;
    }
    key = normalizeKey$1(key);
    for (const listener of context.watchListeners) {
      listener(event, key);
    }
  };
  const startWatch = async () => {
    if (context.watching) {
      return;
    }
    context.watching = true;
    for (const mountpoint in context.mounts) {
      context.unwatch[mountpoint] = await watch(
        context.mounts[mountpoint],
        onChange,
        mountpoint
      );
    }
  };
  const stopWatch = async () => {
    if (!context.watching) {
      return;
    }
    for (const mountpoint in context.unwatch) {
      await context.unwatch[mountpoint]();
    }
    context.unwatch = {};
    context.watching = false;
  };
  const runBatch = (items, commonOptions, cb) => {
    const batches = /* @__PURE__ */ new Map();
    const getBatch = (mount) => {
      let batch = batches.get(mount.base);
      if (!batch) {
        batch = {
          driver: mount.driver,
          base: mount.base,
          items: []
        };
        batches.set(mount.base, batch);
      }
      return batch;
    };
    for (const item of items) {
      const isStringItem = typeof item === "string";
      const key = normalizeKey$1(isStringItem ? item : item.key);
      const value = isStringItem ? void 0 : item.value;
      const options2 = isStringItem || !item.options ? commonOptions : { ...commonOptions, ...item.options };
      const mount = getMount(key);
      getBatch(mount).items.push({
        key,
        value,
        relativeKey: mount.relativeKey,
        options: options2
      });
    }
    return Promise.all([...batches.values()].map((batch) => cb(batch))).then(
      (r) => r.flat()
    );
  };
  const storage = {
    // Item
    hasItem(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      return asyncCall(driver.hasItem, relativeKey, opts);
    },
    getItem(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      return asyncCall(driver.getItem, relativeKey, opts).then(
        (value) => destr(value)
      );
    },
    getItems(items, commonOptions = {}) {
      return runBatch(items, commonOptions, (batch) => {
        if (batch.driver.getItems) {
          return asyncCall(
            batch.driver.getItems,
            batch.items.map((item) => ({
              key: item.relativeKey,
              options: item.options
            })),
            commonOptions
          ).then(
            (r) => r.map((item) => ({
              key: joinKeys(batch.base, item.key),
              value: destr(item.value)
            }))
          );
        }
        return Promise.all(
          batch.items.map((item) => {
            return asyncCall(
              batch.driver.getItem,
              item.relativeKey,
              item.options
            ).then((value) => ({
              key: item.key,
              value: destr(value)
            }));
          })
        );
      });
    },
    getItemRaw(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (driver.getItemRaw) {
        return asyncCall(driver.getItemRaw, relativeKey, opts);
      }
      return asyncCall(driver.getItem, relativeKey, opts).then(
        (value) => deserializeRaw(value)
      );
    },
    async setItem(key, value, opts = {}) {
      if (value === void 0) {
        return storage.removeItem(key);
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (!driver.setItem) {
        return;
      }
      await asyncCall(driver.setItem, relativeKey, stringify(value), opts);
      if (!driver.watch) {
        onChange("update", key);
      }
    },
    async setItems(items, commonOptions) {
      await runBatch(items, commonOptions, async (batch) => {
        if (batch.driver.setItems) {
          return asyncCall(
            batch.driver.setItems,
            batch.items.map((item) => ({
              key: item.relativeKey,
              value: stringify(item.value),
              options: item.options
            })),
            commonOptions
          );
        }
        if (!batch.driver.setItem) {
          return;
        }
        await Promise.all(
          batch.items.map((item) => {
            return asyncCall(
              batch.driver.setItem,
              item.relativeKey,
              stringify(item.value),
              item.options
            );
          })
        );
      });
    },
    async setItemRaw(key, value, opts = {}) {
      if (value === void 0) {
        return storage.removeItem(key, opts);
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (driver.setItemRaw) {
        await asyncCall(driver.setItemRaw, relativeKey, value, opts);
      } else if (driver.setItem) {
        await asyncCall(driver.setItem, relativeKey, serializeRaw(value), opts);
      } else {
        return;
      }
      if (!driver.watch) {
        onChange("update", key);
      }
    },
    async removeItem(key, opts = {}) {
      if (typeof opts === "boolean") {
        opts = { removeMeta: opts };
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (!driver.removeItem) {
        return;
      }
      await asyncCall(driver.removeItem, relativeKey, opts);
      if (opts.removeMeta || opts.removeMata) {
        await asyncCall(driver.removeItem, relativeKey + "$", opts);
      }
      if (!driver.watch) {
        onChange("remove", key);
      }
    },
    // Meta
    async getMeta(key, opts = {}) {
      if (typeof opts === "boolean") {
        opts = { nativeOnly: opts };
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      const meta = /* @__PURE__ */ Object.create(null);
      if (driver.getMeta) {
        Object.assign(meta, await asyncCall(driver.getMeta, relativeKey, opts));
      }
      if (!opts.nativeOnly) {
        const value = await asyncCall(
          driver.getItem,
          relativeKey + "$",
          opts
        ).then((value_) => destr(value_));
        if (value && typeof value === "object") {
          if (typeof value.atime === "string") {
            value.atime = new Date(value.atime);
          }
          if (typeof value.mtime === "string") {
            value.mtime = new Date(value.mtime);
          }
          Object.assign(meta, value);
        }
      }
      return meta;
    },
    setMeta(key, value, opts = {}) {
      return this.setItem(key + "$", value, opts);
    },
    removeMeta(key, opts = {}) {
      return this.removeItem(key + "$", opts);
    },
    // Keys
    async getKeys(base, opts = {}) {
      base = normalizeBaseKey(base);
      const mounts = getMounts(base, true);
      let maskedMounts = [];
      const allKeys = [];
      let allMountsSupportMaxDepth = true;
      for (const mount of mounts) {
        if (!mount.driver.flags?.maxDepth) {
          allMountsSupportMaxDepth = false;
        }
        const rawKeys = await asyncCall(
          mount.driver.getKeys,
          mount.relativeBase,
          opts
        );
        for (const key of rawKeys) {
          const fullKey = mount.mountpoint + normalizeKey$1(key);
          if (!maskedMounts.some((p) => fullKey.startsWith(p))) {
            allKeys.push(fullKey);
          }
        }
        maskedMounts = [
          mount.mountpoint,
          ...maskedMounts.filter((p) => !p.startsWith(mount.mountpoint))
        ];
      }
      const shouldFilterByDepth = opts.maxDepth !== void 0 && !allMountsSupportMaxDepth;
      return allKeys.filter(
        (key) => (!shouldFilterByDepth || filterKeyByDepth(key, opts.maxDepth)) && filterKeyByBase(key, base)
      );
    },
    // Utils
    async clear(base, opts = {}) {
      base = normalizeBaseKey(base);
      await Promise.all(
        getMounts(base, false).map(async (m) => {
          if (m.driver.clear) {
            return asyncCall(m.driver.clear, m.relativeBase, opts);
          }
          if (m.driver.removeItem) {
            const keys = await m.driver.getKeys(m.relativeBase || "", opts);
            return Promise.all(
              keys.map((key) => m.driver.removeItem(key, opts))
            );
          }
        })
      );
    },
    async dispose() {
      await Promise.all(
        Object.values(context.mounts).map((driver) => dispose(driver))
      );
    },
    async watch(callback) {
      await startWatch();
      context.watchListeners.push(callback);
      return async () => {
        context.watchListeners = context.watchListeners.filter(
          (listener) => listener !== callback
        );
        if (context.watchListeners.length === 0) {
          await stopWatch();
        }
      };
    },
    async unwatch() {
      context.watchListeners = [];
      await stopWatch();
    },
    // Mount
    mount(base, driver) {
      base = normalizeBaseKey(base);
      if (base && context.mounts[base]) {
        throw new Error(`already mounted at ${base}`);
      }
      if (base) {
        context.mountpoints.push(base);
        context.mountpoints.sort((a, b) => b.length - a.length);
      }
      context.mounts[base] = driver;
      if (context.watching) {
        Promise.resolve(watch(driver, onChange, base)).then((unwatcher) => {
          context.unwatch[base] = unwatcher;
        }).catch(console.error);
      }
      return storage;
    },
    async unmount(base, _dispose = true) {
      base = normalizeBaseKey(base);
      if (!base || !context.mounts[base]) {
        return;
      }
      if (context.watching && base in context.unwatch) {
        context.unwatch[base]?.();
        delete context.unwatch[base];
      }
      if (_dispose) {
        await dispose(context.mounts[base]);
      }
      context.mountpoints = context.mountpoints.filter((key) => key !== base);
      delete context.mounts[base];
    },
    getMount(key = "") {
      key = normalizeKey$1(key) + ":";
      const m = getMount(key);
      return {
        driver: m.driver,
        base: m.base
      };
    },
    getMounts(base = "", opts = {}) {
      base = normalizeKey$1(base);
      const mounts = getMounts(base, opts.parents);
      return mounts.map((m) => ({
        driver: m.driver,
        base: m.mountpoint
      }));
    },
    // Aliases
    keys: (base, opts = {}) => storage.getKeys(base, opts),
    get: (key, opts = {}) => storage.getItem(key, opts),
    set: (key, value, opts = {}) => storage.setItem(key, value, opts),
    has: (key, opts = {}) => storage.hasItem(key, opts),
    del: (key, opts = {}) => storage.removeItem(key, opts),
    remove: (key, opts = {}) => storage.removeItem(key, opts)
  };
  return storage;
}
function watch(driver, onChange, base) {
  return driver.watch ? driver.watch((event, key) => onChange(event, base + key)) : () => {
  };
}
async function dispose(driver) {
  if (typeof driver.dispose === "function") {
    await asyncCall(driver.dispose);
  }
}

const _assets = {

};

const normalizeKey = function normalizeKey(key) {
  if (!key) {
    return "";
  }
  return key.split("?")[0]?.replace(/[/\\]/g, ":").replace(/:+/g, ":").replace(/^:|:$/g, "") || "";
};

const assets$1 = {
  getKeys() {
    return Promise.resolve(Object.keys(_assets))
  },
  hasItem (id) {
    id = normalizeKey(id);
    return Promise.resolve(id in _assets)
  },
  getItem (id) {
    id = normalizeKey(id);
    return Promise.resolve(_assets[id] ? _assets[id].import() : null)
  },
  getMeta (id) {
    id = normalizeKey(id);
    return Promise.resolve(_assets[id] ? _assets[id].meta : {})
  }
};

function defineDriver(factory) {
  return factory;
}
function createError(driver, message, opts) {
  const err = new Error(`[unstorage] [${driver}] ${message}`, opts);
  if (Error.captureStackTrace) {
    Error.captureStackTrace(err, createError);
  }
  return err;
}
function createRequiredError(driver, name) {
  if (Array.isArray(name)) {
    return createError(
      driver,
      `Missing some of the required options ${name.map((n) => "`" + n + "`").join(", ")}`
    );
  }
  return createError(driver, `Missing required option \`${name}\`.`);
}

function ignoreNotfound(err) {
  return err.code === "ENOENT" || err.code === "EISDIR" ? null : err;
}
function ignoreExists(err) {
  return err.code === "EEXIST" ? null : err;
}
async function writeFile(path, data, encoding) {
  await ensuredir(dirname$1(path));
  return promises.writeFile(path, data, encoding);
}
function readFile(path, encoding) {
  return promises.readFile(path, encoding).catch(ignoreNotfound);
}
function unlink(path) {
  return promises.unlink(path).catch(ignoreNotfound);
}
function readdir(dir) {
  return promises.readdir(dir, { withFileTypes: true }).catch(ignoreNotfound).then((r) => r || []);
}
async function ensuredir(dir) {
  if (existsSync(dir)) {
    return;
  }
  await ensuredir(dirname$1(dir)).catch(ignoreExists);
  await promises.mkdir(dir).catch(ignoreExists);
}
async function readdirRecursive(dir, ignore, maxDepth) {
  if (ignore && ignore(dir)) {
    return [];
  }
  const entries = await readdir(dir);
  const files = [];
  await Promise.all(
    entries.map(async (entry) => {
      const entryPath = resolve$1(dir, entry.name);
      if (entry.isDirectory()) {
        if (maxDepth === void 0 || maxDepth > 0) {
          const dirFiles = await readdirRecursive(
            entryPath,
            ignore,
            maxDepth === void 0 ? void 0 : maxDepth - 1
          );
          files.push(...dirFiles.map((f) => entry.name + "/" + f));
        }
      } else {
        if (!(ignore && ignore(entry.name))) {
          files.push(entry.name);
        }
      }
    })
  );
  return files;
}
async function rmRecursive(dir) {
  const entries = await readdir(dir);
  await Promise.all(
    entries.map((entry) => {
      const entryPath = resolve$1(dir, entry.name);
      if (entry.isDirectory()) {
        return rmRecursive(entryPath).then(() => promises.rmdir(entryPath));
      } else {
        return promises.unlink(entryPath);
      }
    })
  );
}

const PATH_TRAVERSE_RE = /\.\.:|\.\.$/;
const DRIVER_NAME = "fs-lite";
const unstorage_47drivers_47fs_45lite = defineDriver((opts = {}) => {
  if (!opts.base) {
    throw createRequiredError(DRIVER_NAME, "base");
  }
  opts.base = resolve$1(opts.base);
  const r = (key) => {
    if (PATH_TRAVERSE_RE.test(key)) {
      throw createError(
        DRIVER_NAME,
        `Invalid key: ${JSON.stringify(key)}. It should not contain .. segments`
      );
    }
    const resolved = join(opts.base, key.replace(/:/g, "/"));
    return resolved;
  };
  return {
    name: DRIVER_NAME,
    options: opts,
    flags: {
      maxDepth: true
    },
    hasItem(key) {
      return existsSync(r(key));
    },
    getItem(key) {
      return readFile(r(key), "utf8");
    },
    getItemRaw(key) {
      return readFile(r(key));
    },
    async getMeta(key) {
      const { atime, mtime, size, birthtime, ctime } = await promises.stat(r(key)).catch(() => ({}));
      return { atime, mtime, size, birthtime, ctime };
    },
    setItem(key, value) {
      if (opts.readOnly) {
        return;
      }
      return writeFile(r(key), value, "utf8");
    },
    setItemRaw(key, value) {
      if (opts.readOnly) {
        return;
      }
      return writeFile(r(key), value);
    },
    removeItem(key) {
      if (opts.readOnly) {
        return;
      }
      return unlink(r(key));
    },
    getKeys(_base, topts) {
      return readdirRecursive(r("."), opts.ignore, topts?.maxDepth);
    },
    async clear() {
      if (opts.readOnly || opts.noClear) {
        return;
      }
      await rmRecursive(r("."));
    }
  };
});

const storage$1 = createStorage({});

storage$1.mount('/assets', assets$1);

storage$1.mount('data', unstorage_47drivers_47fs_45lite({"driver":"fsLite","base":"./.data/kv"}));

function useStorage(base = "") {
  return base ? prefixStorage(storage$1, base) : storage$1;
}

const fastHash = /*@__PURE__*/ (() => globalThis.process?.getBuiltinModule?.("crypto")?.hash)();
const algorithm = "sha256";
const encoding = "base64url";
function digest(data) {
	if (fastHash) return fastHash(algorithm, data, encoding);
	const h = createHash(algorithm).update(data);
	return globalThis.process?.versions?.webcontainer ? h.digest().toString(encoding) : h.digest(encoding);
}

const Hasher = /* @__PURE__ */ (() => {
  class Hasher2 {
    buff = "";
    #context = /* @__PURE__ */ new Map();
    write(str) {
      this.buff += str;
    }
    dispatch(value) {
      const type = value === null ? "null" : typeof value;
      return this[type](value);
    }
    object(object) {
      if (object && typeof object.toJSON === "function") {
        return this.object(object.toJSON());
      }
      const objString = Object.prototype.toString.call(object);
      let objType = "";
      const objectLength = objString.length;
      objType = objectLength < 10 ? "unknown:[" + objString + "]" : objString.slice(8, objectLength - 1);
      objType = objType.toLowerCase();
      let objectNumber = null;
      if ((objectNumber = this.#context.get(object)) === void 0) {
        this.#context.set(object, this.#context.size);
      } else {
        return this.dispatch("[CIRCULAR:" + objectNumber + "]");
      }
      if (typeof Buffer !== "undefined" && Buffer.isBuffer && Buffer.isBuffer(object)) {
        this.write("buffer:");
        return this.write(object.toString("utf8"));
      }
      if (objType !== "object" && objType !== "function" && objType !== "asyncfunction") {
        if (this[objType]) {
          this[objType](object);
        } else {
          this.unknown(object, objType);
        }
      } else {
        const keys = Object.keys(object).sort();
        const extraKeys = [];
        this.write("object:" + (keys.length + extraKeys.length) + ":");
        const dispatchForKey = (key) => {
          this.dispatch(key);
          this.write(":");
          this.dispatch(object[key]);
          this.write(",");
        };
        for (const key of keys) {
          dispatchForKey(key);
        }
        for (const key of extraKeys) {
          dispatchForKey(key);
        }
      }
    }
    array(arr, unordered) {
      unordered = unordered === void 0 ? false : unordered;
      this.write("array:" + arr.length + ":");
      if (!unordered || arr.length <= 1) {
        for (const entry of arr) {
          this.dispatch(entry);
        }
        return;
      }
      const contextAdditions = /* @__PURE__ */ new Map();
      const entries = arr.map((entry) => {
        const hasher = new Hasher2();
        hasher.dispatch(entry);
        for (const [key, value] of hasher.#context) {
          contextAdditions.set(key, value);
        }
        return hasher.toString();
      });
      this.#context = contextAdditions;
      entries.sort();
      return this.array(entries, false);
    }
    date(date) {
      return this.write("date:" + date.toJSON());
    }
    symbol(sym) {
      return this.write("symbol:" + sym.toString());
    }
    unknown(value, type) {
      this.write(type);
      if (!value) {
        return;
      }
      this.write(":");
      if (value && typeof value.entries === "function") {
        return this.array(
          [...value.entries()],
          true
          /* ordered */
        );
      }
    }
    error(err) {
      return this.write("error:" + err.toString());
    }
    boolean(bool) {
      return this.write("bool:" + bool);
    }
    string(string) {
      this.write("string:" + string.length + ":");
      this.write(string);
    }
    function(fn) {
      this.write("fn:");
      if (isNativeFunction(fn)) {
        this.dispatch("[native]");
      } else {
        this.dispatch(fn.toString());
      }
    }
    number(number) {
      return this.write("number:" + number);
    }
    null() {
      return this.write("Null");
    }
    undefined() {
      return this.write("Undefined");
    }
    regexp(regex) {
      return this.write("regex:" + regex.toString());
    }
    arraybuffer(arr) {
      this.write("arraybuffer:");
      return this.dispatch(new Uint8Array(arr));
    }
    url(url) {
      return this.write("url:" + url.toString());
    }
    map(map) {
      this.write("map:");
      const arr = [...map];
      return this.array(arr, false);
    }
    set(set) {
      this.write("set:");
      const arr = [...set];
      return this.array(arr, false);
    }
    bigint(number) {
      return this.write("bigint:" + number.toString());
    }
  }
  for (const type of [
    "uint8array",
    "uint8clampedarray",
    "unt8array",
    "uint16array",
    "unt16array",
    "uint32array",
    "unt32array",
    "float32array",
    "float64array"
  ]) {
    Hasher2.prototype[type] = function(arr) {
      this.write(type + ":");
      return this.array([...arr], false);
    };
  }
  function isNativeFunction(f) {
    if (typeof f !== "function") {
      return false;
    }
    return Function.prototype.toString.call(f).slice(
      -15
      /* "[native code] }".length */
    ) === "[native code] }";
  }
  return Hasher2;
})();
function serialize(object) {
  const hasher = new Hasher();
  hasher.dispatch(object);
  return hasher.buff;
}
function hash(value) {
  return digest(typeof value === "string" ? value : serialize(value)).replace(/[-_]/g, "").slice(0, 10);
}

function defaultCacheOptions() {
  return {
    name: "_",
    base: "/cache",
    swr: true,
    maxAge: 1
  };
}
function defineCachedFunction(fn, opts = {}) {
  opts = { ...defaultCacheOptions(), ...opts };
  const pending = {};
  const group = opts.group || "nitro/functions";
  const name = opts.name || fn.name || "_";
  const integrity = opts.integrity || hash([fn, opts]);
  const validate = opts.validate || ((entry) => entry.value !== void 0);
  async function get(key, resolver, shouldInvalidateCache, event) {
    const cacheKey = [opts.base, group, name, key + ".json"].filter(Boolean).join(":").replace(/:\/$/, ":index");
    let entry = await useStorage().getItem(cacheKey).catch((error) => {
      console.error(`[cache] Cache read error.`, error);
      useNitroApp().captureError(error, { event, tags: ["cache"] });
    }) || {};
    if (typeof entry !== "object") {
      entry = {};
      const error = new Error("Malformed data read from cache.");
      console.error("[cache]", error);
      useNitroApp().captureError(error, { event, tags: ["cache"] });
    }
    const ttl = (opts.maxAge ?? 0) * 1e3;
    if (ttl) {
      entry.expires = Date.now() + ttl;
    }
    const expired = shouldInvalidateCache || entry.integrity !== integrity || ttl && Date.now() - (entry.mtime || 0) > ttl || validate(entry) === false;
    const _resolve = async () => {
      const isPending = pending[key];
      if (!isPending) {
        if (entry.value !== void 0 && (opts.staleMaxAge || 0) >= 0 && opts.swr === false) {
          entry.value = void 0;
          entry.integrity = void 0;
          entry.mtime = void 0;
          entry.expires = void 0;
        }
        pending[key] = Promise.resolve(resolver());
      }
      try {
        entry.value = await pending[key];
      } catch (error) {
        if (!isPending) {
          delete pending[key];
        }
        throw error;
      }
      if (!isPending) {
        entry.mtime = Date.now();
        entry.integrity = integrity;
        delete pending[key];
        if (validate(entry) !== false) {
          let setOpts;
          if (opts.maxAge && !opts.swr) {
            setOpts = { ttl: opts.maxAge };
          }
          const promise = useStorage().setItem(cacheKey, entry, setOpts).catch((error) => {
            console.error(`[cache] Cache write error.`, error);
            useNitroApp().captureError(error, { event, tags: ["cache"] });
          });
          if (event?.waitUntil) {
            event.waitUntil(promise);
          }
        }
      }
    };
    const _resolvePromise = expired ? _resolve() : Promise.resolve();
    if (entry.value === void 0) {
      await _resolvePromise;
    } else if (expired && event && event.waitUntil) {
      event.waitUntil(_resolvePromise);
    }
    if (opts.swr && validate(entry) !== false) {
      _resolvePromise.catch((error) => {
        console.error(`[cache] SWR handler error.`, error);
        useNitroApp().captureError(error, { event, tags: ["cache"] });
      });
      return entry;
    }
    return _resolvePromise.then(() => entry);
  }
  return async (...args) => {
    const shouldBypassCache = await opts.shouldBypassCache?.(...args);
    if (shouldBypassCache) {
      return fn(...args);
    }
    const key = await (opts.getKey || getKey)(...args);
    const shouldInvalidateCache = await opts.shouldInvalidateCache?.(...args);
    const entry = await get(
      key,
      () => fn(...args),
      shouldInvalidateCache,
      args[0] && isEvent(args[0]) ? args[0] : void 0
    );
    let value = entry.value;
    if (opts.transform) {
      value = await opts.transform(entry, ...args) || value;
    }
    return value;
  };
}
function cachedFunction(fn, opts = {}) {
  return defineCachedFunction(fn, opts);
}
function getKey(...args) {
  return args.length > 0 ? hash(args) : "";
}
function escapeKey(key) {
  return String(key).replace(/\W/g, "");
}
function defineCachedEventHandler(handler, opts = defaultCacheOptions()) {
  const variableHeaderNames = (opts.varies || []).filter(Boolean).map((h) => h.toLowerCase()).sort();
  const _opts = {
    ...opts,
    getKey: async (event) => {
      const customKey = await opts.getKey?.(event);
      if (customKey) {
        return escapeKey(customKey);
      }
      const _path = event.node.req.originalUrl || event.node.req.url || event.path;
      let _pathname;
      try {
        _pathname = escapeKey(decodeURI(parseURL(_path).pathname)).slice(0, 16) || "index";
      } catch {
        _pathname = "-";
      }
      const _hashedPath = `${_pathname}.${hash(_path)}`;
      const _headers = variableHeaderNames.map((header) => [header, event.node.req.headers[header]]).map(([name, value]) => `${escapeKey(name)}.${hash(value)}`);
      return [_hashedPath, ..._headers].join(":");
    },
    validate: (entry) => {
      if (!entry.value) {
        return false;
      }
      if (entry.value.code >= 400) {
        return false;
      }
      if (entry.value.body === void 0) {
        return false;
      }
      if (entry.value.headers.etag === "undefined" || entry.value.headers["last-modified"] === "undefined") {
        return false;
      }
      return true;
    },
    group: opts.group || "nitro/handlers",
    integrity: opts.integrity || hash([handler, opts])
  };
  const _cachedHandler = cachedFunction(
    async (incomingEvent) => {
      const variableHeaders = {};
      for (const header of variableHeaderNames) {
        const value = incomingEvent.node.req.headers[header];
        if (value !== void 0) {
          variableHeaders[header] = value;
        }
      }
      const reqProxy = cloneWithProxy(incomingEvent.node.req, {
        headers: variableHeaders
      });
      const resHeaders = {};
      let _resSendBody;
      const resProxy = cloneWithProxy(incomingEvent.node.res, {
        statusCode: 200,
        writableEnded: false,
        writableFinished: false,
        headersSent: false,
        closed: false,
        getHeader(name) {
          return resHeaders[name];
        },
        setHeader(name, value) {
          resHeaders[name] = value;
          return this;
        },
        getHeaderNames() {
          return Object.keys(resHeaders);
        },
        hasHeader(name) {
          return name in resHeaders;
        },
        removeHeader(name) {
          delete resHeaders[name];
        },
        getHeaders() {
          return resHeaders;
        },
        end(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2();
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return this;
        },
        write(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2(void 0);
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return true;
        },
        writeHead(statusCode, headers2) {
          this.statusCode = statusCode;
          if (headers2) {
            if (Array.isArray(headers2) || typeof headers2 === "string") {
              throw new TypeError("Raw headers  is not supported.");
            }
            for (const header in headers2) {
              const value = headers2[header];
              if (value !== void 0) {
                this.setHeader(
                  header,
                  value
                );
              }
            }
          }
          return this;
        }
      });
      const event = createEvent(reqProxy, resProxy);
      event.fetch = (url, fetchOptions) => fetchWithEvent(event, url, fetchOptions, {
        fetch: useNitroApp().localFetch
      });
      event.$fetch = (url, fetchOptions) => fetchWithEvent(event, url, fetchOptions, {
        fetch: globalThis.$fetch
      });
      event.waitUntil = incomingEvent.waitUntil;
      event.context = incomingEvent.context;
      event.context.cache = {
        options: _opts
      };
      const body = await handler(event) || _resSendBody;
      const headers = event.node.res.getHeaders();
      headers.etag = String(
        headers.Etag || headers.etag || `W/"${hash(body)}"`
      );
      headers["last-modified"] = String(
        headers["Last-Modified"] || headers["last-modified"] || (/* @__PURE__ */ new Date()).toUTCString()
      );
      const cacheControl = [];
      if (opts.swr) {
        if (opts.maxAge) {
          cacheControl.push(`s-maxage=${opts.maxAge}`);
        }
        if (opts.staleMaxAge) {
          cacheControl.push(`stale-while-revalidate=${opts.staleMaxAge}`);
        } else {
          cacheControl.push("stale-while-revalidate");
        }
      } else if (opts.maxAge) {
        cacheControl.push(`max-age=${opts.maxAge}`);
      }
      if (cacheControl.length > 0) {
        headers["cache-control"] = cacheControl.join(", ");
      }
      const cacheEntry = {
        code: event.node.res.statusCode,
        headers,
        body
      };
      return cacheEntry;
    },
    _opts
  );
  return defineEventHandler(async (event) => {
    if (opts.headersOnly) {
      if (handleCacheHeaders(event, { maxAge: opts.maxAge })) {
        return;
      }
      return handler(event);
    }
    const response = await _cachedHandler(
      event
    );
    if (event.node.res.headersSent || event.node.res.writableEnded) {
      return response.body;
    }
    if (handleCacheHeaders(event, {
      modifiedTime: new Date(response.headers["last-modified"]),
      etag: response.headers.etag,
      maxAge: opts.maxAge
    })) {
      return;
    }
    event.node.res.statusCode = response.code;
    for (const name in response.headers) {
      const value = response.headers[name];
      if (name === "set-cookie") {
        event.node.res.appendHeader(
          name,
          splitCookiesString(value)
        );
      } else {
        if (value !== void 0) {
          event.node.res.setHeader(name, value);
        }
      }
    }
    return response.body;
  });
}
function cloneWithProxy(obj, overrides) {
  return new Proxy(obj, {
    get(target, property, receiver) {
      if (property in overrides) {
        return overrides[property];
      }
      return Reflect.get(target, property, receiver);
    },
    set(target, property, value, receiver) {
      if (property in overrides) {
        overrides[property] = value;
        return true;
      }
      return Reflect.set(target, property, value, receiver);
    }
  });
}
const cachedEventHandler = defineCachedEventHandler;

function klona(x) {
	if (typeof x !== 'object') return x;

	var k, tmp, str=Object.prototype.toString.call(x);

	if (str === '[object Object]') {
		if (x.constructor !== Object && typeof x.constructor === 'function') {
			tmp = new x.constructor();
			for (k in x) {
				if (x.hasOwnProperty(k) && tmp[k] !== x[k]) {
					tmp[k] = klona(x[k]);
				}
			}
		} else {
			tmp = {}; // null
			for (k in x) {
				if (k === '__proto__') {
					Object.defineProperty(tmp, k, {
						value: klona(x[k]),
						configurable: true,
						enumerable: true,
						writable: true,
					});
				} else {
					tmp[k] = klona(x[k]);
				}
			}
		}
		return tmp;
	}

	if (str === '[object Array]') {
		k = x.length;
		for (tmp=Array(k); k--;) {
			tmp[k] = klona(x[k]);
		}
		return tmp;
	}

	if (str === '[object Set]') {
		tmp = new Set;
		x.forEach(function (val) {
			tmp.add(klona(val));
		});
		return tmp;
	}

	if (str === '[object Map]') {
		tmp = new Map;
		x.forEach(function (val, key) {
			tmp.set(klona(key), klona(val));
		});
		return tmp;
	}

	if (str === '[object Date]') {
		return new Date(+x);
	}

	if (str === '[object RegExp]') {
		tmp = new RegExp(x.source, x.flags);
		tmp.lastIndex = x.lastIndex;
		return tmp;
	}

	if (str === '[object DataView]') {
		return new x.constructor( klona(x.buffer) );
	}

	if (str === '[object ArrayBuffer]') {
		return x.slice(0);
	}

	// ArrayBuffer.isView(x)
	// ~> `new` bcuz `Buffer.slice` => ref
	if (str.slice(-6) === 'Array]') {
		return new x.constructor(x);
	}

	return x;
}

const inlineAppConfig = {};



const appConfig = defuFn(inlineAppConfig);

const NUMBER_CHAR_RE = /\d/;
const STR_SPLITTERS = ["-", "_", "/", "."];
function isUppercase(char = "") {
  if (NUMBER_CHAR_RE.test(char)) {
    return void 0;
  }
  return char !== char.toLowerCase();
}
function splitByCase(str, separators) {
  const splitters = STR_SPLITTERS;
  const parts = [];
  if (!str || typeof str !== "string") {
    return parts;
  }
  let buff = "";
  let previousUpper;
  let previousSplitter;
  for (const char of str) {
    const isSplitter = splitters.includes(char);
    if (isSplitter === true) {
      parts.push(buff);
      buff = "";
      previousUpper = void 0;
      continue;
    }
    const isUpper = isUppercase(char);
    if (previousSplitter === false) {
      if (previousUpper === false && isUpper === true) {
        parts.push(buff);
        buff = char;
        previousUpper = isUpper;
        continue;
      }
      if (previousUpper === true && isUpper === false && buff.length > 1) {
        const lastChar = buff.at(-1);
        parts.push(buff.slice(0, Math.max(0, buff.length - 1)));
        buff = lastChar + char;
        previousUpper = isUpper;
        continue;
      }
    }
    buff += char;
    previousUpper = isUpper;
    previousSplitter = isSplitter;
  }
  parts.push(buff);
  return parts;
}
function kebabCase(str, joiner) {
  return str ? (Array.isArray(str) ? str : splitByCase(str)).map((p) => p.toLowerCase()).join(joiner) : "";
}
function snakeCase(str) {
  return kebabCase(str || "", "_");
}

function getEnv(key, opts) {
  const envKey = snakeCase(key).toUpperCase();
  return destr(
    process.env[opts.prefix + envKey] ?? process.env[opts.altPrefix + envKey]
  );
}
function _isObject(input) {
  return typeof input === "object" && !Array.isArray(input);
}
function applyEnv(obj, opts, parentKey = "") {
  for (const key in obj) {
    const subKey = parentKey ? `${parentKey}_${key}` : key;
    const envValue = getEnv(subKey, opts);
    if (_isObject(obj[key])) {
      if (_isObject(envValue)) {
        obj[key] = { ...obj[key], ...envValue };
        applyEnv(obj[key], opts, subKey);
      } else if (envValue === void 0) {
        applyEnv(obj[key], opts, subKey);
      } else {
        obj[key] = envValue ?? obj[key];
      }
    } else {
      obj[key] = envValue ?? obj[key];
    }
    if (opts.envExpansion && typeof obj[key] === "string") {
      obj[key] = _expandFromEnv(obj[key]);
    }
  }
  return obj;
}
const envExpandRx = /\{\{([^{}]*)\}\}/g;
function _expandFromEnv(value) {
  return value.replace(envExpandRx, (match, key) => {
    return process.env[key] || match;
  });
}

const _inlineRuntimeConfig = {
  "app": {
    "baseURL": "/",
    "buildId": "855173e3-3785-40ab-8d55-8b89b73971da",
    "buildAssetsDir": "/_nuxt/",
    "cdnURL": ""
  },
  "nitro": {
    "envPrefix": "NUXT_",
    "routeRules": {
      "/__nuxt_error": {
        "cache": false
      },
      "/_nuxt/builds/meta/**": {
        "headers": {
          "cache-control": "public, max-age=31536000, immutable"
        }
      },
      "/_nuxt/builds/**": {
        "headers": {
          "cache-control": "public, max-age=1, immutable"
        }
      },
      "/_nuxt/**": {
        "headers": {
          "cache-control": "public, max-age=31536000, immutable"
        }
      }
    }
  },
  "public": {
    "title": "pxls.space",
    "i18n": {
      "baseUrl": "",
      "defaultLocale": "en",
      "rootRedirect": "",
      "redirectStatusCode": 302,
      "skipSettingLocaleOnNavigate": false,
      "locales": [
        {
          "code": "en",
          "name": "English",
          "language": "",
          "domains": [],
          "defaultForDomains": []
        },
        {
          "code": "bg",
          "name": "Bulgarian",
          "language": "",
          "domains": [],
          "defaultForDomains": []
        },
        {
          "code": "fr",
          "name": "French",
          "language": "",
          "domains": [],
          "defaultForDomains": []
        },
        {
          "code": "de",
          "name": "German",
          "language": "",
          "domains": [],
          "defaultForDomains": []
        },
        {
          "code": "lv",
          "name": "Latvian",
          "language": "",
          "domains": [],
          "defaultForDomains": []
        },
        {
          "code": "ru",
          "name": "Russian",
          "language": "",
          "domains": [],
          "defaultForDomains": []
        },
        {
          "code": "sv",
          "name": "Swedish",
          "language": "",
          "domains": [],
          "defaultForDomains": []
        },
        {
          "code": "fi",
          "name": "Finnish",
          "language": "",
          "domains": [],
          "defaultForDomains": []
        },
        {
          "code": "tok",
          "name": "Toki Pona",
          "language": "",
          "domains": [],
          "defaultForDomains": []
        }
      ],
      "detectBrowserLanguage": false,
      "experimental": {
        "localeDetector": "",
        "typedPages": true,
        "typedOptionsAndMessages": false,
        "alternateLinkCanonicalQueries": true,
        "devCache": false,
        "cacheLifetime": "",
        "stripMessagesPayload": false,
        "preload": false,
        "strictSeo": false,
        "nitroContextDetection": true,
        "httpCacheDuration": 10,
        "compactRoutes": false,
        "prerenderMessages": false,
        "optimizeMessageBundling": true
      },
      "domainLocales": {
        "en": {
          "domain": ""
        },
        "bg": {
          "domain": ""
        },
        "fr": {
          "domain": ""
        },
        "de": {
          "domain": ""
        },
        "lv": {
          "domain": ""
        },
        "ru": {
          "domain": ""
        },
        "sv": {
          "domain": ""
        },
        "fi": {
          "domain": ""
        },
        "tok": {
          "domain": ""
        }
      }
    }
  },
  "proxyTo": "localhost:4567",
  "icon": {
    "serverKnownCssClasses": []
  }
};
const envOptions = {
  prefix: "NITRO_",
  altPrefix: _inlineRuntimeConfig.nitro.envPrefix ?? process.env.NITRO_ENV_PREFIX ?? "_",
  envExpansion: _inlineRuntimeConfig.nitro.envExpansion ?? process.env.NITRO_ENV_EXPANSION ?? false
};
const _sharedRuntimeConfig = _deepFreeze(
  applyEnv(klona(_inlineRuntimeConfig), envOptions)
);
function useRuntimeConfig(event) {
  if (!event) {
    return _sharedRuntimeConfig;
  }
  if (event.context.nitro.runtimeConfig) {
    return event.context.nitro.runtimeConfig;
  }
  const runtimeConfig = klona(_inlineRuntimeConfig);
  applyEnv(runtimeConfig, envOptions);
  event.context.nitro.runtimeConfig = runtimeConfig;
  return runtimeConfig;
}
_deepFreeze(klona(appConfig));
function _deepFreeze(object) {
  const propNames = Object.getOwnPropertyNames(object);
  for (const name of propNames) {
    const value = object[name];
    if (value && typeof value === "object") {
      _deepFreeze(value);
    }
  }
  return Object.freeze(object);
}
new Proxy(/* @__PURE__ */ Object.create(null), {
  get: (_, prop) => {
    console.warn(
      "Please use `useRuntimeConfig()` instead of accessing config directly."
    );
    const runtimeConfig = useRuntimeConfig();
    if (prop in runtimeConfig) {
      return runtimeConfig[prop];
    }
    return void 0;
  }
});

function createContext(opts = {}) {
  let currentInstance;
  let isSingleton = false;
  const checkConflict = (instance) => {
    if (currentInstance && currentInstance !== instance) {
      throw new Error("Context conflict");
    }
  };
  let als;
  if (opts.asyncContext) {
    const _AsyncLocalStorage = opts.AsyncLocalStorage || globalThis.AsyncLocalStorage;
    if (_AsyncLocalStorage) {
      als = new _AsyncLocalStorage();
    } else {
      console.warn("[unctx] `AsyncLocalStorage` is not provided.");
    }
  }
  const _getCurrentInstance = () => {
    if (als) {
      const instance = als.getStore();
      if (instance !== void 0) {
        return instance;
      }
    }
    return currentInstance;
  };
  return {
    use: () => {
      const _instance = _getCurrentInstance();
      if (_instance === void 0) {
        throw new Error("Context is not available");
      }
      return _instance;
    },
    tryUse: () => {
      return _getCurrentInstance();
    },
    set: (instance, replace) => {
      if (!replace) {
        checkConflict(instance);
      }
      currentInstance = instance;
      isSingleton = true;
    },
    unset: () => {
      currentInstance = void 0;
      isSingleton = false;
    },
    call: (instance, callback) => {
      checkConflict(instance);
      currentInstance = instance;
      try {
        return als ? als.run(instance, callback) : callback();
      } finally {
        if (!isSingleton) {
          currentInstance = void 0;
        }
      }
    },
    async callAsync(instance, callback) {
      currentInstance = instance;
      const onRestore = () => {
        currentInstance = instance;
      };
      const onLeave = () => currentInstance === instance ? onRestore : void 0;
      asyncHandlers.add(onLeave);
      try {
        const r = als ? als.run(instance, callback) : callback();
        if (!isSingleton) {
          currentInstance = void 0;
        }
        return await r;
      } finally {
        asyncHandlers.delete(onLeave);
      }
    }
  };
}
function createNamespace(defaultOpts = {}) {
  const contexts = {};
  return {
    get(key, opts = {}) {
      if (!contexts[key]) {
        contexts[key] = createContext({ ...defaultOpts, ...opts });
      }
      return contexts[key];
    }
  };
}
const _globalThis = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : {};
const globalKey = "__unctx__";
const defaultNamespace = _globalThis[globalKey] || (_globalThis[globalKey] = createNamespace());
const getContext = (key, opts = {}) => defaultNamespace.get(key, opts);
const asyncHandlersKey = "__unctx_async_handlers__";
const asyncHandlers = _globalThis[asyncHandlersKey] || (_globalThis[asyncHandlersKey] = /* @__PURE__ */ new Set());

getContext("nitro-app", {
  asyncContext: false,
  AsyncLocalStorage: void 0
});

function isPathInScope(pathname, base) {
  let canonical;
  try {
    const pre = pathname.replace(/%2f/gi, "/").replace(/%5c/gi, "\\");
    canonical = new URL(pre, "http://_").pathname;
  } catch {
    return false;
  }
  return !base || canonical === base || canonical.startsWith(base + "/");
}

const config = useRuntimeConfig();
const _routeRulesMatcher = toRouteMatcher(
  createRouter$1({ routes: config.nitro.routeRules })
);
function createRouteRulesHandler(ctx) {
  return eventHandler((event) => {
    const routeRules = getRouteRules(event);
    if (routeRules.headers) {
      setHeaders(event, routeRules.headers);
    }
    if (routeRules.redirect) {
      let target = routeRules.redirect.to;
      if (target.endsWith("/**")) {
        let targetPath = event.path;
        const strpBase = routeRules.redirect._redirectStripBase;
        if (strpBase) {
          if (!isPathInScope(event.path.split("?")[0], strpBase)) {
            throw createError$1({ statusCode: 400 });
          }
          targetPath = withoutBase(targetPath, strpBase);
        } else if (targetPath.startsWith("//")) {
          targetPath = targetPath.replace(/^\/+/, "/");
        }
        target = joinURL(target.slice(0, -3), targetPath);
      } else if (event.path.includes("?")) {
        const query = getQuery$1(event.path);
        target = withQuery(target, query);
      }
      return sendRedirect(event, target, routeRules.redirect.statusCode);
    }
    if (routeRules.proxy) {
      let target = routeRules.proxy.to;
      if (target.endsWith("/**")) {
        let targetPath = event.path;
        const strpBase = routeRules.proxy._proxyStripBase;
        if (strpBase) {
          if (!isPathInScope(event.path.split("?")[0], strpBase)) {
            throw createError$1({ statusCode: 400 });
          }
          targetPath = withoutBase(targetPath, strpBase);
        } else if (targetPath.startsWith("//")) {
          targetPath = targetPath.replace(/^\/+/, "/");
        }
        target = joinURL(target.slice(0, -3), targetPath);
      } else if (event.path.includes("?")) {
        const query = getQuery$1(event.path);
        target = withQuery(target, query);
      }
      return proxyRequest(event, target, {
        fetch: ctx.localFetch,
        ...routeRules.proxy
      });
    }
  });
}
function getRouteRules(event) {
  event.context._nitro = event.context._nitro || {};
  if (!event.context._nitro.routeRules) {
    event.context._nitro.routeRules = getRouteRulesForPath(
      withoutBase(event.path.split("?")[0], useRuntimeConfig().app.baseURL)
    );
  }
  return event.context._nitro.routeRules;
}
function getRouteRulesForPath(path) {
  return defu({}, ..._routeRulesMatcher.matchAll(path).reverse());
}

function _captureError(error, type) {
  console.error(`[${type}]`, error);
  useNitroApp().captureError(error, { tags: [type] });
}
function trapUnhandledNodeErrors() {
  process.on(
    "unhandledRejection",
    (error) => _captureError(error, "unhandledRejection")
  );
  process.on(
    "uncaughtException",
    (error) => _captureError(error, "uncaughtException")
  );
}
function joinHeaders(value) {
  return Array.isArray(value) ? value.join(", ") : String(value);
}
function normalizeFetchResponse(response) {
  if (!response.headers.has("set-cookie")) {
    return response;
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: normalizeCookieHeaders(response.headers)
  });
}
function normalizeCookieHeader(header = "") {
  return splitCookiesString(joinHeaders(header));
}
function normalizeCookieHeaders(headers) {
  const outgoingHeaders = new Headers();
  for (const [name, header] of headers) {
    if (name === "set-cookie") {
      for (const cookie of normalizeCookieHeader(header)) {
        outgoingHeaders.append("set-cookie", cookie);
      }
    } else {
      outgoingHeaders.set(name, joinHeaders(header));
    }
  }
  return outgoingHeaders;
}

//#region src/runtime/utils/error.ts
/**
* Nitro internal functions extracted from https://github.com/nitrojs/nitro/blob/v2/src/runtime/internal/utils.ts
*/
function isJsonRequest(event) {
	if (hasReqHeader(event, "accept", "text/html")) return false;
	return hasReqHeader(event, "accept", "application/json") || hasReqHeader(event, "user-agent", "curl/") || hasReqHeader(event, "user-agent", "httpie/") || hasReqHeader(event, "sec-fetch-mode", "cors") || event.path.startsWith("/api/") || event.path.endsWith(".json");
}
function hasReqHeader(event, name, includes) {
	const value = getRequestHeader(event, name);
	return !!(value && typeof value === "string" && value.toLowerCase().includes(includes));
}

//#region src/runtime/handlers/error.ts
var error_default = async function errorhandler(error, event, { defaultHandler }) {
	if (event.handled || isJsonRequest(event)) return;
	const defaultRes = await defaultHandler(error, event, { json: true });
	const status = error.status || error.statusCode || 500;
	if (status === 404 && defaultRes.status === 302) {
		setResponseHeaders(event, defaultRes.headers);
		setResponseStatus(event, defaultRes.status, defaultRes.statusText);
		return send(event, JSON.stringify(defaultRes.body, null, 2));
	}
	const errorObject = defaultRes.body;
	const url = new URL(errorObject.url);
	errorObject.url = withoutBase(url.pathname, useRuntimeConfig(event).app.baseURL) + url.search + url.hash;
	errorObject.message = error.unhandled ? errorObject.message || "Server Error" : error.message || errorObject.message || "Server Error";
	errorObject.data ||= error.data;
	errorObject.statusText ||= error.statusText || error.statusMessage;
	delete defaultRes.headers["content-type"];
	delete defaultRes.headers["content-security-policy"];
	setResponseHeaders(event, defaultRes.headers);
	const reqHeaders = getRequestHeaders(event);
	const res = event.path.startsWith("/__nuxt_error") || !!reqHeaders["x-nuxt-error"] ? null : await useNitroApp().localFetch(withQuery(joinURL(useRuntimeConfig(event).app.baseURL, "/__nuxt_error"), errorObject), {
		headers: {
			...reqHeaders,
			"x-nuxt-error": "true"
		},
		redirect: "manual"
	}).catch(() => null);
	if (event.handled) return;
	if (!res) {
		const { template } = await import('../_/error-500.mjs');
		setResponseHeader(event, "Content-Type", "text/html;charset=UTF-8");
		return send(event, template(errorObject));
	}
	const html = await res.text();
	for (const [header, value] of res.headers.entries()) {
		if (header === "set-cookie") {
			appendResponseHeader(event, header, value);
			continue;
		}
		setResponseHeader(event, header, value);
	}
	setResponseStatus(event, res.status && res.status !== 200 ? res.status : defaultRes.status, res.statusText || defaultRes.statusText);
	return send(event, html);
};

function defineNitroErrorHandler(handler) {
  return handler;
}

const errorHandler$1 = defineNitroErrorHandler(
  function defaultNitroErrorHandler(error, event) {
    const res = defaultHandler(error, event);
    setResponseHeaders(event, res.headers);
    setResponseStatus(event, res.status, res.statusText);
    return send(event, JSON.stringify(res.body, null, 2));
  }
);
function defaultHandler(error, event, opts) {
  const isSensitive = error.unhandled || error.fatal;
  const statusCode = error.statusCode || 500;
  const statusMessage = error.statusMessage || "Server Error";
  const url = getRequestURL(event, { xForwardedHost: true, xForwardedProto: true });
  if (statusCode === 404) {
    const baseURL = "/";
    if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) {
      const redirectTo = `${baseURL}${url.pathname.slice(1)}${url.search}`;
      return {
        status: 302,
        statusText: "Found",
        headers: { location: redirectTo },
        body: `Redirecting...`
      };
    }
  }
  if (isSensitive && !opts?.silent) {
    const tags = [error.unhandled && "[unhandled]", error.fatal && "[fatal]"].filter(Boolean).join(" ");
    console.error(`[request error] ${tags} [${event.method}] ${url}
`, error);
  }
  const headers = {
    "content-type": "application/json",
    // Prevent browser from guessing the MIME types of resources.
    "x-content-type-options": "nosniff",
    // Prevent error page from being embedded in an iframe
    "x-frame-options": "DENY",
    // Prevent browsers from sending the Referer header
    "referrer-policy": "no-referrer",
    // Disable the execution of any js
    "content-security-policy": "script-src 'none'; frame-ancestors 'none';"
  };
  setResponseStatus(event, statusCode, statusMessage);
  if (statusCode === 404 || !getResponseHeader(event, "cache-control")) {
    headers["cache-control"] = "no-cache";
  }
  const body = {
    error: true,
    url: url.href,
    statusCode,
    statusMessage,
    message: isSensitive ? "Server Error" : error.message,
    data: isSensitive ? void 0 : error.data
  };
  return {
    status: statusCode,
    statusText: statusMessage,
    headers,
    body
  };
}

const errorHandlers = [error_default, errorHandler$1];

async function errorHandler(error, event) {
  for (const handler of errorHandlers) {
    try {
      await handler(error, event, { defaultHandler });
      if (event.handled) {
        return; // Response handled
      }
    } catch(error) {
      // Handler itself thrown, log and continue
      console.error(error);
    }
  }
  // H3 will handle fallback
}

/*!
  * shared v11.4.12
  * (c) 2026 kazuya kawaguchi
  * Released under the MIT License.
  */
/**
 * Original Utilities
 * written by kazuya kawaguchi
 */
const _create = Object.create;
const create = (obj = null) => _create(obj);
/* eslint-enable */
/**
 * Useful Utilities By Evan you
 * Modified by kazuya kawaguchi
 * MIT License
 * https://github.com/vuejs/vue-next/blob/master/packages/shared/src/index.ts
 * https://github.com/vuejs/vue-next/blob/master/packages/shared/src/codeframe.ts
 */
const isArray = Array.isArray;
const isFunction = (val) => typeof val === 'function';
const isString = (val) => typeof val === 'string';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isObject = (val) => val !== null && typeof val === 'object';
const objectToString = Object.prototype.toString;
const toTypeString = (value) => objectToString.call(value);

const isNotObjectOrIsArray = (val) => !isObject(val) || isArray(val);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepCopy(src, des) {
    // src and des should both be objects, and none of them can be a array
    if (isNotObjectOrIsArray(src) || isNotObjectOrIsArray(des)) {
        throw new Error('Invalid value');
    }
    const stack = [{ src, des }];
    while (stack.length) {
        const { src, des } = stack.pop();
        // using `Object.keys` which skips prototype properties
        Object.keys(src).forEach(key => {
            if (key === '__proto__') {
                return;
            }
            const value = src[key];
            if (isArray(value)) {
                // replace arrays instead of merging them, without retaining source references
                const copied = [];
                copied.length = value.length;
                des[key] = copied;
                stack.push({ src: value, des: copied });
            }
            else if (isObject(value)) {
                if (!isObject(des[key]) || isArray(des[key])) {
                    des[key] = create();
                }
                stack.push({ src: value, des: des[key] });
            }
            else {
                des[key] = value;
            }
        });
    }
}

const __nuxtMock = { runWithContext: async (fn) => await fn() };
function cloneDeep(value) {
  if (value == null || typeof value !== "object") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(cloneDeep);
  }
  const out = create(null);
  for (const key of Object.keys(value)) {
    out[key] = cloneDeep(value[key]);
  }
  return out;
}
const merger = createDefu((obj, key, value) => {
  if (key === "messages" || key === "datetimeFormats" || key === "numberFormats") {
    obj[key] ??= create(null);
    deepCopy(value, obj[key]);
    return true;
  }
});
async function loadVueI18nOptions(vueI18nConfigs) {
  const nuxtApp = __nuxtMock;
  let vueI18nOptions = { messages: create(null) };
  for (const configFile of vueI18nConfigs) {
    const resolver = await configFile().then((x) => isModule(x) ? x.default : x);
    const resolved = isFunction(resolver) ? await nuxtApp.runWithContext(() => resolver()) : resolver;
    vueI18nOptions = merger(create(null), resolved, vueI18nOptions);
  }
  vueI18nOptions.fallbackLocale ??= false;
  return vueI18nOptions;
}
const isModule = (val) => toTypeString(val) === "[object Module]";
async function getLocaleMessages(locale, loader) {
  const nuxtApp = __nuxtMock;
  try {
    const getter = await nuxtApp.runWithContext(loader.load).then((x) => isModule(x) ? x.default : x);
    return isFunction(getter) ? await nuxtApp.runWithContext(() => getter(locale)) : getter;
  } catch (e) {
    throw new Error(`Failed loading locale (${locale}): ` + e.message, { cause: e });
  }
}
async function getLocaleMessagesMerged(locale, loaders = []) {
  const nuxtApp = __nuxtMock;
  const messages = await Promise.all(
    loaders.map((loader) => nuxtApp.runWithContext(() => getLocaleMessages(locale, loader)))
  );
  const merged = {};
  for (const message of messages) {
    deepCopy(message, merged);
  }
  return merged;
}

const locale_en_46ts_673924fd = () => ({});

const source$7 = "msgid \"\"\nmsgstr \"\"\n\"Project-Id-Version: Pxls\\n\"\n\"POT-Creation-Date: 2024-09-07T20:41:44.977Z\\n\"\n\"Language: bg\\n\"\n\"Content-Type: text/plain; charset=UTF-8\\n\"\n\n#: /views/error.handlebars /views/profile.handlebars /public/include/user.js\nmsgid \"My Profile\"\nmsgstr \"Моят профил\"\n\n#: /views/error.handlebars /views/profile.handlebars\nmsgid \"My Factions\"\nmsgstr \"Моите фракции\"\n\n#. HTTP status code name\n#: /views/error.handlebars\nmsgid \"Not Found\"\nmsgstr \"Не е намерено\"\n\n#: /views/error.handlebars\nmsgid \"The content you requested could not be found at this URL. If you believe this is an error, please contact a developer.\"\nmsgstr \"Съдържанието, което искате да намерите на този URL не е намерено. Ако смятате, че това е грешка, моля, контактувайте с администратор.\"\n\n#. links to the homepage (the app itself)\n#: /views/error.handlebars\nmsgid \"Back to Pxls\"\nmsgstr \"Връщане в Pxls\"\n\n#. HTTP status code name\n#: /views/error.handlebars\nmsgid \"Not Authenticated\"\nmsgstr \"Достъпът не е разрешен\"\n\n#: /views/error.handlebars\nmsgid \"You must be logged in to access this data. Please go back to pxls and go through the authentication process.\"\nmsgstr \"Трябва да сте влезли във Вашия профил, за да проверите това съдържание.\"\n\n#. HTTP status code name\n#: /views/error.handlebars\nmsgid \"Not Allowed\"\nmsgstr \"Не е разрешено\"\n\n#: /views/error.handlebars\nmsgid \"The action you attempted to perform is not allowed or resulted in an error. Please ensure you have access to the endpoint and try again later.\"\nmsgstr \"Действието, което се опитвате да извършите не Ви е позволено. Моля, уверете се, че имате достъп и опитайте отново.\"\n\n#: /views/index.handlebars\nmsgid \"Place pixels with people to create art\"\nmsgstr \"Поставяйте пиксели, за да творите!\"\n\n#: /views/index.handlebars\nmsgid \"Lost connection to server, reconnecting...\"\nmsgstr \"Връзката със сървъра е прекъсната, извършва се повторно...\"\n\n#: /views/index.handlebars\nmsgid \"Loading Heatmap (press <kbd>H</kbd> to cancel)\"\nmsgstr \"Зарежда се картата с активността (натиснете <kbd>H</kbd> за отказ\"\n\n#: /views/index.handlebars\nmsgid \"Loading Virginmap (press <kbd>X</kbd> to cancel)\"\nmsgstr \"Зарежда се картата с поставени пиксели (натиснете <kbd>X</kbd> за отказ)\"\n\n#: /views/index.handlebars\nmsgid \"Logout\"\nmsgstr \"Изход\"\n\n#: /views/index.handlebars\nmsgid \"Canvas:\"\nmsgstr \"На платното:\"\n\n#: /views/index.handlebars\nmsgid \"N/A\"\nmsgstr \"N/A\"\n\n#: /views/index.handlebars\nmsgid \"All Time:\"\nmsgstr \"Всички:\"\n\n#: /views/index.handlebars\nmsgid \"Loading online user count&hellip;\"\nmsgstr \"Зареждане на броя онрайн потребители&hellip\"\n\n#: /views/index.handlebars /public/admin/admin.js /public/include/lookup.js\nmsgid \"Pixels\"\nmsgstr \"Пиксели\"\n\n#: /views/index.handlebars\nmsgid \"Undo\"\nmsgstr \"Отказ\"\n\n#: /views/index.handlebars\nmsgid \"You are not signed in.\"\nmsgstr \"Не сте влезли.\"\n\n#: /views/index.handlebars /public/include/user.js\nmsgid \"Sign in with...\"\nmsgstr \"Влезте с/ъс...\"\n\n#: /views/index.handlebars\nmsgid \"Loading...\"\nmsgstr \"Зареждане...\"\n\n#: /views/index.handlebars\nmsgid \"Sign up\"\nmsgstr \"Регистрирайте се\"\n\n#: /views/index.handlebars\nmsgid \"Pick a username\"\nmsgstr \"Изберете своето име\"\n\n#: /views/index.handlebars\nmsgid \"Username:\"\nmsgstr \"Име:\"\n\n#: /views/index.handlebars\nmsgid \"Discord Tag (Optional):\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Drag and drop template image\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Exit\"\nmsgstr \"Изход\"\n\n#: /views/index.handlebars /views/profile.handlebars\nmsgid \"Info\"\nmsgstr \"Информация\"\n\n#: /views/index.handlebars\nmsgid \"Close Panel\"\nmsgstr \"Затворете панела\"\n\n#: /views/index.handlebars /public/include/chat.js\nmsgid \"Chat\"\nmsgstr \"Чат\"\n\n#: /views/index.handlebars\nmsgid \"Pings\"\nmsgstr \"Споменавания\"\n\n#: /views/index.handlebars\nmsgid \"Settings\"\nmsgstr \"Настройки\"\n\n#: /views/index.handlebars\nmsgid \"Jump To Bottom\"\nmsgstr \"Слезте до дъното\"\n\n#: /views/index.handlebars\nmsgid \"Replying to\"\nmsgstr \"\"\n\n#: /views/index.handlebars /public/include/chat.js\nmsgid \"On\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Emoji\"\nmsgstr \"Емотикони\"\n\n#: /views/index.handlebars\nmsgid \"Search\"\nmsgstr \"Търсете\"\n\n#: /views/index.handlebars\nmsgid \"keybinds;keys;keyboard;hotkeys\"\nmsgstr \"клавишни комбинации;клавиши;клавиатура;топли клавиши\"\n\n#: /views/index.handlebars\nmsgid \"Keybinds\"\nmsgstr \"Клавишни комбинации\"\n\n#: /views/index.handlebars\nmsgid \"general\"\nmsgstr \"главни\"\n\n#: /views/index.handlebars\nmsgid \"General\"\nmsgstr \"Главни\"\n\n#: /views/index.handlebars\nmsgid \"move;moving;panning;drag\"\nmsgstr \"преместване;движение\"\n\n#: /views/index.handlebars\nmsgid \"Mouse/arrows/wasd to pan\"\nmsgstr \"Мишка/стрелки/WASD за придвижване\"\n\n#: /views/index.handlebars\nmsgid \"mousewheel;zooming\"\nmsgstr \"мишка\"\n\n#: /views/index.handlebars\nmsgid \"Scroll/pinch to zoom\"\nmsgstr \"Среден бутон/увеличаване с пръсти за увеличаване\"\n\n#: /views/index.handlebars\nmsgid \"scroll;zooming\"\nmsgstr \"мишка;увеличаване;мащаб\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>+</kbd>/<kbd>-</kbd> or <kbd>Q</kbd>/<kbd>E</kbd> to zoom\"\nmsgstr \"<kbd>+</kbd>/<kbd>-</kbd> или <kbd>Q</kbd>/<kbd>E</kbd> за увеличаване\"\n\n#: /views/index.handlebars\nmsgid \"lookups\"\nmsgstr \"проверки\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>Shift</kbd> + Click/Hold touch to lookup pixel\"\nmsgstr \"<kbd>Shift</kbd> + ляв бутон/продължително натискате за информация за пиксел\"\n\n#: /views/index.handlebars\nmsgid \"overlays;alignment;grid hidden;grid shown;hide grid;show grid\"\nmsgstr \"решетка;мрежа\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>G</kbd> to toggle grid\"\nmsgstr \"<kbd>G</kbd> за показване на решетката\"\n\n#: /views/index.handlebars\nmsgid \"close;information shown;information hidden;info shown;info hidden;hide information;show information\"\nmsgstr \"информация;инфо;скрий\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>I</kbd> to open info\"\nmsgstr \"<kbd>I</kbd> за показване на информационния панел\"\n\n#: /views/index.handlebars\nmsgid \"close;settings hidden;settings shown;hide settings;show settings\"\nmsgstr \"затвори;настройки\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>T</kbd> to open settings\"\nmsgstr \"<kbd>T</kbd> за отваряне на настройките\"\n\n#: /views/index.handlebars\nmsgid \"close;chat hidden;chat shown;hide chat;show chat\"\nmsgstr \"затвори;чат\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>B</kbd> to open chat\"\nmsgstr \"<kbd>B</kbd> за отваряне на чата\"\n\n#: /views/index.handlebars\nmsgid \"canvas locked;move;moving;zoom;zooming\"\nmsgstr \"увеличаване;заключване\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>L</kbd> to toggle locking panning of the canvas\"\nmsgstr \"<kbd>L</kbd> за заключване на платното\"\n\n#: /views/index.handlebars\nmsgid \"take screenshot;image;download;picture;canvas\"\nmsgstr \"снимка;скрийншот\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>P</kbd> to take a snapshot\"\nmsgstr \"<kbd>P</kbd> за снимане на екрана\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels placed pixels;heatmap hidden;heatmap shown;hide heatmap;show heatmap\"\nmsgstr \"активност;карта\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>H</kbd> to toggle heatmap\"\nmsgstr \"<kbd>H</kbd> за показване на карта с активността\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels unplaced pixels;virginmap hidden;virginmap shown;hide virginmap;show virginmap\"\nmsgstr \"карта;активност\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>X</kbd> to toggle virginmap\"\nmsgstr \"<kbd>X</kbd> за карта с поставени пиксели\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels placed pixels;wipe;clean;\"\nmsgstr \"чистене;изчистване\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>O</kbd> to clear heatmap\"\nmsgstr \"<kbd>O</kbd> за изчистване на картата с активността\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels unplaced pixels;wipe;clean;\"\nmsgstr \"чистене;изчистване\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>U</kbd> to clear virginmap\"\nmsgstr \"<kbd>U</kbd> за изчистване на картата с поставените пиксели\"\n\n#: /views/index.handlebars\nmsgid \"next color;previous color\"\nmsgstr \"следващ цвят;цвят;предишен цвят\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>J</kbd>/<kbd>K</kbd> to cycle through palette colors\"\nmsgstr \"<kbd>J</kbd>/<kbd>K</kbd> за избор на цвят от палитрата\"\n\n#: /views/index.handlebars\nmsgid \"current coordinates;coords\"\nmsgstr \"координати\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>C</kbd> to copy link of moused-over coordinates\"\nmsgstr \"<kbd>C</kbd> за копиране на координатите под курсора\"\n\n#: /views/index.handlebars\nmsgid \"cancel selection\"\nmsgstr \"отказ\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>ESC</kbd> to deselect current pixel\"\nmsgstr \"<kbd>ESC</kbd> за премахване на най-скорошния пиксел\"\n\n#: /views/index.handlebars\nmsgid \"recenter;jump;center on template;guides;focus\"\nmsgstr \"централизиране;центриране\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>R</kbd> to center the board on the current template\"\nmsgstr \"kbd>R</kbd> за центриране върху сегашния шаблон\"\n\n#: /views/index.handlebars\nmsgid \"templates;guides\"\nmsgstr \"шаблони;шаблон\"\n\n#: /views/index.handlebars\nmsgid \"Template\"\nmsgstr \"Шаблон\"\n\n#: /views/index.handlebars\nmsgid \"transparency\"\nmsgstr \"Прозрачност\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>Page Up</kbd> to increase opacity\"\nmsgstr \"<kbd>Page Up</kbd> за намаляване на прозрачността\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>Page Down</kbd> to decrease opacity\"\nmsgstr \"<kbd>Page Down</kbd> за увеличаване на прозрачността\"\n\n#: /views/index.handlebars\nmsgid \"hidden;shown;hide;show\"\nmsgstr \"скрит;скрита;премахнат;премахната\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>V</kbd> to toggle visibility\"\nmsgstr \"<kbd>V</kbd> за скриване на шаблона\"\n\n#: /views/index.handlebars\nmsgid \"Note: These values are based on QWERTY keyboards. For other layouts, use the keys corresponding to the same position on a QWERTY keyboard.\"\nmsgstr \"ВАЖНО: Тези клавиши са предназначени за латински клавиатури с подредба QWERTY. За други подредби, използвайте съответсващите клавиши. \"\n\n#: /views/index.handlebars\nmsgid \"templates;overlays;guides\"\nmsgstr \"шаблон;гид\"\n\n#: /views/index.handlebars\nmsgid \"templates;overlays;image;pixel art\"\nmsgstr \"шаблон;гидшаблон;гид\"\n\n#: /views/index.handlebars\nmsgid \"template enabled;template disabled;show template;hide template;template shown;template hidden\"\nmsgstr \"шаблон\"\n\n#: /views/index.handlebars\nmsgid \"Use template\"\nmsgstr \"Използване на шаблон\"\n\n#: /views/index.handlebars\nmsgid \"Hold down <kbd>Ctrl</kbd> (or <kbd>Option</kbd> on mac) to drag the template around\"\nmsgstr \"Задръжте <kbd>Ctrl</kbd> (или <kbd>Option</kbd> на mac), за да преместите шаблона\"\n\n#: /views/index.handlebars\nmsgid \"template title;template name;tab name;tab title;title=\"\nmsgstr \"заглавие;шаблон\"\n\n#: /views/index.handlebars\nmsgid \"Title:\"\nmsgstr \"Заглавие\"\n\n#: /views/index.handlebars\nmsgid \"template location source;template source URL;template URL;template=\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"URL:\"\nmsgstr \"URL:\"\n\n#: /views/index.handlebars\nmsgid \"template position;template x;template y;template location; template vertical; template horizontal;ox=;oy=\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Horizontal position:\"\nmsgstr \"Хоризонтална позиция\"\n\n#: /views/index.handlebars\nmsgid \"Vertical position:\"\nmsgstr \"Вертикална позиция\"\n\n#: /views/index.handlebars\nmsgid \"template width;tw=\"\nmsgstr \"широчина\"\n\n#: /views/index.handlebars\nmsgid \"Width:\"\nmsgstr \"Широчина\"\n\n#: /views/index.handlebars\nmsgid \"Reset\"\nmsgstr \"Нулиране\"\n\n#: /views/index.handlebars\nmsgid \"template style;custom template\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Style:\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Use Source Style\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"1-to-1\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"1-to-1 (keep incorrect colors)\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Dotted (Small, 1:2)\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Dotted (Big, 2:2)\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Symbols\"\nmsgstr \"Символи\"\n\n#: /views/index.handlebars\nmsgid \"Numbers\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Custom…\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"template style source;template style URL;custom style URL;custom template\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Custom style URL:\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"template conversion;template palette conversion;convert to palette\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Color Conversion Mode:\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Unconverted\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Nearest Custom\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"template transparency;template opacity;oo=\"\nmsgstr \"прозрачност;яркост;тъмнота\"\n\n#: /views/index.handlebars\nmsgid \"Opacity:\"\nmsgstr \"Прозрачност\"\n\n#: /views/index.handlebars\nmsgid \"ui;interface\"\nmsgstr \"ui;interface;външен вид;интерфейс\"\n\n#: /views/index.handlebars\nmsgid \"UI Settings\"\nmsgstr \"Настройки за външния вид\"\n\n#: /views/index.handlebars\nmsgid \"language override;text\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Language override:\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Use Browser Language\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"English\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Bulgarian\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"French\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"German\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Russian\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Swedish\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Finnish\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Toki Pona\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"themes;look;stylesheets;visuals\"\nmsgstr \"themes;look;stylesheets;visuals;теми;режими;изгледи\"\n\n#: /views/index.handlebars\nmsgid \"Theme:\"\nmsgstr \"Изглед:\"\n\n#: /views/index.handlebars\nmsgid \"Default\"\nmsgstr \"Оригинална\"\n\n#: /views/index.handlebars\nmsgid \"hide reticule;hide reticle;reticule shown reticle shown;reticule hidden;reticle hidden\"\nmsgstr \"скриване на мерника;ретикула;мерник\"\n\n#: /views/index.handlebars\nmsgid \"Show reticule\"\nmsgstr \"Показване на ретикулата\"\n\n#: /views/index.handlebars\nmsgid \"hide cursor;cursor shown;cursor hidden\"\nmsgstr \"курсор;скриване на курсора;скрит курсор\"\n\n#: /views/index.handlebars\nmsgid \"Show cursor\"\nmsgstr \"Показване на курсора\"\n\n#: /views/index.handlebars\nmsgid \"darkness filter\"\nmsgstr \"тъмнота;яркост\"\n\n#: /views/index.handlebars\nmsgid \"Enable color brightness\"\nmsgstr \"Позволяване на променянето на цветовете\"\n\n#: /views/index.handlebars\nmsgid \"Warning: Known to cause fuzziness in Chrome on some Mac/Linux installs\"\nmsgstr \"Внимание: Може да доведе до замъгляване при потребителите на Chrome или на операционните системи Mac/Linux\"\n\n#: /views/index.handlebars\nmsgid \"Color brightness:\"\nmsgstr \"Яркост на цветовете\"\n\n#: /views/index.handlebars\nmsgid \"keep current selected;keep curent color;place\"\nmsgstr \"нулиране;запазване\"\n\n#: /views/index.handlebars\nmsgid \"Deselect color after placing\"\nmsgstr \"Нулиране на цвят след поставяне\"\n\n#: /views/index.handlebars\nmsgid \"mousewheel;palette scrolling\"\nmsgstr \"палитра\"\n\n#: /views/index.handlebars\nmsgid \"Enable scrolling on the palette to switch colors\"\nmsgstr \"Позволяване на извъртане на цветовете от палитнрата със средния бутон на мишката \"\n\n#: /views/index.handlebars\nmsgid \"reverse scrolling;mousewheel;palette scrolling;enable scrolling on the palette to switch colors\"\nmsgstr \"обръщане;посока;извъртане\"\n\n#: /views/index.handlebars\nmsgid \"Invert scroll direction\"\nmsgstr \"Обърната посока\"\n\n#: /views/index.handlebars\nmsgid \"indexed colors;palette indicies\"\nmsgstr \"палитра\"\n\n#: /views/index.handlebars\nmsgid \"Add numbers to palette entries\"\nmsgstr \"Добавяне на цифри към цветовете в палитрата\"\n\n#: /views/index.handlebars\nmsgid \"scrollbar;palette scrolling\"\nmsgstr \"палитра\"\n\n#: /views/index.handlebars\nmsgid \"Enable thin scrollbar\"\nmsgstr \"Включване на тънка лента\"\n\n#: /views/index.handlebars\nmsgid \"scrollbar;palette scrolling;palette stack\"\nmsgstr \"лента;палитра;палитра\"\n\n#: /views/index.handlebars\nmsgid \"Enable palette stacking\"\nmsgstr \"Подреждане на цветовете вертикално\"\n\n#: /views/index.handlebars\nmsgid \"floating bubble location\"\nmsgstr \"позиция;място\"\n\n#: /views/index.handlebars\nmsgid \"Bubble position:\"\nmsgstr \"Позиция на панела с информация\"\n\n#: /views/index.handlebars\nmsgid \"Top left\"\nmsgstr \"Горе вляво\"\n\n#: /views/index.handlebars\nmsgid \"Top right\"\nmsgstr \"Горе вдясно\"\n\n#: /views/index.handlebars\nmsgid \"Bottom left\"\nmsgstr \"Долу вляво\"\n\n#: /views/index.handlebars\nmsgid \"Bottom right\"\nmsgstr \"Долу вдясно\"\n\n#: /views/index.handlebars\nmsgid \"broken;offset workaround\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Attempt to fix canvas displacement bug in Chrome 78+\"\nmsgstr \"Поправяне на проблема с несъответствието при Chrome 78+\"\n\n#: /views/index.handlebars\nmsgid \"chat;message;ping sound\"\nmsgstr \"чат\"\n\n#: /views/index.handlebars\nmsgid \"Chat Settings\"\nmsgstr \"Настройки за чата\"\n\n#: /views/index.handlebars\nmsgid \"username;color;colour\"\nmsgstr \"цвят\"\n\n#: /views/index.handlebars\nmsgid \"Username Color:\"\nmsgstr \"Цвят на името\"\n\n#: /views/index.handlebars\nmsgid \"chat message;chat ui\"\nmsgstr \"чат\"\n\n#: /views/index.handlebars\nmsgid \"Interface\"\nmsgstr \"Интерфейс\"\n\n#: /views/index.handlebars\nmsgid \"enable;disable\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Enable chat\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Page must be reloaded after changing\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"chat size;chat font\"\nmsgstr \"размер;шрифт\"\n\n#: /views/index.handlebars\nmsgid \"Font Size:\"\nmsgstr \"Размер на шрифта\"\n\n#: /views/index.handlebars\nmsgid \"time;timestamps\"\nmsgstr \"време\"\n\n#: /views/index.handlebars\nmsgid \"24 Hour Timestamps\"\nmsgstr \"24-часово време\"\n\n#: /views/index.handlebars\nmsgid \"badges;pixel count;pixels placed\"\nmsgstr \"пиксели\"\n\n#: /views/index.handlebars\nmsgid \"Show pixel-placed badges\"\nmsgstr \"Показване на табелки за количеството на поставените пиксели\"\n\n#: /views/index.handlebars\nmsgid \"badges;factions\"\nmsgstr \"фракция;фракции;група;групи;клан;кланове\"\n\n#: /views/index.handlebars\nmsgid \"Show faction tags\"\nmsgstr \"Показване на таговете на фракциите\"\n\n#: /views/index.handlebars\nmsgid \"template urls;template links;template name\"\nmsgstr \"шаблон\"\n\n#: /views/index.handlebars\nmsgid \"Replace template titles with URLs in chat where applicable\"\nmsgstr \"Заменяне на заглавия на шаблони с пълния URL адрес\"\n\n#: /views/index.handlebars\nmsgid \"chat orientation;chat position\"\nmsgstr \"позиция;чат\"\n\n#: /views/index.handlebars\nmsgid \"Enable horizontal chat\"\nmsgstr \"Хоризонтален режим\"\n\n#: /views/index.handlebars\nmsgid \"banner;animation\"\nmsgstr \"текст;чат\"\n\n#: /views/index.handlebars\nmsgid \"Enable the rotating banner under chat\"\nmsgstr \"Включване на променящия се текст под чата\"\n\n#: /views/index.handlebars\nmsgid \"max;messages;truncate\"\nmsgstr \"максимум;чат;съобщения\"\n\n#: /views/index.handlebars\nmsgid \"Maximum amount of chat messages:\"\nmsgstr \"Максимален брой показани съобщения\"\n\n#: /views/index.handlebars\nmsgid \"link;url;behaviour\"\nmsgstr \"линк\"\n\n#: /views/index.handlebars\nmsgid \"Default internal link action click:\"\nmsgstr \"Зададено действие при отваряне на лиск с шаблон\"\n\n#: /views/index.handlebars\nmsgid \"link;url;behaviour;external;bypass;skip\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Skip external link popup\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Note: Has no effect if external link popups are disabled by the server.\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"chat icon;chat notifications;chat ping\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Chat icon badge mode:\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Show on unread ping\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Show on unread message\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Never show\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"chat icon;chat notifications;chat message\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Chat icon highlight mode:\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"ignored;ignores;unignore;blocked;blocking;unblock\"\nmsgstr \"игнориран;блок;блокиран;блокване;блокиране\"\n\n#: /views/index.handlebars\nmsgid \"Ignores\"\nmsgstr \"Игнорирани потребители\"\n\n#: /views/index.handlebars\nmsgid \"unignore;unblock\"\nmsgstr \"отблокиране;игнориране\"\n\n#: /views/index.handlebars\nmsgid \"Unignore\"\nmsgstr \"Деигнориране на потребителя\"\n\n#: /views/index.handlebars\nmsgid \"overlays;virginmap;heatmap;grid\"\nmsgstr \"пласт\"\n\n#: /views/index.handlebars\nmsgid \"Overlay Settings\"\nmsgstr \"Настройки за наслагване на пластове\"\n\n#: /views/index.handlebars\nmsgid \"heatmap;heatmap opacity;clear heatmap\"\nmsgstr \"активност\"\n\n#: /views/index.handlebars\nmsgid \"Heatmap\"\nmsgstr \"Карта с активността\"\n\n#: /views/index.handlebars\nmsgid \"Turn on heatmap\"\nmsgstr \"Включване на картата с активността\"\n\n#: /views/index.handlebars\nmsgid \"(toggle with <kbd>H</kbd>)\"\nmsgstr \"(включ./изкл. с <kbd>H</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"overlays;activity;pixels placed pixels;wipe;clean\"\nmsgstr \"слой\"\n\n#: /views/index.handlebars\nmsgid \"Clear heatmap\"\nmsgstr \"Изчистване на картата с активността\"\n\n#: /views/index.handlebars\nmsgid \"(hotkey: <kbd>O</kbd>)\"\nmsgstr \"(топъл клавиш: <kbd>O</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels placed pixels;transparency\"\nmsgstr \"слой\"\n\n#: /views/index.handlebars\nmsgid \"Heatmap background opacity:\"\nmsgstr \"Прозрачност на картата с активността:\"\n\n#: /views/index.handlebars\nmsgid \"virginmap;virginmap opacity;clear virginmap\"\nmsgstr \"прозрачност\"\n\n#: /views/index.handlebars\nmsgid \"Virginmap\"\nmsgstr \"Карта с поставените пиксели\"\n\n#: /views/index.handlebars\nmsgid \"Turn on virginmap\"\nmsgstr \"Включване на картата с поставени пиксели\"\n\n#: /views/index.handlebars\nmsgid \"(toggle with <kbd>X</kbd>)\"\nmsgstr \"(включ./изкл. с <kbd>X</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels unplaced pixels;transparency\"\nmsgstr \"наслагване\"\n\n#: /views/index.handlebars\nmsgid \"Virginmap background opacity:\"\nmsgstr \"Прозрачност на картата с поставени пиксели\"\n\n#: /views/index.handlebars\nmsgid \"overlays;activity;pixels unplaced pixels;wipe;clean\"\nmsgstr \"наслагване\"\n\n#: /views/index.handlebars\nmsgid \"Clear virginmap\"\nmsgstr \"Изчистване на картата с поставени пиксели\"\n\n#: /views/index.handlebars\nmsgid \"(hotkey: <kbd>U</kbd>)\"\nmsgstr \"(топъл клавиш: <kbd>U</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"Layer template underneath heatmap\"\nmsgstr \"Поставяне на шаблона под картата с активността\"\n\n#: /views/index.handlebars\nmsgid \"grid;toggle grid\"\nmsgstr \"решетка;мрежа\"\n\n#: /views/index.handlebars\nmsgid \"Grid\"\nmsgstr \"Решетка\"\n\n#: /views/index.handlebars\nmsgid \"Turn on grid\"\nmsgstr \"Включване на решетката\"\n\n#: /views/index.handlebars\nmsgid \"(toggle with <kbd>G</kbd>)\"\nmsgstr \"(включ./изкл. с <kbd>G</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"controls;zooming;panning;movement\"\nmsgstr \"контрол\"\n\n#: /views/index.handlebars\nmsgid \"Control Settings\"\nmsgstr \"Настройки за контрол\"\n\n#: /views/index.handlebars\nmsgid \"zooming;scrolling;scale;scaling\"\nmsgstr \"увеличаване;мащаб\"\n\n#: /views/index.handlebars\nmsgid \"Zooming\"\nmsgstr \"Увеличаване\"\n\n#: /views/index.handlebars\nmsgid \"scrolling sensitivity;zooming sensitivity;mousewheel sensitivity\"\nmsgstr \"точност;увеличаване;мащаб\"\n\n#: /views/index.handlebars\nmsgid \"Zoom sensitivity:\"\nmsgstr \"Точност на увеличението\"\n\n#: /views/index.handlebars\nmsgid \"zooming limit;scrolling limit;mousewheel;zooming minimum;zooming maximum\"\nmsgstr \"увеличаване;мащаб\"\n\n#: /views/index.handlebars\nmsgid \"Minimum scale:\"\nmsgstr \"Най-ниска стойност:\"\n\n#: /views/index.handlebars\nmsgid \"Maximum scale:\"\nmsgstr \"Най-висока стойност:\"\n\n#: /views/index.handlebars\nmsgid \"rounding;zooming;scrolling;mousewheel;integer;decimal\"\nmsgstr \"увеличаване;мащаб\"\n\n#: /views/index.handlebars\nmsgid \"Round zoom values to nearest whole number\"\nmsgstr \"Приближаване на стойностите на мащаба до най-близкото цяло число\"\n\n#: /views/index.handlebars\nmsgid \"controls;miscellaneous\"\nmsgstr \"контроли;настройки\"\n\n#: /views/index.handlebars\nmsgid \"Lock the canvas (disallow canvas drag/zoom with mouse/fingers)\"\nmsgstr \"Закотвяне на платното в определена позиция\"\n\n#: /views/index.handlebars\nmsgid \"MMB picker;mouse picker;selection;palette picker\"\nmsgstr \"мишка\"\n\n#: /views/index.handlebars\nmsgid \"Enable middle mouse button selecting color from board\"\nmsgstr \"Позволяване на средния бутон на мишката да избира цвят от платното\"\n\n#: /views/index.handlebars\nmsgid \"right click action\"\nmsgstr \"десен клавиш\"\n\n#: /views/index.handlebars\nmsgid \"Right-click action:\"\nmsgstr \"Функция на десния бутон на мишката\"\n\n#: /views/index.handlebars\nmsgid \"Nothing\"\nmsgstr \"Никаква\"\n\n#: /views/index.handlebars\nmsgid \"Clear color\"\nmsgstr \"Нулиране на цвета\"\n\n#: /views/index.handlebars\nmsgid \"Copy color\"\nmsgstr \"Копиране на цвета\"\n\n#: /views/index.handlebars\nmsgid \"Lookup\"\nmsgstr \"Преглед на пиксел\"\n\n#: /views/index.handlebars\nmsgid \"Clear color + Lookup\"\nmsgstr \"Нулиране на цвета + преглед на пиксела\"\n\n#: /views/index.handlebars\nmsgid \"snapshots;screenshot;download;picture;canvas\"\nmsgstr \"снимка;скрииншот\"\n\n#: /views/index.handlebars\nmsgid \"Snapshot Settings\"\nmsgstr \"Настройки за екранна снимка\"\n\n#: /views/index.handlebars\nmsgid \"screenshot;snapshot;download;board;canvas\"\nmsgstr \"снимка;скрииншот\"\n\n#: /views/index.handlebars\nmsgid \"take screenshot;image;download format;picture;canvas;board\"\nmsgstr \"снимка;скрииншот\"\n\n#: /views/index.handlebars\nmsgid \"Snapshot image format:\"\nmsgstr \"Формат на изтеглената екранна снимка\"\n\n#: /views/index.handlebars\nmsgid \"PNG\"\nmsgstr \"PNG\"\n\n#: /views/index.handlebars\nmsgid \"JPEG\"\nmsgstr \"JPEG\"\n\n#: /views/index.handlebars\nmsgid \"WEBP (Chrome only)\"\nmsgstr \"WEBP (само за Chrome)\"\n\n#: /views/index.handlebars\nmsgid \"sound;notification;alert;notify;ping\"\nmsgstr \"звук;известия\"\n\n#: /views/index.handlebars\nmsgid \"Sound and Notification Settings\"\nmsgstr \"Звук и Известия\"\n\n#: /views/index.handlebars\nmsgid \"audio;mute;noise;volume\"\nmsgstr \"звук;известия\"\n\n#: /views/index.handlebars\nmsgid \"Enable sound\"\nmsgstr \"Включване на звука\"\n\n#: /views/index.handlebars\nmsgid \"notifs;notify;pixel notification\"\nmsgstr \"звук;известия\"\n\n#: /views/index.handlebars\nmsgid \"Enable pixel available notification\"\nmsgstr \"Включване на известия за готови пиксели\"\n\n#: /views/index.handlebars\nmsgid \"notification;pixel ready;alert\"\nmsgstr \"звук;известия\"\n\n#: /views/index.handlebars\nmsgid \"Pixel Ready Notification\"\nmsgstr \"Известие за готов пиксел\"\n\n#: /views/index.handlebars\nmsgid \"alert source;notify url;notify source;notification url;notification source\"\nmsgstr \"звук;известия;адрес;файл;източник\"\n\n#: /views/index.handlebars\nmsgid \"Alert URL:\"\nmsgstr \"URL на звука\"\n\n#: /views/index.handlebars\nmsgid \"Update\"\nmsgstr \"Потвърдете\"\n\n#: /views/index.handlebars\nmsgid \"Test\"\nmsgstr \"Тествайте\"\n\n#: /views/index.handlebars\nmsgid \"sound level;audio level;mute audio;mute sound\"\nmsgstr \"звук;известия;сила\"\n\n#: /views/index.handlebars\nmsgid \"Volume:\"\nmsgstr \"Звук\"\n\n#: /views/index.handlebars\nmsgid \"alert forewarning;alert delay; notification delay; notification forewarning\"\nmsgstr \"звук;известия;предупреждение\"\n\n#: /views/index.handlebars\nmsgid \"Delay (seconds):\"\nmsgstr \"Закъснение (в секунди)\"\n\n#: /views/index.handlebars\nmsgid \"chat mentions;chat pings;chat sound\"\nmsgstr \"споменаване;тагване;пингване\"\n\n#: /views/index.handlebars\nmsgid \"Chat Pings\"\nmsgstr \"Споменаване в чата\"\n\n#: /views/index.handlebars\nmsgid \"Enable pings\"\nmsgstr \"Позволяване на известията за споменаване\"\n\n#: /views/index.handlebars\nmsgid \"mention sound\"\nmsgstr \"звук;известие\"\n\n#: /views/index.handlebars\nmsgid \"Play sound on ping:\"\nmsgstr \"Звук при споменаване:\"\n\n#: /views/index.handlebars /public/include/chat.js\nmsgid \"Off\"\nmsgstr \"Изключен\"\n\n#: /views/index.handlebars\nmsgid \"Only when necessary\"\nmsgstr \"Само, когато е необходимо\"\n\n#: /views/index.handlebars\nmsgid \"Always\"\nmsgstr \"Включен\"\n\n#: /views/index.handlebars\nmsgid \"mention sound volume\"\nmsgstr \"звук;известия;сила\"\n\n#: /views/index.handlebars\nmsgid \"Ping sound volume:\"\nmsgstr \"Сила на известие за споменаване в чата:\"\n\n#: /views/index.handlebars\nmsgid \"personal account\"\nmsgstr \"акаунт;профил;таг\"\n\n#: /views/index.handlebars\nmsgid \"Account Settings\"\nmsgstr \"Настройки за профила\"\n\n#: /views/index.handlebars\nmsgid \"Public Discord name:\"\nmsgstr \"Показан дискорд таг:\"\n\n#: /views/index.handlebars /public/include/chat.js\nmsgid \"Set\"\nmsgstr \"Потвърди\"\n\n#: /views/index.handlebars\nmsgid \"Remove\"\nmsgstr \"Премахни\"\n\n#: /views/index.handlebars\nmsgid \"Help\"\nmsgstr \"Помощ\"\n\n#: /views/index.handlebars\nmsgid \"Notifications\"\nmsgstr \"Съобщения\"\n\n#: /views/partials/faq.handlebars\nmsgid \"FAQ\"\nmsgstr \"Често задавани въпроси\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Why is the cooldown as long as it is?\"\nmsgstr \"Колко трябва да чакам, за да поставя пиксел?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"The time it takes to get a pixel is dynamic, and changes based on how many people are online. The cooldown time is longer when more users are online.\"\nmsgstr \"Времето за изчакване се определя от броя на потребителите, които са онлайн в момента. Колкото повече потребители, толкова по-дълго изчакване.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Why does it say 0/6 pixels?\"\nmsgstr \"Защо пише 0/6 пиксела?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"This means that you are waiting for your next pixel. When you place a pixel, there is a cooldown for when you can place the next one. Over time, you can gain up to 6 \\\"stacked\\\" pixels to place at once.\"\nmsgstr \"Това означава, че в момента изчаквате следващия си пиксел. Когато поставите пиксел, трябва да изчакате, за да поставите следващия. Може да натрупате до 6 \\\"натрупани\\\" пиксела в рамките на около 30-40м., които да поставите накуп.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Why does it take so long to \\\"stack\\\" pixels?\"\nmsgstr \"Защо отнема толкова дълго да се \\\"натрупат\\\" пиксели?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"This is by design. It is better to place a pixel as soon as you get one. Pixel \\\"stacking\\\" is meant to give you a bump if you go AFK for a bit. It takes around 20-30 minutes to get a full 6/6 pixels, but it only takes around 3 minutes to place 6 pixels if you place them as soon as possible.\"\nmsgstr \"Защото така е проектиран сайта. Натрупването е предназначено да подпомогне играчите, които са излезли офлайн за някакъв период от време. За натрупване на 6 пиксела трябва да се изчакат 30-40 минути, докато поставянето им веднага, след като таймера изтече би отнело под 3.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I appeal a ban?\"\nmsgstr \"Как да ми бъде премахнат бана?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Contact us on <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord</a> or send an appeal to our <a href=\\\"https://pxls.space/appeal\\\" target=\\\"_blank\\\">Google form</a> after reading the rules in the site's info panel.\"\nmsgstr \"Контактувайте с нас на <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord</a> или пратете извинение (на английски) на <a href=\\\"https://pxls.space/appeal\\\" target=\\\"_blank\\\">Google form</a> след прочитане на правилата.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I make a template?\"\nmsgstr \"Как да направя шаблон?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"A template is an image link that is posted in the template textbox in the settings panel so you can place over it on the canvas. You may use a regular image link to your pixel art, but many people use 3rd party tools like <a href=\\\"https://discord.gg/5MVDCq53vC\\\" target=\\\"blank\\\">Clueless</a> to turn pixel art into a fancier link. If you need to make pixel art yourself, you can use <a href=\\\"https://www.piskelapp.com/p/create\\\" target=\\\"_blank\\\">Piskel</a> to create art to put into Clueless.\"\nmsgstr \"\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I move a template?\"\nmsgstr \"Как да преместя шаблона си?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Hold <kbd>CTRL</kbd> (or <kbd>OPTION</kbd> on macOS) and click and drag to move it around. On mobile, you can tap and hold where you want to move the template and click \\\"Move Template Here\\\" in the pop-up.\"\nmsgstr \"Задръжте <kbd>CTRL</kbd> (или <kbd>OPTION</kbd> на macOS) и го премествайте с мишката си. На мобилно устройство, задръжте мястото, където искате да се намира горния ляв ъгъл на шаблона Ви и натиснете \\\"Премести шаблона тук\\\".\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Does the canvas reset? When?\"\nmsgstr \"Платното изчиства ли се? Кога?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Yes. The canvas resets when it is completely full. A reset date is not usually decided until the canvas is full, but the average canvas life-span is around 1 month. Updates are posted in our <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord server</a> when a reset date is set.\"\nmsgstr \"Да, платното се заменя с ново, когато вече няма достатъчно място, на което да се рисува. Няма определена продължителност, но датата и часът на промяната се обявяват няколко дена по-рано.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Where can I see the past canvases?\"\nmsgstr \"Къде мога да разгледам предишните платна?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"The past canvases are featured on our <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord server</a>, or the <a href=\\\"https://archives.pxls.space\\\" target=\\\"_blank\\\">archives</a>, which records timelapses and a lot of useful information on each canvas.\"\nmsgstr \"Последните кадри от предишните платна са включени на <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord server</a>, а за пълен запис, посетете <a href=\\\"https://pxlsfiddle.com\\\" target=\\\"_blank\\\">PxlsFiddle</a>.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I see who placed a pixel?\"\nmsgstr \"Как да видя кой е поставил пиксел?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"By shift-clicking (or tap and hold on mobile) a pixel, you can see who placed a pixel, how many pixels they have placed, and when they placed it.\"\nmsgstr \"Чрез натискане на Shift + кликване (или задържане на мобилно устройство) може да разберете кой и кога е поставил пиксел и колко пиксела има той.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I report someone?\"\nmsgstr \"Как да докладвам за нарушение на правилата?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Shift-click (or tap and hold on mobile) on a pixel, and click the Report button.\"\nmsgstr \"Кликнете и натиснете Shift (или задръжете на мобилно устройство) на дадения пиксел, и натиснете бутона Докладвай.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I change the color of my name in the chat?\"\nmsgstr \"Как да сменя цвета на името си?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"There is a \\\"Username Color\\\" option near the bottom of the settings panel.\"\nmsgstr \"Отидете в настройките за чата.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"What is a \\\"virginmap\\\"?\"\nmsgstr \"Какво е \\\"карта с поставени пиксели\\\"?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"The virginmap shows which pixels have not yet been placed on (or “virgin” pixels).\"\nmsgstr \"Тази карта Ви показва кои пиксели от началото на платното са все още недокоснати.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I report bugs?\"\nmsgstr \"Как да докладвам за проблем?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Submit bugs to the #dev-and-bugs forum in the <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord server</a>. If you have found an exploit, please message one of the staff members privately (through DMs) or open a modmail by DMing pxls.mail#8384.\"\nmsgstr \"Посетете канала #dev-and-bugs в <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">дискорд сървъра</a>.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I get more info or contact staff?\"\nmsgstr \"Как да се свържа с екипа администратори/да получа повече информация?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Check the info panel (the icon on the top left) for more details and links, or join our <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord server</a>, where a staff member will gladly respond.\"\nmsgstr \"Цъкнете информационния панел (иконката горе вляво) или посетете нашия <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">дискорд сървър</a>.\"\n\n#: /views/partials/info.handlebars\nmsgid \"Welcome!\"\nmsgstr \"Добре дошли!\"\n\n#: /views/partials/info.handlebars\nmsgid \"Welcome to pxls.space! Pxls is a multiplayer online collaborative canvas based on Reddit's <a href=\\\"https://www.reddit.com/r/place\\\" target=\\\"_blank\\\">r/place</a> event from 2017 that allows you to create anything you can imagine, one pixel at a time. Join hundreds of other players in the Pxls community and create amazing works of art together as a team, or solo.\"\nmsgstr \"Добре дошли в pxls.space! Pxls.space е онлайн платно за множество играчи, на което можете да нарисувате каквото си пожелаете. Присъединете се към стотици други играчи и създайте каквото пожелаете, в екип или соло.\"\n\n#: /views/partials/info.handlebars\nmsgid \"The best place to reach staff and fellow community is in the discord!\"\nmsgstr \"Най-доброто място за комуникация и  консултиране с модераторите и администраторите е дискорд сървъра ни.\"\n\n#: /views/partials/info.handlebars\nmsgid \"Check out our social media pages, and please take the time to read the rules below. Have fun creating (or changing) art!\"\nmsgstr \"Молим Ви да отделите малко внимание на правилата, които следват. Приятно прекарване!\"\n\n#: /views/partials/info.handlebars\nmsgid \"Canvas Rules\"\nmsgstr \"Правила, отнасящи се до платното\"\n\n#: /views/partials/info.handlebars\nmsgid \"We pride ourselves on trying to keep an open canvas for all free from outside interference on our end, and especially censorship. However, for the good of the community and on accounts of our own beliefs, please acknowledge and obey the following guidelines:\"\nmsgstr \"Нашата цел е платното да е свободно от цензура, но за благото на обществото има някои правила:\"\n\n#: /views/partials/info.handlebars\nmsgid \"No hateful imagery or derogatory speech. This includes but is not limited to words such as <i>f****t</i>, <i>n****r</i>, etc; as well as the Swastika, Hammer and Sickle, and any symbols of terrorism.\"\nmsgstr \"Без пречупени кръстове и изписването на силно обидни думи, като <i>педал</i>, <i>педераст</i> и английските <i>f****t</i>, <i>n****r</i> и <i>retard</i>. \"\n\n#: /views/partials/info.handlebars\nmsgid \"No NSFW or NSFL content.\"\nmsgstr \"Без нецензурни изображения.\"\n\n#: /views/partials/info.handlebars\nmsgid \"No nudity or otherwise sexually explicit content\"\nmsgstr \"Без голота или силно еротични изображения\"\n\n#: /views/partials/info.handlebars\nmsgid \"No female-presenting nipples/bare breasts, genitalia, sexual fluids\"\nmsgstr \"Без напълно оголени женски гърди, женски и мъжки полови органи и сексуални течности\"\n\n#: /views/partials/info.handlebars\nmsgid \"No sexual imagery/erotica\"\nmsgstr \"Без сексуални илюстрации\"\n\n#: /views/partials/info.handlebars\nmsgid \"No excessive blood or otherwise obscene/shocking content\"\nmsgstr \"Без силно окървавени тела и друго шокиращо съдържание\"\n\n#: /views/partials/info.handlebars\nmsgid \"No more than <b>one</b> account per user, no exceptions. Multiple account users will be banned from creating art on the canvas.\"\nmsgstr \"Без повече от <b>един</b> акаунт на всеки потребител. Нарушителите ще бъдат отстранени.\"\n\n#: /views/partials/info.handlebars\nmsgid \"No auto-placement tools of any kind, you must place the pixels manually.\"\nmsgstr \"Без ботове/автокликъри. Всеки пиксел трябва да бъде поставен на ръка.\"\n\n#: /views/partials/info.handlebars\nmsgid \"Do not abuse site functionality, such as reports or lookups. (e.g. automated reporting/lookups, etc.)\"\nmsgstr \"Без преупотреба на функциите на сайта (автоматично преглеждане на пиксели/докладване)\"\n\n#: /views/partials/info.handlebars\nmsgid \"Any automated aggregation of data from user lookups is not allowed, and will result in a ban.\"\nmsgstr \"Всяко автоматизирано събиране на данни чрез преглеждане на пиксели ще бъде наказано.\"\n\n#: /views/partials/info.handlebars\nmsgid \"Staff have final say in any rule disputes\"\nmsgstr \"Екипът от модератори и администратори има последната дума в спорове за правилата\"\n\n#: /views/partials/info.handlebars\nmsgid \"If you feel a moderator has acted inappropriately, please report it to an administrator.\"\nmsgstr \"Ако смятате, че даден модератор е пристъпил неправилно или непристойно, контактувайте администратор.\"\n\n#: /views/partials/info.handlebars\nmsgid \"If you believe you have been falsely banned you may contact a moderator or administrator.\"\nmsgstr \"Ако смятате, че даден модератор се е отнесъл неправилно спрямо вас, контактувайте другите членове на екипа.\"\n\n#: /views/partials/info.handlebars\nmsgid \"Chat Rules\"\nmsgstr \"Правила, отнасящи се до чата\"\n\n#: /views/partials/info.handlebars\nmsgid \"Keep chat civil. No harassment or homophobic/transphobic/disablist language.\"\nmsgstr \"Дръжте се цивилизовано, без хомофобски и расистки изказвания.\"\n\n#: /views/partials/info.handlebars\nmsgid \"No hate speech. This includes emoji/symbols/ASCII art.\"\nmsgstr \"Без силни обиди като посочените в Правило 1, отнасящо се за платното. Това включва и емотикони/ASCII.\"\n\n#: /views/partials/info.handlebars\nmsgid \"Normal swearing/etc is allowed\"\nmsgstr \"Обикновенните псувни са позволени\"\n\n#: /views/partials/info.handlebars\nmsgid \"No spamming\"\nmsgstr \"Без спамене.\"\n\n#: /views/partials/info.handlebars\nmsgid \"This includes excessive ASCII art/emojis/symbols/whitespace\"\nmsgstr \"Това включва прекомерно използване на емотикони/странни символи и ASCII\"\n\n#: /views/partials/info.handlebars\nmsgid \"No \\\"copy pasta\\\"s\"\nmsgstr \"Без \\\"копипасти\\\"\"\n\n#: /views/partials/info.handlebars\nmsgid \"No links to sites that actively break the canvas or chat rules (e.g. porn sites)\"\nmsgstr \"Без нецензурно съдържание - прекалено еротично държане, линкове към порнографско съдържание и т.н.\"\n\n#: /views/partials/info.handlebars\nmsgid \"No symbology which break the canvas or chat rules (e.g. NSFW ASCII art)\"\nmsgstr \"Без нецензорни символи в чата.\"\n\n#: /views/partials/info.handlebars\nmsgid \"No personal information\"\nmsgstr \"Без твърде лична информация (адрес, пълно име( място на учене/работа и т.н.)\"\n\n#: /views/partials/info.handlebars\nmsgid \"Links\"\nmsgstr \"Линкове\"\n\n#: /views/partials/info.handlebars\nmsgid \"Terms of Service\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Privacy Policy\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Discord (main hub)\"\nmsgstr \"Дискорд (главно място за общуване)\"\n\n#: /views/partials/info.handlebars\nmsgid \"Twitter\"\nmsgstr \"Туитър\"\n\n#: /views/partials/info.handlebars\nmsgid \"GitHub (back end)\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"GitHub (front end)\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Single-player mode\"\nmsgstr \"Pxls за един играч\"\n\n#: /views/partials/info.handlebars\nmsgid \"Statistics\"\nmsgstr \"Статистики\"\n\n#: /views/partials/info.handlebars\nmsgid \"Profile (user info, factions, etc.)\"\nmsgstr \"Профил (информация и фракции)\"\n\n#: /views/partials/info.handlebars\nmsgid \"Wiki\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Generator, progress checker, and monitor for Pxls templates\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Archives\"\nmsgstr \"Архиви\"\n\n#: /views/partials/info.handlebars\nmsgid \"PxlsFiddle (archives)\"\nmsgstr \"PxlsFiddle (архиви)\"\n\n#: /views/partials/info.handlebars\nmsgid \"Donate\"\nmsgstr \"Дари\"\n\n#: /views/partials/info.handlebars\nmsgid \"Donations are not accepted at this time, but this panel will be updated when they're open again!\"\nmsgstr \"Даренията не се приемат в момента, но този панел ще бъде променен, когато отново има възможност за тях!\"\n\n#: /views/profile.handlebars\nmsgid \"{0}'s Profile\"\nmsgstr \"Профил на {0}\"\n\n#: /views/profile.handlebars\nmsgid \"My Data\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Reports\"\nmsgstr \"Докладвания\"\n\n#: /views/profile.handlebars\nmsgid \"Factions\"\nmsgstr \"Фракции\"\n\n#: /views/profile.handlebars\nmsgid \"Data\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"You must be logged in to view your profile.\"\nmsgstr \"Трябва да сте влезли в своя профил, за да го разгледате.\"\n\n#: /views/profile.handlebars\nmsgid \"Registration Date\"\nmsgstr \"Дата на регистриране\"\n\n#: /views/profile.handlebars /public/include/lookup.js\nmsgid \"Alltime Pixels\"\nmsgstr \"Пиксели\"\n\n#: /views/profile.handlebars\nmsgid \"Current Canvas Pixels\"\nmsgstr \"Пиксели на сегашното платно\"\n\n#: /views/profile.handlebars\nmsgid \"Discord Tag\"\nmsgstr \"Дискорд таг\"\n\n#: /views/profile.handlebars /public/include/lookup.js\nmsgid \"Faction\"\nmsgstr \"Фракции\"\n\n#: /views/profile.handlebars\nmsgid \"None\"\nmsgstr \"Няма\"\n\n#: /views/profile.handlebars /public/admin/admin.js\nmsgid \"Roles\"\nmsgstr \"Роли\"\n\n#: /views/profile.handlebars\nmsgid \"Canvas Ban Expiry\"\nmsgstr \"Дата на свършване на наказанието (платно)\"\n\n#: /views/profile.handlebars\nmsgid \"Never\"\nmsgstr \"Никога\"\n\n#: /views/profile.handlebars\nmsgid \"Chat Ban Expiry\"\nmsgstr \"Дата на свършване на наказанието (чат)\"\n\n#: /views/profile.handlebars\nmsgid \"View rankings and other stats <a href=\\\"/stats\\\">here</a>.\"\nmsgstr \"Разгледайте позициите и други статистики <a href=\\\"/stats\\\">тук</a>.\"\n\n#: /views/profile.handlebars\nmsgid \"You must be logged in to view your reports.\"\nmsgstr \"Трябва да сте влезли в профила си, за да разгледате своите доклади.\"\n\n#: /views/profile.handlebars\nmsgid \"Canvas Reports ({0}/{1} open)\"\nmsgstr \"Докладвания за платното ({0}/{1} отворени)\"\n\n#. eg \"Report on Bob (closed)\n#: /views/profile.handlebars\nmsgid \"Report on {0} (closed)\"\nmsgstr \"Докладване над {0} (прегледано)\"\n\n#. eg \"Report on Bob (open)\n#: /views/profile.handlebars\nmsgid \"Report on {0} (open)\"\nmsgstr \"Докладване над {0} (непрегледано)\"\n\n#. eg \"Reported Bob on Jan 1, 1970, 00:00:00 AM (UTC)\n#: /views/profile.handlebars\nmsgid \"Reported {0} on {1}\"\nmsgstr \"Докладвал за {0} на {1}\"\n\n#: /views/profile.handlebars\nmsgid \"There are no canvas reports to show.\"\nmsgstr \"Няма доклади, отнасящи се за платното.\"\n\n#: /views/profile.handlebars\nmsgid \"Chat Reports ({0}/{1} open)\"\nmsgstr \"Докладвания за чата ({0}/{1} отворени\"\n\n#: /views/profile.handlebars\nmsgid \"There are no chat reports to show.\"\nmsgstr \"Няма доклади, отнасящи се за чата.\"\n\n#: /views/profile.handlebars\nmsgid \"You must be logged in to manage your factions.\"\nmsgstr \"Трябва да сте влезли в профила си, за да работите с Вашите фракции.\"\n\n#: /views/profile.handlebars\nmsgid \"You are faction restricted and cannot create new factions. If you believe this is an error, please contact a moderator.\"\nmsgstr \"Вие имате забрана за създаване на нови фракции. Ако смятате, че това е грешка, контактувайте с администратор.\"\n\n#: /views/profile.handlebars\nmsgid \"You are canvas banned and cannot create new factions. If you believe this is an error, please contact a moderator.\"\nmsgstr \"Вие имате наказание, отнасящо се за платното и нямате право да създадете нови фракции. Ако смятате, че това е грешка, контактувайте с администратор.\"\n\n#: /views/profile.handlebars\nmsgid \"You must have at least {0} all-time pixels to create a faction.\"\nmsgstr \"Трябва да имате поне {0} пиксела, за да създадете фракция.\"\n\n#: /views/profile.handlebars\nmsgid \"Create\"\nmsgstr \"Създайте\"\n\n#: /views/profile.handlebars\nmsgid \"Join\"\nmsgstr \"Присъединете се\"\n\n#: /views/profile.handlebars\nmsgid \"This is your currently displayed faction.\"\nmsgstr \"Това е фракцията, показана на Вашия профил.\"\n\n#. eg \"Pixelers (members: 100, ID: 1)\"\n#: /views/profile.handlebars\nmsgid \"{0} (members: {1}, ID: {2})\"\nmsgstr \"{0} (членове: {1}, ID: {2})\"\n\n#: /views/profile.handlebars\nmsgid \"Owner: {0}\"\nmsgstr \"Собственик: {0}\"\n\n#. makes the faction no longer the one displayed for the current user\n#: /views/profile.handlebars\nmsgid \"Remove Displayed\"\nmsgstr \"Премахнете от профила\"\n\n#. makes the faction the one displayed for the current user\n#: /views/profile.handlebars\nmsgid \"Set Displayed\"\nmsgstr \"Покажете на профила\"\n\n#: /views/profile.handlebars\nmsgid \"Members\"\nmsgstr \"Членове\"\n\n#: /views/profile.handlebars\nmsgid \"Edit\"\nmsgstr \"Редактирайте\"\n\n#: /views/profile.handlebars /public/include/chat.js\nmsgid \"Delete\"\nmsgstr \"Изтрийте\"\n\n#: /views/profile.handlebars\nmsgid \"Leave\"\nmsgstr \"Излезте\"\n\n#: /views/profile.handlebars\nmsgid \"You are not in any factions yet!\"\nmsgstr \"Вие не сте членове на нито една фракция.\"\n\n#: /views/profile.handlebars\nmsgid \"You must be logged in to view your data.\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Log Keys\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Log keys can be used by those who have them to tell which pixels you placed on previous canvases.\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"You can see the public <a href=\\\"https://pxls.space/extra/logs/\\\" target=\\\"_blank\\\">Pxls Logs</a> to learn more.\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Canvas Code\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Log Key\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"You have no log keys yet!\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Log keys should show up here after a canvas you have placed on ends.\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Members of {0} ([{1}])\"\nmsgstr \"Mчленове на {0} ([{1}])\"\n\n#: /views/profile.handlebars /public/admin/admin.js /public/include/lookup.js\nmsgid \"Close\"\nmsgstr \"Затворете\"\n\n#: /views/profile.handlebars\nmsgid \"Faction Members\"\nmsgstr \"Членове на фракцията\"\n\n#. This loop only fires when on our own profile. We can't leave a faction we own, we can only transfer ownership, so no point in showing ourselves in the member list.\n#. since we can't leave the faction until we transfer, if there's only one member in the list it's assumed to be the owner. we don't want to show ourself in the list\n#: /views/profile.handlebars\nmsgid \"Transfer Ownership\"\nmsgstr \"Прехвърлете собственост\"\n\n#. bans a user from the faction\n#: /views/profile.handlebars /public/include/chat.js\nmsgid \"Ban\"\nmsgstr \"Премахни от фракцията\"\n\n#: /views/profile.handlebars\nmsgid \"Nothing to see here!\"\nmsgstr \"Тук няма нищо!\"\n\n#: /views/profile.handlebars\nmsgid \"Faction Bans\"\nmsgstr \"Премахнати от фракцията\"\n\n#: /views/profile.handlebars /public/admin/admin.js /public/include/chat.js\nmsgid \"Unban\"\nmsgstr \"Отмени наказанието\"\n\n#: /views/profile.handlebars\nmsgid \"Find A Faction\"\nmsgstr \"Намерете фракция\"\n\n#: /views/profile.handlebars\nmsgid \"Search:\"\nmsgstr \"Търсете:\"\n\n#: /views/profile.handlebars\nmsgid \"Enter a search term to get started.\"\nmsgstr \"Напишете нещо.\"\n\n#: /views/profile.handlebars\nmsgid \"Load More\"\nmsgstr \"Вижте още\"\n\n#: /public/admin/admin.js\nmsgid \"Send alert...\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Rule #1: Hateful/derogatory speech or symbols\"\nmsgstr \"Правило 1: Силно обидно съдържание\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Rule #2: Nudity, genitalia, or non-PG-13 content\"\nmsgstr \"Правило 2: Голота/насилие\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Rule #3: Multi-account\"\nmsgstr \"Правило 3: Втори профил\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Rule #4: Botting\"\nmsgstr \"Правило 4: Автоматизирано поставяне\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Other (specify below)\"\nmsgstr \"Друго (пишете на английски)\"\n\n#: /public/admin/admin.js /public/include/chat.js /public/include/lookup.js\nmsgid \"Additional information (if applicable)\"\nmsgstr \"\"\n\n#. \"Revert pixels of the last *n* hours\", part before 'n'\n#: /public/admin/admin.js\nmsgid \"Revert pixels of the last \"\nmsgstr \"\"\n\n#. \"Revert pixels of the last *n* hours\", part after 'n'\n#: /public/admin/admin.js\nmsgid \" hours\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"You must specify the details.\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Something went wrong! Perhaps insufficient permissions?\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Shadowban user\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Shadowbanned user\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Permaban user\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Permabanned user\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Ban user\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Banned user\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Unbanned user ${username}\"\nmsgstr \"\"\n\n#. Context: ban type\n#: /public/admin/admin.js\nmsgid \"shadow\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"never\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"permanent\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/chat.js /public/include/uiHelper.js\n#: /public/include/user.js\nmsgid \"Yes\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/chat.js /public/include/uiHelper.js\n#: /public/include/user.js\nmsgid \"No\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Yes (permanent)\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Username\"\nmsgstr \"Име\"\n\n#: /public/admin/admin.js /public/include/chat.js\nmsgid \"Profile\"\nmsgstr \"Профил\"\n\n#: /public/admin/admin.js\nmsgid \"Logins\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"All Time Pixels\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/user.js\nmsgid \"Rename Requested\"\nmsgstr \"Промяната е изпратена за одобрение\"\n\n#: /public/admin/admin.js\nmsgid \"Discord Name\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/user.js\nmsgid \"Banned\"\nmsgstr \"Наказан\"\n\n#: /public/admin/admin.js\nmsgid \"Chatbanned\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Ban Reason\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Ban Expiracy\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Chatban Reason\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"(canvas ban)\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"when canvas ban ends\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Chatban Expires\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Ban (24h)\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Permaban\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Shadowban\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Custom ban length: \"\nmsgstr \"\"\n\n#. Admin check. Example: type = 'username', arg = 'pxlsuser94'\n#: /public/admin/admin.js\nmsgid \"${type} ${arg} not found.\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Unban Reason:\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Unbanning ${username}\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/chat.js /public/include/lookup.js\n#: /public/include/user.js\nmsgid \"Cancel\"\nmsgstr \"Отказ\"\n\n#. Moderator panel label\n#: /public/admin/admin.js\nmsgid \"MOD\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Ignore cooldown\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Place any color\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Ignore placemap\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Ban user (24h)\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Unban user\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Check user\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"profile\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"User Agent\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Send Alert\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Mod Actions\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"More...\"\nmsgstr \"\"\n\n#. Snapshot save name\n#: /public/include/board.js\nmsgid \"pxls canvas\"\nmsgstr \"\"\n\n#. template link action\n#: /public/include/chat.js\nmsgid \"Ask\"\nmsgstr \"Попитай\"\n\n#: /public/include/chat.js\nmsgid \"Open in a new tab\"\nmsgstr \"Отвори в друг раздел\"\n\n#: /public/include/chat.js\nmsgid \"Open in current tab (replacing template)\"\nmsgstr \"Отвори в сегашния раздел, заменяйки сегашния шаблон\"\n\n#: /public/include/chat.js\nmsgid \"Jump to coordinates without replacing template\"\nmsgstr \"Посети координатите без смяна на шаблона\"\n\n#: /public/include/chat.js\nmsgid \"Please upload your template image to a third-party image host.\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"You must have at least \"\nmsgstr \"Трябва да имате поне \"\n\n#: /public/include/chat.js\nmsgid \" pixels to send links.\"\nmsgstr \" пиксела, за да изпращате линкове.\"\n\n#: /public/include/chat.js\nmsgid \"You must be logged in to chat.\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"No Results\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Reply\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"none provided\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Purged by ${purge.initiator} with reason: ${reason}\"\nmsgstr \"Изчистено от ${purge.initiator} с причина: ${reason}\"\n\n#: /public/include/chat.js\nmsgid \"External Link\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"This link is taking you to the following website:\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"The operators of this website have no responsibility or control over the contents hosted at {0}. Are you sure you want to go there?\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Note: You can disable this popup in settings.\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Visit Site\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"template:\"\nmsgstr \"шаблон:\"\n\n#: /public/include/chat.js\nmsgid \"Open Failed\"\nmsgstr \"Отварянето се провали\"\n\n#: /public/include/chat.js\nmsgid \"Failed to automatically open in a new tab\"\nmsgstr \"Опитът за отваряне в нов раздел се провали\"\n\n#: /public/include/chat.js\nmsgid \"Click here to open in a new tab instead\"\nmsgstr \"Цъкнете тук, за да отворите в друг раздел\"\n\n#: /public/include/chat.js\nmsgid \"Open Template\"\nmsgstr \"Отвори шаблон\"\n\n#: /public/include/chat.js\nmsgid \"This link will overwrite your current template. What would you like to do?\"\nmsgstr \"Този линк ще премахне сегашния ви шаблон. Какво желаете да направите?\"\n\n#: /public/include/chat.js\nmsgid \"Note: You can set a default action in the settings menu which bypasses this popup completely.\"\nmsgstr \"Нота: Можете да зададете настройки, които да премахнат това съобщение в настройките.\"\n\n#: /public/include/chat.js\nmsgid \"OK\"\nmsgstr \"\"\n\n#: /public/include/chat.js /public/include/lookup.js\nmsgid \"Report\"\nmsgstr \"Докладвай\"\n\n#: /public/include/chat.js\nmsgid \"Mention\"\nmsgstr \"Спомени\"\n\n#: /public/include/chat.js\nmsgid \"Ignore\"\nmsgstr \"Игнорирай\"\n\n#: /public/include/chat.js\nmsgid \"Chat (un)ban\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Purge User\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Mod Lookup\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Chat Lookup\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Enter a reason for your report\"\nmsgstr \"Въведете причина за Вашия доклад (на английски)\"\n\n#: /public/include/chat.js\nmsgid \"You are reporting a chat message from ${reportTarget} with the content:\"\nmsgstr \"\"\n\n#: /public/include/chat.js /public/include/lookup.js\nmsgid \"Sent report!\"\nmsgstr \"\"\n\n#: /public/include/chat.js /public/include/lookup.js\nmsgid \"Error sending report.\"\nmsgstr \"Грешка при изпращането на докладване.\"\n\n#: /public/include/chat.js\nmsgid \"Report User\"\nmsgstr \"Дакладвай за потребителя\"\n\n#: /public/include/chat.js\nmsgid \"User ignored. You can unignore from chat settings.\"\nmsgstr \"Потребителят игнориран. Можете да промените решението си в настройките.\"\n\n#: /public/include/chat.js\nmsgid \"Failed to ignore user. Either they\\\\'re already ignored, or an error occurred. If the problem persists, contact a developer.\"\nmsgstr \"Грешка при игнорирането на потребителя. Ако този проблем се повтаря, контактирайте администраторите.\"\n\n#: /public/include/chat.js\nmsgid \"Permanent\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Temporary\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Rule 3: Spam\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Rule 1: Chat civility\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Rule 2: Hate Speech\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Rule 5: NSFW\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Custom\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Banning:\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Message:\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Ban Length\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Reason\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Purge Messages\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Purging all messages is disabled during snip mode\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Silent (no purge message)\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Custom reason\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Additional information:\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Chatban initiated\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Error occurred while chatbanning\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Chatban\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Failed to delete\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"ID: \"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"User: \"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Message: \"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Reason: \"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Delete Message\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Purge\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Selected Message\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Purge Reason\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"User purged\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Error sending purge.\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Toggle Rename Request\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Select one of the options below to set the current rename request state.\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Rename request updated\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"An unknown error occurred. Please contact a developer\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"New Name: \"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Enter the new name for the user below. Please note that if you\\\\'re trying to change the caps, you\\\\'ll have to rename to something else first.\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"User renamed\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Force Rename\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"You cannot use chat while canvas banned.\"\nmsgstr \"Не можете да използвате чата, докато имате наказание за платното.\"\n\n#: /public/include/lookup.js\nmsgid \"Sending...\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"additional information:\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"Report Pixel\"\nmsgstr \"Докладвай пиксел\"\n\n#: /public/include/lookup.js\nmsgid \"This pixel is background (was not placed by a user).\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"Hide sensitive information\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"Move Template Here\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"An error occurred, either you aren't logged in or you may be attempting to look up users too fast. Please try again in 60 seconds\"\nmsgstr \"Случи се грешка, или не сте свързани, или се опитвате да получите информация твърде бързо. Опитайте отново след 60 сек.\"\n\n#: /public/include/lookup.js\nmsgid \"Coords\"\nmsgstr \"Координати\"\n\n#: /public/include/lookup.js\nmsgid \"View Profile\"\nmsgstr \"Виж профил\"\n\n#: /public/include/lookup.js\nmsgid \"Origin\"\nmsgstr \"Произход\"\n\n#: /public/include/lookup.js\nmsgid \"Part of a nuke\"\nmsgstr \"Част от масово изтриване\"\n\n#: /public/include/lookup.js\nmsgid \"Placed by a staff member using placement overrides\"\nmsgstr \"Поставен от член на екипа, използвал обособени функции\"\n\n#: /public/include/lookup.js\nmsgid \"Time\"\nmsgstr \"Време\"\n\n#: /public/include/lookup.js\nmsgid \"just now\"\nmsgstr \"току-що\"\n\n#: /public/include/lookup.js\nmsgid \"${hoursStr}:${minuteStr}:${secsStr} ago\"\nmsgstr \"$преди {hoursStr}:${minuteStr}:${secsStr}\"\n\n#: /public/include/lookup.js\nmsgid \"Discord\"\nmsgstr \"Дискорд\"\n\n#: /public/include/notifications.js\nmsgid \"Posted by ${notification.who}\"\nmsgstr \"Изпратено от ${notification.who}\"\n\n#: /public/include/notifications.js\nmsgid \"Expires ${expiry}\"\nmsgstr \"Свършва да действа на ${expiry}\"\n\n#: /public/include/template.js\nmsgid \"There was an error getting the image\"\nmsgstr \"Настъпи проблем при получаване на изображението\"\n\n#: /public/include/timer.js\nmsgid \"Your next pixel will be available in ${delay} seconds!\"\nmsgstr \"Следващият Ви пиксел ще е наличен след ${delay} секунди.\"\n\n#: /public/include/timer.js\nmsgid \"Your next pixel has been available for ${alertDelay} seconds!\"\nmsgstr \"Следващият Ви пиксел е наличен от ${alertDelay} секунди.\"\n\n#: /public/include/timer.js\nmsgid \"Your next pixel is available!\"\nmsgstr \"Следващият Ви пиксел е наличен.\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Dark\"\nmsgstr \"Тъмна\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Darker\"\nmsgstr \"По-тъмна\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Blue\"\nmsgstr \"Синя\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Purple\"\nmsgstr \"Лилава\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Green\"\nmsgstr \"Зелена\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Matte\"\nmsgstr \"Матирана\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Terminal\"\nmsgstr \"Терминал\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Red\"\nmsgstr \"Червена\"\n\n#: /public/include/uiHelper.js\nmsgid \"A new ${type} report has been received.\"\nmsgstr \"\"\n\n#: /public/include/uiHelper.js\nmsgid \"Cannot fetch local files. Use the file selector in template settings.\"\nmsgstr \"\"\n\n#: /public/include/uiHelper.js\nmsgid \"Redirect Warning\"\nmsgstr \"\"\n\n#: /public/include/uiHelper.js\nmsgid \"Are you sure you want to redirect to the following URL?\"\nmsgstr \"\"\n\n#: /public/include/uiHelper.js\nmsgid \"Drag and dropped file must be a valid image.\"\nmsgstr \"\"\n\n#: /public/include/uiHelper.js\nmsgid \"Discord name updated successfully\"\nmsgstr \"Вашият дискорд таг бе редактиран успешно\"\n\n#: /public/include/uiHelper.js\nmsgid \"Couldn\\\\'t change discord name: \"\nmsgstr \"Не можахме да редактираме името Ви:\"\n\n#: /public/include/user.js\nmsgid \"By logging in or registering, you agree to the <a href=\\\"{0}\\\" target=\\\"_blank\\\">terms of use</a> and <a href=\\\"{1}\\\" target=\\\"_blank\\\">privacy policy</a>.\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"Sign in with {0}\"\nmsgstr \"Влезте с {0}\"\n\n#: /public/include/user.js\nmsgid \"New Accounts Disabled\"\nmsgstr \"Новите профили не са използваеми\"\n\n#: /public/include/user.js\nmsgid \"online\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"Sign Out\"\nmsgstr \"Изход\"\n\n#: /public/include/user.js\nmsgid \"Are you sure you want to sign out?\"\nmsgstr \"Сигурни ли сте, че искате да излезете?\"\n\n#: /public/include/user.js\nmsgid \"You are permanently banned.\"\nmsgstr \"Вие сте наказани за неопределен срок.\"\n\n#: /public/include/user.js\nmsgid \"You are temporarily banned and will not be allowed to place until ${timestamp}\"\nmsgstr \"Вие сте наказани до ${timestamp} и дотогава нямате право да поставяте пиксели.\"\n\n#: /public/include/user.js\nmsgid \"You can contact us using one of the links in the info menu.\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"If you think this was an error, please contact us using one of the links in the info tab.\"\nmsgstr \"Ако мислите, че това е грешка, контактувайте с нас.\"\n\n#: /public/include/user.js\nmsgid \"Ban reason:\"\nmsgstr \"Причина за наказанието:\"\n\n#: /public/include/user.js\nmsgid \"An unknown error occurred. Please contact staff on discord\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"Staff have required you to change your username, this usually means your name breaks one of our rules.\"\nmsgstr \"Екипът ни е решил, че името Ви се нуждае от промяна.\"\n\n#: /public/include/user.js\nmsgid \"If you disagree, please contact us on Discord (link in the info panel).\"\nmsgstr \"Ако сте несъгласни, контактувайте с нас.\"\n\n#: /public/include/user.js\nmsgid \"New Username:\"\nmsgstr \"Ново име:\"\n\n#: /public/include/user.js\nmsgid \"Not now\"\nmsgstr \"Не сега\"\n\n#: /public/include/user.js\nmsgid \"Change\"\nmsgstr \"Промени\"\n\n#: /public/include/user.js\nmsgid \"You must change your username.\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"Click here to continue.\"\nmsgstr \"\"\n\n#: /public/pxls.js\nmsgid \"Alert\"\nmsgstr \"Внимание\"\n\n#~ msgid \"Subreddit\"\n#~ msgstr \"Редит\"\n\n#~ msgid \"GitHub\"\n#~ msgstr \"ГитХъб\"\n";

function poToMessages(source) {
  const messages = {};
  let msgid = null;
  let msgstr = null;
  let current = null;
  const flush = () => {
    if (msgid && msgstr) {
      messages[msgid] = msgstr;
    }
    msgid = msgstr = null;
    current = null;
  };
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith("msgid ")) {
      flush();
      current = "msgid";
      msgid = unquote(line.slice(6));
    } else if (line.startsWith("msgstr ")) {
      current = "msgstr";
      msgstr = unquote(line.slice(7));
    } else if (line.startsWith('"') && current) {
      if (current === "msgid") {
        msgid = (msgid != null ? msgid : "") + unquote(line);
      } else {
        msgstr = (msgstr != null ? msgstr : "") + unquote(line);
      }
    } else if (line === "" || line.startsWith("#")) {
      if (line === "") flush();
    }
  }
  flush();
  return messages;
}
function unquote(value) {
  return value.trim().slice(1, -1).replace(/\\(.)/g, (_, char) => {
    switch (char) {
      case "n":
        return "\n";
      case "t":
        return "	";
      default:
        return char;
    }
  });
}

const locale_bg_46ts_ec5c6ddd = () => poToMessages(source$7);

const source$6 = "msgid \"\"\nmsgstr \"\"\n\"Project-Id-Version: Pxls\\n\"\n\"POT-Creation-Date: 2024-09-07T20:41:44.977Z\\n\"\n\"PO-Revision-Date: 2025-06-17T01:05:37.440Z\\n\"\n\"Last-Translator: volcanofr <volcano0france@gmail.com>\\n\"\n\"Language-Team: French\\n\"\n\"Language: fr\\n\"\n\"Content-Type: text/plain; charset=UTF-8\\n\"\n\"Content-Transfer-Encoding: 8bit\\n\"\n\"X-Generator: Custom by volcanofr 1.0\\n\"\n\n#: /views/error.handlebars\n#: /views/error.handlebars\n#: /views/error.handlebars\n#: /views/profile.handlebars\n#: /public/include/user.js\nmsgid \"My Profile\"\nmsgstr \"Mon profil\"\n\n#: /views/error.handlebars\n#: /views/profile.handlebars\nmsgid \"My Factions\"\nmsgstr \"Mes factions\"\n\n#. HTTP status code name\n#: /views/error.handlebars\nmsgid \"Not Found\"\nmsgstr \"Non trouvé\"\n\n#: /views/error.handlebars\nmsgid \"The content you requested could not be found at this URL. If you believe this is an error, please contact a developer.\"\nmsgstr \"Le contenu que vous avez demandé n'a pas pu être trouvé à cette URL. Si vous pensez qu'il s'agit d'une erreur, merci de contacter un développeur.\"\n\n#. links to the homepage (the app itself)\n#: /views/error.handlebars\n#: /views/error.handlebars\n#: /views/error.handlebars\nmsgid \"Back to Pxls\"\nmsgstr \"Retourner sur Pxls\"\n\n#. HTTP status code name\n#: /views/error.handlebars\nmsgid \"Not Authenticated\"\nmsgstr \"Non authentifié\"\n\n#: /views/error.handlebars\nmsgid \"You must be logged in to access this data. Please go back to pxls and go through the authentication process.\"\nmsgstr \"Vous devez être connecté pour accéder à ces données. Veuillez retourner sur pxls et vous authentifier.\"\n\n#. HTTP status code name\n#: /views/error.handlebars\nmsgid \"Not Allowed\"\nmsgstr \"Non autorisé\"\n\n#: /views/error.handlebars\nmsgid \"The action you attempted to perform is not allowed or resulted in an error. Please ensure you have access to the endpoint and try again later.\"\nmsgstr \"L'action que vous avez tenté d'effectuer n'est pas autorisée ou a donné lieu à une erreur. Veuillez vous assurer que vous avez accès au point d'accès et réessayez plus tard.\"\n\n#: /views/index.handlebars\nmsgid \"Place pixels with people to create art\"\nmsgstr \"Place des pixels avec d'autres pour créer des œuvres d'art\"\n\n#: /views/index.handlebars\nmsgid \"Lost connection to server, reconnecting...\"\nmsgstr \"Connexion au serveur perdue, reconnexion...\"\n\n#: /views/index.handlebars\nmsgid \"Loading Heatmap (press <kbd>H</kbd> to cancel)\"\nmsgstr \"Chargement de la Heatmap  (appuyez sur <kbd>H</kbd> pour annuler)\"\n\n#: /views/index.handlebars\nmsgid \"Loading Virginmap (press <kbd>X</kbd> to cancel)\"\nmsgstr \"Chargement de la Virginmap (appuyez sur <kbd>H</kbd> pour annuler)\"\n\n#: /views/index.handlebars\nmsgid \"Logout\"\nmsgstr \"Se déconnecter\"\n\n#: /views/index.handlebars\nmsgid \"Canvas:\"\nmsgstr \"Canvas :\"\n\n#: /views/index.handlebars\n#: /views/index.handlebars\n#: /views/index.handlebars\n#: /views/index.handlebars\nmsgid \"N/A\"\nmsgstr \"N/A\"\n\n#: /views/index.handlebars\nmsgid \"All Time:\"\nmsgstr \"Total :\"\n\n#: /views/index.handlebars\nmsgid \"Loading online user count&hellip;\"\nmsgstr \"Chargement du nombre d'utilisateurs en ligne&hellip;\"\n\n#: /views/index.handlebars\n#: /public/admin/admin.js\n#: /public/include/lookup.js\nmsgid \"Pixels\"\nmsgstr \"Pixels\"\n\n#: /views/index.handlebars\nmsgid \"Undo\"\nmsgstr \"Annuler\"\n\n#: /views/index.handlebars\nmsgid \"You are not signed in.\"\nmsgstr \"Tu n'es pas connecté.\"\n\n#: /views/index.handlebars\n#: /public/include/user.js\nmsgid \"Sign in with...\"\nmsgstr \"Se connecter avec...\"\n\n#: /views/index.handlebars\nmsgid \"Loading...\"\nmsgstr \"Chargement...\"\n\n#: /views/index.handlebars\n#: /views/index.handlebars\nmsgid \"Sign up\"\nmsgstr \"S'inscripte\"\n\n#: /views/index.handlebars\nmsgid \"Pick a username\"\nmsgstr \"Choisis ton pseudo\"\n\n#: /views/index.handlebars\nmsgid \"Username:\"\nmsgstr \"Pseudo :\"\n\n#: /views/index.handlebars\nmsgid \"Discord Tag (Optional):\"\nmsgstr \"Nom d'utilisateur Discord (optionnel) :\"\n\n#: /views/index.handlebars\nmsgid \"Drag and drop template image\"\nmsgstr \"Glisser-déposer l'image modèle\"\n\n#: /views/index.handlebars\nmsgid \"Exit\"\nmsgstr \"Sortir\"\n\n#: /views/index.handlebars\n#: /views/profile.handlebars\nmsgid \"Info\"\nmsgstr \"Info\"\n\n#: /views/index.handlebars\n#: /views/index.handlebars\n#: /views/index.handlebars\n#: /views/index.handlebars\nmsgid \"Close Panel\"\nmsgstr \"Fermer le menu\"\n\n#: /views/index.handlebars\n#: /public/include/chat.js\nmsgid \"Chat\"\nmsgstr \"Tchat\"\n\n#: /views/index.handlebars\nmsgid \"Pings\"\nmsgstr \"Mentions\"\n\n#: /views/index.handlebars\n#: /views/index.handlebars\nmsgid \"Settings\"\nmsgstr \"Paramètres\"\n\n#: /views/index.handlebars\nmsgid \"Jump To Bottom\"\nmsgstr \"Descendre en bas de page\"\n\n#: /views/index.handlebars\nmsgid \"Replying to\"\nmsgstr \"Répondre à\"\n\n#: /views/index.handlebars\n#: /public/include/chat.js\nmsgid \"On\"\nmsgstr \"Activé\"\n\n#: /views/index.handlebars\nmsgid \"Emoji\"\nmsgstr \"Émoji\"\n\n#: /views/index.handlebars\nmsgid \"Search\"\nmsgstr \"Recherecher\"\n\n#: /views/index.handlebars\nmsgid \"keybinds;keys;keyboard;hotkeys\"\nmsgstr \"keybinds;keys;keyboard;hotkeys;raccourcis;touches;clavier\"\n\n#: /views/index.handlebars\nmsgid \"Keybinds\"\nmsgstr \"Raccourcis clavier\"\n\n#: /views/index.handlebars\nmsgid \"general\"\nmsgstr \"general;général\"\n\n#: /views/index.handlebars\n#: /views/index.handlebars\nmsgid \"General\"\nmsgstr \"Général\"\n\n#: /views/index.handlebars\nmsgid \"move;moving;panning;drag\"\nmsgstr \"move;moving;panning;drag;déplacer;déplacement\"\n\n#: /views/index.handlebars\nmsgid \"Mouse/arrows/wasd to pan\"\nmsgstr \"Souris/flèches/WASD pour se déplacer\"\n\n#: /views/index.handlebars\nmsgid \"mousewheel;zooming\"\nmsgstr \"mousewheel;zooming;molette;souris;zoom\"\n\n#: /views/index.handlebars\nmsgid \"Scroll/pinch to zoom\"\nmsgstr \"Scroller/pincer pour zoomer\"\n\n#: /views/index.handlebars\nmsgid \"scroll;zooming\"\nmsgstr \"scroll;zooming;zoom\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>+</kbd>/<kbd>-</kbd> or <kbd>Q</kbd>/<kbd>E</kbd> to zoom\"\nmsgstr \"<kbd>+</kbd>/<kbd>-</kbd> ou <kbd>Q</kbd>/<kbd>E</kbd> pour zoomer\"\n\n#: /views/index.handlebars\nmsgid \"lookups\"\nmsgstr \"lookups;infos\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>Shift</kbd> + Click/Hold touch to lookup pixel\"\nmsgstr \"<kbd>Shift</kbd> + clic/maintient de la touche pour voir les infos du pixel\"\n\n#: /views/index.handlebars\n#: /views/index.handlebars\nmsgid \"overlays;alignment;grid hidden;grid shown;hide grid;show grid\"\nmsgstr \"overlays;alignment;grid hidden;grid shown;hide grid;show grid;grille\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>G</kbd> to toggle grid\"\nmsgstr \"<kbd>G</kbd> pour afficher la grille\"\n\n#: /views/index.handlebars\nmsgid \"close;information shown;information hidden;info shown;info hidden;hide information;show information\"\nmsgstr \"close;information shown;information hidden;info shown;info hidden;hide information;show information;fermer;information;info\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>I</kbd> to open info\"\nmsgstr \"<kbd>I</kbd> pour ouvrir le menu informatif\"\n\n#: /views/index.handlebars\nmsgid \"close;settings hidden;settings shown;hide settings;show settings\"\nmsgstr \"close;settings hidden;settings shown;hide settings;show settings;fermer;paramètres\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>T</kbd> to open settings\"\nmsgstr \"<kbd>T</kbd> pour ouvrir les paramètres\"\n\n#: /views/index.handlebars\nmsgid \"close;chat hidden;chat shown;hide chat;show chat\"\nmsgstr \"close;chat hidden;chat shown;hide chat;show chat;fermer;tchat\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>B</kbd> to open chat\"\nmsgstr \"<kbd>B</kbd> pour ouvrir le tchat\"\n\n#: /views/index.handlebars\nmsgid \"canvas locked;move;moving;zoom;zooming\"\nmsgstr \"canvas locked;move;moving;zoom;zooming;verrouiller;déplacer;zoomer\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>L</kbd> to toggle locking panning of the canvas\"\nmsgstr \"<kbd>L</kbd> pour verrouiller les déplacements du canvas\"\n\n#: /views/index.handlebars\nmsgid \"take screenshot;image;download;picture;canvas\"\nmsgstr \"take screenshot;image;download;picture;canvas;capture d'écran;image;téléchargement\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>P</kbd> to take a snapshot\"\nmsgstr \"<kbd>P</kbd> pour prendre une capture d'écran\"\n\n#: /views/index.handlebars\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels placed pixels;heatmap hidden;heatmap shown;hide heatmap;show heatmap\"\nmsgstr \"overlays;user activity;pixels placed pixels;heatmap hidden;heatmap shown;hide heatmap;show heatmap;activité\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>H</kbd> to toggle heatmap\"\nmsgstr \"<kbd>H</kbd> pour afficher la Heatmap\"\n\n#: /views/index.handlebars\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels unplaced pixels;virginmap hidden;virginmap shown;hide virginmap;show virginmap\"\nmsgstr \"overlays;user activity;pixels unplaced pixels;virginmap hidden;virginmap shown;hide virginmap;show virginmap;activité\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>X</kbd> to toggle virginmap\"\nmsgstr \"<kbd>X</kbd> pour afficher la Virginmap\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels placed pixels;wipe;clean;\"\nmsgstr \"overlays;user activity;pixels placed pixels;wipe;clean;activité;placé;nettoyé;\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>O</kbd> to clear heatmap\"\nmsgstr \"<kbd>O</kbd> pour retirer la Heatmap\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels unplaced pixels;wipe;clean;\"\nmsgstr \"overlays;user activity;pixels unplaced pixels;wipe;clean;activité;retiré;nettoyé;\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>U</kbd> to clear virginmap\"\nmsgstr \"<kbd>U</kbd> pour retirer la Virginmap\"\n\n#: /views/index.handlebars\nmsgid \"next color;previous color\"\nmsgstr \"next color;previous color;couleur;suivante;précédante\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>J</kbd>/<kbd>K</kbd> to cycle through palette colors\"\nmsgstr \"<kbd>J</kbd>/<kbd>K</kbd> pour se déplacer dans la palette des couleurs\"\n\n#: /views/index.handlebars\nmsgid \"current coordinates;coords\"\nmsgstr \"current coordinates;coords;coordonnées\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>C</kbd> to copy link of moused-over coordinates\"\nmsgstr \"<kbd>C</kbd> pour copier le lien des coordonnées de la souris\"\n\n#: /views/index.handlebars\nmsgid \"cancel selection\"\nmsgstr \"cancel selection;annuler;sélection\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>ESC</kbd> to deselect current pixel\"\nmsgstr \"<kbd>ESC</kbd> pour désélectionner le pixel\"\n\n#: /views/index.handlebars\nmsgid \"recenter;jump;center on template;guides;focus\"\nmsgstr \"recenter;jump;center on template;guides;focus;recentrer;aller à;centrer;recentrer\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>R</kbd> to center the board on the current template\"\nmsgstr \"<kbd>R</kbd> pour centrer le canvas sur le modèle\"\n\n#: /views/index.handlebars\nmsgid \"templates;guides\"\nmsgstr \"templates;guides;modèles\"\n\n#: /views/index.handlebars\n#: /views/index.handlebars\nmsgid \"Template\"\nmsgstr \"Modèle\"\n\n#: /views/index.handlebars\n#: /views/index.handlebars\nmsgid \"transparency\"\nmsgstr \"transparency;transparence\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>Page Up</kbd> to increase opacity\"\nmsgstr \"<kbd>Page Up</kbd> pour augmenter l'opacité\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>Page Down</kbd> to decrease opacity\"\nmsgstr \"<kbd>Page Up</kbd> pour diminuer l'opacité\"\n\n#: /views/index.handlebars\nmsgid \"hidden;shown;hide;show\"\nmsgstr \"hidden;shown;hide;show;caché;affiché;cacher;afficher\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>V</kbd> to toggle visibility\"\nmsgstr \"<kbd>V</kbd> pour afficher le modèle\"\n\n#: /views/index.handlebars\nmsgid \"Note: These values are based on QWERTY keyboards. For other layouts, use the keys corresponding to the same position on a QWERTY keyboard.\"\nmsgstr \"Note : Ces veleurs sont basées sur un clavier QWERTY. Pour d'autres dispositions, utilisez les touches correspondantes à la même position qu'un clavier QWERTY.\"\n\n#: /views/index.handlebars\nmsgid \"templates;overlays;guides\"\nmsgstr \"templates;overlays;guides;modèles\"\n\n#: /views/index.handlebars\nmsgid \"templates;overlays;image;pixel art\"\nmsgstr \"templates;overlays;image;pixel art;modèles\"\n\n#: /views/index.handlebars\nmsgid \"template enabled;template disabled;show template;hide template;template shown;template hidden\"\nmsgstr \"template enabled;template disabled;show template;hide template;template shown;template hidden;modèle\"\n\n#: /views/index.handlebars\nmsgid \"Use template\"\nmsgstr \"Utiliser le modèle\"\n\n#: /views/index.handlebars\nmsgid \"Hold down <kbd>Ctrl</kbd> (or <kbd>Option</kbd> on mac) to drag the template around\"\nmsgstr \"Maintenez <kbd>Ctrl</kbd> (ou <kbd>Option</kbd> sur Mac) pour faire glisser la position du modèle\"\n\n#: /views/index.handlebars\nmsgid \"template title;template name;tab name;tab title;title=\"\nmsgstr \"template title;template name;tab name;tab title;title=;modèle;titre;nom\"\n\n#: /views/index.handlebars\nmsgid \"Title:\"\nmsgstr \"Titre :\"\n\n#: /views/index.handlebars\nmsgid \"template location source;template source URL;template URL;template=\"\nmsgstr \"template location source;template source URL;template URL;template=;modèle;source;lien\"\n\n#: /views/index.handlebars\nmsgid \"URL:\"\nmsgstr \"URL :\"\n\n#: /views/index.handlebars\nmsgid \"template position;template x;template y;template location; template vertical; template horizontal;ox=;oy=\"\nmsgstr \"template position;template x;template y;template location; template vertical; template horizontal;ox=;oy=;modèle;position;localisation;verical;horizontal\"\n\n#: /views/index.handlebars\nmsgid \"Horizontal position:\"\nmsgstr \"Position horizontale :\"\n\n#: /views/index.handlebars\nmsgid \"Vertical position:\"\nmsgstr \"Position verticale :\"\n\n#: /views/index.handlebars\nmsgid \"template width;tw=\"\nmsgstr \"template width;tw=;modèle;largeur\"\n\n#: /views/index.handlebars\nmsgid \"Width:\"\nmsgstr \"Largeur :\"\n\n#: /views/index.handlebars\n#: /views/index.handlebars\nmsgid \"Reset\"\nmsgstr \"Réinitialiser\"\n\n#: /views/index.handlebars\nmsgid \"template style;custom template\"\nmsgstr \"template style;custom template;modèle;style;personnalisé\"\n\n#: /views/index.handlebars\nmsgid \"Style:\"\nmsgstr \"Style :\"\n\n#: /views/index.handlebars\nmsgid \"Use Source Style\"\nmsgstr \"Utiliser le style source\"\n\n#: /views/index.handlebars\nmsgid \"1-to-1\"\nmsgstr \"1 pour 1\"\n\n#: /views/index.handlebars\nmsgid \"1-to-1 (keep incorrect colors)\"\nmsgstr \"1 pour 1 (garder les couleurs inconnues)\"\n\n#: /views/index.handlebars\nmsgid \"Dotted (Small, 1:2)\"\nmsgstr \"Pointillé (petit 1:2)\"\n\n#: /views/index.handlebars\nmsgid \"Dotted (Big, 2:2)\"\nmsgstr \"Pointillé (grand 2:2)\"\n\n#: /views/index.handlebars\nmsgid \"Symbols\"\nmsgstr \"Symboles\"\n\n#: /views/index.handlebars\nmsgid \"Numbers\"\nmsgstr \"Nombres\"\n\n#: /views/index.handlebars\nmsgid \"Custom…\"\nmsgstr \"Personnaliser…\"\n\n#: /views/index.handlebars\nmsgid \"template style source;template style URL;custom style URL;custom template\"\nmsgstr \"template style source;template style URL;custom style URL;custom template;modèle;style;personnalisé;source;lien\"\n\n#: /views/index.handlebars\nmsgid \"Custom style URL:\"\nmsgstr \"URL du style personnalisé :\"\n\n#: /views/index.handlebars\nmsgid \"template conversion;template palette conversion;convert to palette\"\nmsgstr \"template conversion;template palette conversion;convert to palette;modèle;conversion;palette;convertir\"\n\n#: /views/index.handlebars\nmsgid \"Color Conversion Mode:\"\nmsgstr \"Mode de conversion des couleurs :\"\n\n#: /views/index.handlebars\nmsgid \"Unconverted\"\nmsgstr \"Non convertit\"\n\n#: /views/index.handlebars\nmsgid \"Nearest Custom\"\nmsgstr \"Connue la plus proche\"\n\n#: /views/index.handlebars\nmsgid \"template transparency;template opacity;oo=\"\nmsgstr \"template transparency;template opacity;oo=;modèle;transparence;opacité\"\n\n#: /views/index.handlebars\nmsgid \"Opacity:\"\nmsgstr \"Opacité :\"\n\n#: /views/index.handlebars\nmsgid \"ui;interface\"\nmsgstr \"ui;interface\"\n\n#: /views/index.handlebars\nmsgid \"UI Settings\"\nmsgstr \"Paramètres UI\"\n\n#: /views/index.handlebars\nmsgid \"language override;text\"\nmsgstr \"language override;text;langue;texte\"\n\n#: /views/index.handlebars\nmsgid \"Language override:\"\nmsgstr \"Language override:\"\n\n#: /views/index.handlebars\nmsgid \"Use Browser Language\"\nmsgstr \"Use Browser Language\"\n\n#: /views/index.handlebars\nmsgid \"English\"\nmsgstr \"English\"\n\n#: /views/index.handlebars\nmsgid \"Bulgarian\"\nmsgstr \"Bulgarian\"\n\n#: /views/index.handlebars\nmsgid \"French\"\nmsgstr \"French (actuel)\"\n\n#: /views/index.handlebars\nmsgid \"German\"\nmsgstr \"German\"\n\n#: /views/index.handlebars\nmsgid \"Russian\"\nmsgstr \"Russian\"\n\n#: /views/index.handlebars\nmsgid \"Swedish\"\nmsgstr \"Swedish\"\n\n#: /views/index.handlebars\nmsgid \"Finnish\"\nmsgstr \"Finnish\"\n\n#: /views/index.handlebars\nmsgid \"Toki Pona\"\nmsgstr \"Toki Pona\"\n\n#: /views/index.handlebars\nmsgid \"themes;look;stylesheets;visuals\"\nmsgstr \"themes;look;stylesheets;visuals;thèmes;style;visuels\"\n\n#: /views/index.handlebars\nmsgid \"Theme:\"\nmsgstr \"Thème :\"\n\n#: /views/index.handlebars\nmsgid \"Default\"\nmsgstr \"Par défaut\"\n\n#: /views/index.handlebars\nmsgid \"hide reticule;hide reticle;reticule shown reticle shown;reticule hidden;reticle hidden\"\nmsgstr \"hide reticule;hide reticle;reticule shown reticle shown;reticule hidden;reticle hidden;visé;réticule\"\n\n#: /views/index.handlebars\nmsgid \"Show reticule\"\nmsgstr \"Exposer le pixel visé\"\n\n#: /views/index.handlebars\nmsgid \"hide cursor;cursor shown;cursor hidden\"\nmsgstr \"hide cursor;cursor shown;cursor hidden;curseur\"\n\n#: /views/index.handlebars\nmsgid \"Show cursor\"\nmsgstr \"Voir le curseur\"\n\n#: /views/index.handlebars\nmsgid \"darkness filter\"\nmsgstr \"darkness filter;luminosité;filtre\"\n\n#: /views/index.handlebars\nmsgid \"Enable color brightness\"\nmsgstr \"Activer la luminosité des couleurs\"\n\n#: /views/index.handlebars\nmsgid \"Warning: Known to cause fuzziness in Chrome on some Mac/Linux installs\"\nmsgstr \"Attention : Peut générer du flou sur Chrome et quelques installations de Max/Linux\"\n\n#: /views/index.handlebars\nmsgid \"Color brightness:\"\nmsgstr \"Luminosité des couleurs :\"\n\n#: /views/index.handlebars\nmsgid \"keep current selected;keep curent color;place\"\nmsgstr \"keep current selected;keep curent color;place;garder;actuel;sélectionné;couleur\"\n\n#: /views/index.handlebars\nmsgid \"Deselect color after placing\"\nmsgstr \"Désélectionner la couleur après l'avoir placée\"\n\n#: /views/index.handlebars\nmsgid \"mousewheel;palette scrolling\"\nmsgstr \"mousewheel;palette scrolling;molette\"\n\n#: /views/index.handlebars\nmsgid \"Enable scrolling on the palette to switch colors\"\nmsgstr \"Scroller sur la palette pour changer de couleur\"\n\n#: /views/index.handlebars\nmsgid \"reverse scrolling;mousewheel;palette scrolling;enable scrolling on the palette to switch colors\"\nmsgstr \"reverse scrolling;mousewheel;palette scrolling;enable scrolling on the palette to switch colors;inverse;palette;changement;couleur\"\n\n#: /views/index.handlebars\nmsgid \"Invert scroll direction\"\nmsgstr \"Inverser la direction du scroll\"\n\n#: /views/index.handlebars\nmsgid \"indexed colors;palette indicies\"\nmsgstr \"indexed colors;palette indicies;couleurs;indexées;signes\"\n\n#: /views/index.handlebars\nmsgid \"Add numbers to palette entries\"\nmsgstr \"Ajouter des nombres aux couleurs de la palette\"\n\n#: /views/index.handlebars\nmsgid \"scrollbar;palette scrolling\"\nmsgstr \"scrollbar;palette scrolling;palette\"\n\n#: /views/index.handlebars\nmsgid \"Enable thin scrollbar\"\nmsgstr \"Scrollbar fine\"\n\n#: /views/index.handlebars\nmsgid \"scrollbar;palette scrolling;palette stack\"\nmsgstr \"scrollbar;palette scrolling;palette stack;palette;multiligne\"\n\n#: /views/index.handlebars\nmsgid \"Enable palette stacking\"\nmsgstr \"Palette multiligne\"\n\n#: /views/index.handlebars\nmsgid \"floating bubble location\"\nmsgstr \"floating bubble location;bulle;flottante;position;localisation\"\n\n#: /views/index.handlebars\nmsgid \"Bubble position:\"\nmsgstr \"Position de la bulle :\"\n\n#: /views/index.handlebars\nmsgid \"Top left\"\nmsgstr \"Haut à gauche\"\n\n#: /views/index.handlebars\nmsgid \"Top right\"\nmsgstr \"Haut à droite\"\n\n#: /views/index.handlebars\nmsgid \"Bottom left\"\nmsgstr \"Bas à gauche\"\n\n#: /views/index.handlebars\nmsgid \"Bottom right\"\nmsgstr \"Bas à droite\"\n\n#: /views/index.handlebars\nmsgid \"broken;offset workaround\"\nmsgstr \"broken;offset workaround;cassé;décalage;correction\"\n\n#: /views/index.handlebars\nmsgid \"Attempt to fix canvas displacement bug in Chrome 78+\"\nmsgstr \"Tentative de correction du bug de décalage sur le canvas pour Chrome 78+\"\n\n#: /views/index.handlebars\nmsgid \"chat;message;ping sound\"\nmsgstr \"chat;message;ping sound;tchat;mention;son\"\n\n#: /views/index.handlebars\nmsgid \"Chat Settings\"\nmsgstr \"Paramètres du tchat\"\n\n#: /views/index.handlebars\nmsgid \"username;color;colour\"\nmsgstr \"username;color;colour:pseudonyme;couleur\"\n\n#: /views/index.handlebars\nmsgid \"Username Color:\"\nmsgstr \"Couleur du nom :\"\n\n#: /views/index.handlebars\nmsgid \"chat message;chat ui\"\nmsgstr \"chat message;chat ui;message;tchat;interface\"\n\n#: /views/index.handlebars\nmsgid \"Interface\"\nmsgstr \"Interface\"\n\n#: /views/index.handlebars\nmsgid \"enable;disable\"\nmsgstr \"enable;disable;activer;désactiver\"\n\n#: /views/index.handlebars\nmsgid \"Enable chat\"\nmsgstr \"Activer le tchat\"\n\n#: /views/index.handlebars\nmsgid \"Page must be reloaded after changing\"\nmsgstr \"La page doit être rechargée après modification\"\n\n#: /views/index.handlebars\nmsgid \"chat size;chat font\"\nmsgstr \"chat size;chat font;tchat;taille;police d'écriture\"\n\n#: /views/index.handlebars\nmsgid \"Font Size:\"\nmsgstr \"Taille de police :\"\n\n#: /views/index.handlebars\nmsgid \"time;timestamps\"\nmsgstr \"time;timestamps;heure;horodatage\"\n\n#: /views/index.handlebars\nmsgid \"24 Hour Timestamps\"\nmsgstr \"Horodatage sous 24 heures\"\n\n#: /views/index.handlebars\nmsgid \"badges;pixel count;pixels placed\"\nmsgstr \"badges;pixel count;pixels placed;nombre;pixels;placés\"\n\n#: /views/index.handlebars\nmsgid \"Show pixel-placed badges\"\nmsgstr \"Badges du nombre de pixels posés\"\n\n#: /views/index.handlebars\nmsgid \"badges;factions\"\nmsgstr \"badges;factions\"\n\n#: /views/index.handlebars\nmsgid \"Show faction tags\"\nmsgstr \"Étiquettes de faction\"\n\n#: /views/index.handlebars\nmsgid \"template urls;template links;template name\"\nmsgstr \"template urls;template links;template name;modèle;lien;nom\"\n\n#: /views/index.handlebars\nmsgid \"Replace template titles with URLs in chat where applicable\"\nmsgstr \"Replacer les titres des modèles par leur URL dans le tchat quand applicable\"\n\n#: /views/index.handlebars\nmsgid \"chat orientation;chat position\"\nmsgstr \"chat orientation;chat position\"\n\n#: /views/index.handlebars\nmsgid \"Enable horizontal chat\"\nmsgstr \"Tchat horizontal\"\n\n#: /views/index.handlebars\nmsgid \"banner;animation\"\nmsgstr \"banner;animation;bannière\"\n\n#: /views/index.handlebars\nmsgid \"Enable the rotating banner under chat\"\nmsgstr \"Bannière rotative sous le tchat\"\n\n#: /views/index.handlebars\nmsgid \"max;messages;truncate\"\nmsgstr \"max;messages;truncate;tronquer\"\n\n#: /views/index.handlebars\nmsgid \"Maximum amount of chat messages:\"\nmsgstr \"Nombre maximum de messages tchat :\"\n\n#: /views/index.handlebars\nmsgid \"link;url;behaviour\"\nmsgstr \"link;url;behaviour;lien;comportement\"\n\n#: /views/index.handlebars\nmsgid \"Default internal link action click:\"\nmsgstr \"Action par défaut à l'ouverture d'un lien interne :\"\n\n#: /views/index.handlebars\nmsgid \"link;url;behaviour;external;bypass;skip\"\nmsgstr \"link;url;behaviour;external;bypass;skip;lien;externe;comportement;passer;ignorer\"\n\n#: /views/index.handlebars\nmsgid \"Skip external link popup\"\nmsgstr \"Ignorer la pop-up des liens externe\"\n\n#: /views/index.handlebars\nmsgid \"Note: Has no effect if external link popups are disabled by the server.\"\nmsgstr \"Note : n'a aucun effet si les pop-ups de lien externe sont désactivées par le serveur.\"\n\n#: /views/index.handlebars\nmsgid \"chat icon;chat notifications;chat ping\"\nmsgstr \"chat icon;chat notifications;chat ping;icône:tchat;notifications\"\n\n#: /views/index.handlebars\nmsgid \"Chat icon badge mode:\"\nmsgstr \"Mode d'icône de badge tchat :\"\n\n#: /views/index.handlebars\n#: /views/index.handlebars\nmsgid \"Show on unread ping\"\nmsgstr \"Voir lors d'une mention non lue\"\n\n#: /views/index.handlebars\n#: /views/index.handlebars\nmsgid \"Show on unread message\"\nmsgstr \"Voir lors d'un message non lu\"\n\n#: /views/index.handlebars\n#: /views/index.handlebars\nmsgid \"Never show\"\nmsgstr \"Ne jamais afficher\"\n\n#: /views/index.handlebars\nmsgid \"chat icon;chat notifications;chat message\"\nmsgstr \"chat icon;chat notifications;chat message;icône;tchat;message;notifications\"\n\n#: /views/index.handlebars\nmsgid \"Chat icon highlight mode:\"\nmsgstr \"Mode de mise en évidence d'icône du tchat :\"\n\n#: /views/index.handlebars\nmsgid \"ignored;ignores;unignore;blocked;blocking;unblock\"\nmsgstr \"ignored;ignores;unignore;blocked;blocking;unblock;ignoré;bloqueé;ignorer;bloquer;débloquer\"\n\n#: /views/index.handlebars\nmsgid \"Ignores\"\nmsgstr \"Ignorer\"\n\n#: /views/index.handlebars\nmsgid \"unignore;unblock\"\nmsgstr \"unignore;unblock;ingorer;débloquer\"\n\n#: /views/index.handlebars\nmsgid \"Unignore\"\nmsgstr \"Ne plus ignorer\"\n\n#: /views/index.handlebars\nmsgid \"overlays;virginmap;heatmap;grid\"\nmsgstr \"overlays;virginmap;heatmap;grid;modèles;grille\"\n\n#: /views/index.handlebars\nmsgid \"Overlay Settings\"\nmsgstr \"Paramètres de l'overlay\"\n\n#: /views/index.handlebars\nmsgid \"heatmap;heatmap opacity;clear heatmap\"\nmsgstr \"heatmap;heatmap opacity;clear heatmap;opacité;retirer\"\n\n#: /views/index.handlebars\nmsgid \"Heatmap\"\nmsgstr \"Heatmap\"\n\n#: /views/index.handlebars\nmsgid \"Turn on heatmap\"\nmsgstr \"Activer la Heatmap\"\n\n#: /views/index.handlebars\nmsgid \"(toggle with <kbd>H</kbd>)\"\nmsgstr \"(activer avec <kbd>H</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"overlays;activity;pixels placed pixels;wipe;clean\"\nmsgstr \"overlays;activity;pixels placed pixels;wipe;clean;modèles;activité;pixels;posés;nettoyer\"\n\n#: /views/index.handlebars\nmsgid \"Clear heatmap\"\nmsgstr \"Retirer la Heatmap\"\n\n#: /views/index.handlebars\nmsgid \"(hotkey: <kbd>O</kbd>)\"\nmsgstr \"(touche : <kbd>O</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels placed pixels;transparency\"\nmsgstr \"overlays;user activity;pixels placed pixels;transparency;modèles;activité;pixels;posés;transparence\"\n\n#: /views/index.handlebars\nmsgid \"Heatmap background opacity:\"\nmsgstr \"Opacité du fond de la Heatmap :\"\n\n#: /views/index.handlebars\nmsgid \"virginmap;virginmap opacity;clear virginmap\"\nmsgstr \"virginmap;virginmap opacity;clear virginmap;opacité;nettoyer\"\n\n#: /views/index.handlebars\nmsgid \"Virginmap\"\nmsgstr \"Virginmap\"\n\n#: /views/index.handlebars\nmsgid \"Turn on virginmap\"\nmsgstr \"Activer la Virginmap\"\n\n#: /views/index.handlebars\nmsgid \"(toggle with <kbd>X</kbd>)\"\nmsgstr \"(activer avec <kbd>X</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels unplaced pixels;transparency\"\nmsgstr \"overlays;user activity;pixels unplaced pixels;transparency;modèles;pixels;retirés;transparence\"\n\n#: /views/index.handlebars\nmsgid \"Virginmap background opacity:\"\nmsgstr \"Opacité du fond de la Virginmap :\"\n\n#: /views/index.handlebars\nmsgid \"overlays;activity;pixels unplaced pixels;wipe;clean\"\nmsgstr \"overlays;activity;pixels unplaced pixels;wipe;clean;modèles;activité;pixels;retirés;nettoyer\"\n\n#: /views/index.handlebars\nmsgid \"Clear virginmap\"\nmsgstr \"Retirer la Virginmap\"\n\n#: /views/index.handlebars\nmsgid \"(hotkey: <kbd>U</kbd>)\"\nmsgstr \"(touche : <kbd>U</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"Layer template underneath heatmap\"\nmsgstr \"Couche du modèle sous la Heatmap\"\n\n#: /views/index.handlebars\nmsgid \"grid;toggle grid\"\nmsgstr \"grid;toggle grid;grille;activer;désactiver\"\n\n#: /views/index.handlebars\nmsgid \"Grid\"\nmsgstr \"Grille\"\n\n#: /views/index.handlebars\nmsgid \"Turn on grid\"\nmsgstr \"Activer la grille\"\n\n#: /views/index.handlebars\nmsgid \"(toggle with <kbd>G</kbd>)\"\nmsgstr \"(activer avec <kbd>G</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"controls;zooming;panning;movement\"\nmsgstr \"controls;zooming;panning;movement;contrôles;zoom;mouvement\"\n\n#: /views/index.handlebars\nmsgid \"Control Settings\"\nmsgstr \"Paramètres des contrôles\"\n\n#: /views/index.handlebars\nmsgid \"zooming;scrolling;scale;scaling\"\nmsgstr \"zooming;scrolling;scale;scaling;zoom;taille;échelle\"\n\n#: /views/index.handlebars\nmsgid \"Zooming\"\nmsgstr \"Zoom\"\n\n#: /views/index.handlebars\nmsgid \"scrolling sensitivity;zooming sensitivity;mousewheel sensitivity\"\nmsgstr \"scrolling sensitivity;zooming sensitivity;mousewheel sensitivity;sensibilité;zoom;molette\"\n\n#: /views/index.handlebars\nmsgid \"Zoom sensitivity:\"\nmsgstr \"Sensibilité du zoom :\"\n\n#: /views/index.handlebars\nmsgid \"zooming limit;scrolling limit;mousewheel;zooming minimum;zooming maximum\"\nmsgstr \"zooming limit;scrolling limit;mousewheel;zooming minimum;zooming maximum;zoom;limite;molette;minimum;maximum\"\n\n#: /views/index.handlebars\nmsgid \"Minimum scale:\"\nmsgstr \"Taille minimale :\"\n\n#: /views/index.handlebars\nmsgid \"Maximum scale:\"\nmsgstr \"Taille maximale :\"\n\n#: /views/index.handlebars\nmsgid \"rounding;zooming;scrolling;mousewheel;integer;decimal\"\nmsgstr \"rounding;zooming;scrolling;mousewheel;integer;decimal;arrondir;zoom;molette;entier;décimal\"\n\n#: /views/index.handlebars\nmsgid \"Round zoom values to nearest whole number\"\nmsgstr \"Arrondir la valeur du zoom à l'entier le plus proche\"\n\n#: /views/index.handlebars\nmsgid \"controls;miscellaneous\"\nmsgstr \"controls;miscellaneous;contrôles;divers;autres\"\n\n#: /views/index.handlebars\nmsgid \"Lock the canvas (disallow canvas drag/zoom with mouse/fingers)\"\nmsgstr \"Verrouiller le canvas (bloque le mouvement et le zoom)\"\n\n#: /views/index.handlebars\nmsgid \"MMB picker;mouse picker;selection;palette picker\"\nmsgstr \"MMB picker;mouse picker;selection;palette picker;souris;sélection;palette\"\n\n#: /views/index.handlebars\nmsgid \"Enable middle mouse button selecting color from board\"\nmsgstr \"Clic mollette permet de récupérer la couleur du pixel visé\"\n\n#: /views/index.handlebars\nmsgid \"right click action\"\nmsgstr \"right click action;clic;clique;droit;action\"\n\n#: /views/index.handlebars\nmsgid \"Right-click action:\"\nmsgstr \"Action au clic droit :\"\n\n#: /views/index.handlebars\nmsgid \"Nothing\"\nmsgstr \"Aucune\"\n\n#: /views/index.handlebars\nmsgid \"Clear color\"\nmsgstr \"Retirer la sélection de couleur\"\n\n#: /views/index.handlebars\nmsgid \"Copy color\"\nmsgstr \"Copier la couleur\"\n\n#: /views/index.handlebars\nmsgid \"Lookup\"\nmsgstr \"Regarder les informations du pixel\"\n\n#: /views/index.handlebars\nmsgid \"Clear color + Lookup\"\nmsgstr \"Retirer la sélection + infos pixel\"\n\n#: /views/index.handlebars\nmsgid \"snapshots;screenshot;download;picture;canvas\"\nmsgstr \"snapshots;screenshot;download;picture;canvas;capture d'écran;télécharger;image\"\n\n#: /views/index.handlebars\nmsgid \"Snapshot Settings\"\nmsgstr \"Paramètres de capture d'écran\"\n\n#: /views/index.handlebars\nmsgid \"screenshot;snapshot;download;board;canvas\"\nmsgstr \"screenshot;snapshot;download;board;canvas;capture d'écran;télécharger;image\"\n\n#: /views/index.handlebars\nmsgid \"take screenshot;image;download format;picture;canvas;board\"\nmsgstr \"take screenshot;image;download format;picture;canvas;board;capture d'écran;télécharger;format\"\n\n#: /views/index.handlebars\nmsgid \"Snapshot image format:\"\nmsgstr \"Format de l'image de capture :\"\n\n#: /views/index.handlebars\nmsgid \"PNG\"\nmsgstr \"PNG\"\n\n#: /views/index.handlebars\nmsgid \"JPEG\"\nmsgstr \"JPEG\"\n\n#: /views/index.handlebars\nmsgid \"WEBP (Chrome only)\"\nmsgstr \"WEBP (Chrome uniquement)\"\n\n#: /views/index.handlebars\nmsgid \"sound;notification;alert;notify;ping\"\nmsgstr \"sound;notification;alert;notify;ping;son;notification;alerte;notification\"\n\n#: /views/index.handlebars\nmsgid \"Sound and Notification Settings\"\nmsgstr \"Paramètres des sons et notifications\"\n\n#: /views/index.handlebars\nmsgid \"audio;mute;noise;volume\"\nmsgstr \"audio;mute;noise;volume;silencieux,bruit\"\n\n#: /views/index.handlebars\nmsgid \"Enable sound\"\nmsgstr \"Activer le son\"\n\n#: /views/index.handlebars\nmsgid \"notifs;notify;pixel notification\"\nmsgstr \"notifs;notify;pixel notification;notification\"\n\n#: /views/index.handlebars\nmsgid \"Enable pixel available notification\"\nmsgstr \"Notification quand un nouveau pixel est disponible\"\n\n#: /views/index.handlebars\nmsgid \"notification;pixel ready;alert\"\nmsgstr \"notification;pixel ready;alert;prêt;alerte\"\n\n#: /views/index.handlebars\nmsgid \"Pixel Ready Notification\"\nmsgstr \"Notification de nouveau pixel disponible\"\n\n#: /views/index.handlebars\nmsgid \"alert source;notify url;notify source;notification url;notification source\"\nmsgstr \"alert source;notify url;notify source;notification url;notification source;alerte;source;lien;notification\"\n\n#: /views/index.handlebars\nmsgid \"Alert URL:\"\nmsgstr \"URL de l'alerte :\"\n\n#: /views/index.handlebars\nmsgid \"Update\"\nmsgstr \"Mettre à jour\"\n\n#: /views/index.handlebars\nmsgid \"Test\"\nmsgstr \"Tester\"\n\n#: /views/index.handlebars\nmsgid \"sound level;audio level;mute audio;mute sound\"\nmsgstr \"sound level;audio level;mute audio;mute sound;volume;silencieux\"\n\n#: /views/index.handlebars\nmsgid \"Volume:\"\nmsgstr \"Volume :\"\n\n#: /views/index.handlebars\nmsgid \"alert forewarning;alert delay; notification delay; notification forewarning\"\nmsgstr \"alert forewarning;alert delay; notification delay; notification forewarning;alerte;délais;avertissement\"\n\n#: /views/index.handlebars\nmsgid \"Delay (seconds):\"\nmsgstr \"Délai (secondes) :\"\n\n#: /views/index.handlebars\nmsgid \"chat mentions;chat pings;chat sound\"\nmsgstr \"chat mentions;chat pings;chat sound;tchat;mention;son\"\n\n#: /views/index.handlebars\nmsgid \"Chat Pings\"\nmsgstr \"Mentions du tchat\"\n\n#: /views/index.handlebars\nmsgid \"Enable pings\"\nmsgstr \"Activer les mentions\"\n\n#: /views/index.handlebars\nmsgid \"mention sound\"\nmsgstr \"son des mentions\"\n\n#: /views/index.handlebars\nmsgid \"Play sound on ping:\"\nmsgstr \"Son quand mentionné :\"\n\n#: /views/index.handlebars\n#: /public/include/chat.js\nmsgid \"Off\"\nmsgstr \"Désactivé\"\n\n#: /views/index.handlebars\nmsgid \"Only when necessary\"\nmsgstr \"Uniquement quand nécessaire\"\n\n#: /views/index.handlebars\nmsgid \"Always\"\nmsgstr \"Tout le temps\"\n\n#: /views/index.handlebars\nmsgid \"mention sound volume\"\nmsgstr \"volume des mentions\"\n\n#: /views/index.handlebars\nmsgid \"Ping sound volume:\"\nmsgstr \"Volume des mentions :\"\n\n#: /views/index.handlebars\nmsgid \"personal account\"\nmsgstr \"compte personnel\"\n\n#: /views/index.handlebars\nmsgid \"Account Settings\"\nmsgstr \"Paramètres du compte\"\n\n#: /views/index.handlebars\nmsgid \"Public Discord name:\"\nmsgstr \"Nom d'utilisateur Discord publique :\"\n\n#: /views/index.handlebars\n#: /public/include/chat.js\nmsgid \"Set\"\nmsgstr \"Définir\"\n\n#: /views/index.handlebars\nmsgid \"Remove\"\nmsgstr \"Retirer\"\n\n#: /views/index.handlebars\nmsgid \"Help\"\nmsgstr \"Aide\"\n\n#: /views/index.handlebars\nmsgid \"Notifications\"\nmsgstr \"Notifications\"\n\n#: /views/partials/faq.handlebars\nmsgid \"FAQ\"\nmsgstr \"FAQ\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Why is the cooldown as long as it is?\"\nmsgstr \"Pourquoi est-ce que le cooldown est si long ?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"The time it takes to get a pixel is dynamic, and changes based on how many people are online. The cooldown time is longer when more users are online.\"\nmsgstr \"Le temps de recharge entre chaque pixel est dynamique, et change selon le nombre de personnes en ligne. Plus il y a de joueurs, plus le cooldown est grand.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Why does it say 0/6 pixels?\"\nmsgstr \"Pourquoi est-ce que ça dit 0/6 pixels ?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"This means that you are waiting for your next pixel. When you place a pixel, there is a cooldown for when you can place the next one. Over time, you can gain up to 6 \\\"stacked\\\" pixels to place at once.\"\nmsgstr \"Cela veut dire que vous attendez votre prochain pixel. Quand vous placez un pixel, il y a un cooldown qui indique quand vous pouvez placer le suivant. Avec le temps, jusqu'à 6 pixels peuvent être mis en réserve.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Why does it take so long to \\\"stack\\\" pixels?\"\nmsgstr \"Pourquoi ça prends si longtemps à avoir sa réserve de pixel pleine ?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"This is by design. It is better to place a pixel as soon as you get one. Pixel \\\"stacking\\\" is meant to give you a bump if you go AFK for a bit. It takes around 20-30 minutes to get a full 6/6 pixels, but it only takes around 3 minutes to place 6 pixels if you place them as soon as possible.\"\nmsgstr \"C'est une question de conception. Il est préférable de poser un pixel dès que vous en avez. La réserve a pour but de vous donner un coup de pouce si vous restez AFK. Cela prends environ 40 minutes pour avoir la réserve pleine (6/6), mais seulement 3 minutes si vous les placer dès que possible.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I appeal a ban?\"\nmsgstr \"Comment je peux faire appel de mon ban ?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Contact us on <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord</a> or send an appeal to our <a href=\\\"https://pxls.space/appeal\\\" target=\\\"_blank\\\">Google form</a> after reading the rules in the site's info panel.\"\nmsgstr \"Contactez-nous sur <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord</a>, ou envoyez un appel à notre <a href=\\\"https://pxls.space/appeal\\\" target=\\\"_blank\\\">formulaire Google</a> après avoir lu les règles du site dans le menu d'informations.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I make a template?\"\nmsgstr \"Comment créer un modèle ?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"A template is an image link that is posted in the template textbox in the settings panel so you can place over it on the canvas. You may use a regular image link to your pixel art, but many people use 3rd party tools like <a href=\\\"https://discord.gg/5MVDCq53vC\\\" target=\\\"blank\\\">Clueless</a> to turn pixel art into a fancier link. If you need to make pixel art yourself, you can use <a href=\\\"https://www.piskelapp.com/p/create\\\" target=\\\"_blank\\\">Piskel</a> to create art to put into Clueless.\"\nmsgstr \"Un modèle est un lien d'image qui est posté dans la boîte de texte des modèles dans les paramètres afin de pouvoir le placer sur le canvas. Tu peux utiliser un lien d'image normal pour ton pixel art, mais beaucoup de gens utilisent des outils comme <a href=\\\"https://discord.gg/5MVDCq53vC\\\" target=\\\"blank\\\">Clueless</a> pour transformer ton pixel art en un lien plus simple. Si tu as besoin de faire un pixel art toi-même, tu peux utliser <a href=\\\"https://www.piskelapp.com/p/create\\\" target=\\\"_blank\\\">Piskel</a> pour créer un modèle et le mettre ensuite dans Clueless.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I move a template?\"\nmsgstr \"Comment bouger un modèle ?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Hold <kbd>CTRL</kbd> (or <kbd>OPTION</kbd> on macOS) and click and drag to move it around. On mobile, you can tap and hold where you want to move the template and click \\\"Move Template Here\\\" in the pop-up.\"\nmsgstr \"Maintenez <kbd>CTRL</kbd> (ou <kbd>OPTION</kbd> sur Mac) puis cliquez et déplacez. Sur mobile, vous pouvez cliquez puis maintenir là où vous voulez bouger le modèle, et cliquer sur \\\"Déplacer ici le modèle\\\" dans la pop-up.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Does the canvas reset? When?\"\nmsgstr \"Est-ce que le canvas se réinitialise ? Quand ?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Yes. The canvas resets when it is completely full. A reset date is not usually decided until the canvas is full, but the average canvas life-span is around 1 month. Updates are posted in our <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord server</a> when a reset date is set.\"\nmsgstr \"Oui. Le canvas se fait une nouvelle beauté à chaque complétion totale. Une date de réinitialisation n'est généralement pas décidée avant que le canvas soit complètement rempli, mais la durée de vie habituelle d'un canvas est d'environ 1 mois. Les mises à jour sont postées sur notre <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">serveur Discord</a> quand une date est fixée.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Where can I see the past canvases?\"\nmsgstr \"Où puis-je voir les canvas passés ?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"The past canvases are featured on our <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord server</a>, or the <a href=\\\"https://archives.pxls.space\\\" target=\\\"_blank\\\">archives</a>, which records timelapses and a lot of useful information on each canvas.\"\nmsgstr \"Les anciens canvas sont mis en avant sur notre <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">serveur Discord</a> ou sur le site externe <a href=\\\"https://pxlsfiddle.com\\\" target=\\\"_blank\\\">PxlsFiddle</a>, qui enregistre des timelapses et bien d'autres informations utiles sur chaque canvas.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I see who placed a pixel?\"\nmsgstr \"Comment voir qui a placé un pixel ?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"By shift-clicking (or tap and hold on mobile) a pixel, you can see who placed a pixel, how many pixels they have placed, and when they placed it.\"\nmsgstr \"En appuyant simultanément sur <kbd>SHIFT</kbd> et clic droit sur un pixel, vous pouvez voir qui l'a placé, combien de pixels a été placé par cette personne et quand est-ce qu'il a été placé.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I report someone?\"\nmsgstr \"Comment signaler quelqu'un ?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Shift-click (or tap and hold on mobile) on a pixel, and click the Report button.\"\nmsgstr \"En appuyant simultanément sur <kbd>SHIFT</kbd> et clic droit (ou cliquez et maintenaez sur mobile) sur un pixel, il y a un bouton de signalement.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I change the color of my name in the chat?\"\nmsgstr \"Comment changer la couleur de mon nom dans le tchat ?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"There is a \\\"Username Color\\\" option near the bottom of the settings panel.\"\nmsgstr \"Il y a une option \\\"Couleur du nom\\\" vers le bas du menu des paramètres.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"What is a \\\"virginmap\\\"?\"\nmsgstr \"Qu'est-ce que la \\\"Virginmap\\\" ?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"The virginmap shows which pixels have not yet been placed on (or “virgin” pixels).\"\nmsgstr \"La Virginmap affiche quels pixels n'ont encore jamais été placés (ou pixels “vierge”).\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I report bugs?\"\nmsgstr \"Comment signaler un bug ?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Submit bugs to the #dev-and-bugs forum in the <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord server</a>. If you have found an exploit, please message one of the staff members privately (through DMs) or open a modmail by DMing pxls.mail#8384.\"\nmsgstr \"Envoyer vos trouvailles dans le salon #dev-and-bugs sur notre <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">serveur Discord</a>. Si vous avez trouver une faille, merci de contacter en priver l'un des staffs (via les MPs).\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I get more info or contact staff?\"\nmsgstr \"Comment avoir plus d'infos ou contacter le staff ?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Check the info panel (the icon on the top left) for more details and links, or join our <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord server</a>, where a staff member will gladly respond.\"\nmsgstr \"Regardez le menu d'information (l'icône en haut à gauche) pour plus de détails et des liens, ou rejoignez notre <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">serveur Discord</a>, où un membre du staff sera heureux de pouvoir vous répondre.\"\n\n#: /views/partials/info.handlebars\nmsgid \"Welcome!\"\nmsgstr \"Bienvenue !\"\n\n#: /views/partials/info.handlebars\nmsgid \"Welcome to pxls.space! Pxls is a multiplayer online collaborative canvas based on Reddit's <a href=\\\"https://www.reddit.com/r/place\\\" target=\\\"_blank\\\">r/place</a> event from 2017 that allows you to create anything you can imagine, one pixel at a time. Join hundreds of other players in the Pxls community and create amazing works of art together as a team, or solo.\"\nmsgstr \"Bienvenue sur pxls.space ! Pxls est un canvas multijoueur en ligne et collaboratif basé sur le jeu Reddit <a href=\\\"https://www.reddit.com/r/place\\\" target=\\\"_blank\\\">r/place</a> de 2017. Ce canvas vous permet de créer tout ce que vous pouvez imaginer, pixel par pixel. Rejoignez des centaines de joueurs sur la communauté Pxls et créez des œuvres d'arts en équipe ou solo.\"\n\n#: /views/partials/info.handlebars\nmsgid \"The best place to reach staff and fellow community is in the discord!\"\nmsgstr \"Le meilleur endroit pour contacter le staff et les autres membres de la communauté, c'est sur Discord !\"\n\n#: /views/partials/info.handlebars\nmsgid \"Check out our social media pages, and please take the time to read the rules below. Have fun creating (or changing) art!\"\nmsgstr \"Regardez nos réseaux sociaux, et prenez le temps de lire les règles ci-dessous s'il-vous-plaît. Amusez-vous bien à créer (ou modifier) des œuvres d'arts !\"\n\n#: /views/partials/info.handlebars\nmsgid \"Canvas Rules\"\nmsgstr \"Règles du canvas\"\n\n#: /views/partials/info.handlebars\nmsgid \"We pride ourselves on trying to keep an open canvas for all free from outside interference on our end, and especially censorship. However, for the good of the community and on accounts of our own beliefs, please acknowledge and obey the following guidelines:\"\nmsgstr \"Nous sommes fier de maintenir un canvas gratuit et ouvert à tous de l'interface à la back end, en particulier sur la transparence. Cependant, pour le bien de la communauté et selon nos convictions, nous vous demandons de bien vouloir prendre connaissance et de vous conformer à ces règles :\"\n\n#: /views/partials/info.handlebars\nmsgid \"No hateful imagery or derogatory speech. This includes but is not limited to words such as <i>f****t</i>, <i>n****r</i>, etc; as well as the Swastika, Hammer and Sickle, and any symbols of terrorism.\"\nmsgstr \"Pas d'image haineuse ni de propos méprisants. Cela inclus, mais sans se limiter, des mots (anglais) tel que <i>f****t</i>, <i>n****r</i>, etc ; ainsi que la croix gammée, la faucille et marteau ou symboles du terrorisme.\"\n\n#: /views/partials/info.handlebars\nmsgid \"No NSFW or NSFL content.\"\nmsgstr \"Aucun contenu NSFW (sexuel) ou NSFL (violent).\"\n\n#: /views/partials/info.handlebars\nmsgid \"No nudity or otherwise sexually explicit content\"\nmsgstr \"Aucune nudité ou autre contenu sexuellement explicite\"\n\n#: /views/partials/info.handlebars\nmsgid \"No female-presenting nipples/bare breasts, genitalia, sexual fluids\"\nmsgstr \"Pas de seins nus, d'organes génitaux ou de fluides sexuels\"\n\n#: /views/partials/info.handlebars\nmsgid \"No sexual imagery/erotica\"\nmsgstr \"Pas d'image sexuelle ni érotique\"\n\n#: /views/partials/info.handlebars\nmsgid \"No excessive blood or otherwise obscene/shocking content\"\nmsgstr \"Pas de sang excessif ni de contenu obscène ou choquant\"\n\n#: /views/partials/info.handlebars\nmsgid \"No more than <b>one</b> account per user, no exceptions. Multiple account users will be banned from creating art on the canvas.\"\nmsgstr \"Pas plus d'<b>un</b> compte par joueur, aucune exception. Les utilisateurs ayant des doubles comptes seront banni du canvas.\"\n\n#: /views/partials/info.handlebars\nmsgid \"No auto-placement tools of any kind, you must place the pixels manually.\"\nmsgstr \"Pas d'auto placement sous quelque forme que ce soit, vous devez placer manuellement les pixels.\"\n\n#: /views/partials/info.handlebars\nmsgid \"Do not abuse site functionality, such as reports or lookups. (e.g. automated reporting/lookups, etc.)\"\nmsgstr \"N'abusez pas de fonctionnalité du site, tel que les signalements ou les infos pixel. (ex. signalement/infos automatisé, etc...)\"\n\n#: /views/partials/info.handlebars\nmsgid \"Any automated aggregation of data from user lookups is not allowed, and will result in a ban.\"\nmsgstr \"Toute collecte automatisée de donnée est strictement interdite et en résultera d'un bannissement.\"\n\n#: /views/partials/info.handlebars\n#: /views/partials/info.handlebars\nmsgid \"Staff have final say in any rule disputes\"\nmsgstr \"Le staff a le dernier mot en cas de littige sur les règles\"\n\n#: /views/partials/info.handlebars\n#: /views/partials/info.handlebars\nmsgid \"If you feel a moderator has acted inappropriately, please report it to an administrator.\"\nmsgstr \"Si vous trouvez qu'un modérateur a agit de manière inappropriée, veuillez le signaler à un administrateur.\"\n\n#: /views/partials/info.handlebars\nmsgid \"If you believe you have been falsely banned you may contact a moderator or administrator.\"\nmsgstr \"Si vous pensez que vous avez été banni à tort, contactez un modérateur ou administrateur.\"\n\n#: /views/partials/info.handlebars\nmsgid \"Chat Rules\"\nmsgstr \"Règles du tchat\"\n\n#: /views/partials/info.handlebars\nmsgid \"Keep chat civil. No harassment or homophobic/transphobic/disablist language.\"\nmsgstr \"Veillez à ce que le tchat reste civilisé. L'harcèlement, l'homophobie, la transphobie, etc... sont interdits.\"\n\n#: /views/partials/info.handlebars\nmsgid \"No hate speech. This includes emoji/symbols/ASCII art.\"\nmsgstr \"Aucune haine. Cela inclus les émojis, symboles, l'art ASCII, etc...\"\n\n#: /views/partials/info.handlebars\nmsgid \"Normal swearing/etc is allowed\"\nmsgstr \"Les injures ordinaires sont autorisées\"\n\n#: /views/partials/info.handlebars\nmsgid \"No spamming\"\nmsgstr \"Ne spammez pas\"\n\n#: /views/partials/info.handlebars\nmsgid \"This includes excessive ASCII art/emojis/symbols/whitespace\"\nmsgstr \"Cela inclus l'utilisation excessive d'art ASCII, émojis, symboles et espaces\"\n\n#: /views/partials/info.handlebars\nmsgid \"No \\\"copy pasta\\\"s\"\nmsgstr \"Pas de \\\"copy pasta\\\"\"\n\n#: /views/partials/info.handlebars\nmsgid \"No links to sites that actively break the canvas or chat rules (e.g. porn sites)\"\nmsgstr \"Aucun lien vers des sites qui enfreignent activement les règles du canvas ou du tchat (ex. sites porno)\"\n\n#: /views/partials/info.handlebars\nmsgid \"No symbology which break the canvas or chat rules (e.g. NSFW ASCII art)\"\nmsgstr \"Pas de symbologie qui enfreint les règles du canvas ou du tchat (ex. art ASCII NSFW)\"\n\n#: /views/partials/info.handlebars\nmsgid \"No personal information\"\nmsgstr \"Aucune information personnelle\"\n\n#: /views/partials/info.handlebars\nmsgid \"Links\"\nmsgstr \"Liens\"\n\n#: /views/partials/info.handlebars\nmsgid \"Terms of Service\"\nmsgstr \"Conditions d'utilisation\"\n\n#: /views/partials/info.handlebars\nmsgid \"Privacy Policy\"\nmsgstr \"Charte de confidentialité\"\n\n#: /views/partials/info.handlebars\nmsgid \"Discord (main hub)\"\nmsgstr \"Discord (hub principal)\"\n\n#: /views/partials/info.handlebars\nmsgid \"Twitter\"\nmsgstr \"Twitter\"\n\n#: /views/partials/info.handlebars\nmsgid \"GitHub (back end)\"\nmsgstr \"GitHub (back end)\"\n\n#: /views/partials/info.handlebars\nmsgid \"GitHub (front end)\"\nmsgstr \"GitHub (front end)\"\n\n#: /views/partials/info.handlebars\nmsgid \"Single-player mode\"\nmsgstr \"Mode solo\"\n\n#: /views/partials/info.handlebars\nmsgid \"Statistics\"\nmsgstr \"Statistiques\"\n\n#: /views/partials/info.handlebars\nmsgid \"Profile (user info, factions, etc.)\"\nmsgstr \"Profil (info joueur, factions, etc...)\"\n\n#: /views/partials/info.handlebars\nmsgid \"Wiki\"\nmsgstr \"Wiki\"\n\n#: /views/partials/info.handlebars\nmsgid \"Generator, progress checker, and monitor for Pxls templates\"\nmsgstr \"Générateur et suivi de progression pour les modèles Pxls\"\n\n#: /views/partials/info.handlebars\nmsgid \"Archives\"\nmsgstr \"Archives\"\n\n#: /views/partials/info.handlebars\nmsgid \"PxlsFiddle (archives)\"\nmsgstr \"PxlsFiddle (archives)\"\n\n#: /views/partials/info.handlebars\nmsgid \"Donate\"\nmsgstr \"Faire une donation\"\n\n#: /views/partials/info.handlebars\nmsgid \"Donations are not accepted at this time, but this panel will be updated when they're open again!\"\nmsgstr \"Les donations ne sont pas actuellement acceptées, mais le menu sera mis à jour quand de nouveau ouvert !\"\n\n#: /views/profile.handlebars\n#: /views/profile.handlebars\nmsgid \"{0}'s Profile\"\nmsgstr \"Profil de {0}\"\n\n#: /views/profile.handlebars\nmsgid \"My Data\"\nmsgstr \"Mes données\"\n\n#: /views/profile.handlebars\n#: /views/profile.handlebars\nmsgid \"Reports\"\nmsgstr \"Signalements\"\n\n#: /views/profile.handlebars\nmsgid \"Factions\"\nmsgstr \"Factions\"\n\n#: /views/profile.handlebars\nmsgid \"Data\"\nmsgstr \"Données\"\n\n#: /views/profile.handlebars\nmsgid \"You must be logged in to view your profile.\"\nmsgstr \"Vous devez être connecté pour voir votre profil.\"\n\n#: /views/profile.handlebars\nmsgid \"Registration Date\"\nmsgstr \"Date d'incription\"\n\n#: /views/profile.handlebars\n#: /public/include/lookup.js\nmsgid \"Alltime Pixels\"\nmsgstr \"Pixels totaux\"\n\n#: /views/profile.handlebars\nmsgid \"Current Canvas Pixels\"\nmsgstr \"Pixels du canvas en cours\"\n\n#: /views/profile.handlebars\nmsgid \"Discord Tag\"\nmsgstr \"Nom d'utilisateur Discord\"\n\n#: /views/profile.handlebars\n#: /public/include/lookup.js\nmsgid \"Faction\"\nmsgstr \"Faction\"\n\n#: /views/profile.handlebars\n#: /views/profile.handlebars\nmsgid \"None\"\nmsgstr \"Aucune\"\n\n#: /views/profile.handlebars\n#: /public/admin/admin.js\nmsgid \"Roles\"\nmsgstr \"Riles\"\n\n#: /views/profile.handlebars\nmsgid \"Canvas Ban Expiry\"\nmsgstr \"Fin du ban du canvas\"\n\n#: /views/profile.handlebars\n#: /views/profile.handlebars\nmsgid \"Never\"\nmsgstr \"Jamais\"\n\n#: /views/profile.handlebars\nmsgid \"Chat Ban Expiry\"\nmsgstr \"Fin du ban du tchat\"\n\n#: /views/profile.handlebars\nmsgid \"View rankings and other stats <a href=\\\"/stats\\\">here</a>.\"\nmsgstr \"Voir les classements et autres stats <a href=\\\"/stats\\\">ici</a>.\"\n\n#: /views/profile.handlebars\nmsgid \"You must be logged in to view your reports.\"\nmsgstr \"Vous devez être connecté afin de voir vos signalements.\"\n\n#: /views/profile.handlebars\nmsgid \"Canvas Reports ({0}/{1} open)\"\nmsgstr \"Signalements du canvas ({0}/{1} ouverts)\"\n\n#. eg \"Report on Bob (closed)\n#: /views/profile.handlebars\n#: /views/profile.handlebars\nmsgid \"Report on {0} (closed)\"\nmsgstr \"Signalement sur {0} (fermé)\"\n\n#. eg \"Report on Bob (open)\n#: /views/profile.handlebars\n#: /views/profile.handlebars\nmsgid \"Report on {0} (open)\"\nmsgstr \"Report on {0} (ouvert)\"\n\n#. eg \"Reported Bob on Jan 1, 1970, 00:00:00 AM (UTC)\n#: /views/profile.handlebars\n#: /views/profile.handlebars\nmsgid \"Reported {0} on {1}\"\nmsgstr \"Signalement {0} sur {1}\"\n\n#: /views/profile.handlebars\nmsgid \"There are no canvas reports to show.\"\nmsgstr \"Il n'y a aucun signalement du canvas à afficher.\"\n\n#: /views/profile.handlebars\nmsgid \"Chat Reports ({0}/{1} open)\"\nmsgstr \"Signalements du tchat ({0}/{1} ouverts)\"\n\n#: /views/profile.handlebars\nmsgid \"There are no chat reports to show.\"\nmsgstr \"Il n'y a aucun signalement du tchat à afficher.\"\n\n#: /views/profile.handlebars\nmsgid \"You must be logged in to manage your factions.\"\nmsgstr \"Vous devez être connecté afin de gérer vos factions.\"\n\n#: /views/profile.handlebars\nmsgid \"You are faction restricted and cannot create new factions. If you believe this is an error, please contact a moderator.\"\nmsgstr \"Vous avez été limité dans la création de faction. Si vous pensez qu'il s'agit d'une erreur, veuillez contacter un modérateur.\"\n\n#: /views/profile.handlebars\nmsgid \"You are canvas banned and cannot create new factions. If you believe this is an error, please contact a moderator.\"\nmsgstr \"Vous avez été banni du canvas et ne pouvez pas créer de nouvelle faction. Si vous pensez qu'il s'agit d'une erreur, veuillez contacter un modérateur.\"\n\n#: /views/profile.handlebars\nmsgid \"You must have at least {0} all-time pixels to create a faction.\"\nmsgstr \"Vous devez avoir au moins posé {0} pixels totaux afin de créer un faction.\"\n\n#: /views/profile.handlebars\nmsgid \"Create\"\nmsgstr \"Créer\"\n\n#: /views/profile.handlebars\nmsgid \"Join\"\nmsgstr \"Rejoindre\"\n\n#: /views/profile.handlebars\nmsgid \"This is your currently displayed faction.\"\nmsgstr \"Ceci est votre faction actuellement affichée.\"\n\n#. eg \"Pixelers (members: 100, ID: 1)\"\n#: /views/profile.handlebars\nmsgid \"{0} (members: {1}, ID: {2})\"\nmsgstr \"{0} (membres : {1}, ID : {2})\"\n\n#: /views/profile.handlebars\nmsgid \"Owner: {0}\"\nmsgstr \"Propriétaire : {0}\"\n\n#. makes the faction no longer the one displayed for the current user\n#: /views/profile.handlebars\nmsgid \"Remove Displayed\"\nmsgstr \"Retirer de l'affichage\"\n\n#. makes the faction the one displayed for the current user\n#: /views/profile.handlebars\nmsgid \"Set Displayed\"\nmsgstr \"Définir comme affiché\"\n\n#: /views/profile.handlebars\nmsgid \"Members\"\nmsgstr \"Membres\"\n\n#: /views/profile.handlebars\nmsgid \"Edit\"\nmsgstr \"Modifier\"\n\n#: /views/profile.handlebars\n#: /public/include/chat.js\nmsgid \"Delete\"\nmsgstr \"Supprimer\"\n\n#: /views/profile.handlebars\nmsgid \"Leave\"\nmsgstr \"Quitter\"\n\n#: /views/profile.handlebars\nmsgid \"You are not in any factions yet!\"\nmsgstr \"Vous n'êtes pas encore dans une factions !\"\n\n#: /views/profile.handlebars\nmsgid \"You must be logged in to view your data.\"\nmsgstr \"Vous devez être connecté pour voir vos données.\"\n\n#: /views/profile.handlebars\nmsgid \"Log Keys\"\nmsgstr \"Clés de log\"\n\n#: /views/profile.handlebars\nmsgid \"Log keys can be used by those who have them to tell which pixels you placed on previous canvases.\"\nmsgstr \"Les clés de log peuvent être utilisées afin de savoir quels pixels vous avez placés sur les canvas précédents.\"\n\n#: /views/profile.handlebars\nmsgid \"You can see the public <a href=\\\"https://pxls.space/extra/logs/\\\" target=\\\"_blank\\\">Pxls Logs</a> to learn more.\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Canvas Code\"\nmsgstr \"Code de canvas\"\n\n#: /views/profile.handlebars\nmsgid \"Log Key\"\nmsgstr \"Clé de log\"\n\n#: /views/profile.handlebars\nmsgid \"You have no log keys yet!\"\nmsgstr \"Vous n'avez pas déjà de clé de log !\"\n\n#: /views/profile.handlebars\nmsgid \"Log keys should show up here after a canvas you have placed on ends.\"\nmsgstr \"Des clés de log devraient apparaître ici après avoir placé sur un canvas passé.\"\n\n#: /views/profile.handlebars\nmsgid \"Members of {0} ([{1}])\"\nmsgstr \"Membres de {0} ([{1}])\"\n\n#: /views/profile.handlebars\n#: /views/profile.handlebars\n#: /views/profile.handlebars\n#: /views/profile.handlebars\n#: /public/admin/admin.js\n#: /public/include/lookup.js\nmsgid \"Close\"\nmsgstr \"Fermer\"\n\n#: /views/profile.handlebars\nmsgid \"Faction Members\"\nmsgstr \"Membres de la faction\"\n\n#. This loop only fires when on our own profile. We can't leave a faction we own, we can only transfer ownership, so no point in showing ourselves in the member list.\n#. since we can't leave the faction until we transfer, if there's only one member in the list it's assumed to be the owner. we don't want to show ourself in the list\n#: /views/profile.handlebars\nmsgid \"Transfer Ownership\"\nmsgstr \"Transférer la propriété\"\n\n#. bans a user from the faction\n#: /views/profile.handlebars\n#: /public/include/chat.js\nmsgid \"Ban\"\nmsgstr \"Ban\"\n\n#: /views/profile.handlebars\n#: /views/profile.handlebars\nmsgid \"Nothing to see here!\"\nmsgstr \"Il n'y a rien à voir ici !\"\n\n#: /views/profile.handlebars\nmsgid \"Faction Bans\"\nmsgstr \"Bans de faction\"\n\n#: /views/profile.handlebars\n#: /public/admin/admin.js\n#: /public/include/chat.js\nmsgid \"Unban\"\nmsgstr \"Unban\"\n\n#: /views/profile.handlebars\nmsgid \"Find A Faction\"\nmsgstr \"Trouver une faction\"\n\n#: /views/profile.handlebars\nmsgid \"Search:\"\nmsgstr \"Rechercher :\"\n\n#: /views/profile.handlebars\nmsgid \"Enter a search term to get started.\"\nmsgstr \"Entrer un terme de recherche afin de commencer.\"\n\n#: /views/profile.handlebars\nmsgid \"Load More\"\nmsgstr \"Charger plus\"\n\n#: /public/admin/admin.js\nmsgid \"Send alert...\"\nmsgstr \"Envoyer une alerte...\"\n\n#: /public/admin/admin.js\n#: /public/include/lookup.js\nmsgid \"Rule #1: Hateful/derogatory speech or symbols\"\nmsgstr \"Règle #1 : Discours et symboles haineux/méprisants\"\n\n#: /public/admin/admin.js\n#: /public/include/lookup.js\nmsgid \"Rule #2: Nudity, genitalia, or non-PG-13 content\"\nmsgstr \"Règle #2 : Nudité, sexualité et contenu -13\"\n\n#: /public/admin/admin.js\n#: /public/include/lookup.js\nmsgid \"Rule #3: Multi-account\"\nmsgstr \"Règle #3 : Doubles comptes\"\n\n#: /public/admin/admin.js\n#: /public/include/lookup.js\nmsgid \"Rule #4: Botting\"\nmsgstr \"Règle #4 : Automatisation\"\n\n#: /public/admin/admin.js\n#: /public/include/lookup.js\nmsgid \"Other (specify below)\"\nmsgstr \"Autre (spécifié ci-dessous)\"\n\n#: /public/admin/admin.js\n#: /public/include/chat.js\n#: /public/include/lookup.js\nmsgid \"Additional information (if applicable)\"\nmsgstr \"Information additionnelle (si applicable)\"\n\n#. \"Revert pixels of the last *n* hours\", part before 'n'\n#: /public/admin/admin.js\nmsgid \"Revert pixels of the last \"\nmsgstr \"Annuler les pixels des dernières \"\n\n#. \"Revert pixels of the last *n* hours\", part after 'n'\n#: /public/admin/admin.js\nmsgid \" hours\"\nmsgstr \" heures\"\n\n#: /public/admin/admin.js\n#: /public/include/lookup.js\nmsgid \"You must specify the details.\"\nmsgstr \"Vous devez spécifiez les détails.\"\n\n#: /public/admin/admin.js\nmsgid \"Something went wrong! Perhaps insufficient permissions?\"\nmsgstr \"Quelque chose s'est mal passée ! Peut-être des permissions insuffisantes ?\"\n\n#: /public/admin/admin.js\nmsgid \"Shadowban user\"\nmsgstr \"Shadowban l'utilisateur\"\n\n#: /public/admin/admin.js\nmsgid \"Shadowbanned user\"\nmsgstr \"Utilisateur shadowbanni\"\n\n#: /public/admin/admin.js\nmsgid \"Permaban user\"\nmsgstr \"Bannir définitivement l'utilisateur\"\n\n#: /public/admin/admin.js\nmsgid \"Permabanned user\"\nmsgstr \"Utilisateur banni définitivement\"\n\n#: /public/admin/admin.js\nmsgid \"Ban user\"\nmsgstr \"Bannir l'utilisateur\"\n\n#: /public/admin/admin.js\nmsgid \"Banned user\"\nmsgstr \"Utilisateur banni\"\n\n#: /public/admin/admin.js\nmsgid \"Unbanned user ${username}\"\nmsgstr \"Utilisateur ${username} unbanni\"\n\n#. Context: ban type\n#: /public/admin/admin.js\nmsgid \"shadow\"\nmsgstr \"shadow\"\n\n#: /public/admin/admin.js\nmsgid \"never\"\nmsgstr \"jamais\"\n\n#: /public/admin/admin.js\nmsgid \"permanent\"\nmsgstr \"permanent\"\n\n#: /public/admin/admin.js\n#: /public/include/chat.js\n#: /public/include/uiHelper.js\n#: /public/include/user.js\nmsgid \"Yes\"\nmsgstr \"Oui\"\n\n#: /public/admin/admin.js\n#: /public/include/chat.js\n#: /public/include/uiHelper.js\n#: /public/include/user.js\nmsgid \"No\"\nmsgstr \"Non\"\n\n#: /public/admin/admin.js\nmsgid \"Yes (permanent)\"\nmsgstr \"Oui (permanent)\"\n\n#: /public/admin/admin.js\n#: /public/include/lookup.js\nmsgid \"Username\"\nmsgstr \"Nom d'utilisateur\"\n\n#: /public/admin/admin.js\n#: /public/include/chat.js\nmsgid \"Profile\"\nmsgstr \"Profil\"\n\n#: /public/admin/admin.js\nmsgid \"Logins\"\nmsgstr \"Identifiants\"\n\n#: /public/admin/admin.js\nmsgid \"All Time Pixels\"\nmsgstr \"Pixels totaux\"\n\n#: /public/admin/admin.js\n#: /public/include/user.js\nmsgid \"Rename Requested\"\nmsgstr \"Renommage demandé\"\n\n#: /public/admin/admin.js\nmsgid \"Discord Name\"\nmsgstr \"Nom d'utilisateur Discord\"\n\n#: /public/admin/admin.js\n#: /public/include/user.js\nmsgid \"Banned\"\nmsgstr \"Banni\"\n\n#: /public/admin/admin.js\nmsgid \"Chatbanned\"\nmsgstr \"Banni du tchat\"\n\n#: /public/admin/admin.js\nmsgid \"Ban Reason\"\nmsgstr \"Raison du bannissement\"\n\n#: /public/admin/admin.js\nmsgid \"Ban Expiracy\"\nmsgstr \"Expiration du ban\"\n\n#: /public/admin/admin.js\nmsgid \"Chatban Reason\"\nmsgstr \"Raison du ban du tchat\"\n\n#: /public/admin/admin.js\nmsgid \"(canvas ban)\"\nmsgstr \"(ban canvas)\"\n\n#: /public/admin/admin.js\nmsgid \"when canvas ban ends\"\nmsgstr \"quand le ban du canvas se termine\"\n\n#: /public/admin/admin.js\nmsgid \"Chatban Expires\"\nmsgstr \"Expiration du ban du tchat\"\n\n#: /public/admin/admin.js\nmsgid \"Ban (24h)\"\nmsgstr \"Ban (24h)\"\n\n#: /public/admin/admin.js\nmsgid \"Permaban\"\nmsgstr \"Ban définitif\"\n\n#: /public/admin/admin.js\nmsgid \"Shadowban\"\nmsgstr \"Shadowban\"\n\n#: /public/admin/admin.js\nmsgid \"Custom ban length: \"\nmsgstr \"Durée personnalisée du ban : \"\n\n#. Admin check. Example: type = 'username', arg = 'pxlsuser94'\n#: /public/admin/admin.js\nmsgid \"${type} ${arg} not found.\"\nmsgstr \"${type} ${arg} non trouvé.\"\n\n#: /public/admin/admin.js\nmsgid \"Unban Reason:\"\nmsgstr \"Raison du débannissement :\"\n\n#: /public/admin/admin.js\nmsgid \"Unbanning ${username}\"\nmsgstr \"Débannir ${username}\"\n\n#: /public/admin/admin.js\n#: /public/include/chat.js\n#: /public/include/lookup.js\n#: /public/include/user.js\nmsgid \"Cancel\"\nmsgstr \"Annuler\"\n\n#. Moderator panel label\n#: /public/admin/admin.js\nmsgid \"MOD\"\nmsgstr \"MOD\"\n\n#: /public/admin/admin.js\nmsgid \"Ignore cooldown\"\nmsgstr \"Ignorer le cooldown\"\n\n#: /public/admin/admin.js\nmsgid \"Place any color\"\nmsgstr \"Place n'importe quelle couleur\"\n\n#: /public/admin/admin.js\nmsgid \"Ignore placemap\"\nmsgstr \"Ignorer la placemap\"\n\n#: /public/admin/admin.js\nmsgid \"Ban user (24h)\"\nmsgstr \"Ban l'utilisateur (24h)\"\n\n#: /public/admin/admin.js\nmsgid \"Unban user\"\nmsgstr \"Débannir l'utilisateur\"\n\n#: /public/admin/admin.js\nmsgid \"Check user\"\nmsgstr \"Vérifier l'utilisateur\"\n\n#: /public/admin/admin.js\nmsgid \"profile\"\nmsgstr \"profil\"\n\n#: /public/admin/admin.js\nmsgid \"User Agent\"\nmsgstr \"Agent utilisateur\"\n\n#: /public/admin/admin.js\nmsgid \"Send Alert\"\nmsgstr \"Envoyer une alerte\"\n\n#: /public/admin/admin.js\nmsgid \"Mod Actions\"\nmsgstr \"Actions mod\"\n\n#: /public/admin/admin.js\nmsgid \"More...\"\nmsgstr \"Plus...\"\n\n#. Snapshot save name\n#: /public/include/board.js\nmsgid \"pxls canvas\"\nmsgstr \"canvas pxls\"\n\n#. template link action\n#: /public/include/chat.js\nmsgid \"Ask\"\nmsgstr \"Demander\"\n\n#: /public/include/chat.js\nmsgid \"Open in a new tab\"\nmsgstr \"Ouvrir dans un nouvel onglet\"\n\n#: /public/include/chat.js\nmsgid \"Open in current tab (replacing template)\"\nmsgstr \"Ouvrir sur ce onglet (replace le modèle)\"\n\n#: /public/include/chat.js\nmsgid \"Jump to coordinates without replacing template\"\nmsgstr \"Aller aux coordonnées sans remplacer le modèle\"\n\n#: /public/include/chat.js\nmsgid \"Please upload your template image to a third-party image host.\"\nmsgstr \"Veuillez téléverser votre image de modèle sur un hébergeur d'image tiers.\"\n\n#: /public/include/chat.js\nmsgid \"You must have at least \"\nmsgstr \"Vous devez au moins avoir \"\n\n#: /public/include/chat.js\nmsgid \" pixels to send links.\"\nmsgstr \" pixels afin d'envoyer des liens.\"\n\n#: /public/include/chat.js\nmsgid \"You must be logged in to chat.\"\nmsgstr \"Vous devez être connecté pour tchater.\"\n\n#: /public/include/chat.js\nmsgid \"No Results\"\nmsgstr \"Aucun résultat\"\n\n#: /public/include/chat.js\nmsgid \"Reply\"\nmsgstr \"Répondre\"\n\n#: /public/include/chat.js\nmsgid \"none provided\"\nmsgstr \"aucun fourni\"\n\n#: /public/include/chat.js\nmsgid \"Purged by ${purge.initiator} with reason: ${reason}\"\nmsgstr \"Prugé par ${purge.initiator} pour : ${reason}\"\n\n#: /public/include/chat.js\nmsgid \"External Link\"\nmsgstr \"Lien externe\"\n\n#: /public/include/chat.js\nmsgid \"This link is taking you to the following website:\"\nmsgstr \"Ce lien vous emmènera au site suivant :\"\n\n#: /public/include/chat.js\nmsgid \"The operators of this website have no responsibility or control over the contents hosted at {0}. Are you sure you want to go there?\"\nmsgstr \"Les opérateurs de ce site n'ont aucune responsabilité ni contrôle sur le contenu hébergé sur {0}. Êtes-vous sûr de vouloir y aller ?\"\n\n#: /public/include/chat.js\nmsgid \"Note: You can disable this popup in settings.\"\nmsgstr \"Note : vous pouvez désactiver cette pop-up dans les paramètres.\"\n\n#: /public/include/chat.js\nmsgid \"Visit Site\"\nmsgstr \"Visiter le site\"\n\n#: /public/include/chat.js\nmsgid \"template:\"\nmsgstr \"modèle :\"\n\n#: /public/include/chat.js\nmsgid \"Open Failed\"\nmsgstr \"Échec de l'ouverture\"\n\n#: /public/include/chat.js\nmsgid \"Failed to automatically open in a new tab\"\nmsgstr \"Échec de l'ouverture automatique dans un nouvel onglet\"\n\n#: /public/include/chat.js\nmsgid \"Click here to open in a new tab instead\"\nmsgstr \"Cliquez ici pour ouvrir dans un nouvel onglet\"\n\n#: /public/include/chat.js\nmsgid \"Open Template\"\nmsgstr \"Ouvrir le modèle\"\n\n#: /public/include/chat.js\nmsgid \"This link will overwrite your current template. What would you like to do?\"\nmsgstr \"Ce lien remplacera votre modèle actuel. Que voulez-vous faire ?\"\n\n#: /public/include/chat.js\nmsgid \"Note: You can set a default action in the settings menu which bypasses this popup completely.\"\nmsgstr \"Note : vous pouvez définir une action par défaut dans le menu des paramètres, pour complètement contourner cette pop-up.\"\n\n#: /public/include/chat.js\nmsgid \"OK\"\nmsgstr \"OK\"\n\n#: /public/include/chat.js\n#: /public/include/lookup.js\nmsgid \"Report\"\nmsgstr \"Singaler\"\n\n#: /public/include/chat.js\nmsgid \"Mention\"\nmsgstr \"Mention\"\n\n#: /public/include/chat.js\nmsgid \"Ignore\"\nmsgstr \"Ignorer\"\n\n#: /public/include/chat.js\nmsgid \"Chat (un)ban\"\nmsgstr \"(Dé)bannir du tchat\"\n\n#: /public/include/chat.js\nmsgid \"Purge User\"\nmsgstr \"Purger l'utilisateur\"\n\n#: /public/include/chat.js\nmsgid \"Mod Lookup\"\nmsgstr \"Vue modérateur\"\n\n#: /public/include/chat.js\nmsgid \"Chat Lookup\"\nmsgstr \"Vue tchat\"\n\n#: /public/include/chat.js\nmsgid \"Enter a reason for your report\"\nmsgstr \"Entrer la raison de votre signalement\"\n\n#: /public/include/chat.js\nmsgid \"You are reporting a chat message from ${reportTarget} with the content:\"\nmsgstr \"Vous signalez un message tchat de ${reportTarget} ayant comme contenu :\"\n\n#: /public/include/chat.js\n#: /public/include/lookup.js\nmsgid \"Sent report!\"\nmsgstr \"Signalement envoyé !\"\n\n#: /public/include/chat.js\n#: /public/include/lookup.js\nmsgid \"Error sending report.\"\nmsgstr \"Erreur lors de l'envoi du signalement.\"\n\n#: /public/include/chat.js\nmsgid \"Report User\"\nmsgstr \"Signaler le joueur\"\n\n#: /public/include/chat.js\nmsgid \"User ignored. You can unignore from chat settings.\"\nmsgstr \"Utilisateur ignoré. Vous pouvez le désignorer depuis les paramètres du tchat.\"\n\n#: /public/include/chat.js\nmsgid \"Failed to ignore user. Either they\\\\'re already ignored, or an error occurred. If the problem persists, contact a developer.\"\nmsgstr \"Échec dans \"\n\n#: /public/include/chat.js\nmsgid \"Permanent\"\nmsgstr \"Permanent\"\n\n#: /public/include/chat.js\nmsgid \"Temporary\"\nmsgstr \"Temporaire\"\n\n#: /public/include/chat.js\nmsgid \"Rule 3: Spam\"\nmsgstr \"Règle 3 : Spam\"\n\n#: /public/include/chat.js\nmsgid \"Rule 1: Chat civility\"\nmsgstr \"Règle 1 : Civilité dans le tchat\"\n\n#: /public/include/chat.js\nmsgid \"Rule 2: Hate Speech\"\nmsgstr \"Règle 2 : Propos haineux\"\n\n#: /public/include/chat.js\nmsgid \"Rule 5: NSFW\"\nmsgstr \"Règle 5 : NSFW\"\n\n#: /public/include/chat.js\nmsgid \"Custom\"\nmsgstr \"Personnalisé\"\n\n#: /public/include/chat.js\nmsgid \"Banning:\"\nmsgstr \"Bannir :\"\n\n#: /public/include/chat.js\nmsgid \"Message:\"\nmsgstr \"Message :\"\n\n#: /public/include/chat.js\nmsgid \"Ban Length\"\nmsgstr \"Durée du ban\"\n\n#: /public/include/chat.js\nmsgid \"Reason\"\nmsgstr \"Raison\"\n\n#: /public/include/chat.js\nmsgid \"Purge Messages\"\nmsgstr \"Purge de ses messages\"\n\n#: /public/include/chat.js\nmsgid \"Purging all messages is disabled during snip mode\"\nmsgstr \"La purge de tous les messages est désactivée durant le mode snip\"\n\n#: /public/include/chat.js\nmsgid \"Silent (no purge message)\"\nmsgstr \"Silencieux (aucune purge de message)\"\n\n#: /public/include/chat.js\nmsgid \"Custom reason\"\nmsgstr \"Raison personnalisée\"\n\n#: /public/include/chat.js\nmsgid \"Additional information:\"\nmsgstr \"Information additionnelle :\"\n\n#: /public/include/chat.js\nmsgid \"Chatban initiated\"\nmsgstr \"Ban du tchat initialisé\"\n\n#: /public/include/chat.js\nmsgid \"Error occurred while chatbanning\"\nmsgstr \"Une erreur est apparue lors du bannissement tchat\"\n\n#: /public/include/chat.js\nmsgid \"Chatban\"\nmsgstr \"Ban du tchat\"\n\n#: /public/include/chat.js\nmsgid \"Failed to delete\"\nmsgstr \"Échec de la suppression\"\n\n#: /public/include/chat.js\nmsgid \"ID: \"\nmsgstr \"ID : \"\n\n#: /public/include/chat.js\nmsgid \"User: \"\nmsgstr \"Utilisateur : \"\n\n#: /public/include/chat.js\nmsgid \"Message: \"\nmsgstr \"Message : \"\n\n#: /public/include/chat.js\nmsgid \"Reason: \"\nmsgstr \"Raison : \"\n\n#: /public/include/chat.js\nmsgid \"Delete Message\"\nmsgstr \"Supprimer le message\"\n\n#: /public/include/chat.js\nmsgid \"Purge\"\nmsgstr \"Purger\"\n\n#: /public/include/chat.js\nmsgid \"Selected Message\"\nmsgstr \"Message sélectionnée\"\n\n#: /public/include/chat.js\nmsgid \"Purge Reason\"\nmsgstr \"Raison de la purge\"\n\n#: /public/include/chat.js\nmsgid \"User purged\"\nmsgstr \"Utilisateur purgé\"\n\n#: /public/include/chat.js\nmsgid \"Error sending purge.\"\nmsgstr \"Erreur d'envoi de la purge.\"\n\n#: /public/include/chat.js\nmsgid \"Toggle Rename Request\"\nmsgstr \"Activer les demandes de renommage\"\n\n#: /public/include/chat.js\nmsgid \"Select one of the options below to set the current rename request state.\"\nmsgstr \"Sélectionnez l'une des options ci-dessous afin de définir le statut de la demande de renommage.\"\n\n#: /public/include/chat.js\nmsgid \"Rename request updated\"\nmsgstr \"Demande de renommage mise à jour\"\n\n#: /public/include/chat.js\nmsgid \"An unknown error occurred. Please contact a developer\"\nmsgstr \"Une erreur inconnue est apparue. Merci de contacter un développeur\"\n\n#: /public/include/chat.js\nmsgid \"New Name: \"\nmsgstr \"Nouveau nom : \"\n\n#: /public/include/chat.js\nmsgid \"Enter the new name for the user below. Please note that if you\\\\'re trying to change the caps, you\\\\'ll have to rename to something else first.\"\nmsgstr \"Entrer le nouveau ci-desous pour l'utilisateur. Veuillez noter que si vous tentez de cahnger les majuscules, vous devriez le renommer à quelque chose d'autres avant.\"\n\n#: /public/include/chat.js\nmsgid \"User renamed\"\nmsgstr \"Utilisateur renommé\"\n\n#: /public/include/chat.js\nmsgid \"Force Rename\"\nmsgstr \"Forcer le renommage\"\n\n#: /public/include/chat.js\nmsgid \"You cannot use chat while canvas banned.\"\nmsgstr \"Vous de pouvez pas utiliser le tchat en étant banni du canvas.\"\n\n#: /public/include/lookup.js\nmsgid \"Sending...\"\nmsgstr \"Envoi...\"\n\n#: /public/include/lookup.js\nmsgid \"additional information:\"\nmsgstr \"information additionnelle :\"\n\n#: /public/include/lookup.js\nmsgid \"Report Pixel\"\nmsgstr \"Signaler le pixel\"\n\n#: /public/include/lookup.js\nmsgid \"This pixel is background (was not placed by a user).\"\nmsgstr \"Ce pixel fait parti du fond (non placé par un utilisateur).\"\n\n#: /public/include/lookup.js\nmsgid \"Hide sensitive information\"\nmsgstr \"Cacher les informations sensible\"\n\n#: /public/include/lookup.js\nmsgid \"Move Template Here\"\nmsgstr \"Déplacer ici le modèle\"\n\n#: /public/include/lookup.js\nmsgid \"An error occurred, either you aren't logged in or you may be attempting to look up users too fast. Please try again in 60 seconds\"\nmsgstr \"Une erreur est apparue, soit vous n'êtes pas connecté ou vous tentez de voir des données trop rapidement. Réessayez dans 60 secondes\"\n\n#: /public/include/lookup.js\nmsgid \"Coords\"\nmsgstr \"Coord.\"\n\n#: /public/include/lookup.js\nmsgid \"View Profile\"\nmsgstr \"Voir le profil\"\n\n#: /public/include/lookup.js\nmsgid \"Origin\"\nmsgstr \"Origine\"\n\n#: /public/include/lookup.js\nmsgid \"Part of a nuke\"\nmsgstr \"Fait parti d'une nuke\"\n\n#: /public/include/lookup.js\nmsgid \"Placed by a staff member using placement overrides\"\nmsgstr \"Placé par un staff en utilisant une dérogation de placement\"\n\n#: /public/include/lookup.js\nmsgid \"Time\"\nmsgstr \"Temps\"\n\n#: /public/include/lookup.js\nmsgid \"just now\"\nmsgstr \"maintenant\"\n\n#: /public/include/lookup.js\nmsgid \"${hoursStr}:${minuteStr}:${secsStr} ago\"\nmsgstr \"il y a ${hoursStr}:${minuteStr}:${secsStr}\"\n\n#: /public/include/lookup.js\nmsgid \"Discord\"\nmsgstr \"Discord\"\n\n#: /public/include/notifications.js\nmsgid \"Posted by ${notification.who}\"\nmsgstr \"Posté par ${notification.who}\"\n\n#: /public/include/notifications.js\nmsgid \"Expires ${expiry}\"\nmsgstr \"Expire ${expiry}\"\n\n#: /public/include/template.js\nmsgid \"There was an error getting the image\"\nmsgstr \"Une erreur est apparue lors de l'acquisition de l'image\"\n\n#: /public/include/timer.js\nmsgid \"Your next pixel will be available in ${delay} seconds!\"\nmsgstr \"Votre prochain pixel sera disponible dans ${delay} secondes !\"\n\n#: /public/include/timer.js\nmsgid \"Your next pixel has been available for ${alertDelay} seconds!\"\nmsgstr \"Votre pixel est disponible depuis ${alertDelay} secondes !\"\n\n#: /public/include/timer.js\nmsgid \"Your next pixel is available!\"\nmsgstr \"Votre prochain pixel est disponible !\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Dark\"\nmsgstr \"Sombre\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Darker\"\nmsgstr \"Foncé\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Blue\"\nmsgstr \"Bleu\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Purple\"\nmsgstr \"Violet\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Green\"\nmsgstr \"Vert\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Matte\"\nmsgstr \"Mate\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Terminal\"\nmsgstr \"Terminal\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Red\"\nmsgstr \"Rouge\"\n\n#: /public/include/uiHelper.js\nmsgid \"A new ${type} report has been received.\"\nmsgstr \"Un nouveau signalement ${type} a été reçu.\"\n\n#: /public/include/uiHelper.js\nmsgid \"Cannot fetch local files. Use the file selector in template settings.\"\nmsgstr \"Impossible de récupérer des fichiers locaux. Utilisez le sélecteur de fichiers dans les paramètres du modèle.\"\n\n#: /public/include/uiHelper.js\nmsgid \"Redirect Warning\"\nmsgstr \"Avertissement de redirection\"\n\n#: /public/include/uiHelper.js\nmsgid \"Are you sure you want to redirect to the following URL?\"\nmsgstr \"Êtes-vous sûr de vouloir vous rediriger vers l'URL suivante ?\"\n\n#: /public/include/uiHelper.js\nmsgid \"Drag and dropped file must be a valid image.\"\nmsgstr \"Les fichiers en glisser-déposer doivent être une image valide.\"\n\n#: /public/include/uiHelper.js\nmsgid \"Discord name updated successfully\"\nmsgstr \"Nom d'utilisateur Discord mis à jour\"\n\n#: /public/include/uiHelper.js\nmsgid \"Couldn\\\\'t change discord name: \"\nmsgstr \"N'a pas pu changer le nom d'utilisateur Discord : \"\n\n#: /public/include/user.js\nmsgid \"By logging in or registering, you agree to the <a href=\\\"{0}\\\" target=\\\"_blank\\\">terms of use</a> and <a href=\\\"{1}\\\" target=\\\"_blank\\\">privacy policy</a>.\"\nmsgstr \"En se connectant ou s'enregistrant, vous acceptez les <a href=\\\"{0}\\\" target=\\\"_blank\\\">conditions d'utilisation</a> et la <a href=\\\"{1}\\\" target=\\\"_blank\\\">charte de confidentialité</a>.\"\n\n#: /public/include/user.js\nmsgid \"Sign in with {0}\"\nmsgstr \"Se connecter avec {0}\"\n\n#: /public/include/user.js\nmsgid \"New Accounts Disabled\"\nmsgstr \"Nouveaux comptes désactivés\"\n\n#: /public/include/user.js\nmsgid \"online\"\nmsgstr \"en ligne\"\n\n#: /public/include/user.js\nmsgid \"Sign Out\"\nmsgstr \"Se déconnecter\"\n\n#: /public/include/user.js\nmsgid \"Are you sure you want to sign out?\"\nmsgstr \"Êtes-vous sur de vous déconnecter ?\"\n\n#: /public/include/user.js\nmsgid \"You are permanently banned.\"\nmsgstr \"Vous êtes définitivement banni.\"\n\n#: /public/include/user.js\nmsgid \"You are temporarily banned and will not be allowed to place until ${timestamp}\"\nmsgstr \"Vous êtes temporairement banni et n'êtes plus autorisé à placer jusqu'à ${timestamp}\"\n\n#: /public/include/user.js\nmsgid \"You can contact us using one of the links in the info menu.\"\nmsgstr \"Vous pouvez nous contacter via un des liens du menu d'informations.\"\n\n#: /public/include/user.js\nmsgid \"If you think this was an error, please contact us using one of the links in the info tab.\"\nmsgstr \"Si vous pensez que c'est une erreur, veuillez nous contacter via un des liens du menu d'informations.\"\n\n#: /public/include/user.js\nmsgid \"Ban reason:\"\nmsgstr \"Raison du bannissement :\"\n\n#: /public/include/user.js\nmsgid \"An unknown error occurred. Please contact staff on discord\"\nmsgstr \"Une erreur inconnue est apparue. Merci de contacter un staff sur Discord\"\n\n#: /public/include/user.js\nmsgid \"Staff have required you to change your username, this usually means your name breaks one of our rules.\"\nmsgstr \"Le staff vous demande de changer votre pseudonyme, cela signifie généralement que votre nom enfreint l'une de nos règles.\"\n\n#: /public/include/user.js\nmsgid \"If you disagree, please contact us on Discord (link in the info panel).\"\nmsgstr \"Si vous refusez, merci de nous contacter sur Discord (lien dans le menu d'informations).\"\n\n#: /public/include/user.js\nmsgid \"New Username:\"\nmsgstr \"Nouveau pseudo :\"\n\n#: /public/include/user.js\nmsgid \"Not now\"\nmsgstr \"Pas maintenant\"\n\n#: /public/include/user.js\nmsgid \"Change\"\nmsgstr \"Changer\"\n\n#: /public/include/user.js\nmsgid \"You must change your username.\"\nmsgstr \"Vous devez changer votre pseudonyme.\"\n\n#: /public/include/user.js\nmsgid \"Click here to continue.\"\nmsgstr \"Cliquez ici pour continuer.\"\n\n#: /public/pxls.js\nmsgid \"Alert\"\nmsgstr \"Alerte\"\n";

const locale_fr_46ts_8b862775 = () => poToMessages(source$6);

const source$5 = "msgid \"\"\nmsgstr \"\"\n\"Project-Id-Version: Pxls\\n\"\n\"POT-Creation-Date: 2024-09-07T20:41:44.977Z\\n\"\n\"PO-Revision-Date: 2024-01-20 11:30+0000\\n\"\n\"Last-Translator: Starshine\\n\"\n\"Language-Team: German <https://weblate.pxls.space/projects/pxls-space/pxls-web/de/>\\n\"\n\"Language: de\\n\"\n\"Content-Type: text/plain; charset=UTF-8\\n\"\n\"Content-Transfer-Encoding: 8bit\\n\"\n\"Plural-Forms: nplurals=2; plural=n != 1;\\n\"\n\"X-Generator: Weblate 5.3.1\\n\"\n\n#: /views/error.handlebars /views/profile.handlebars /public/include/user.js\nmsgid \"My Profile\"\nmsgstr \"Mein Profil\"\n\n#: /views/error.handlebars /views/profile.handlebars\nmsgid \"My Factions\"\nmsgstr \"Meine Gilden\"\n\n#. HTTP status code name\n#: /views/error.handlebars\nmsgid \"Not Found\"\nmsgstr \"Nicht gefunden\"\n\n#: /views/error.handlebars\nmsgid \"The content you requested could not be found at this URL. If you believe this is an error, please contact a developer.\"\nmsgstr \"Der von dir angeforderte Inhalt konnte unter dieser URL nicht gefunden werden. Wenn du glaubst, dass dies ein Fehler ist, kontaktiere bitte einen Entwickler.\"\n\n#. links to the homepage (the app itself)\n#: /views/error.handlebars\nmsgid \"Back to Pxls\"\nmsgstr \"Zurück zu Pxls\"\n\n#. HTTP status code name\n#: /views/error.handlebars\nmsgid \"Not Authenticated\"\nmsgstr \"Nicht authentifiziert\"\n\n#: /views/error.handlebars\nmsgid \"You must be logged in to access this data. Please go back to pxls and go through the authentication process.\"\nmsgstr \"Du musst eingeloggt sein, um diese Daten abrufen zu können. Bitte gehe zurück zu Pxls und durchlaufe den Authentifizierungsprozess.\"\n\n#. HTTP status code name\n#: /views/error.handlebars\nmsgid \"Not Allowed\"\nmsgstr \"Nicht Erlaubt\"\n\n#: /views/error.handlebars\nmsgid \"The action you attempted to perform is not allowed or resulted in an error. Please ensure you have access to the endpoint and try again later.\"\nmsgstr \"Die Aktion, die du versucht hast auszuführen, ist nicht erlaubt oder hat zu einem Fehler geführt. Bitte stelle sicher, dass du Zugriff auf den Endpunkt hast und versuche es später noch einmal.\"\n\n#: /views/index.handlebars\nmsgid \"Place pixels with people to create art\"\nmsgstr \"Platziere Pixel mit Menschen um Kunst zu schaffen\"\n\n#: /views/index.handlebars\nmsgid \"Lost connection to server, reconnecting...\"\nmsgstr \"Verbindung zum Server verloren. Verbindung wiederherstellen...\"\n\n#: /views/index.handlebars\nmsgid \"Loading Heatmap (press <kbd>H</kbd> to cancel)\"\nmsgstr \"Heatmap wird geladen (drücke <kbd>H</kbd> zum abbrechen)\"\n\n#: /views/index.handlebars\nmsgid \"Loading Virginmap (press <kbd>X</kbd> to cancel)\"\nmsgstr \"Virginmap wird geladen (drücke <kbd>X</kbd> zum abbrechen)\"\n\n#: /views/index.handlebars\nmsgid \"Logout\"\nmsgstr \"Abmelden\"\n\n#: /views/index.handlebars\nmsgid \"Canvas:\"\nmsgstr \"Leinwand:\"\n\n#: /views/index.handlebars\nmsgid \"N/A\"\nmsgstr \"k.A.\"\n\n#: /views/index.handlebars\nmsgid \"All Time:\"\nmsgstr \"Gesamt:\"\n\n#: /views/index.handlebars\nmsgid \"Loading online user count&hellip;\"\nmsgstr \"Online-Benutzer werden geladen&hellip;\"\n\n#: /views/index.handlebars /public/admin/admin.js /public/include/lookup.js\nmsgid \"Pixels\"\nmsgstr \"Pixels\"\n\n#: /views/index.handlebars\nmsgid \"Undo\"\nmsgstr \"Rückgängig\"\n\n#: /views/index.handlebars\nmsgid \"You are not signed in.\"\nmsgstr \"Du bist nicht angemeldet.\"\n\n#: /views/index.handlebars /public/include/user.js\nmsgid \"Sign in with...\"\nmsgstr \"Melde dich an mit...\"\n\n#: /views/index.handlebars\nmsgid \"Loading...\"\nmsgstr \"Laden...\"\n\n#: /views/index.handlebars\nmsgid \"Sign up\"\nmsgstr \"Registrieren\"\n\n#: /views/index.handlebars\nmsgid \"Pick a username\"\nmsgstr \"Wähle einen Nutzernamen\"\n\n#: /views/index.handlebars\nmsgid \"Username:\"\nmsgstr \"Nutzername:\"\n\n#: /views/index.handlebars\nmsgid \"Discord Tag (Optional):\"\nmsgstr \"Discord Tag (optional):\"\n\n#: /views/index.handlebars\nmsgid \"Drag and drop template image\"\nmsgstr \"Vorlage hineinziehen und ablegen\"\n\n#: /views/index.handlebars\nmsgid \"Exit\"\nmsgstr \"Verlassen\"\n\n#: /views/index.handlebars /views/profile.handlebars\nmsgid \"Info\"\nmsgstr \"Info\"\n\n#: /views/index.handlebars\nmsgid \"Close Panel\"\nmsgstr \"Panel schließen\"\n\n#: /views/index.handlebars /public/include/chat.js\nmsgid \"Chat\"\nmsgstr \"Chat\"\n\n#: /views/index.handlebars\nmsgid \"Pings\"\nmsgstr \"Erwähnungen\"\n\n#: /views/index.handlebars\nmsgid \"Settings\"\nmsgstr \"Einstellungen\"\n\n#: /views/index.handlebars\nmsgid \"Jump To Bottom\"\nmsgstr \"Zum Anfang springen\"\n\n#: /views/index.handlebars\nmsgid \"Replying to\"\nmsgstr \"Antwort an\"\n\n#: /views/index.handlebars /public/include/chat.js\nmsgid \"On\"\nmsgstr \"Ein\"\n\n#: /views/index.handlebars\nmsgid \"Emoji\"\nmsgstr \"Emoji\"\n\n#: /views/index.handlebars\nmsgid \"Search\"\nmsgstr \"Suche\"\n\n#: /views/index.handlebars\nmsgid \"keybinds;keys;keyboard;hotkeys\"\nmsgstr \"tastenkürzel;taste;tastatur;hotkeys\"\n\n#: /views/index.handlebars\nmsgid \"Keybinds\"\nmsgstr \"Tastaturkürzel\"\n\n#: /views/index.handlebars\nmsgid \"general\"\nmsgstr \"generell\"\n\n#: /views/index.handlebars\nmsgid \"General\"\nmsgstr \"Generell\"\n\n#: /views/index.handlebars\nmsgid \"move;moving;panning;drag\"\nmsgstr \"bewegen;bewegung;schwenken;ziehen\"\n\n#: /views/index.handlebars\nmsgid \"Mouse/arrows/wasd to pan\"\nmsgstr \"Maus/Pfeile/WASD zum Bewegen\"\n\n#: /views/index.handlebars\nmsgid \"mousewheel;zooming\"\nmsgstr \"mausrad;zoomen\"\n\n#: /views/index.handlebars\nmsgid \"Scroll/pinch to zoom\"\nmsgstr \"Zum Zoomen scrollen/drücken\"\n\n#: /views/index.handlebars\nmsgid \"scroll;zooming\"\nmsgstr \"scroll;zoom\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>+</kbd>/<kbd>-</kbd> or <kbd>Q</kbd>/<kbd>E</kbd> to zoom\"\nmsgstr \"<kbd>+</kbd>/<kbd>-</kbd> oder <kbd>Q</kbd>/<kbd>E</kbd> zum Zoomen\"\n\n#: /views/index.handlebars\nmsgid \"lookups\"\nmsgstr \"nachschlagen\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>Shift</kbd> + Click/Hold touch to lookup pixel\"\nmsgstr \"<kbd>Shift</kbd> + klicken/halten zum Abrufen von Pixeln\"\n\n#: /views/index.handlebars\nmsgid \"overlays;alignment;grid hidden;grid shown;hide grid;show grid\"\nmsgstr \"Overlay;Ausrichtung;Gitter versteckt;Gitter angezeigt;Gitter anzeigen\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>G</kbd> to toggle grid\"\nmsgstr \"<kbd>G</kbd> um Gitternetz umzuschalten\"\n\n#: /views/index.handlebars\nmsgid \"close;information shown;information hidden;info shown;info hidden;hide information;show information\"\nmsgstr \"Schließen;Information angezeigt;Information versteckt;Info angezeigt;Info versteckt;Information ausblenden;Information einblenden\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>I</kbd> to open info\"\nmsgstr \"<kbd>I</kbd> um Info anzuzeigen\"\n\n#: /views/index.handlebars\nmsgid \"close;settings hidden;settings shown;hide settings;show settings\"\nmsgstr \"schließen;Einstellungen ausgeblendet;Einstellungen angezeigt;Einstellungen ausblenden;Einstellungen anzeigen\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>T</kbd> to open settings\"\nmsgstr \"<kbd>T</kbd> um Einstellungen zu öffnen\"\n\n#: /views/index.handlebars\nmsgid \"close;chat hidden;chat shown;hide chat;show chat\"\nmsgstr \"schließen;Chat ausgeblendet;Chat angezeigt;Chat ausblenden;Chat anzeigen\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>B</kbd> to open chat\"\nmsgstr \"<kbd>B</kbd> um Chat zu öffnen\"\n\n#: /views/index.handlebars\nmsgid \"canvas locked;move;moving;zoom;zooming\"\nmsgstr \"Leinwand gesperrt;bewegen;verschieben;zoom;zoomen\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>L</kbd> to toggle locking panning of the canvas\"\nmsgstr \"<kbd>L</kbd> um das verschieben und zoomen der Leinwand ein/auszuschalten\"\n\n#: /views/index.handlebars\nmsgid \"take screenshot;image;download;picture;canvas\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>P</kbd> to take a snapshot\"\nmsgstr \"<kbd>P</kbd> um einen screenshot zu machen\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels placed pixels;heatmap hidden;heatmap shown;hide heatmap;show heatmap\"\nmsgstr \"Overlays;Nutzeraktivität;platzierte Pixel;Heatmap versteckt;Heatmap angezeigt;Heatmap ausblenden;Heatmap einblenden\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>H</kbd> to toggle heatmap\"\nmsgstr \"<kbd>H</kbd> zum Umschalten der Heatmap\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels unplaced pixels;virginmap hidden;virginmap shown;hide virginmap;show virginmap\"\nmsgstr \"Overlays;Nutzeraktivität;unplatzierte Pixel;Virginmap versteckt;Virginmap angezeigt;Virginmap ausblenden;Virginmap einblenden\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>X</kbd> to toggle virginmap\"\nmsgstr \"<kbd>X</kbd> zum Umschalten der Virginmap\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels placed pixels;wipe;clean;\"\nmsgstr \"Overlays;Nutzeraktivität;platzierte Pixel;löschen;reinigen;\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>O</kbd> to clear heatmap\"\nmsgstr \"<kbd>O</kbd>, um die Heatmap zu löschen\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels unplaced pixels;wipe;clean;\"\nmsgstr \"Overlays;Nutzeraktivität;unplatzierte Pixel;löschen;reinigen;\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>U</kbd> to clear virginmap\"\nmsgstr \"<kbd>U</kbd>, um die Virginmap zu löschen\"\n\n#: /views/index.handlebars\nmsgid \"next color;previous color\"\nmsgstr \"nächste Farbe;vorherige Farbe\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>J</kbd>/<kbd>K</kbd> to cycle through palette colors\"\nmsgstr \"<kbd>J</kbd>/<kbd>K</kbd>, um durch Palettenfarben zu wechseln\"\n\n#: /views/index.handlebars\nmsgid \"current coordinates;coords\"\nmsgstr \"aktuelle Koordinaten;Koordinaten\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>C</kbd> to copy link of moused-over coordinates\"\nmsgstr \"<kbd>C</kbd>, um den Link der angezeigten Koordinaten zu kopieren\"\n\n#: /views/index.handlebars\nmsgid \"cancel selection\"\nmsgstr \"Auswahl abbrechen\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>ESC</kbd> to deselect current pixel\"\nmsgstr \"<kbd>ESC</kbd>, um das aktuelle Pixel abzuwählen\"\n\n#: /views/index.handlebars\nmsgid \"recenter;jump;center on template;guides;focus\"\nmsgstr \"neu zentrieren;springen;auf Vorlage zentrieren;Leitlinien;fokussieren\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>R</kbd> to center the board on the current template\"\nmsgstr \"<kbd>R</kbd>, um das Board auf die aktuelle Vorlage zu zentrieren\"\n\n#: /views/index.handlebars\nmsgid \"templates;guides\"\nmsgstr \"Vorlagen;Leitlinien\"\n\n#: /views/index.handlebars\nmsgid \"Template\"\nmsgstr \"Vorlage\"\n\n#: /views/index.handlebars\nmsgid \"transparency\"\nmsgstr \"Transparenz\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>Page Up</kbd> to increase opacity\"\nmsgstr \"<kbd>Bild hoch</kbd>, um die Deckkraft zu erhöhen\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>Page Down</kbd> to decrease opacity\"\nmsgstr \"<kbd>Bild runter</kbd>, um die Deckkraft zu verringern\"\n\n#: /views/index.handlebars\nmsgid \"hidden;shown;hide;show\"\nmsgstr \"versteckt;angezeigt;ausblenden;einblenden\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>V</kbd> to toggle visibility\"\nmsgstr \"<kbd>V</kbd>, um die Sichtbarkeit umzuschalten\"\n\n#: /views/index.handlebars\nmsgid \"Note: These values are based on QWERTY keyboards. For other layouts, use the keys corresponding to the same position on a QWERTY keyboard.\"\nmsgstr \"Hinweis: Diese Werte basieren auf QWERTY-Tastaturen. Bei anderen Layouts verwenden Sie die Tasten, die sich an der gleichen Position auf einer QWERTY-Tastatur befinden.\"\n\n#: /views/index.handlebars\nmsgid \"templates;overlays;guides\"\nmsgstr \"Vorlagen;Overlays;Leitlinien\"\n\n#: /views/index.handlebars\nmsgid \"templates;overlays;image;pixel art\"\nmsgstr \"Vorlagen;Overlays;Bild;Pixelkunst\"\n\n#: /views/index.handlebars\nmsgid \"template enabled;template disabled;show template;hide template;template shown;template hidden\"\nmsgstr \"Vorlage aktiviert;Vorlage deaktiviert;Vorlage anzeigen;Vorlage ausblenden;Vorlage angezeigt;Vorlage versteckt\"\n\n#: /views/index.handlebars\nmsgid \"Use template\"\nmsgstr \"Vorlage verwenden\"\n\n#: /views/index.handlebars\nmsgid \"Hold down <kbd>Ctrl</kbd> (or <kbd>Option</kbd> on mac) to drag the template around\"\nmsgstr \"Halten Sie <kbd>Strg</kbd> (oder <kbd>Option</kbd> auf dem Mac) gedrückt, um die Vorlage zu verschieben\"\n\n#: /views/index.handlebars\nmsgid \"template title;template name;tab name;tab title;title=\"\nmsgstr \"Vorlagentitel;Vorlagenname;Tab-Name;Tab-Titel;Titel=\"\n\n#: /views/index.handlebars\nmsgid \"Title:\"\nmsgstr \"Titel:\"\n\n#: /views/index.handlebars\nmsgid \"template location source;template source URL;template URL;template=\"\nmsgstr \"Vorlagenquelle;Vorlagenquellen-URL;Vorlagen-URL;Vorlage=\"\n\n#: /views/index.handlebars\nmsgid \"URL:\"\nmsgstr \"URL:\"\n\n#: /views/index.handlebars\nmsgid \"template position;template x;template y;template location; template vertical; template horizontal;ox=;oy=\"\nmsgstr \"Vorlagenposition;Vorlage X;Vorlage Y;Vorlagenstandort;Vorlage vertikal;Vorlage horizontal;ox=;oy=\"\n\n#: /views/index.handlebars\nmsgid \"Horizontal position:\"\nmsgstr \"Horizontale Position:\"\n\n#: /views/index.handlebars\nmsgid \"Vertical position:\"\nmsgstr \"Vertikale Position:\"\n\n#: /views/index.handlebars\nmsgid \"template width;tw=\"\nmsgstr \"Vorlagenbreite;tw=\"\n\n#: /views/index.handlebars\nmsgid \"Width:\"\nmsgstr \"Breite:\"\n\n#: /views/index.handlebars\nmsgid \"Reset\"\nmsgstr \"Zurücksetzen\"\n\n#: /views/index.handlebars\nmsgid \"template style;custom template\"\nmsgstr \"Vorlagenstil;benutzerdefinierte Vorlage\"\n\n#: /views/index.handlebars\nmsgid \"Style:\"\nmsgstr \"Stil:\"\n\n#: /views/index.handlebars\nmsgid \"Use Source Style\"\nmsgstr \"Quellenstil verwenden\"\n\n#: /views/index.handlebars\nmsgid \"1-to-1\"\nmsgstr \"1-zu-1\"\n\n#: /views/index.handlebars\nmsgid \"1-to-1 (keep incorrect colors)\"\nmsgstr \"1-zu-1 (falsche Farben beibehalten)\"\n\n#: /views/index.handlebars\nmsgid \"Dotted (Small, 1:2)\"\nmsgstr \"Gepunktet (Klein, 1:2)\"\n\n#: /views/index.handlebars\nmsgid \"Dotted (Big, 2:2)\"\nmsgstr \"Gepunktet (Groß, 2:2)\"\n\n#: /views/index.handlebars\nmsgid \"Symbols\"\nmsgstr \"Symbole\"\n\n#: /views/index.handlebars\nmsgid \"Numbers\"\nmsgstr \"Zahlen\"\n\n#: /views/index.handlebars\nmsgid \"Custom…\"\nmsgstr \"Benutzerdefiniert…\"\n\n#: /views/index.handlebars\nmsgid \"template style source;template style URL;custom style URL;custom template\"\nmsgstr \"Vorlagenstilquelle;Vorlagenstil-URL;benutzerdefinierte Stil-URL;benutzerdefinierte Vorlage\"\n\n#: /views/index.handlebars\nmsgid \"Custom style URL:\"\nmsgstr \"Benutzerdefinierte Stil-URL:\"\n\n#: /views/index.handlebars\nmsgid \"template conversion;template palette conversion;convert to palette\"\nmsgstr \"Vorlagenkonvertierung;Vorlagenpalettenkonvertierung;in Palette konvertieren\"\n\n#: /views/index.handlebars\nmsgid \"Color Conversion Mode:\"\nmsgstr \"Farbkonvertierungsmodus:\"\n\n#: /views/index.handlebars\nmsgid \"Unconverted\"\nmsgstr \"Unkonvertiert\"\n\n#: /views/index.handlebars\nmsgid \"Nearest Custom\"\nmsgstr \"Nächste benutzerdefinierte\"\n\n#: /views/index.handlebars\nmsgid \"template transparency;template opacity;oo=\"\nmsgstr \"Vorlagentransparenz;Vorlagendeckkraft;oo=\"\n\n#: /views/index.handlebars\nmsgid \"Opacity:\"\nmsgstr \"Deckkraft:\"\n\n#: /views/index.handlebars\nmsgid \"ui;interface\"\nmsgstr \"UI;Benutzeroberfläche\"\n\n#: /views/index.handlebars\nmsgid \"UI Settings\"\nmsgstr \"UI-Einstellungen\"\n\n#: /views/index.handlebars\nmsgid \"language override;text\"\nmsgstr \"Sprachüberschreibung;Text\"\n\n#: /views/index.handlebars\nmsgid \"Language override:\"\nmsgstr \"Sprachüberschreibung:\"\n\n#: /views/index.handlebars\nmsgid \"Use Browser Language\"\nmsgstr \"Browser-Sprache verwenden\"\n\n#: /views/index.handlebars\nmsgid \"English\"\nmsgstr \"Englisch\"\n\n\n#: /views/index.handlebars\nmsgid \"Bulgarian\"\nmsgstr \"Bulgarisch\"\n\n#: /views/index.handlebars\nmsgid \"French\"\nmsgstr \"Französisch\"\n\n#: /views/index.handlebars\nmsgid \"German\"\nmsgstr \"Deutsch\"\n\n#: /views/index.handlebars\nmsgid \"Russian\"\nmsgstr \"Russisch\"\n\n#: /views/index.handlebars\nmsgid \"Swedish\"\nmsgstr \"Schwedisch\"\n\n#: /views/index.handlebars\nmsgid \"Finnish\"\nmsgstr \"Finnisch\"\n\n#: /views/index.handlebars\nmsgid \"Toki Pona\"\nmsgstr \"Toki Pona\"\n\n#: /views/index.handlebars\nmsgid \"themes;look;stylesheets;visuals\"\nmsgstr \"Themen;Aussehen;Stylesheets;Visuals\"\n\n#: /views/index.handlebars\nmsgid \"Theme:\"\nmsgstr \"Thema:\"\n\n#: /views/index.handlebars\nmsgid \"Default\"\nmsgstr \"Standard\"\n\n#: /views/index.handlebars\nmsgid \"hide reticule;hide reticle;reticule shown reticle shown;reticule hidden;reticle hidden\"\nmsgstr \"Fadenkreuz ausblenden;Fadenkreuz anzeigen;Fadenkreuz angezeigt;Fadenkreuz versteckt\"\n\n#: /views/index.handlebars\nmsgid \"Show reticule\"\nmsgstr \"Fadenkreuz anzeigen\"\n\n#: /views/index.handlebars\nmsgid \"hide cursor;cursor shown;cursor hidden\"\nmsgstr \"Cursor ausblenden;Cursor anzeigen;Cursor versteckt\"\n\n#: /views/index.handlebars\nmsgid \"Show cursor\"\nmsgstr \"Cursor anzeigen\"\n\n#: /views/index.handlebars\nmsgid \"darkness filter\"\nmsgstr \"Dunkelheitsfilter\"\n\n#: /views/index.handlebars\nmsgid \"Enable color brightness\"\nmsgstr \"Farbsättigung aktivieren\"\n\n#: /views/index.handlebars\nmsgid \"Warning: Known to cause fuzziness in Chrome on some Mac/Linux installs\"\nmsgstr \"Warnung: Kann auf einigen Mac/Linux-Installationen in Chrome Unschärfe verursachen\"\n\n#: /views/index.handlebars\nmsgid \"Color brightness:\"\nmsgstr \"Farbsättigung:\"\n\n#: /views/index.handlebars\nmsgid \"keep current selected;keep curent color;place\"\nmsgstr \"Aktuelle Auswahl beibehalten;aktuelle Farbe beibehalten;platzieren\"\n\n#: /views/index.handlebars\nmsgid \"Deselect color after placing\"\nmsgstr \"Farbe nach Platzierung abwählen\"\n\n#: /views/index.handlebars\nmsgid \"mousewheel;palette scrolling\"\nmsgstr \"Mausrad;Paletten-Scrolling\"\n\n#: /views/index.handlebars\nmsgid \"Enable scrolling on the palette to switch colors\"\nmsgstr \"Scrolling in der Palette zum Wechseln der Farben aktivieren\"\n\n#: /views/index.handlebars\nmsgid \"reverse scrolling;mousewheel;palette scrolling;enable scrolling on the palette to switch colors\"\nmsgstr \"Scrolling umkehren;Mausrad;Paletten-Scrolling;Scrolling in der Palette aktivieren, um Farben zu wechseln\"\n\n#: /views/index.handlebars\nmsgid \"Invert scroll direction\"\nmsgstr \"Scrollrichtung umkehren\"\n\n#: /views/index.handlebars\nmsgid \"indexed colors;palette indicies\"\nmsgstr \"Indizierte Farben;Palettenindizes\"\n\n#: /views/index.handlebars\nmsgid \"Add numbers to palette entries\"\nmsgstr \"Nummern zu Paletteneinträgen hinzufügen\"\n\n#: /views/index.handlebars\nmsgid \"scrollbar;palette scrolling\"\nmsgstr \"Scrollleiste;Paletten-Scrolling\"\n\n#: /views/index.handlebars\nmsgid \"Enable thin scrollbar\"\nmsgstr \"Dünne Scrollleiste aktivieren\"\n\n#: /views/index.handlebars\nmsgid \"scrollbar;palette scrolling;palette stack\"\nmsgstr \"Scrollleiste;Paletten-Scrolling;Palettenstapel\"\n\n#: /views/index.handlebars\nmsgid \"Enable palette stacking\"\nmsgstr \"Palettenstapel aktivieren\"\n\n#: /views/index.handlebars\nmsgid \"floating bubble location\"\nmsgstr \"fliegende Infobox position\"\n\n#: /views/index.handlebars\nmsgid \"Bubble position:\"\nmsgstr \"Infobox position:\"\n\n#: /views/index.handlebars\nmsgid \"Top left\"\nmsgstr \"Oben links\"\n\n#: /views/index.handlebars\nmsgid \"Top right\"\nmsgstr \"Oben rechts\"\n\n#: /views/index.handlebars\nmsgid \"Bottom left\"\nmsgstr \"Unten links\"\n\n#: /views/index.handlebars\nmsgid \"Bottom right\"\nmsgstr \"Unten rechts\"\n\n#: /views/index.handlebars\nmsgid \"broken;offset workaround\"\nmsgstr \"Fehlerhaft;Offset-Workaround\"\n\n#: /views/index.handlebars\nmsgid \"Attempt to fix canvas displacement bug in Chrome 78+\"\nmsgstr \"Versuch, den Canvas-Verschiebungsfehler in Chrome 78+ zu beheben\"\n\n#: /views/index.handlebars\nmsgid \"chat;message;ping sound\"\nmsgstr \"Chat;Nachricht;Ping-Ton\"\n\n#: /views/index.handlebars\nmsgid \"Chat Settings\"\nmsgstr \"Chat-Einstellungen\"\n\n#: /views/index.handlebars\nmsgid \"username;color;colour\"\nmsgstr \"Benutzername;Farbe\"\n\n#: /views/index.handlebars\nmsgid \"Username Color:\"\nmsgstr \"Farbe des Benutzernamens:\"\n\n#: /views/index.handlebars\nmsgid \"chat message;chat ui\"\nmsgstr \"Chat-Nachricht;Chat-Oberfläche\"\n\n#: /views/index.handlebars\nmsgid \"Interface\"\nmsgstr \"Oberfläche\"\n\n#: /views/index.handlebars\nmsgid \"enable;disable\"\nmsgstr \"aktivieren;deaktivieren\"\n\n#: /views/index.handlebars\nmsgid \"Enable chat\"\nmsgstr \"Chat aktivieren\"\n\n#: /views/index.handlebars\nmsgid \"Page must be reloaded after changing\"\nmsgstr \"Die Seite muss nach Änderung neu geladen werden\"\n\n#: /views/index.handlebars\nmsgid \"chat size;chat font\"\nmsgstr \"Chat-Größe;Chat-Schriftart\"\n\n#: /views/index.handlebars\nmsgid \"Font Size:\"\nmsgstr \"Schriftgröße:\"\n\n#: /views/index.handlebars\nmsgid \"time;timestamps\"\nmsgstr \"Zeit;Zeitstempel\"\n\n#: /views/index.handlebars\nmsgid \"24 Hour Timestamps\"\nmsgstr \"24-Stunden-Zeitstempel\"\n\n#: /views/index.handlebars\nmsgid \"badges;pixel count;pixels placed\"\nmsgstr \"Abzeichen;Pixelanzahl;platzierte Pixel\"\n\n#: /views/index.handlebars\nmsgid \"Show pixel-placed badges\"\nmsgstr \"Abzeichen für platzierte Pixel anzeigen\"\n\n#: /views/index.handlebars\nmsgid \"badges;factions\"\nmsgstr \"Abzeichen;Fraktionen\"\n\n#: /views/index.handlebars\nmsgid \"Show faction tags\"\nmsgstr \"Fraktionstags anzeigen\"\n\n#: /views/index.handlebars\nmsgid \"template urls;template links;template name\"\nmsgstr \"Vorlagen-URLs;Vorlagen-Links;Vorlagenname\"\n\n#: /views/index.handlebars\nmsgid \"Replace template titles with URLs in chat where applicable\"\nmsgstr \"Vorlagentitel im Chat durch URLs ersetzen, falls zutreffend\"\n\n#: /views/index.handlebars\nmsgid \"chat orientation;chat position\"\nmsgstr \"Chat-Ausrichtung;Chat-Position\"\n\n#: /views/index.handlebars\nmsgid \"Enable horizontal chat\"\nmsgstr \"Horizontalen Chat aktivieren\"\n\n#: /views/index.handlebars\nmsgid \"banner;animation\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Enable the rotating banner under chat\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"max;messages;truncate\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Maximum amount of chat messages:\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"link;url;behaviour\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Default internal link action click:\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"link;url;behaviour;external;bypass;skip\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Skip external link popup\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Note: Has no effect if external link popups are disabled by the server.\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"chat icon;chat notifications;chat ping\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Chat icon badge mode:\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Show on unread ping\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Show on unread message\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Never show\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"chat icon;chat notifications;chat message\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Chat icon highlight mode:\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"ignored;ignores;unignore;blocked;blocking;unblock\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Ignores\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"unignore;unblock\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Unignore\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"overlays;virginmap;heatmap;grid\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Overlay Settings\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"heatmap;heatmap opacity;clear heatmap\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Heatmap\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Turn on heatmap\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"(toggle with <kbd>H</kbd>)\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"overlays;activity;pixels placed pixels;wipe;clean\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Clear heatmap\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"(hotkey: <kbd>O</kbd>)\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels placed pixels;transparency\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Heatmap background opacity:\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"virginmap;virginmap opacity;clear virginmap\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Virginmap\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Turn on virginmap\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"(toggle with <kbd>X</kbd>)\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels unplaced pixels;transparency\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Virginmap background opacity:\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"overlays;activity;pixels unplaced pixels;wipe;clean\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Clear virginmap\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"(hotkey: <kbd>U</kbd>)\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Layer template underneath heatmap\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"grid;toggle grid\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Grid\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Turn on grid\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"(toggle with <kbd>G</kbd>)\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"controls;zooming;panning;movement\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Control Settings\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"zooming;scrolling;scale;scaling\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Zooming\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"scrolling sensitivity;zooming sensitivity;mousewheel sensitivity\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Zoom sensitivity:\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"zooming limit;scrolling limit;mousewheel;zooming minimum;zooming maximum\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Minimum scale:\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Maximum scale:\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"rounding;zooming;scrolling;mousewheel;integer;decimal\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Round zoom values to nearest whole number\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"controls;miscellaneous\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Lock the canvas (disallow canvas drag/zoom with mouse/fingers)\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"MMB picker;mouse picker;selection;palette picker\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Enable middle mouse button selecting color from board\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"right click action\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Right-click action:\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Nothing\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Clear color\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Copy color\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Lookup\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Clear color + Lookup\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"snapshots;screenshot;download;picture;canvas\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Snapshot Settings\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"screenshot;snapshot;download;board;canvas\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"take screenshot;image;download format;picture;canvas;board\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Snapshot image format:\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"PNG\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"JPEG\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"WEBP (Chrome only)\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"sound;notification;alert;notify;ping\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Sound and Notification Settings\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"audio;mute;noise;volume\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Enable sound\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"notifs;notify;pixel notification\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Enable pixel available notification\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"notification;pixel ready;alert\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Pixel Ready Notification\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"alert source;notify url;notify source;notification url;notification source\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Alert URL:\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Update\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Test\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"sound level;audio level;mute audio;mute sound\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Volume:\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"alert forewarning;alert delay; notification delay; notification forewarning\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Delay (seconds):\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"chat mentions;chat pings;chat sound\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Chat Pings\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Enable pings\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"mention sound\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Play sound on ping:\"\nmsgstr \"\"\n\n#: /views/index.handlebars /public/include/chat.js\nmsgid \"Off\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Only when necessary\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Always\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"mention sound volume\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Ping sound volume:\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"personal account\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Account Settings\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Public Discord name:\"\nmsgstr \"\"\n\n#: /views/index.handlebars /public/include/chat.js\nmsgid \"Set\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Remove\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Help\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Notifications\"\nmsgstr \"\"\n\n#: /views/partials/faq.handlebars\nmsgid \"FAQ\"\nmsgstr \"\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Why is the cooldown as long as it is?\"\nmsgstr \"\"\n\n#: /views/partials/faq.handlebars\nmsgid \"The time it takes to get a pixel is dynamic, and changes based on how many people are online. The cooldown time is longer when more users are online.\"\nmsgstr \"\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Why does it say 0/6 pixels?\"\nmsgstr \"\"\n\n#: /views/partials/faq.handlebars\nmsgid \"This means that you are waiting for your next pixel. When you place a pixel, there is a cooldown for when you can place the next one. Over time, you can gain up to 6 \\\"stacked\\\" pixels to place at once.\"\nmsgstr \"\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Why does it take so long to \\\"stack\\\" pixels?\"\nmsgstr \"\"\n\n#: /views/partials/faq.handlebars\nmsgid \"This is by design. It is better to place a pixel as soon as you get one. Pixel \\\"stacking\\\" is meant to give you a bump if you go AFK for a bit. It takes around 20-30 minutes to get a full 6/6 pixels, but it only takes around 3 minutes to place 6 pixels if you place them as soon as possible.\"\nmsgstr \"\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I appeal a ban?\"\nmsgstr \"\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Contact us on <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord</a> or send an appeal to our <a href=\\\"https://pxls.space/appeal\\\" target=\\\"_blank\\\">Google form</a> after reading the rules in the site's info panel.\"\nmsgstr \"\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I make a template?\"\nmsgstr \"\"\n\n#: /views/partials/faq.handlebars\nmsgid \"A template is an image link that is posted in the template textbox in the settings panel so you can place over it on the canvas. You may use a regular image link to your pixel art, but many people use 3rd party tools like <a href=\\\"https://discord.gg/5MVDCq53vC\\\" target=\\\"blank\\\">Clueless</a> to turn pixel art into a fancier link. If you need to make pixel art yourself, you can use <a href=\\\"https://www.piskelapp.com/p/create\\\" target=\\\"_blank\\\">Piskel</a> to create art to put into Clueless.\"\nmsgstr \"\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I move a template?\"\nmsgstr \"\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Hold <kbd>CTRL</kbd> (or <kbd>OPTION</kbd> on macOS) and click and drag to move it around. On mobile, you can tap and hold where you want to move the template and click \\\"Move Template Here\\\" in the pop-up.\"\nmsgstr \"\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Does the canvas reset? When?\"\nmsgstr \"\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Yes. The canvas resets when it is completely full. A reset date is not usually decided until the canvas is full, but the average canvas life-span is around 1 month. Updates are posted in our <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord server</a> when a reset date is set.\"\nmsgstr \"\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Where can I see the past canvases?\"\nmsgstr \"\"\n\n#: /views/partials/faq.handlebars\nmsgid \"The past canvases are featured on our <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord server</a>, or the <a href=\\\"https://archives.pxls.space\\\" target=\\\"_blank\\\">archives</a>, which records timelapses and a lot of useful information on each canvas.\"\nmsgstr \"\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I see who placed a pixel?\"\nmsgstr \"\"\n\n#: /views/partials/faq.handlebars\nmsgid \"By shift-clicking (or tap and hold on mobile) a pixel, you can see who placed a pixel, how many pixels they have placed, and when they placed it.\"\nmsgstr \"\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I report someone?\"\nmsgstr \"\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Shift-click (or tap and hold on mobile) on a pixel, and click the Report button.\"\nmsgstr \"\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I change the color of my name in the chat?\"\nmsgstr \"\"\n\n#: /views/partials/faq.handlebars\nmsgid \"There is a \\\"Username Color\\\" option near the bottom of the settings panel.\"\nmsgstr \"\"\n\n#: /views/partials/faq.handlebars\nmsgid \"What is a \\\"virginmap\\\"?\"\nmsgstr \"\"\n\n#: /views/partials/faq.handlebars\nmsgid \"The virginmap shows which pixels have not yet been placed on (or “virgin” pixels).\"\nmsgstr \"\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I report bugs?\"\nmsgstr \"\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Submit bugs to the #dev-and-bugs forum in the <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord server</a>. If you have found an exploit, please message one of the staff members privately (through DMs) or open a modmail by DMing pxls.mail#8384.\"\nmsgstr \"\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I get more info or contact staff?\"\nmsgstr \"\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Check the info panel (the icon on the top left) for more details and links, or join our <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord server</a>, where a staff member will gladly respond.\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Welcome!\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Welcome to pxls.space! Pxls is a multiplayer online collaborative canvas based on Reddit's <a href=\\\"https://www.reddit.com/r/place\\\" target=\\\"_blank\\\">r/place</a> event from 2017 that allows you to create anything you can imagine, one pixel at a time. Join hundreds of other players in the Pxls community and create amazing works of art together as a team, or solo.\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"The best place to reach staff and fellow community is in the discord!\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Check out our social media pages, and please take the time to read the rules below. Have fun creating (or changing) art!\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Canvas Rules\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"We pride ourselves on trying to keep an open canvas for all free from outside interference on our end, and especially censorship. However, for the good of the community and on accounts of our own beliefs, please acknowledge and obey the following guidelines:\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"No hateful imagery or derogatory speech. This includes but is not limited to words such as <i>f****t</i>, <i>n****r</i>, etc; as well as the Swastika, Hammer and Sickle, and any symbols of terrorism.\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"No NSFW or NSFL content.\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"No nudity or otherwise sexually explicit content\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"No female-presenting nipples/bare breasts, genitalia, sexual fluids\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"No sexual imagery/erotica\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"No excessive blood or otherwise obscene/shocking content\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"No more than <b>one</b> account per user, no exceptions. Multiple account users will be banned from creating art on the canvas.\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"No auto-placement tools of any kind, you must place the pixels manually.\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Do not abuse site functionality, such as reports or lookups. (e.g. automated reporting/lookups, etc.)\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Any automated aggregation of data from user lookups is not allowed, and will result in a ban.\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Staff have final say in any rule disputes\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"If you feel a moderator has acted inappropriately, please report it to an administrator.\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"If you believe you have been falsely banned you may contact a moderator or administrator.\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Chat Rules\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Keep chat civil. No harassment or homophobic/transphobic/disablist language.\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"No hate speech. This includes emoji/symbols/ASCII art.\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Normal swearing/etc is allowed\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"No spamming\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"This includes excessive ASCII art/emojis/symbols/whitespace\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"No \\\"copy pasta\\\"s\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"No links to sites that actively break the canvas or chat rules (e.g. porn sites)\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"No symbology which break the canvas or chat rules (e.g. NSFW ASCII art)\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"No personal information\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Links\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Terms of Service\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Privacy Policy\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Discord (main hub)\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Twitter\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"GitHub (back end)\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"GitHub (front end)\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Single-player mode\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Statistics\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Profile (user info, factions, etc.)\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Wiki\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Generator, progress checker, and monitor for Pxls templates\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Archives\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"PxlsFiddle (archives)\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Donate\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Donations are not accepted at this time, but this panel will be updated when they're open again!\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"{0}'s Profile\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"My Data\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Reports\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Factions\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Data\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"You must be logged in to view your profile.\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Registration Date\"\nmsgstr \"\"\n\n#: /views/profile.handlebars /public/include/lookup.js\nmsgid \"Alltime Pixels\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Current Canvas Pixels\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Discord Tag\"\nmsgstr \"\"\n\n#: /views/profile.handlebars /public/include/lookup.js\nmsgid \"Faction\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"None\"\nmsgstr \"\"\n\n#: /views/profile.handlebars /public/admin/admin.js\nmsgid \"Roles\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Canvas Ban Expiry\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Never\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Chat Ban Expiry\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"View rankings and other stats <a href=\\\"/stats\\\">here</a>.\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"You must be logged in to view your reports.\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Canvas Reports ({0}/{1} open)\"\nmsgstr \"\"\n\n#. eg \"Report on Bob (closed)\n#: /views/profile.handlebars\nmsgid \"Report on {0} (closed)\"\nmsgstr \"\"\n\n#. eg \"Report on Bob (open)\n#: /views/profile.handlebars\nmsgid \"Report on {0} (open)\"\nmsgstr \"\"\n\n#. eg \"Reported Bob on Jan 1, 1970, 00:00:00 AM (UTC)\n#: /views/profile.handlebars\nmsgid \"Reported {0} on {1}\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"There are no canvas reports to show.\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Chat Reports ({0}/{1} open)\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"There are no chat reports to show.\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"You must be logged in to manage your factions.\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"You are faction restricted and cannot create new factions. If you believe this is an error, please contact a moderator.\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"You are canvas banned and cannot create new factions. If you believe this is an error, please contact a moderator.\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"You must have at least {0} all-time pixels to create a faction.\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Create\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Join\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"This is your currently displayed faction.\"\nmsgstr \"\"\n\n#. eg \"Pixelers (members: 100, ID: 1)\"\n#: /views/profile.handlebars\nmsgid \"{0} (members: {1}, ID: {2})\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Owner: {0}\"\nmsgstr \"\"\n\n#. makes the faction no longer the one displayed for the current user\n#: /views/profile.handlebars\nmsgid \"Remove Displayed\"\nmsgstr \"\"\n\n#. makes the faction the one displayed for the current user\n#: /views/profile.handlebars\nmsgid \"Set Displayed\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Members\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Edit\"\nmsgstr \"\"\n\n#: /views/profile.handlebars /public/include/chat.js\nmsgid \"Delete\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Leave\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"You are not in any factions yet!\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"You must be logged in to view your data.\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Log Keys\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Log keys can be used by those who have them to tell which pixels you placed on previous canvases.\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"You can see the public <a href=\\\"https://pxls.space/extra/logs/\\\" target=\\\"_blank\\\">Pxls Logs</a> to learn more.\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Canvas Code\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Log Key\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"You have no log keys yet!\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Log keys should show up here after a canvas you have placed on ends.\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Members of {0} ([{1}])\"\nmsgstr \"\"\n\n#: /views/profile.handlebars /public/admin/admin.js /public/include/lookup.js\nmsgid \"Close\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Faction Members\"\nmsgstr \"\"\n\n#. This loop only fires when on our own profile. We can't leave a faction we own, we can only transfer ownership, so no point in showing ourselves in the member list.\n#. since we can't leave the faction until we transfer, if there's only one member in the list it's assumed to be the owner. we don't want to show ourself in the list\n#: /views/profile.handlebars\nmsgid \"Transfer Ownership\"\nmsgstr \"\"\n\n#. bans a user from the faction\n#: /views/profile.handlebars /public/include/chat.js\nmsgid \"Ban\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Nothing to see here!\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Faction Bans\"\nmsgstr \"\"\n\n#: /views/profile.handlebars /public/admin/admin.js /public/include/chat.js\nmsgid \"Unban\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Find A Faction\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Search:\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Enter a search term to get started.\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Load More\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Send alert...\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Rule #1: Hateful/derogatory speech or symbols\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Rule #2: Nudity, genitalia, or non-PG-13 content\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Rule #3: Multi-account\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Rule #4: Botting\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Other (specify below)\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/chat.js /public/include/lookup.js\nmsgid \"Additional information (if applicable)\"\nmsgstr \"\"\n\n#. \"Revert pixels of the last *n* hours\", part before 'n'\n#: /public/admin/admin.js\nmsgid \"Revert pixels of the last \"\nmsgstr \"\"\n\n#. \"Revert pixels of the last *n* hours\", part after 'n'\n#: /public/admin/admin.js\nmsgid \" hours\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"You must specify the details.\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Something went wrong! Perhaps insufficient permissions?\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Shadowban user\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Shadowbanned user\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Permaban user\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Permabanned user\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Ban user\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Banned user\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Unbanned user ${username}\"\nmsgstr \"\"\n\n#. Context: ban type\n#: /public/admin/admin.js\nmsgid \"shadow\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"never\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"permanent\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/chat.js /public/include/uiHelper.js\n#: /public/include/user.js\nmsgid \"Yes\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/chat.js /public/include/uiHelper.js\n#: /public/include/user.js\nmsgid \"No\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Yes (permanent)\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Username\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/chat.js\nmsgid \"Profile\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Logins\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"All Time Pixels\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/user.js\nmsgid \"Rename Requested\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Discord Name\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/user.js\nmsgid \"Banned\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Chatbanned\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Ban Reason\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Ban Expiracy\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Chatban Reason\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"(canvas ban)\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"when canvas ban ends\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Chatban Expires\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Ban (24h)\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Permaban\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Shadowban\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Custom ban length: \"\nmsgstr \"\"\n\n#. Admin check. Example: type = 'username', arg = 'pxlsuser94'\n#: /public/admin/admin.js\nmsgid \"${type} ${arg} not found.\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Unban Reason:\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Unbanning ${username}\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/chat.js /public/include/lookup.js\n#: /public/include/user.js\nmsgid \"Cancel\"\nmsgstr \"\"\n\n#. Moderator panel label\n#: /public/admin/admin.js\nmsgid \"MOD\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Ignore cooldown\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Place any color\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Ignore placemap\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Ban user (24h)\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Unban user\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Check user\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"profile\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"User Agent\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Send Alert\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Mod Actions\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"More...\"\nmsgstr \"\"\n\n#. Snapshot save name\n#: /public/include/board.js\nmsgid \"pxls canvas\"\nmsgstr \"\"\n\n#. template link action\n#: /public/include/chat.js\nmsgid \"Ask\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Open in a new tab\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Open in current tab (replacing template)\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Jump to coordinates without replacing template\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Please upload your template image to a third-party image host.\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"You must have at least \"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \" pixels to send links.\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"You must be logged in to chat.\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"No Results\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Reply\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"none provided\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Purged by ${purge.initiator} with reason: ${reason}\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"External Link\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"This link is taking you to the following website:\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"The operators of this website have no responsibility or control over the contents hosted at {0}. Are you sure you want to go there?\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Note: You can disable this popup in settings.\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Visit Site\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"template:\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Open Failed\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Failed to automatically open in a new tab\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Click here to open in a new tab instead\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Open Template\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"This link will overwrite your current template. What would you like to do?\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Note: You can set a default action in the settings menu which bypasses this popup completely.\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"OK\"\nmsgstr \"\"\n\n#: /public/include/chat.js /public/include/lookup.js\nmsgid \"Report\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Mention\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Ignore\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Chat (un)ban\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Purge User\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Mod Lookup\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Chat Lookup\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Enter a reason for your report\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"You are reporting a chat message from ${reportTarget} with the content:\"\nmsgstr \"\"\n\n#: /public/include/chat.js /public/include/lookup.js\nmsgid \"Sent report!\"\nmsgstr \"\"\n\n#: /public/include/chat.js /public/include/lookup.js\nmsgid \"Error sending report.\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Report User\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"User ignored. You can unignore from chat settings.\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Failed to ignore user. Either they\\\\'re already ignored, or an error occurred. If the problem persists, contact a developer.\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Permanent\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Temporary\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Rule 3: Spam\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Rule 1: Chat civility\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Rule 2: Hate Speech\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Rule 5: NSFW\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Custom\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Banning:\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Message:\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Ban Length\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Reason\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Purge Messages\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Purging all messages is disabled during snip mode\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Silent (no purge message)\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Custom reason\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Additional information:\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Chatban initiated\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Error occurred while chatbanning\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Chatban\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Failed to delete\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"ID: \"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"User: \"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Message: \"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Reason: \"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Delete Message\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Purge\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Selected Message\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Purge Reason\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"User purged\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Error sending purge.\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Toggle Rename Request\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Select one of the options below to set the current rename request state.\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Rename request updated\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"An unknown error occurred. Please contact a developer\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"New Name: \"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Enter the new name for the user below. Please note that if you\\\\'re trying to change the caps, you\\\\'ll have to rename to something else first.\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"User renamed\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Force Rename\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"You cannot use chat while canvas banned.\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"Sending...\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"additional information:\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"Report Pixel\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"This pixel is background (was not placed by a user).\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"Hide sensitive information\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"Move Template Here\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"An error occurred, either you aren't logged in or you may be attempting to look up users too fast. Please try again in 60 seconds\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"Coords\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"View Profile\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"Origin\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"Part of a nuke\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"Placed by a staff member using placement overrides\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"Time\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"just now\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"${hoursStr}:${minuteStr}:${secsStr} ago\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"Discord\"\nmsgstr \"\"\n\n#: /public/include/notifications.js\nmsgid \"Posted by ${notification.who}\"\nmsgstr \"\"\n\n#: /public/include/notifications.js\nmsgid \"Expires ${expiry}\"\nmsgstr \"\"\n\n#: /public/include/template.js\nmsgid \"There was an error getting the image\"\nmsgstr \"\"\n\n#: /public/include/timer.js\nmsgid \"Your next pixel will be available in ${delay} seconds!\"\nmsgstr \"\"\n\n#: /public/include/timer.js\nmsgid \"Your next pixel has been available for ${alertDelay} seconds!\"\nmsgstr \"\"\n\n#: /public/include/timer.js\nmsgid \"Your next pixel is available!\"\nmsgstr \"\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Dark\"\nmsgstr \"\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Darker\"\nmsgstr \"\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Blue\"\nmsgstr \"\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Purple\"\nmsgstr \"\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Green\"\nmsgstr \"\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Matte\"\nmsgstr \"\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Terminal\"\nmsgstr \"\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Red\"\nmsgstr \"\"\n\n#: /public/include/uiHelper.js\nmsgid \"A new ${type} report has been received.\"\nmsgstr \"\"\n\n#: /public/include/uiHelper.js\nmsgid \"Cannot fetch local files. Use the file selector in template settings.\"\nmsgstr \"\"\n\n#: /public/include/uiHelper.js\nmsgid \"Redirect Warning\"\nmsgstr \"\"\n\n#: /public/include/uiHelper.js\nmsgid \"Are you sure you want to redirect to the following URL?\"\nmsgstr \"\"\n\n#: /public/include/uiHelper.js\nmsgid \"Drag and dropped file must be a valid image.\"\nmsgstr \"\"\n\n#: /public/include/uiHelper.js\nmsgid \"Discord name updated successfully\"\nmsgstr \"\"\n\n#: /public/include/uiHelper.js\nmsgid \"Couldn\\\\'t change discord name: \"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"By logging in or registering, you agree to the <a href=\\\"{0}\\\" target=\\\"_blank\\\">terms of use</a> and <a href=\\\"{1}\\\" target=\\\"_blank\\\">privacy policy</a>.\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"Sign in with {0}\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"New Accounts Disabled\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"online\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"Sign Out\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"Are you sure you want to sign out?\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"You are permanently banned.\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"You are temporarily banned and will not be allowed to place until ${timestamp}\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"You can contact us using one of the links in the info menu.\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"If you think this was an error, please contact us using one of the links in the info tab.\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"Ban reason:\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"An unknown error occurred. Please contact staff on discord\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"Staff have required you to change your username, this usually means your name breaks one of our rules.\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"If you disagree, please contact us on Discord (link in the info panel).\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"New Username:\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"Not now\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"Change\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"You must change your username.\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"Click here to continue.\"\nmsgstr \"\"\n\n#: /public/pxls.js\nmsgid \"Alert\"\nmsgstr \"\"\n";

const locale_de_46ts_d8ed6a5e = () => poToMessages(source$5);

const source$4 = "msgid \"\"\nmsgstr \"\"\n\"Project-Id-Version: Pxls\\n\"\n\"POT-Creation-Date: 2024-09-07T20:41:44.977Z\\n\"\n\"Language: \\n\"\n\"Content-Type: text/plain; charset=UTF-8\\n\"\n\n#: /views/error.handlebars /views/profile.handlebars /public/include/user.js\nmsgid \"My Profile\"\nmsgstr \"Mans Profils\"\n\n#: /views/error.handlebars /views/profile.handlebars\nmsgid \"My Factions\"\nmsgstr \"Manas Frakcijas\"\n\n#. HTTP status code name\n#: /views/error.handlebars\nmsgid \"Not Found\"\nmsgstr \"Nav Atrasts\"\n\n#: /views/error.handlebars\nmsgid \"The content you requested could not be found at this URL. If you believe this is an error, please contact a developer.\"\nmsgstr \"Saturs, kuru meklējāt, nevarēja būt atrasts šajā URL. Ja uzskatāt ka šī ir kļūda, sazinieties ar izstrādātāju.\"\n\n#. links to the homepage (the app itself)\n#: /views/error.handlebars\nmsgid \"Back to Pxls\"\nmsgstr \"Atpakaļ uz Pxls\"\n\n#. HTTP status code name\n#: /views/error.handlebars\nmsgid \"Not Authenticated\"\nmsgstr \"Nav Autentifikācijas\"\n\n#: /views/error.handlebars\nmsgid \"You must be logged in to access this data. Please go back to pxls and go through the authentication process.\"\nmsgstr \"Ir nepieciešams autentificēties lai piekļūtu šiem datiem. Lūdzu atgriezieties uz pxls un izejiet cauri autentifikācijas procesam.\"\n\n#. HTTP status code name\n#: /views/error.handlebars\nmsgid \"Not Allowed\"\nmsgstr \"Nav Atļauts\"\n\n#: /views/error.handlebars\nmsgid \"The action you attempted to perform is not allowed or resulted in an error. Please ensure you have access to the endpoint and try again later.\"\nmsgstr \"Darbība, kuru mēģinājāt izpildīt, nav atļauta vai izraisīja kļūdu. Lūdzu, nodrošiniet piekļuvi galapunktam un mēģiniet vēlreiz vēlāk.\"\n\n#: /views/index.handlebars\nmsgid \"Place pixels with people to create art\"\nmsgstr \"Lieciet pikseļus kopā ar citiem lai veidotu mākslu\"\n\n#: /views/index.handlebars\nmsgid \"Lost connection to server, reconnecting...\"\nmsgstr \"Zaudēts savienojums ar serveri, atkārtoti savienojas... \"\n\n#: /views/index.handlebars\nmsgid \"Loading Heatmap (press <kbd>H</kbd> to cancel)\"\nmsgstr \"Lādējas siltuma karte (nospiediet <kbd>H</kbd> lai atceltu)\"\n\n# translating as \"background pixel map\"\n#: /views/index.handlebars\nmsgid \"Loading Virginmap (press <kbd>X</kbd> to cancel)\"\nmsgstr \"Lādējas fona pikseļu karte (nospiediet <kbd>X</kbd> lai atceltu)\"\n\n#: /views/index.handlebars\nmsgid \"Logout\"\nmsgstr \"Iziet\"\n\n#: /views/index.handlebars\nmsgid \"Canvas:\"\nmsgstr \"Kanva:\"\n\n#: /views/index.handlebars\nmsgid \"N/A\"\nmsgstr \"N/A\"\n\n#: /views/index.handlebars\nmsgid \"All Time:\"\nmsgstr \"Pavisam:\"\n\n#: /views/index.handlebars\nmsgid \"Loading online user count&hellip;\"\nmsgstr \"Lādējas tiešsaistes lietotāju skaits&hellip;\"\n\n#: /views/index.handlebars /public/admin/admin.js /public/include/lookup.js\nmsgid \"Pixels\"\nmsgstr \"Pikseļi\"\n\n#: /views/index.handlebars\nmsgid \"Undo\"\nmsgstr \"Atsaukt\"\n\n#: /views/index.handlebars\nmsgid \"You are not signed in.\"\nmsgstr \"Jūs neesat pierakstījies.\"\n\n#: /views/index.handlebars /public/include/user.js\nmsgid \"Sign in with...\"\nmsgstr \"Pierakstīties ar...\"\n\n#: /views/index.handlebars\nmsgid \"Loading...\"\nmsgstr \"Lādējas...\"\n\n#: /views/index.handlebars\nmsgid \"Sign up\"\nmsgstr \"Reģistrēties\"\n\n#: /views/index.handlebars\nmsgid \"Pick a username\"\nmsgstr \"Izvēlieties lietotājvārdu\"\n\n#: /views/index.handlebars\nmsgid \"Username:\"\nmsgstr \"Lietotājvārds:\"\n\n#: /views/index.handlebars\nmsgid \"Discord Tag (Optional):\"\nmsgstr \"Discord lietotājvārds (Neobligāti):\"\n\n#: /views/index.handlebars\nmsgid \"Drag and drop template image\"\nmsgstr \"Velciet un nometiet šablona bildi\"\n\n#: /views/index.handlebars\nmsgid \"Exit\"\nmsgstr \"Izeja\"\n\n#: /views/index.handlebars /views/profile.handlebars\nmsgid \"Info\"\nmsgstr \"Info\"\n\n#: /views/index.handlebars\nmsgid \"Close Panel\"\nmsgstr \"Aizvērt Paneli\"\n\n#: /views/index.handlebars /public/include/chat.js\nmsgid \"Chat\"\nmsgstr \"Čats\"\n\n#: /views/index.handlebars\nmsgid \"Pings\"\nmsgstr \"Pieminējumi\"\n\n#: /views/index.handlebars\nmsgid \"Settings\"\nmsgstr \"Iestatījumi\"\n\n#: /views/index.handlebars\nmsgid \"Jump To Bottom\"\nmsgstr \"Aizlekt Uz Leju\"\n\n#: /views/index.handlebars\nmsgid \"Replying to\"\nmsgstr \"\"\n\n#: /views/index.handlebars /public/include/chat.js\nmsgid \"On\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Emoji\"\nmsgstr \"Emocijzīmes\"\n\n#: /views/index.handlebars\nmsgid \"Search\"\nmsgstr \"Meklēt\"\n\n#: /views/index.handlebars\nmsgid \"keybinds;keys;keyboard;hotkeys\"\nmsgstr \"īsinājumtaustiņi;pogas;taustiņi;klaviatūra;tastatūra;īsceļi\"\n\n#: /views/index.handlebars\nmsgid \"Keybinds\"\nmsgstr \"Īsceļi\"\n\n#: /views/index.handlebars\nmsgid \"general\"\nmsgstr \"vispārīgi\"\n\n#: /views/index.handlebars\nmsgid \"General\"\nmsgstr \"Vispārīgi\"\n\n#: /views/index.handlebars\nmsgid \"move;moving;panning;drag\"\nmsgstr \"pārvietot;vilkt\"\n\n#: /views/index.handlebars\nmsgid \"Mouse/arrows/wasd to pan\"\nmsgstr \"Pele/bultas/wasd lai panorāmētu\"\n\n#: /views/index.handlebars\nmsgid \"mousewheel;zooming\"\nmsgstr \"peles ritenis;ritināt;tālummaiņa;pietuvināt;attālināt\"\n\n# is there a way to say pinch in 1 word?\n#: /views/index.handlebars\nmsgid \"Scroll/pinch to zoom\"\nmsgstr \"Ritināt/savilkt 2 pirkstus lai tuvinātu\"\n\n#: /views/index.handlebars\nmsgid \"scroll;zooming\"\nmsgstr \"ritināt;tuvināt\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>+</kbd>/<kbd>-</kbd> or <kbd>Q</kbd>/<kbd>E</kbd> to zoom\"\nmsgstr \"<kbd>+</kbd>/<kbd>-</kbd> vai <kbd>Q</kbd>/<kbd>E</kbd> lai pietuvinātu\"\n\n#: /views/index.handlebars\nmsgid \"lookups\"\nmsgstr \"meklēšana;uzmeklēšana\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>Shift</kbd> + Click/Hold touch to lookup pixel\"\nmsgstr \"<kbd>Shift</kbd> + Noklikšķināt/Turēt lai uzmeklētu pikseli\"\n\n#: /views/index.handlebars\nmsgid \"overlays;alignment;grid hidden;grid shown;hide grid;show grid\"\nmsgstr \"pārklājums;nolīdzināšana;režģis parādīts;režģis paslēpts;parādīt režģi;paslēpt režģi\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>G</kbd> to toggle grid\"\nmsgstr \"<kbd>G</kbd> lai ieslēgtu/izslēgtu režģi\"\n\n#: /views/index.handlebars\nmsgid \"close;information shown;information hidden;info shown;info hidden;hide information;show information\"\nmsgstr \"aizvērt;informācija parādīta;informācija paslēpti;info\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>I</kbd> to open info\"\nmsgstr \"<kbd>I</kbd> lai atvērtu info\"\n\n#: /views/index.handlebars\nmsgid \"close;settings hidden;settings shown;hide settings;show settings\"\nmsgstr \"aizvērt;iestatījumi parādīti;iestatījumi paslēpti;parādīt iestatījumus\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>T</kbd> to open settings\"\nmsgstr \"<kbd>T</kbd> lai atvērtu iestatījumus\"\n\n#: /views/index.handlebars\nmsgid \"close;chat hidden;chat shown;hide chat;show chat\"\nmsgstr \"aizvērt;čats parādīts;čats paslēpts;parādīt čatu\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>B</kbd> to open chat\"\nmsgstr \"<kbd>B</kbd> lai atvērtu čatu\"\n\n#: /views/index.handlebars\nmsgid \"canvas locked;move;moving;zoom;zooming\"\nmsgstr \"audekls;kanvas;pārvietot;pietuvināt\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>L</kbd> to toggle locking panning of the canvas\"\nmsgstr \"<kbd>L</kbd> lai ieslēgtu/izslēgtu panorāmēšanas bloķēšanu\"\n\n#: /views/index.handlebars\nmsgid \"take screenshot;image;download;picture;canvas\"\nmsgstr \"ekrānuzņēmums;attēls;foto;lejupieladēt;audekls;kanvas\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>P</kbd> to take a snapshot\"\nmsgstr \"<kbd>P</kbd> lai izveidotu momentuzņēmumu\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels placed pixels;heatmap hidden;heatmap shown;hide heatmap;show heatmap\"\nmsgstr \"pārklājumi;lietotāju darbība;karstuma karte;parādīt karstuma karti;paslēpt karstuma karti\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>H</kbd> to toggle heatmap\"\nmsgstr \"<kbd>H</kbd> lai ieslēgtu/izslēgtu karstuma karti\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels unplaced pixels;virginmap hidden;virginmap shown;hide virginmap;show virginmap\"\nmsgstr \"pārklājumi;lietotāju darbība;pikseļi;neliktie pikseļi;virginmap;fona pikseļi paslēpti;fona pikseļi parādīti;paslēpt fona pikseļus;parādīt fona pikseļud\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>X</kbd> to toggle virginmap\"\nmsgstr \"<kbd>X</kbd> lai ieslēgtu/izslēgtu fona pikseļu karti\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels placed pixels;wipe;clean;\"\nmsgstr \"parklājumi;lietotāju darbība;notīrīt\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>O</kbd> to clear heatmap\"\nmsgstr \"<kbd>O</kbd> lai notīrītu karstuma karti\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels unplaced pixels;wipe;clean;\"\nmsgstr \"parklājumi;lietotāju darbība;notīrīt\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>U</kbd> to clear virginmap\"\nmsgstr \"<kbd>U</kbd> lai notīrītu fona pikseļu karti\"\n\n#: /views/index.handlebars\nmsgid \"next color;previous color\"\nmsgstr \"nākošā krāsa;iepriekšējā krāsa\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>J</kbd>/<kbd>K</kbd> to cycle through palette colors\"\nmsgstr \"<kbd>J</kbd>/<kbd>K</kbd> lai pārvietotos caur krāsu paleti\"\n\n#: /views/index.handlebars\nmsgid \"current coordinates;coords\"\nmsgstr \"pašreizējās koordinātas;koordinātas\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>C</kbd> to copy link of moused-over coordinates\"\nmsgstr \"<kbd>C</kbd> lai kopētu koordinātu zem kursora\"\n\n#: /views/index.handlebars\nmsgid \"cancel selection\"\nmsgstr \"atcelt atlasi\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>ESC</kbd> to deselect current pixel\"\nmsgstr \"<kbd>ESC</kbd> lai atceltu pašreizējā pikseļa atlasi\"\n\n#: /views/index.handlebars\nmsgid \"recenter;jump;center on template;guides;focus\"\nmsgstr \"centrēt;pārlekt;centrēt uz šablonu;fokusēt\"\n\n# board/canvas - same thing? or not\n#: /views/index.handlebars\nmsgid \"<kbd>R</kbd> to center the board on the current template\"\nmsgstr \"<kbd>R</kbd> lai centrētu kanvu uz pašreizējo šablonu\"\n\n#: /views/index.handlebars\nmsgid \"templates;guides\"\nmsgstr \"šabloni\"\n\n#: /views/index.handlebars\nmsgid \"Template\"\nmsgstr \"Šablons\"\n\n#: /views/index.handlebars\nmsgid \"transparency\"\nmsgstr \"caurredzamība;caurspīdīgums\"\n\n# write caurredzamība instead and switch increase/decrease? russian translator did exactly that, but I didn't. Not sure which is less confusing\n#: /views/index.handlebars\nmsgid \"<kbd>Page Up</kbd> to increase opacity\"\nmsgstr \"<kbd>Page Up</kbd> lai palielinātu necaurredzamību\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>Page Down</kbd> to decrease opacity\"\nmsgstr \"<kbd>Page Down</kbd> lai samazinātu necaurredzamību\"\n\n#: /views/index.handlebars\nmsgid \"hidden;shown;hide;show\"\nmsgstr \"parādīt;paslēpt;\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>V</kbd> to toggle visibility\"\nmsgstr \"<kbd>V</kbd> lai ieslēgtu/izslēgtu redzamību\"\n\n#: /views/index.handlebars\nmsgid \"Note: These values are based on QWERTY keyboards. For other layouts, use the keys corresponding to the same position on a QWERTY keyboard.\"\nmsgstr \"Piezīme: Šīs taustiņu vērtības balstās uz QWERTY tastatūrām. Priekš citiem izskārtojumiem, lietojiet taustiņu, kas atbilt ar to pašu vietu QWERTY tastatūrā.\"\n\n#: /views/index.handlebars\nmsgid \"templates;overlays;guides\"\nmsgstr \"šabloni;pārklājumi\"\n\n#: /views/index.handlebars\nmsgid \"templates;overlays;image;pixel art\"\nmsgstr \"šabloni;pārklājumi;attēls;pikseļu māksla\"\n\n#: /views/index.handlebars\nmsgid \"template enabled;template disabled;show template;hide template;template shown;template hidden\"\nmsgstr \"šablons iespējots;šablons atspējots\"\n\n#: /views/index.handlebars\nmsgid \"Use template\"\nmsgstr \"Izmantot šablonu\"\n\n#: /views/index.handlebars\nmsgid \"Hold down <kbd>Ctrl</kbd> (or <kbd>Option</kbd> on mac) to drag the template around\"\nmsgstr \"Turiet <kbd>Ctrl</kbd> (vai <kbd>Option</kbd> uz mac) lai vilktu šablonu apkārt\"\n\n#: /views/index.handlebars\nmsgid \"template title;template name;tab name;tab title;title=\"\nmsgstr \"šablona nosaukums;cilnes nosaukums;title=\"\n\n#: /views/index.handlebars\nmsgid \"Title:\"\nmsgstr \"Nosaukums:\"\n\n#: /views/index.handlebars\nmsgid \"template location source;template source URL;template URL;template=\"\nmsgstr \"šablonaavots;šablona URL;template=\"\n\n#: /views/index.handlebars\nmsgid \"URL:\"\nmsgstr \"URL:\"\n\n#: /views/index.handlebars\nmsgid \"template position;template x;template y;template location; template vertical; template horizontal;ox=;oy=\"\nmsgstr \"šablona pozīcija;šablona novietojums;šablona x; šablona y;ox=;oy=\"\n\n#: /views/index.handlebars\nmsgid \"Horizontal position:\"\nmsgstr \"Horizontālais novietojums:\"\n\n#: /views/index.handlebars\nmsgid \"Vertical position:\"\nmsgstr \"Vertikālais novietojums:\"\n\n#: /views/index.handlebars\nmsgid \"template width;tw=\"\nmsgstr \"šablona platums;tw=\"\n\n#: /views/index.handlebars\nmsgid \"Width:\"\nmsgstr \"Platums:\"\n\n#: /views/index.handlebars\nmsgid \"Reset\"\nmsgstr \"Atiestatīt\"\n\n#: /views/index.handlebars\nmsgid \"template style;custom template\"\nmsgstr \"šablona veids;pielāgots šablons\"\n\n# stils also makes sense, but veids feels closer to what it is\n#: /views/index.handlebars\nmsgid \"Style:\"\nmsgstr \"Veids:\"\n\n#: /views/index.handlebars\nmsgid \"Use Source Style\"\nmsgstr \"Izmantot Avota Veidu\"\n\n#: /views/index.handlebars\nmsgid \"1-to-1\"\nmsgstr \"1 pret 1\"\n\n#: /views/index.handlebars\nmsgid \"1-to-1 (keep incorrect colors)\"\nmsgstr \"1 pret 1 (atstāt kļūdainas krāsas)\"\n\n#: /views/index.handlebars\nmsgid \"Dotted (Small, 1:2)\"\nmsgstr \"Punktēts (Mazs, 1:2)\"\n\n#: /views/index.handlebars\nmsgid \"Dotted (Big, 2:2)\"\nmsgstr \"Punktēts (Liels, 2:2)\"\n\n#: /views/index.handlebars\nmsgid \"Symbols\"\nmsgstr \"Simboli\"\n\n#: /views/index.handlebars\nmsgid \"Numbers\"\nmsgstr \"Skaitļi\"\n\n#: /views/index.handlebars\nmsgid \"Custom…\"\nmsgstr \"Pielāgots…\"\n\n#: /views/index.handlebars\nmsgid \"template style source;template style URL;custom style URL;custom template\"\nmsgstr \"šablona veida avots;šablona veida URL; \"\n\n#: /views/index.handlebars\nmsgid \"Custom style URL:\"\nmsgstr \"Pielāgotā veida URL:\"\n\n#: /views/index.handlebars\nmsgid \"template conversion;template palette conversion;convert to palette\"\nmsgstr \"šablona pārveidošana\"\n\n#: /views/index.handlebars\nmsgid \"Color Conversion Mode:\"\nmsgstr \"Krāsu Pārveidošanas Režīms:\"\n\n#: /views/index.handlebars\nmsgid \"Unconverted\"\nmsgstr \"Nepārveidots\"\n\n#: /views/index.handlebars\nmsgid \"Nearest Custom\"\nmsgstr \"Pārveidot uz tuvākajām paletes krāsām\"\n\n#: /views/index.handlebars\nmsgid \"template transparency;template opacity;oo=\"\nmsgstr \"šablona caurspīdīgums;oo=\"\n\n#: /views/index.handlebars\nmsgid \"Opacity:\"\nmsgstr \"Necaurspīdīgums:\"\n\n#: /views/index.handlebars\nmsgid \"ui;interface\"\nmsgstr \"ui;interfeiss;saskarsne\"\n\n#: /views/index.handlebars\nmsgid \"UI Settings\"\nmsgstr \"Lietotāja Saskarsnes Iestatījumi\"\n\n#: /views/index.handlebars\nmsgid \"language override;text\"\nmsgstr \"valodas izvēle;teksts\"\n\n# override in this sense doesn't translate easily so it's izvēle\n#: /views/index.handlebars\nmsgid \"Language override:\"\nmsgstr \"Valodas izvēle:\"\n\n#: /views/index.handlebars\nmsgid \"Use Browser Language\"\nmsgstr \"Izmantot Pārlūka Valodu\"\n\n#: /views/index.handlebars\nmsgid \"English\"\nmsgstr \"Angļu\"\n\n#: /views/index.handlebars\nmsgid \"Bulgarian\"\nmsgstr \"Bulgāru\"\n\n#: /views/index.handlebars\nmsgid \"French\"\nmsgstr \"Franču\"\n\n#: /views/index.handlebars\nmsgid \"German\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Russian\"\nmsgstr \"Krievu\"\n\n#: /views/index.handlebars\nmsgid \"Swedish\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Finnish\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Toki Pona\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"themes;look;stylesheets;visuals\"\nmsgstr \"tēmas;izskats;stila lapas;motīvs\"\n\n#: /views/index.handlebars\nmsgid \"Theme:\"\nmsgstr \"Motīvs:\"\n\n#: /views/index.handlebars\nmsgid \"Default\"\nmsgstr \"Noklusējums\"\n\n#: /views/index.handlebars\nmsgid \"hide reticule;hide reticle;reticule shown reticle shown;reticule hidden;reticle hidden\"\nmsgstr \"paslēpt retiklu\"\n\n# honestly don't exactly know that word in english\n#: /views/index.handlebars\nmsgid \"Show reticule\"\nmsgstr \"Rādīt retiklu\"\n\n#: /views/index.handlebars\nmsgid \"hide cursor;cursor shown;cursor hidden\"\nmsgstr \"paslēpt kursoru; kursors parādīts; kursors paslēpts\"\n\n#: /views/index.handlebars\nmsgid \"Show cursor\"\nmsgstr \"Rādīt kursoru\"\n\n#: /views/index.handlebars\nmsgid \"darkness filter\"\nmsgstr \"tumsas filtrs\"\n\n#: /views/index.handlebars\nmsgid \"Enable color brightness\"\nmsgstr \"Iespējot krāsu spilgtumu\"\n\n#: /views/index.handlebars\nmsgid \"Warning: Known to cause fuzziness in Chrome on some Mac/Linux installs\"\nmsgstr \"Uzmanību: Zināms, ka izraisa izplūdumu uz Chrome dažās Mac/Linux instalācijās\"\n\n#: /views/index.handlebars\nmsgid \"Color brightness:\"\nmsgstr \"Krāsu spilgtums:\"\n\n#: /views/index.handlebars\nmsgid \"keep current selected;keep curent color;place\"\nmsgstr \"atstāt pašreizējo atlasītu;atsāt pašreizējo krāsu;likt\"\n\n#: /views/index.handlebars\nmsgid \"Deselect color after placing\"\nmsgstr \"Noņemt krāsas atlasi pēc likšanas\"\n\n#: /views/index.handlebars\nmsgid \"mousewheel;palette scrolling\"\nmsgstr \"peles ritenis;paletes ritināšana\"\n\n#: /views/index.handlebars\nmsgid \"Enable scrolling on the palette to switch colors\"\nmsgstr \"Iespējot paletes ritināšanu lai pārslēgtu krāsas\"\n\n#: /views/index.handlebars\nmsgid \"reverse scrolling;mousewheel;palette scrolling;enable scrolling on the palette to switch colors\"\nmsgstr \"apgriezta ritināšana;peles ritenis;paletes ritināšana;iespējot paletes ritināšanu lai pārslēgtu krāsas\"\n\n#: /views/index.handlebars\nmsgid \"Invert scroll direction\"\nmsgstr \"Apgriezt ritināšanas virzienu\"\n\n# who will ever search for it like that? or like most of these things\n#: /views/index.handlebars\nmsgid \"indexed colors;palette indicies\"\nmsgstr \"indeksētas krāsas\"\n\n#: /views/index.handlebars\nmsgid \"Add numbers to palette entries\"\nmsgstr \"Pievienot skaitli pie paletes krāsām\"\n\n#: /views/index.handlebars\nmsgid \"scrollbar;palette scrolling\"\nmsgstr \"ritjosla;paletes ritināšana\"\n\n#: /views/index.handlebars\nmsgid \"Enable thin scrollbar\"\nmsgstr \"Iespējot tievo ritjoslu\"\n\n#: /views/index.handlebars\nmsgid \"scrollbar;palette scrolling;palette stack\"\nmsgstr \"ritjosla;paletes ritināšana;paletes rindas\"\n\n#: /views/index.handlebars\nmsgid \"Enable palette stacking\"\nmsgstr \"Iespējot paletes novietošanu vairākās rindās\"\n\n#: /views/index.handlebars\nmsgid \"floating bubble location\"\nmsgstr \"peldošā burbuļa novietojums\"\n\n#: /views/index.handlebars\nmsgid \"Bubble position:\"\nmsgstr \"Uznirstošā loga novietojums:\"\n\n#: /views/index.handlebars\nmsgid \"Top left\"\nmsgstr \"Augšā, pa kreisi\"\n\n#: /views/index.handlebars\nmsgid \"Top right\"\nmsgstr \"Augšā, pa labi\"\n\n#: /views/index.handlebars\nmsgid \"Bottom left\"\nmsgstr \"Apakšā, pa kreisi\"\n\n#: /views/index.handlebars\nmsgid \"Bottom right\"\nmsgstr \"Apakšā, pa labi\"\n\n#: /views/index.handlebars\nmsgid \"broken;offset workaround\"\nmsgstr \"salauzts;nobīde\"\n\n#: /views/index.handlebars\nmsgid \"Attempt to fix canvas displacement bug in Chrome 78+\"\nmsgstr \"Mēģināt salabot kanvas nobīdes kļudu uz Chrome 78+\"\n\n#: /views/index.handlebars\nmsgid \"chat;message;ping sound\"\nmsgstr \"čats;ziņa,pieminējuma skaņa\"\n\n#: /views/index.handlebars\nmsgid \"Chat Settings\"\nmsgstr \"Čata Iestatījumi\"\n\n#: /views/index.handlebars\nmsgid \"username;color;colour\"\nmsgstr \"vārds;lietotājvārds;krāsa\"\n\n#: /views/index.handlebars\nmsgid \"Username Color:\"\nmsgstr \"Lietotājvārda Krāsa:\"\n\n#: /views/index.handlebars\nmsgid \"chat message;chat ui\"\nmsgstr \"čata ziņa, čata ui; čata lietotāja saskarsne\"\n\n#: /views/index.handlebars\nmsgid \"Interface\"\nmsgstr \"Lietotāja Saskarsne\"\n\n#: /views/index.handlebars\nmsgid \"enable;disable\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Enable chat\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Page must be reloaded after changing\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"chat size;chat font\"\nmsgstr \"čata lielums;čata fonts\"\n\n#: /views/index.handlebars\nmsgid \"Font Size:\"\nmsgstr \"Fonta Lielums:\"\n\n#: /views/index.handlebars\nmsgid \"time;timestamps\"\nmsgstr \"laiks;laikspiedogs\"\n\n#: /views/index.handlebars\nmsgid \"24 Hour Timestamps\"\nmsgstr \"24 Stundu Laiks\"\n\n#: /views/index.handlebars\nmsgid \"badges;pixel count;pixels placed\"\nmsgstr \"žetoni;pikseļu skaits;pikseļi nolikti\"\n\n#: /views/index.handlebars\nmsgid \"Show pixel-placed badges\"\nmsgstr \"Rādīt pikseļu skaita žetonus\"\n\n#: /views/index.handlebars\nmsgid \"badges;factions\"\nmsgstr \"žetoni;frakcijas\"\n\n#: /views/index.handlebars\nmsgid \"Show faction tags\"\nmsgstr \"Rādīt frakciju birkas\"\n\n#: /views/index.handlebars\nmsgid \"template urls;template links;template name\"\nmsgstr \"šablonu url;šablonu linki;šablonu nosaukumi;šablonu saite\"\n\n#: /views/index.handlebars\nmsgid \"Replace template titles with URLs in chat where applicable\"\nmsgstr \"Aizstāt šablonu nosaukumus ar URL čatā, kur piemērojams\"\n\n#: /views/index.handlebars\nmsgid \"chat orientation;chat position\"\nmsgstr \"čata virziens;čata novietojums\"\n\n#: /views/index.handlebars\nmsgid \"Enable horizontal chat\"\nmsgstr \"Iespējot horizontālo čatu\"\n\n#: /views/index.handlebars\nmsgid \"banner;animation\"\nmsgstr \"baneris;animācija\"\n\n#: /views/index.handlebars\nmsgid \"Enable the rotating banner under chat\"\nmsgstr \"Iespējot rotējošo baneri zem čata\"\n\n#: /views/index.handlebars\nmsgid \"max;messages;truncate\"\nmsgstr \"maksimums;ziņas;saīsināšana\"\n\n#: /views/index.handlebars\nmsgid \"Maximum amount of chat messages:\"\nmsgstr \"Maksimālais ziņu skaits čatā:\"\n\n#: /views/index.handlebars\nmsgid \"link;url;behaviour\"\nmsgstr \"links;saite;url;uzvedība\"\n\n#: /views/index.handlebars\nmsgid \"Default internal link action click:\"\nmsgstr \"Noklusējuma darbība nospiežot saiti:\"\n\n#: /views/index.handlebars\nmsgid \"link;url;behaviour;external;bypass;skip\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Skip external link popup\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Note: Has no effect if external link popups are disabled by the server.\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"chat icon;chat notifications;chat ping\"\nmsgstr \"čata ikona;čata žetons;čata paziņojumi;čata pieminējumi\"\n\n#: /views/index.handlebars\nmsgid \"Chat icon badge mode:\"\nmsgstr \"Čata paziņojuma ikonas režīms:\"\n\n#: /views/index.handlebars\nmsgid \"Show on unread ping\"\nmsgstr \"Parādīt nelasīta pieminējuma gadījumā\"\n\n#: /views/index.handlebars\nmsgid \"Show on unread message\"\nmsgstr \"Parādīt nelasītas ziņas gadījumā\"\n\n#: /views/index.handlebars\nmsgid \"Never show\"\nmsgstr \"Nekad nerādīt\"\n\n#: /views/index.handlebars\nmsgid \"chat icon;chat notifications;chat message\"\nmsgstr \"čata ikona;čata paziņojumi;čata ziņa\"\n\n#: /views/index.handlebars\nmsgid \"Chat icon highlight mode:\"\nmsgstr \"Čata ikonas izcelšanas režīms:\"\n\n#: /views/index.handlebars\nmsgid \"ignored;ignores;unignore;blocked;blocking;unblock\"\nmsgstr \"ignorēt;beigt ignorēt;bloķēts;atbloķēt\"\n\n#: /views/index.handlebars\nmsgid \"Ignores\"\nmsgstr \"Ignorētie\"\n\n#: /views/index.handlebars\nmsgid \"unignore;unblock\"\nmsgstr \"beigt ignorēt;atbloķēt\"\n\n# stop ignoring\n#: /views/index.handlebars\nmsgid \"Unignore\"\nmsgstr \"Beigt ignorēt\"\n\n#: /views/index.handlebars\nmsgid \"overlays;virginmap;heatmap;grid\"\nmsgstr \"pārklājums;fona pikseļu karte;karstuma karte;režģis\"\n\n#: /views/index.handlebars\nmsgid \"Overlay Settings\"\nmsgstr \"Pārklājuma Iestatījumi\"\n\n#: /views/index.handlebars\nmsgid \"heatmap;heatmap opacity;clear heatmap\"\nmsgstr \"karstuma karte;karstuma kartes caurspīdīgums;notīrīt karstuma karti\"\n\n#: /views/index.handlebars\nmsgid \"Heatmap\"\nmsgstr \"Karstuma karte\"\n\n#: /views/index.handlebars\nmsgid \"Turn on heatmap\"\nmsgstr \"Ieslēgt karstuma karti\"\n\n#: /views/index.handlebars\nmsgid \"(toggle with <kbd>H</kbd>)\"\nmsgstr \"(pārslēgt ar <kbd>H</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"overlays;activity;pixels placed pixels;wipe;clean\"\nmsgstr \"pārklājumi;darbība;pikseļi nolikti;notīrīt\"\n\n#: /views/index.handlebars\nmsgid \"Clear heatmap\"\nmsgstr \"Notīrīt karstuma karti\"\n\n#: /views/index.handlebars\nmsgid \"(hotkey: <kbd>O</kbd>)\"\nmsgstr \"(taustiņš: <kbd>O</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels placed pixels;transparency\"\nmsgstr \"pārklājumi;lietotāju darbība;noliktie pikseļi;caurspīdīgums\"\n\n#: /views/index.handlebars\nmsgid \"Heatmap background opacity:\"\nmsgstr \"Karstuma kartes fona caurspīdīgums:\"\n\n#: /views/index.handlebars\nmsgid \"virginmap;virginmap opacity;clear virginmap\"\nmsgstr \"fona pikseļu karte;notīrit fona pikseļu karti\"\n\n#: /views/index.handlebars\nmsgid \"Virginmap\"\nmsgstr \"Fona pikseļu karte\"\n\n#: /views/index.handlebars\nmsgid \"Turn on virginmap\"\nmsgstr \"Ieslēgt fona pikseļu karti\"\n\n#: /views/index.handlebars\nmsgid \"(toggle with <kbd>X</kbd>)\"\nmsgstr \"(pārslēgt ar <kbd>X</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels unplaced pixels;transparency\"\nmsgstr \"pārklājumi;lietotāju darbība;fona pikseļi;caurspīdīgums\"\n\n#: /views/index.handlebars\nmsgid \"Virginmap background opacity:\"\nmsgstr \"Fona pikseļu kartes fona caurspīdīgums:\"\n\n#: /views/index.handlebars\nmsgid \"overlays;activity;pixels unplaced pixels;wipe;clean\"\nmsgstr \"parklājumi;darbība;fona pikseļi;notīrīt\"\n\n#: /views/index.handlebars\nmsgid \"Clear virginmap\"\nmsgstr \"Notīrīt fona pikseļu karti\"\n\n#: /views/index.handlebars\nmsgid \"(hotkey: <kbd>U</kbd>)\"\nmsgstr \"(taustiņš: <kbd>U</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"Layer template underneath heatmap\"\nmsgstr \"Novietot šablonu zem karstuma kartes\"\n\n#: /views/index.handlebars\nmsgid \"grid;toggle grid\"\nmsgstr \"režgis\"\n\n#: /views/index.handlebars\nmsgid \"Grid\"\nmsgstr \"Režģis\"\n\n#: /views/index.handlebars\nmsgid \"Turn on grid\"\nmsgstr \"Ieslēgt režģi\"\n\n#: /views/index.handlebars\nmsgid \"(toggle with <kbd>G</kbd>)\"\nmsgstr \"(pārslēgt ar <kbd>G</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"controls;zooming;panning;movement\"\nmsgstr \"vadība;tuvināšana;panorāmēšanas;pārvietošana\"\n\n#: /views/index.handlebars\nmsgid \"Control Settings\"\nmsgstr \"Vadības iestatījumi\"\n\n#: /views/index.handlebars\nmsgid \"zooming;scrolling;scale;scaling\"\nmsgstr \"pietuvināšana;ritināšana;mērogošana\"\n\n#: /views/index.handlebars\nmsgid \"Zooming\"\nmsgstr \"Pietuvināšana\"\n\n#: /views/index.handlebars\nmsgid \"scrolling sensitivity;zooming sensitivity;mousewheel sensitivity\"\nmsgstr \"ritināšanas jutīgums;pietuvināšanas jutīgums;peles riteņa jutīgums\"\n\n#: /views/index.handlebars\nmsgid \"Zoom sensitivity:\"\nmsgstr \"Pietuvināšanas jutīgums\"\n\n#: /views/index.handlebars\nmsgid \"zooming limit;scrolling limit;mousewheel;zooming minimum;zooming maximum\"\nmsgstr \"pietuvināšanas limits;ritināšanas limits;peles ritenis;\"\n\n#: /views/index.handlebars\nmsgid \"Minimum scale:\"\nmsgstr \"Minimālais mērogs:\"\n\n#: /views/index.handlebars\nmsgid \"Maximum scale:\"\nmsgstr \"Maksimālais mērogs:\"\n\n#: /views/index.handlebars\nmsgid \"rounding;zooming;scrolling;mousewheel;integer;decimal\"\nmsgstr \"apaļošana;pietuvināšana;ritināšana;peles ritenis;\"\n\n#: /views/index.handlebars\nmsgid \"Round zoom values to nearest whole number\"\nmsgstr \"Apaļot pietuvināšanas vērtību līdz tuvākajam veselajam skaitlim\"\n\n#: /views/index.handlebars\nmsgid \"controls;miscellaneous\"\nmsgstr \"vadība;dažāds\"\n\n#: /views/index.handlebars\nmsgid \"Lock the canvas (disallow canvas drag/zoom with mouse/fingers)\"\nmsgstr \"Bloķēt kanvas panorāmēšanu ar peli/pirkstiem\"\n\n#: /views/index.handlebars\nmsgid \"MMB picker;mouse picker;selection;palette picker\"\nmsgstr \"MMB;peles izvēle;atlase;paletes izvēle;paletes atlase\"\n\n#: /views/index.handlebars\nmsgid \"Enable middle mouse button selecting color from board\"\nmsgstr \"Iespējot krāses atlasi no kanvas ar vidējo peles pogu\"\n\n#: /views/index.handlebars\nmsgid \"right click action\"\nmsgstr \"kreisā klikšķa darbība\"\n\n#: /views/index.handlebars\nmsgid \"Right-click action:\"\nmsgstr \"Kreisā klikšķa darbība\"\n\n#: /views/index.handlebars\nmsgid \"Nothing\"\nmsgstr \"Nekas\"\n\n#: /views/index.handlebars\nmsgid \"Clear color\"\nmsgstr \"Noņemt krāsu\"\n\n#: /views/index.handlebars\nmsgid \"Copy color\"\nmsgstr \"Kopēt krāsu\"\n\n#: /views/index.handlebars\nmsgid \"Lookup\"\nmsgstr \"Uzmeklēt\"\n\n#: /views/index.handlebars\nmsgid \"Clear color + Lookup\"\nmsgstr \"Noņemt krāsu + Uzmeklēt\"\n\n#: /views/index.handlebars\nmsgid \"snapshots;screenshot;download;picture;canvas\"\nmsgstr \"momentuzņēmums;attēls;lejupieladēt;kanvas;audekls\"\n\n#: /views/index.handlebars\nmsgid \"Snapshot Settings\"\nmsgstr \"Momentuzņēmuma Iestatījumi\"\n\n#: /views/index.handlebars\nmsgid \"screenshot;snapshot;download;board;canvas\"\nmsgstr \"momentuzņēmums;attēls;lejupieladēt;kanvas;audekls\"\n\n#: /views/index.handlebars\nmsgid \"take screenshot;image;download format;picture;canvas;board\"\nmsgstr \"momentuzņēmums;attēls;lejupieladēt;kanvas;audekls;formāts\"\n\n#: /views/index.handlebars\nmsgid \"Snapshot image format:\"\nmsgstr \"Momentuzņēmuma attēla formāts:\"\n\n#: /views/index.handlebars\nmsgid \"PNG\"\nmsgstr \"PNG\"\n\n#: /views/index.handlebars\nmsgid \"JPEG\"\nmsgstr \"JPEG\"\n\n#: /views/index.handlebars\nmsgid \"WEBP (Chrome only)\"\nmsgstr \"WEBP (tikai Chrome)\"\n\n#: /views/index.handlebars\nmsgid \"sound;notification;alert;notify;ping\"\nmsgstr \"skaņa;paziņojumi;brīdinājumi;pieminējumi\"\n\n#: /views/index.handlebars\nmsgid \"Sound and Notification Settings\"\nmsgstr \"Skaņas un Paziņojumu Iestatījumi\"\n\n#: /views/index.handlebars\nmsgid \"audio;mute;noise;volume\"\nmsgstr \"audio;izslēgt skaņu;troksnis;skaļums\"\n\n#: /views/index.handlebars\nmsgid \"Enable sound\"\nmsgstr \"Iespējot skaņu\"\n\n#: /views/index.handlebars\nmsgid \"notifs;notify;pixel notification\"\nmsgstr \"paziņojumi;pikseļa paziņojums\"\n\n#: /views/index.handlebars\nmsgid \"Enable pixel available notification\"\nmsgstr \"Iespējot pieejama pikseļa paziņojumu\"\n\n#: /views/index.handlebars\nmsgid \"notification;pixel ready;alert\"\nmsgstr \"paziņojums;pikselis gatavs;brīdinājums\"\n\n#: /views/index.handlebars\nmsgid \"Pixel Ready Notification\"\nmsgstr \"Paziņojums Par Gatavu Pikseli\"\n\n#: /views/index.handlebars\nmsgid \"alert source;notify url;notify source;notification url;notification source\"\nmsgstr \"brīdinājuma avots;paziņojuma avots;paziņojuma url\"\n\n#: /views/index.handlebars\nmsgid \"Alert URL:\"\nmsgstr \"Paziņojuma URL:\"\n\n#: /views/index.handlebars\nmsgid \"Update\"\nmsgstr \"Atjaunināt\"\n\n#: /views/index.handlebars\nmsgid \"Test\"\nmsgstr \"Pārbaudīt\"\n\n#: /views/index.handlebars\nmsgid \"sound level;audio level;mute audio;mute sound\"\nmsgstr \"skaņas līmenis;skaļums;izslēgt skaņu\"\n\n#: /views/index.handlebars\nmsgid \"Volume:\"\nmsgstr \"Skaļums:\"\n\n#: /views/index.handlebars\nmsgid \"alert forewarning;alert delay; notification delay; notification forewarning\"\nmsgstr \"brīdinājuma aizkave;paziņojuma aizkave\"\n\n#: /views/index.handlebars\nmsgid \"Delay (seconds):\"\nmsgstr \"Aizkave (sekundēs):\"\n\n#: /views/index.handlebars\nmsgid \"chat mentions;chat pings;chat sound\"\nmsgstr \"čata pieminējumi;čata skaņa\"\n\n#: /views/index.handlebars\nmsgid \"Chat Pings\"\nmsgstr \"Čata pieminējumi\"\n\n#: /views/index.handlebars\nmsgid \"Enable pings\"\nmsgstr \"Iespējot pieminējumu paziņojumu\"\n\n#: /views/index.handlebars\nmsgid \"mention sound\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Play sound on ping:\"\nmsgstr \"Iespējot pieminējumu paziņojumu skaņu:\"\n\n#: /views/index.handlebars /public/include/chat.js\nmsgid \"Off\"\nmsgstr \"Izslēgts\"\n\n#: /views/index.handlebars\nmsgid \"Only when necessary\"\nmsgstr \"Tikai kad nepieciešams\"\n\n#: /views/index.handlebars\nmsgid \"Always\"\nmsgstr \"Vienmēr\"\n\n#: /views/index.handlebars\nmsgid \"mention sound volume\"\nmsgstr \"pieminējuma skaņas skaļums\"\n\n#: /views/index.handlebars\nmsgid \"Ping sound volume:\"\nmsgstr \"Pieminējuma skaļums:\"\n\n#: /views/index.handlebars\nmsgid \"personal account\"\nmsgstr \"personīgais konts\"\n\n#: /views/index.handlebars\nmsgid \"Account Settings\"\nmsgstr \"Konta Iestatījumi\"\n\n#: /views/index.handlebars\nmsgid \"Public Discord name:\"\nmsgstr \"Publisks Discord vārds:\"\n\n#: /views/index.handlebars /public/include/chat.js\nmsgid \"Set\"\nmsgstr \"Iestatīt\"\n\n#: /views/index.handlebars\nmsgid \"Remove\"\nmsgstr \"Noņemt\"\n\n#: /views/index.handlebars\nmsgid \"Help\"\nmsgstr \"Palīdzība\"\n\n#: /views/index.handlebars\nmsgid \"Notifications\"\nmsgstr \"Paziņojumi\"\n\n#: /views/partials/faq.handlebars\nmsgid \"FAQ\"\nmsgstr \"BUJ\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Why is the cooldown as long as it is?\"\nmsgstr \"Kāpēc man ir jāgaida tieši tik ilgi priekš jauna pikseļa?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"The time it takes to get a pixel is dynamic, and changes based on how many people are online. The cooldown time is longer when more users are online.\"\nmsgstr \"Laiks lai iegūtu jaunu pikseli ir atkarīgs no tiešsaistes lietotāju skaita. Laiks paliek arvien ilgāks, jo vairāk lietotāju.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Why does it say 0/6 pixels?\"\nmsgstr \"Kāpēc te ir rakstīts 0/6 pikseļu?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"This means that you are waiting for your next pixel. When you place a pixel, there is a cooldown for when you can place the next one. Over time, you can gain up to 6 \\\"stacked\\\" pixels to place at once.\"\nmsgstr \"Tas nozīmē, ka jūs gaidat jūsu nākamo pikseli. Kad noliekat pikseli, jums ir jāgaida, pirms varat nolikt nākamo. Laika gaitā, varat sakrāt līdz 6 pikseļiem.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Why does it take so long to \\\"stack\\\" pixels?\"\nmsgstr \"Kāpēc tas aizņem tik ilgi sakrāt vairākus pikseļus?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"This is by design. It is better to place a pixel as soon as you get one. Pixel \\\"stacking\\\" is meant to give you a bump if you go AFK for a bit. It takes around 20-30 minutes to get a full 6/6 pixels, but it only takes around 3 minutes to place 6 pixels if you place them as soon as possible.\"\nmsgstr \"Tā ir domāts. Ir ātrāk nolikt pikseli uzreiz, kad tas ir pieejams. Pikseļu krāšana ir domāta, lai iedotu jums nelielu bonusu pēc tā, ka pārstājat likt. Iegūt pilnus 6/6 pikseļus aizņem 40 minūtes, bet ja tos likt uzreiz, 6 pikseļi aizņemtu tikai 3 minūtes.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I appeal a ban?\"\nmsgstr \"Kā man pārsūdzēt banu?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Contact us on <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord</a> or send an appeal to our <a href=\\\"https://pxls.space/appeal\\\" target=\\\"_blank\\\">Google form</a> after reading the rules in the site's info panel.\"\nmsgstr \"Sazinieties ar mums <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord</a> vai aizpildiet mūsu <a href=\\\"https://pxls.space/appeal\\\" target=\\\"_blank\\\">Google form</a> pēc tā, ka izlasījat noteikumus lapas info panelī.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I make a template?\"\nmsgstr \"Kā man izveidot šablonu?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"A template is an image link that is posted in the template textbox in the settings panel so you can place over it on the canvas. You may use a regular image link to your pixel art, but many people use 3rd party tools like <a href=\\\"https://discord.gg/5MVDCq53vC\\\" target=\\\"blank\\\">Clueless</a> to turn pixel art into a fancier link. If you need to make pixel art yourself, you can use <a href=\\\"https://www.piskelapp.com/p/create\\\" target=\\\"_blank\\\">Piskel</a> to create art to put into Clueless.\"\nmsgstr \"Šablons ir saite uz attēlu kura ir ievietota šablona teksta lodziņā, iestatījumu panelī, kuru tad var novietot uz kanvas. Jūs varat izmantot parastu attēla saiti uz jūsu pikseļu zīmējumu, bet daudzi izmanto trešās puses rīkus, kā piemēram, <a href=\\\"https://discord.gg/5MVDCq53vC\\\" target=\\\"blank\\\">Clueless</a>. Ja jums pašiem vajag izveidot pikseļu zīmejumu, jūs varat izmantot <a href=\\\"https://www.piskelapp.com/p/create\\\" target=\\\"_blank\\\">Piskel</a>, kuru tad var ielikt iekšā Clueless.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I move a template?\"\nmsgstr \"Kā man pārvietot šablonu?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Hold <kbd>CTRL</kbd> (or <kbd>OPTION</kbd> on macOS) and click and drag to move it around. On mobile, you can tap and hold where you want to move the template and click \\\"Move Template Here\\\" in the pop-up.\"\nmsgstr \"Turiet <kbd>CTRL</kbd> (vai <kbd>OPTION</kbd> uz macOS) un klikškiniet un velciet to apkārt. Uz mobilās ierīces jūs varat nospiest un turēt tur, kur jūs vēlaties novietot šablonu, tad uznirstošajā logā izvēlieties \\\"Move Template Here\\\".\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Does the canvas reset? When?\"\nmsgstr \"Vai kanva tiek mainīta? Kad?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Yes. The canvas resets when it is completely full. A reset date is not usually decided until the canvas is full, but the average canvas life-span is around 1 month. Updates are posted in our <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord server</a> when a reset date is set.\"\nmsgstr \"Jā, kanva tiek nomainīta uz jaunu, kad tā ir pilna. Datums, kad tas notiek, parasti, nav noteikts pirms tas paliek pilns, bet parasti kanva paliek uz aptuveni 1 mēnesi. Atjauninājumi tiek publicēti mūsu <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord serverī</a> kad datums ir noteikts.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Where can I see the past canvases?\"\nmsgstr \"Kur es varu redzēt pagājušās kanvas?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"The past canvases are featured on our <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord server</a>, or the <a href=\\\"https://archives.pxls.space\\\" target=\\\"_blank\\\">archives</a>, which records timelapses and a lot of useful information on each canvas.\"\nmsgstr \"Pagājušās kanvas ir parādītas mūsu <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord serverī</a>, vai trešās puses mājaslapā <a href=\\\"https://pxlsfiddle.com\\\" target=\\\"_blank\\\">PxlsFiddle</a>, kas ieraksta video un daudz noderīgas informācijas par katru kanvu.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I see who placed a pixel?\"\nmsgstr \"Kā es varu redzēt kas nolika pikseli?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"By shift-clicking (or tap and hold on mobile) a pixel, you can see who placed a pixel, how many pixels they have placed, and when they placed it.\"\nmsgstr \"Shift-klikšķinot (vai turot) pikseli, jūs varat redzēt kas nolika pikseli un kad, kā arī cik daudz viņi ir nolikuši pavisam.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I report someone?\"\nmsgstr \"Kā man sūdzēties par kādu?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Shift-click (or tap and hold on mobile) on a pixel, and click the Report button.\"\nmsgstr \"Shift-klikšķiniet (vai turiet) pikseli un izvēlieties \\\"Report\\\"\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I change the color of my name in the chat?\"\nmsgstr \"Kā man izmainīt mana vārda krāsu čatā?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"There is a \\\"Username Color\\\" option near the bottom of the settings panel.\"\nmsgstr \"Iestatījumu panelī atrodiet \\\"Lietotājvārda Krāsa\\\"\"\n\n#: /views/partials/faq.handlebars\nmsgid \"What is a \\\"virginmap\\\"?\"\nmsgstr \"Kas ir fona pikseļu karte?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"The virginmap shows which pixels have not yet been placed on (or “virgin” pixels).\"\nmsgstr \"Fona pikseļu karte parāda pikseļus, uz kuriem neviens lietotājs vēl nav uzlicis savu pikseli.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I report bugs?\"\nmsgstr \"Kā man paziņot par kļūdu?\"\n\n# I can't think of a way to say staff without sounding super weird\n#: /views/partials/faq.handlebars\nmsgid \"Submit bugs to the #dev-and-bugs forum in the <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord server</a>. If you have found an exploit, please message one of the staff members privately (through DMs) or open a modmail by DMing pxls.mail#8384.\"\nmsgstr \"Par kļūdām varat paziņot #dev-and-bugs kanālā mūsu <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord serverī</a>. Ja atradāt eksploitu, lūdzu sazinieties ar administratoru privātā sarakstē.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I get more info or contact staff?\"\nmsgstr \"Kā es varu iegūt vairāk informācijas vai sazināties ar administratoru?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Check the info panel (the icon on the top left) for more details and links, or join our <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord server</a>, where a staff member will gladly respond.\"\nmsgstr \"Apskatiet info paneli (ikona augšējā kreisajā stūrī) priekš sīkākas informācijas un saitēm vai pievienojieties mūsu <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord serverim</a>, kur kāds ar prieku atbildēs uz jūsu jautājumiem.\"\n\n#: /views/partials/info.handlebars\nmsgid \"Welcome!\"\nmsgstr \"Laipni lūdzam!\"\n\n#: /views/partials/info.handlebars\nmsgid \"Welcome to pxls.space! Pxls is a multiplayer online collaborative canvas based on Reddit's <a href=\\\"https://www.reddit.com/r/place\\\" target=\\\"_blank\\\">r/place</a> event from 2017 that allows you to create anything you can imagine, one pixel at a time. Join hundreds of other players in the Pxls community and create amazing works of art together as a team, or solo.\"\nmsgstr \"Esiet sveicināti uz pxls.space! Pxls ir tiešsaistes vairāku spēlētāju sadarbības kanva, kura ļauj jums izveidot jebko, ko varat iedomāties, pa vienam pikselim reizē. Pievienojieties simtiem citu spēlētāju Pxls kopienā un veidojiet apbrīnojamus mākslas darbus kopā kā komanda, vai viens pats.\"\n\n# project maintainers = staff, makes sense right?\n#: /views/partials/info.handlebars\nmsgid \"The best place to reach staff and fellow community is in the discord!\"\nmsgstr \"Labākā vieta, kur sazināties ar projekta uzturētājiem un citiem, ir discord!\"\n\n#: /views/partials/info.handlebars\nmsgid \"Check out our social media pages, and please take the time to read the rules below. Have fun creating (or changing) art!\"\nmsgstr \"Apskatiet mūsu sociālo mēdiju lapas un lūdzu veltiet laiku lai iepazītos ar noteikumiem zemāk. Izklaidējieties veidojot (vai mainot) mākslas darbus!\"\n\n#: /views/partials/info.handlebars\nmsgid \"Canvas Rules\"\nmsgstr \"Kanvas Noteikumi\"\n\n#: /views/partials/info.handlebars\nmsgid \"We pride ourselves on trying to keep an open canvas for all free from outside interference on our end, and especially censorship. However, for the good of the community and on accounts of our own beliefs, please acknowledge and obey the following guidelines:\"\nmsgstr \"Mēs lepojamies ar to, ka cenšamies visiem nodrošināt atvērtu kanvu brīvu no ārējās iejaukšanās un jo īpaši cenzūras. Tomēr kopienas labā un mūsu pašu pārliecības dēļ, lūdzu, atzīstiet un ievērojiet šādas vadlīnijas:\"\n\n#: /views/partials/info.handlebars\nmsgid \"No hateful imagery or derogatory speech. This includes but is not limited to words such as <i>f****t</i>, <i>n****r</i>, etc; as well as the Swastika, Hammer and Sickle, and any symbols of terrorism.\"\nmsgstr \"Nekādu naidīgu attēlu vai nievājošas runas. Tas ietver tādus vārdus kā, bet ne tikai, <i>f****t</i>, <i>n****r</i> utt., kā arī svastika un jebkādi terorisma simboli.\"\n\n#: /views/partials/info.handlebars\nmsgid \"No NSFW or NSFL content.\"\nmsgstr \"Nekāda NSFW vai NSFW satura (\\\"nav drošs priekš darba\\\" un \\\"nav drošs priekš dzīves\\\").\"\n\n#: /views/partials/info.handlebars\nmsgid \"No nudity or otherwise sexually explicit content\"\nmsgstr \"Nekāda kailuma vai citādi seksuāla satura\"\n\n#: /views/partials/info.handlebars\nmsgid \"No female-presenting nipples/bare breasts, genitalia, sexual fluids\"\nmsgstr \"Nekādu sieviešu krūtsgalu/kailu krūšu, ģenitāliju, seksuālo šķidrumu\"\n\n#: /views/partials/info.handlebars\nmsgid \"No sexual imagery/erotica\"\nmsgstr \"Nekādu seksuālu attēlu/erotikas\"\n\n#: /views/partials/info.handlebars\nmsgid \"No excessive blood or otherwise obscene/shocking content\"\nmsgstr \"Nekādu pārmērīgu asiņu vai citādi šokējoša satura\"\n\n#: /views/partials/info.handlebars\nmsgid \"No more than <b>one</b> account per user, no exceptions. Multiple account users will be banned from creating art on the canvas.\"\nmsgstr \"Ne vairāk par <b>vienu</b> kontu katram lietotājam, bez izņēmumiem. Lietotājiem ar vairākiem kontiem būs aizliegts zīmēt uz kanvas.\"\n\n#: /views/partials/info.handlebars\nmsgid \"No auto-placement tools of any kind, you must place the pixels manually.\"\nmsgstr \"Nekādu rīku, kas liek pikseļus jūsu vietā, jums katrs pikselis ir jāliek ar rokām.\"\n\n#: /views/partials/info.handlebars\nmsgid \"Do not abuse site functionality, such as reports or lookups. (e.g. automated reporting/lookups, etc.)\"\nmsgstr \"Nelietojies ļaunprātīgi saita funkcijas, kā sudzība un pikseļu uzmeklēšana. (piemēram automātiska sudzību sūtīšana/uzmeklēšana utt.)\"\n\n#: /views/partials/info.handlebars\nmsgid \"Any automated aggregation of data from user lookups is not allowed, and will result in a ban.\"\nmsgstr \"Jebkāda automātiska informācijas apkopošana no uzmeklēšanas nav atļauta un beigsies ar banu.\"\n\n#: /views/partials/info.handlebars\nmsgid \"Staff have final say in any rule disputes\"\nmsgstr \"Moderatoriem ir pēdējais vārds jebkādos strīdos par noteikumiem\"\n\n#: /views/partials/info.handlebars\nmsgid \"If you feel a moderator has acted inappropriately, please report it to an administrator.\"\nmsgstr \"Ja uzskatāt, ka moderators ir rīkojies neatbilstoši, lūdzu, ziņojiet par to administratoram.\"\n\n#: /views/partials/info.handlebars\nmsgid \"If you believe you have been falsely banned you may contact a moderator or administrator.\"\nmsgstr \"Ja uzskatāt, ka esat nobanots bez pamatota iemesla, varat sazināties ar moderatoru vai administratoru.\"\n\n#: /views/partials/info.handlebars\nmsgid \"Chat Rules\"\nmsgstr \"Čata Noteikumi\"\n\n#: /views/partials/info.handlebars\nmsgid \"Keep chat civil. No harassment or homophobic/transphobic/disablist language.\"\nmsgstr \"Esiet pieklājīgi čatā. Nedrīkst uzmākties un apvainot citus. Aizliegts iztekties veidā kas ir homofobisks/transfobisks vai pret invalīdiem.\"\n\n#: /views/partials/info.handlebars\nmsgid \"No hate speech. This includes emoji/symbols/ASCII art.\"\nmsgstr \"Nekādas naida runas, iekļaujot emocījzīmes, simbolus, ASCII zīmejumus.\"\n\n#: /views/partials/info.handlebars\nmsgid \"Normal swearing/etc is allowed\"\nmsgstr \"Lamāties ir atļauts\"\n\n#: /views/partials/info.handlebars\nmsgid \"No spamming\"\nmsgstr \"Nedrīkst spamot\"\n\n#: /views/partials/info.handlebars\nmsgid \"This includes excessive ASCII art/emojis/symbols/whitespace\"\nmsgstr \"Šis iekļauj pārmērīgus ASCII zīmejumus/emocījzīmes/atstarpes\"\n\n#: /views/partials/info.handlebars\nmsgid \"No \\\"copy pasta\\\"s\"\nmsgstr \"Nekādu \\\"copy pasta\\\" (teksta kopēšana un ielīmēšana lielā apjomā)\"\n\n#: /views/partials/info.handlebars\nmsgid \"No links to sites that actively break the canvas or chat rules (e.g. porn sites)\"\nmsgstr \"Nekādu saišu uz lapām kuras aktīvi pārkāpj kanvas vai čata noteikumus (piemēram pornogrāfija)\"\n\n#: /views/partials/info.handlebars\nmsgid \"No symbology which break the canvas or chat rules (e.g. NSFW ASCII art)\"\nmsgstr \"Nekādu simbolu kas pārkāpj kanvas vai čata noteikumus (piemēram NSFW ASCII zīmejumi)\"\n\n#: /views/partials/info.handlebars\nmsgid \"No personal information\"\nmsgstr \"Nekādas personīgās informācijas\"\n\n#: /views/partials/info.handlebars\nmsgid \"Links\"\nmsgstr \"Linki\"\n\n#: /views/partials/info.handlebars\nmsgid \"Terms of Service\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Privacy Policy\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Discord (main hub)\"\nmsgstr \"Discord (galvenais)\"\n\n#: /views/partials/info.handlebars\nmsgid \"Twitter\"\nmsgstr \"Twitter\"\n\n#: /views/partials/info.handlebars\nmsgid \"GitHub (back end)\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"GitHub (front end)\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Single-player mode\"\nmsgstr \"Viena spēlētāja režīms\"\n\n#: /views/partials/info.handlebars\nmsgid \"Statistics\"\nmsgstr \"Statistika\"\n\n#: /views/partials/info.handlebars\nmsgid \"Profile (user info, factions, etc.)\"\nmsgstr \"Profils (lietotāja info, frakcijas, utt.)\"\n\n#: /views/partials/info.handlebars\nmsgid \"Wiki\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Generator, progress checker, and monitor for Pxls templates\"\nmsgstr \"Pxls šablonu veidotājs, progresa pārbaudītājs, grafiki\"\n\n#: /views/partials/info.handlebars\nmsgid \"Archives\"\nmsgstr \"Arhīvi\"\n\n#: /views/partials/info.handlebars\nmsgid \"PxlsFiddle (archives)\"\nmsgstr \"PxlsFiddle (arhīvi)\"\n\n#: /views/partials/info.handlebars\nmsgid \"Donate\"\nmsgstr \"Ziedot\"\n\n#: /views/partials/info.handlebars\nmsgid \"Donations are not accepted at this time, but this panel will be updated when they're open again!\"\nmsgstr \"Ziedojumi šobrīd netiek pieņemti, bet šis panelis būs atjaunināts, kad tas būs atkal iespējams!\"\n\n#: /views/profile.handlebars\nmsgid \"{0}'s Profile\"\nmsgstr \"{0} Profils\"\n\n#: /views/profile.handlebars\nmsgid \"My Data\"\nmsgstr \"Mani Dati\"\n\n#: /views/profile.handlebars\nmsgid \"Reports\"\nmsgstr \"Sūdzības\"\n\n#: /views/profile.handlebars\nmsgid \"Factions\"\nmsgstr \"Frakcijas\"\n\n#: /views/profile.handlebars\nmsgid \"Data\"\nmsgstr \"Dati\"\n\n#: /views/profile.handlebars\nmsgid \"You must be logged in to view your profile.\"\nmsgstr \"Jums ir nepieciešams pierakstīties lau redzētu savu profilu.\"\n\n#: /views/profile.handlebars\nmsgid \"Registration Date\"\nmsgstr \"Reģistrācijas Datums\"\n\n#: /views/profile.handlebars /public/include/lookup.js\nmsgid \"Alltime Pixels\"\nmsgstr \"Pikseļi Pavisam\"\n\n#: /views/profile.handlebars\nmsgid \"Current Canvas Pixels\"\nmsgstr \"Pašreizējās Kanvas Pikseļi\"\n\n#: /views/profile.handlebars\nmsgid \"Discord Tag\"\nmsgstr \"Discord Lietotājvārds\"\n\n#: /views/profile.handlebars /public/include/lookup.js\nmsgid \"Faction\"\nmsgstr \"Frakcija\"\n\n#: /views/profile.handlebars\nmsgid \"None\"\nmsgstr \"Nekāda\"\n\n#: /views/profile.handlebars /public/admin/admin.js\nmsgid \"Roles\"\nmsgstr \"Lomas\"\n\n#: /views/profile.handlebars\nmsgid \"Canvas Ban Expiry\"\nmsgstr \"Kanvas Bana Beigas\"\n\n#: /views/profile.handlebars\nmsgid \"Never\"\nmsgstr \"Nekad\"\n\n#: /views/profile.handlebars\nmsgid \"Chat Ban Expiry\"\nmsgstr \"Čata Bana Beigas\"\n\n#: /views/profile.handlebars\nmsgid \"View rankings and other stats <a href=\\\"/stats\\\">here</a>.\"\nmsgstr \"Apskatiet reitingus un citu statistiku <a href=\\\"/stats\\\">šeit</a>.\"\n\n#: /views/profile.handlebars\nmsgid \"You must be logged in to view your reports.\"\nmsgstr \"Jums ir nepieciešams pierakstīties lai redzētu savas sūdzības\"\n\n#: /views/profile.handlebars\nmsgid \"Canvas Reports ({0}/{1} open)\"\nmsgstr \"Kanvas Sūdzības ({0}/{1} atvērtas)\"\n\n#. eg \"Report on Bob (closed)\n#: /views/profile.handlebars\nmsgid \"Report on {0} (closed)\"\nmsgstr \"Sūdzība uz {0} (aizvērta)\"\n\n#. eg \"Report on Bob (open)\n#: /views/profile.handlebars\nmsgid \"Report on {0} (open)\"\nmsgstr \"Sūdzība uz {0} (atvērta)\"\n\n#. eg \"Reported Bob on Jan 1, 1970, 00:00:00 AM (UTC)\n#: /views/profile.handlebars\nmsgid \"Reported {0} on {1}\"\nmsgstr \"Sūdzība uz {0} sūtīta {1}\"\n\n#: /views/profile.handlebars\nmsgid \"There are no canvas reports to show.\"\nmsgstr \"Nav kanvas sūdzību, kuru parādīt.\"\n\n#: /views/profile.handlebars\nmsgid \"Chat Reports ({0}/{1} open)\"\nmsgstr \"Čata sūdzības ({0}/{1} atvērtas)\"\n\n#: /views/profile.handlebars\nmsgid \"There are no chat reports to show.\"\nmsgstr \"Nav čata sūdzību, kuru parādīt.\"\n\n#: /views/profile.handlebars\nmsgid \"You must be logged in to manage your factions.\"\nmsgstr \"Jums ir nepieciešams pierakstīties lai pārvaldītu frakcijas.\"\n\n#: /views/profile.handlebars\nmsgid \"You are faction restricted and cannot create new factions. If you believe this is an error, please contact a moderator.\"\nmsgstr \"Uz jums ir uzlikts frakciju ierobežojums un jūs nevarat izveidot jaunas frakcijas. Ja uzskatāt, ka tā ir kļūda, sazinieties ar moderatoru.\"\n\n#: /views/profile.handlebars\nmsgid \"You are canvas banned and cannot create new factions. If you believe this is an error, please contact a moderator.\"\nmsgstr \"Jūms ir kanvas bans un jūs nevarar izveidot jaunas frakcijas. Ja uzskatāt, ka tā ir kļūda, sazinieties ar moderatoru.\"\n\n#: /views/profile.handlebars\nmsgid \"You must have at least {0} all-time pixels to create a faction.\"\nmsgstr \"Jums ir nepieciešami vismaz {0} pikseļi pavisam lai izveidotu frakciju.\"\n\n#: /views/profile.handlebars\nmsgid \"Create\"\nmsgstr \"Izveidot\"\n\n#: /views/profile.handlebars\nmsgid \"Join\"\nmsgstr \"Pievienoties\"\n\n#: /views/profile.handlebars\nmsgid \"This is your currently displayed faction.\"\nmsgstr \"Šī ir frakcija kura pašlaik tiek rādīta.\"\n\n#. eg \"Pixelers (members: 100, ID: 1)\"\n#: /views/profile.handlebars\nmsgid \"{0} (members: {1}, ID: {2})\"\nmsgstr \"{0} (biedru: {1}, ID: {2})\"\n\n#: /views/profile.handlebars\nmsgid \"Owner: {0}\"\nmsgstr \"Īpašnieks: {0}\"\n\n#. makes the faction no longer the one displayed for the current user\n#: /views/profile.handlebars\nmsgid \"Remove Displayed\"\nmsgstr \"Pārstāt rādīt\"\n\n#. makes the faction the one displayed for the current user\n#: /views/profile.handlebars\nmsgid \"Set Displayed\"\nmsgstr \"Rādīt\"\n\n#: /views/profile.handlebars\nmsgid \"Members\"\nmsgstr \"Biedri\"\n\n#: /views/profile.handlebars\nmsgid \"Edit\"\nmsgstr \"Rediģēt\"\n\n#: /views/profile.handlebars /public/include/chat.js\nmsgid \"Delete\"\nmsgstr \"Izdzēst\"\n\n#: /views/profile.handlebars\nmsgid \"Leave\"\nmsgstr \"Pamest\"\n\n#: /views/profile.handlebars\nmsgid \"You are not in any factions yet!\"\nmsgstr \"Jūs pagaidām neesat nevienā frakcijā!\"\n\n#: /views/profile.handlebars\nmsgid \"You must be logged in to view your data.\"\nmsgstr \"Jums ir nepieciešams pierakstīties lai skatītu savus datus.\"\n\n#: /views/profile.handlebars\nmsgid \"Log Keys\"\nmsgstr \"Datu Atslēgas\"\n\n#: /views/profile.handlebars\nmsgid \"Log keys can be used by those who have them to tell which pixels you placed on previous canvases.\"\nmsgstr \"Datu atslēgu var izmantot lai redzētu, kurus pikseļus bijāt likuši iepriekšējā kanvā.\"\n\n#: /views/profile.handlebars\nmsgid \"You can see the public <a href=\\\"https://pxls.space/extra/logs/\\\" target=\\\"_blank\\\">Pxls Logs</a> to learn more.\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Canvas Code\"\nmsgstr \"Kanvas Kods\"\n\n#: /views/profile.handlebars\nmsgid \"Log Key\"\nmsgstr \"Datu atslēga\"\n\n#: /views/profile.handlebars\nmsgid \"You have no log keys yet!\"\nmsgstr \"Jums vēl nav nevienas datu atslēgas!\"\n\n#: /views/profile.handlebars\nmsgid \"Log keys should show up here after a canvas you have placed on ends.\"\nmsgstr \"Datu atslēgām vajadzētu šeit parādīties pēc kanvas kurā piedalījāties beigām.\"\n\n#: /views/profile.handlebars\nmsgid \"Members of {0} ([{1}])\"\nmsgstr \"{0} ([{1}]) biedri\"\n\n#: /views/profile.handlebars /public/admin/admin.js /public/include/lookup.js\nmsgid \"Close\"\nmsgstr \"Aizvērt\"\n\n#: /views/profile.handlebars\nmsgid \"Faction Members\"\nmsgstr \"Frakcijas Biedri\"\n\n#. This loop only fires when on our own profile. We can't leave a faction we own, we can only transfer ownership, so no point in showing ourselves in the member list.\n#. since we can't leave the faction until we transfer, if there's only one member in the list it's assumed to be the owner. we don't want to show ourself in the list\n#: /views/profile.handlebars\nmsgid \"Transfer Ownership\"\nmsgstr \"Pārvest Īpašnieka Statusu\"\n\n#. bans a user from the faction\n#: /views/profile.handlebars /public/include/chat.js\nmsgid \"Ban\"\nmsgstr \"Banot\"\n\n#: /views/profile.handlebars\nmsgid \"Nothing to see here!\"\nmsgstr \"Šeit nav ko redzēt!\"\n\n#: /views/profile.handlebars\nmsgid \"Faction Bans\"\nmsgstr \"Frakcijas Bani\"\n\n#: /views/profile.handlebars /public/admin/admin.js /public/include/chat.js\nmsgid \"Unban\"\nmsgstr \"Noņemt banu\"\n\n#: /views/profile.handlebars\nmsgid \"Find A Faction\"\nmsgstr \"Atrast Frakciju\"\n\n#: /views/profile.handlebars\nmsgid \"Search:\"\nmsgstr \"Meklēt:\"\n\n#: /views/profile.handlebars\nmsgid \"Enter a search term to get started.\"\nmsgstr \"Ievadiet meklēšanas vaicājumu lai sāktu\"\n\n#: /views/profile.handlebars\nmsgid \"Load More\"\nmsgstr \"Ielādēt Vēl\"\n\n#: /public/admin/admin.js\nmsgid \"Send alert...\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Rule #1: Hateful/derogatory speech or symbols\"\nmsgstr \"Noteikums #1: Naida runa vai simboli\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Rule #2: Nudity, genitalia, or non-PG-13 content\"\nmsgstr \"Noteikums #2: Kailums, ģenitālijas vai 13+ saturs\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Rule #3: Multi-account\"\nmsgstr \"Noteikums #3: Vairāki konti\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Rule #4: Botting\"\nmsgstr \"Noteikums #4: Automātiski rīki\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Other (specify below)\"\nmsgstr \"Cits (paskaidrojiet zemāk)\"\n\n#: /public/admin/admin.js /public/include/chat.js /public/include/lookup.js\nmsgid \"Additional information (if applicable)\"\nmsgstr \"Papildus informācija (ja piemērojams)\"\n\n#. \"Revert pixels of the last *n* hours\", part before 'n'\n#: /public/admin/admin.js\nmsgid \"Revert pixels of the last \"\nmsgstr \"\"\n\n#. \"Revert pixels of the last *n* hours\", part after 'n'\n#: /public/admin/admin.js\nmsgid \" hours\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"You must specify the details.\"\nmsgstr \"Jums ir jānorāda detaļas.\"\n\n#: /public/admin/admin.js\nmsgid \"Something went wrong! Perhaps insufficient permissions?\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Shadowban user\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Shadowbanned user\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Permaban user\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Permabanned user\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Ban user\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Banned user\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Unbanned user ${username}\"\nmsgstr \"\"\n\n#. Context: ban type\n#: /public/admin/admin.js\nmsgid \"shadow\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"never\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"permanent\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/chat.js /public/include/uiHelper.js\n#: /public/include/user.js\nmsgid \"Yes\"\nmsgstr \"Jā\"\n\n#: /public/admin/admin.js /public/include/chat.js /public/include/uiHelper.js\n#: /public/include/user.js\nmsgid \"No\"\nmsgstr \"Nē\"\n\n#: /public/admin/admin.js\nmsgid \"Yes (permanent)\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Username\"\nmsgstr \"Lietotājvārds\"\n\n#: /public/admin/admin.js /public/include/chat.js\nmsgid \"Profile\"\nmsgstr \"Profils\"\n\n#: /public/admin/admin.js\nmsgid \"Logins\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"All Time Pixels\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/user.js\nmsgid \"Rename Requested\"\nmsgstr \"Pārsaukšana Pieprasīta\"\n\n#: /public/admin/admin.js\nmsgid \"Discord Name\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/user.js\nmsgid \"Banned\"\nmsgstr \"Banots\"\n\n#: /public/admin/admin.js\nmsgid \"Chatbanned\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Ban Reason\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Ban Expiracy\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Chatban Reason\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"(canvas ban)\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"when canvas ban ends\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Chatban Expires\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Ban (24h)\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Permaban\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Shadowban\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Custom ban length: \"\nmsgstr \"\"\n\n#. Admin check. Example: type = 'username', arg = 'pxlsuser94'\n#: /public/admin/admin.js\nmsgid \"${type} ${arg} not found.\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Unban Reason:\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Unbanning ${username}\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/chat.js /public/include/lookup.js\n#: /public/include/user.js\nmsgid \"Cancel\"\nmsgstr \"Atcelt\"\n\n#. Moderator panel label\n#: /public/admin/admin.js\nmsgid \"MOD\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Ignore cooldown\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Place any color\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Ignore placemap\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Ban user (24h)\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Unban user\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Check user\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"profile\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"User Agent\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Send Alert\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Mod Actions\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"More...\"\nmsgstr \"\"\n\n#. Snapshot save name\n#: /public/include/board.js\nmsgid \"pxls canvas\"\nmsgstr \"pxls kanva\"\n\n#. template link action\n#: /public/include/chat.js\nmsgid \"Ask\"\nmsgstr \"Prasīt\"\n\n#: /public/include/chat.js\nmsgid \"Open in a new tab\"\nmsgstr \"Atvērt jaunā cilnē\"\n\n#: /public/include/chat.js\nmsgid \"Open in current tab (replacing template)\"\nmsgstr \"Atvērt pašreizējā cilnē (aizstājot šablonu)\"\n\n#: /public/include/chat.js\nmsgid \"Jump to coordinates without replacing template\"\nmsgstr \"Aizlekt uz koordināti neaizstājot šablonu\"\n\n#: /public/include/chat.js\nmsgid \"Please upload your template image to a third-party image host.\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"You must have at least \"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \" pixels to send links.\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"You must be logged in to chat.\"\nmsgstr \"Jums ir nepieciešams pierakstīties lai izmantotu čatu.\"\n\n#: /public/include/chat.js\nmsgid \"No Results\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Reply\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"none provided\"\nmsgstr \"nav norādīts\"\n\n#: /public/include/chat.js\nmsgid \"Purged by ${purge.initiator} with reason: ${reason}\"\nmsgstr \"${purge.initiator} izdzēsa ar iemeslu: ${reason}\"\n\n#: /public/include/chat.js\nmsgid \"External Link\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"This link is taking you to the following website:\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"The operators of this website have no responsibility or control over the contents hosted at {0}. Are you sure you want to go there?\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Note: You can disable this popup in settings.\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Visit Site\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"template:\"\nmsgstr \"šablons:\"\n\n#: /public/include/chat.js\nmsgid \"Open Failed\"\nmsgstr \"Atvēršana Neizdevās\"\n\n#: /public/include/chat.js\nmsgid \"Failed to automatically open in a new tab\"\nmsgstr \"Neizdevās automatiski atvērt jaunā cilnē\"\n\n#: /public/include/chat.js\nmsgid \"Click here to open in a new tab instead\"\nmsgstr \"Nospiediet šeit lai atvērtu jaunā cilnē\"\n\n#: /public/include/chat.js\nmsgid \"Open Template\"\nmsgstr \"Atvērt Šablonu\"\n\n#: /public/include/chat.js\nmsgid \"This link will overwrite your current template. What would you like to do?\"\nmsgstr \"Šī saite pārrakstīs pašreizejo šablonu. Ko jūs vēlētos darīt?\"\n\n#: /public/include/chat.js\nmsgid \"Note: You can set a default action in the settings menu which bypasses this popup completely.\"\nmsgstr \"Piezīme: Jūs varat iestatīt noklusējuma darbību iestatījumos lai izlaistu šo logu pilnībā.\"\n\n#: /public/include/chat.js\nmsgid \"OK\"\nmsgstr \"\"\n\n#: /public/include/chat.js /public/include/lookup.js\nmsgid \"Report\"\nmsgstr \"Sūdzēties\"\n\n#: /public/include/chat.js\nmsgid \"Mention\"\nmsgstr \"Pieminēt\"\n\n#: /public/include/chat.js\nmsgid \"Ignore\"\nmsgstr \"Ignorēt\"\n\n#: /public/include/chat.js\nmsgid \"Chat (un)ban\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Purge User\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Mod Lookup\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Chat Lookup\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Enter a reason for your report\"\nmsgstr \"Ievadiet iemeslu jūsu sūdzībai\"\n\n#: /public/include/chat.js\nmsgid \"You are reporting a chat message from ${reportTarget} with the content:\"\nmsgstr \"\"\n\n#: /public/include/chat.js /public/include/lookup.js\nmsgid \"Sent report!\"\nmsgstr \"\"\n\n#: /public/include/chat.js /public/include/lookup.js\nmsgid \"Error sending report.\"\nmsgstr \"Radās kļuda sūtot sūdzību.\"\n\n#: /public/include/chat.js\nmsgid \"Report User\"\nmsgstr \"Sūdzēties par lietotāju\"\n\n#: /public/include/chat.js\nmsgid \"User ignored. You can unignore from chat settings.\"\nmsgstr \"Lietotājs ignorēts. Jūs varat pārstāt ignorēt no čata iestatījumiem.\"\n\n#: /public/include/chat.js\nmsgid \"Failed to ignore user. Either they\\\\'re already ignored, or an error occurred. If the problem persists, contact a developer.\"\nmsgstr \"Radās kļuda ignorējot lietotāju. Iespējams viņi jau ir ignorēti, vai ir notikusi kļuda. Ja problēma saglabājas, sazinieties ar izstrādātāju.\"\n\n#: /public/include/chat.js\nmsgid \"Permanent\"\nmsgstr \"Bezgalīgs\"\n\n#: /public/include/chat.js\nmsgid \"Temporary\"\nmsgstr \"Īslaicīgs\"\n\n#: /public/include/chat.js\nmsgid \"Rule 3: Spam\"\nmsgstr \"Noteikums 3: Spams\"\n\n#: /public/include/chat.js\nmsgid \"Rule 1: Chat civility\"\nmsgstr \"Noteikums 1: Pieklājība čatā\"\n\n#: /public/include/chat.js\nmsgid \"Rule 2: Hate Speech\"\nmsgstr \"Noteikums 2: Naida Runa\"\n\n#: /public/include/chat.js\nmsgid \"Rule 5: NSFW\"\nmsgstr \"Noteikums 5: NSFW\"\n\n#: /public/include/chat.js\nmsgid \"Custom\"\nmsgstr \"Pielāgots\"\n\n#: /public/include/chat.js\nmsgid \"Banning:\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Message:\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Ban Length\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Reason\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Purge Messages\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Purging all messages is disabled during snip mode\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Silent (no purge message)\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Custom reason\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Additional information:\"\nmsgstr \"Papildus informācija:\"\n\n#: /public/include/chat.js\nmsgid \"Chatban initiated\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Error occurred while chatbanning\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Chatban\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Failed to delete\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"ID: \"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"User: \"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Message: \"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Reason: \"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Delete Message\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Purge\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Selected Message\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Purge Reason\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"User purged\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Error sending purge.\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Toggle Rename Request\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Select one of the options below to set the current rename request state.\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Rename request updated\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"An unknown error occurred. Please contact a developer\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"New Name: \"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Enter the new name for the user below. Please note that if you\\\\'re trying to change the caps, you\\\\'ll have to rename to something else first.\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"User renamed\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Force Rename\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"You cannot use chat while canvas banned.\"\nmsgstr \"Kanvas bana dēļ jūs nevarat izmantot čatu\"\n\n#: /public/include/lookup.js\nmsgid \"Sending...\"\nmsgstr \"Sūta...\"\n\n#: /public/include/lookup.js\nmsgid \"additional information:\"\nmsgstr \"papildus informācija:\"\n\n#: /public/include/lookup.js\nmsgid \"Report Pixel\"\nmsgstr \"Sūdzēties Par Pikseli\"\n\n#: /public/include/lookup.js\nmsgid \"This pixel is background (was not placed by a user).\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"Hide sensitive information\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"Move Template Here\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"An error occurred, either you aren't logged in or you may be attempting to look up users too fast. Please try again in 60 seconds\"\nmsgstr \"Ir notikusi kļuda. Jūs neesat pierakstījies vai iespējams mēģinat uzmeklēt lietotājus pārāk ātri. Lūdzu mēģiniet vēlreiz pēc 60 sekundēm.\"\n\n#: /public/include/lookup.js\nmsgid \"Coords\"\nmsgstr \"Koordināta\"\n\n#: /public/include/lookup.js\nmsgid \"View Profile\"\nmsgstr \"Apskatīt Profilu\"\n\n#: /public/include/lookup.js\nmsgid \"Origin\"\nmsgstr \"Avots\"\n\n#: /public/include/lookup.js\nmsgid \"Part of a nuke\"\nmsgstr \"Daļa no masveida dzēšanas\"\n\n#: /public/include/lookup.js\nmsgid \"Placed by a staff member using placement overrides\"\nmsgstr \"Moderatora nolikts ignorējot taimeri\"\n\n#: /public/include/lookup.js\nmsgid \"Time\"\nmsgstr \"Laiks\"\n\n#: /public/include/lookup.js\nmsgid \"just now\"\nmsgstr \"tikko\"\n\n#: /public/include/lookup.js\nmsgid \"${hoursStr}:${minuteStr}:${secsStr} ago\"\nmsgstr \"pirms ${hoursStr}:${minuteStr}:${secsStr}\"\n\n#: /public/include/lookup.js\nmsgid \"Discord\"\nmsgstr \"Discord\"\n\n#: /public/include/notifications.js\nmsgid \"Posted by ${notification.who}\"\nmsgstr \"Atsūtīja ${notification.who}\"\n\n#: /public/include/notifications.js\nmsgid \"Expires ${expiry}\"\nmsgstr \"Beidzas ${expiry}\"\n\n#: /public/include/template.js\nmsgid \"There was an error getting the image\"\nmsgstr \"Notika kļūda iegūstot attēlu\"\n\n#: /public/include/timer.js\nmsgid \"Your next pixel will be available in ${delay} seconds!\"\nmsgstr \"Jūsu nākošais pikselis būs pieejams pēc ${delay} sekundēm!\"\n\n#: /public/include/timer.js\nmsgid \"Your next pixel has been available for ${alertDelay} seconds!\"\nmsgstr \"Jūsu nākošais pikselis bija pieejams pirms ${alertDelay} sekundēm!\"\n\n#: /public/include/timer.js\nmsgid \"Your next pixel is available!\"\nmsgstr \"Jūsu nākošais pikselis ir pieejams!\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Dark\"\nmsgstr \"Tumšs\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Darker\"\nmsgstr \"Tumšāks\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Blue\"\nmsgstr \"Zils\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Purple\"\nmsgstr \"Violets\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Green\"\nmsgstr \"Zaļš\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Matte\"\nmsgstr \"Matēts\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Terminal\"\nmsgstr \"Terminālis\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Red\"\nmsgstr \"Sarkans\"\n\n#: /public/include/uiHelper.js\nmsgid \"A new ${type} report has been received.\"\nmsgstr \"\"\n\n#: /public/include/uiHelper.js\nmsgid \"Cannot fetch local files. Use the file selector in template settings.\"\nmsgstr \"Neizdevās iegūt lokālos failus. Izmantojiet failu atlasītaju šablona iestatījumos.\"\n\n#: /public/include/uiHelper.js\nmsgid \"Redirect Warning\"\nmsgstr \"Novirzīšanas Brīdinājums\"\n\n#: /public/include/uiHelper.js\nmsgid \"Are you sure you want to redirect to the following URL?\"\nmsgstr \"Vai jūs esat pārliecināts ka vēlaties novirzīties uz sekojošo URL?\"\n\n#: /public/include/uiHelper.js\nmsgid \"Drag and dropped file must be a valid image.\"\nmsgstr \"Vilktajam un nomestajam failam jābūt derīgam attēlam.\"\n\n#: /public/include/uiHelper.js\nmsgid \"Discord name updated successfully\"\nmsgstr \"Discord vārds atjaunināts sekmīgi\"\n\n#: /public/include/uiHelper.js\nmsgid \"Couldn\\\\'t change discord name: \"\nmsgstr \"Neizdevās nomainīt discord vārdu\"\n\n#: /public/include/user.js\nmsgid \"By logging in or registering, you agree to the <a href=\\\"{0}\\\" target=\\\"_blank\\\">terms of use</a> and <a href=\\\"{1}\\\" target=\\\"_blank\\\">privacy policy</a>.\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"Sign in with {0}\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"New Accounts Disabled\"\nmsgstr \"Jauni Konti Atspējoti\"\n\n#: /public/include/user.js\nmsgid \"online\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"Sign Out\"\nmsgstr \"Iziet\"\n\n#: /public/include/user.js\nmsgid \"Are you sure you want to sign out?\"\nmsgstr \"Vai esat pārliecināti, ka vēlaties iziet?\"\n\n#: /public/include/user.js\nmsgid \"You are permanently banned.\"\nmsgstr \"Jūs esat banots uz bezgalīgu laiku.\"\n\n#: /public/include/user.js\nmsgid \"You are temporarily banned and will not be allowed to place until ${timestamp}\"\nmsgstr \"Jūs esat īslaicīgā banā un nevarēsiet likt līdz ${timestamp}\"\n\n#: /public/include/user.js\nmsgid \"You can contact us using one of the links in the info menu.\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"If you think this was an error, please contact us using one of the links in the info tab.\"\nmsgstr \"Ja uzskatāt, ka tā ir kļuda, lūdzu sazinieties ar mums izmantojot vienu no saitēm info panelī\"\n\n#: /public/include/user.js\nmsgid \"Ban reason:\"\nmsgstr \"Bana iemesls:\"\n\n#: /public/include/user.js\nmsgid \"An unknown error occurred. Please contact staff on discord\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"Staff have required you to change your username, this usually means your name breaks one of our rules.\"\nmsgstr \"Moderatori prasījuši jums nomainīt jūsu lietotājvārdu, parasti tas nozīmē, ka vārds pārkāpj kādu no mūsu noteikumiem.\"\n\n#: /public/include/user.js\nmsgid \"If you disagree, please contact us on Discord (link in the info panel).\"\nmsgstr \"Ja nepiekrītat, lūdzu kontaktējieties ar mums Discord (links ir info panelī)\"\n\n#: /public/include/user.js\nmsgid \"New Username:\"\nmsgstr \"Jaunais Lietotājvārds:\"\n\n#: /public/include/user.js\nmsgid \"Not now\"\nmsgstr \"Ne tagad\"\n\n#: /public/include/user.js\nmsgid \"Change\"\nmsgstr \"Nomainīt\"\n\n#: /public/include/user.js\nmsgid \"You must change your username.\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"Click here to continue.\"\nmsgstr \"\"\n\n#: /public/pxls.js\nmsgid \"Alert\"\nmsgstr \"Brīdinājums\"\n\n#~ msgid \"Subreddit\"\n#~ msgstr \"Subreddits\"\n\n#~ msgid \"GitHub\"\n#~ msgstr \"GitHub\"\n";

const locale_lv_46ts_525a1aa6 = () => poToMessages(source$4);

const source$3 = "msgid \"\"\nmsgstr \"\"\n\"Project-Id-Version: Pxls\\n\"\n\"POT-Creation-Date: 2024-09-07T20:41:44.977Z\\n\"\n\"Language: ru\\n\"\n\"Content-Type: text/plain; charset=UTF-8\\n\"\n\n#: /views/error.handlebars /views/profile.handlebars /public/include/user.js\nmsgid \"My Profile\"\nmsgstr \"Мой профиль\"\n\n#: /views/error.handlebars /views/profile.handlebars\nmsgid \"My Factions\"\nmsgstr \"Мои фракции\"\n\n#. HTTP status code name\n#: /views/error.handlebars\nmsgid \"Not Found\"\nmsgstr \"Не найдено\"\n\n#: /views/error.handlebars\nmsgid \"The content you requested could not be found at this URL. If you believe this is an error, please contact a developer.\"\nmsgstr \"Запрошенный вами контент не может быть найден по этому URL-адресу. Если вы считаете, что это ошибка, обратитесь к разработчику.\"\n\n#. links to the homepage (the app itself)\n#: /views/error.handlebars\nmsgid \"Back to Pxls\"\nmsgstr \"Вернуться в Pxls\"\n\n#. HTTP status code name\n#: /views/error.handlebars\nmsgid \"Not Authenticated\"\nmsgstr \"Не авторизован\"\n\n#: /views/error.handlebars\nmsgid \"You must be logged in to access this data. Please go back to pxls and go through the authentication process.\"\nmsgstr \"Вы должны авторизоваться, чтобы получить доступ к этим данным. Вернитесь в pxls и пройдите процесс авторизации.\"\n\n#. HTTP status code name\n#: /views/error.handlebars\nmsgid \"Not Allowed\"\nmsgstr \"Не разрешено\"\n\n#: /views/error.handlebars\nmsgid \"The action you attempted to perform is not allowed or resulted in an error. Please ensure you have access to the endpoint and try again later.\"\nmsgstr \"Действие, которое вы пытались выполнить, запрещено или привело к ошибке. Убедитесь, что у вас есть доступ к конечной точке, и повторите попытку позже.\"\n\n#: /views/index.handlebars\nmsgid \"Place pixels with people to create art\"\nmsgstr \"Ставьте пиксели с пользователями, чтобы создавать рисунки\"\n\n#: /views/index.handlebars\nmsgid \"Lost connection to server, reconnecting...\"\nmsgstr \"Потеряно соединение с сервером, переподключение...\"\n\n#: /views/index.handlebars\nmsgid \"Loading Heatmap (press <kbd>H</kbd> to cancel)\"\nmsgstr \"Загрузка Heatmap (нажмите <kbd>H</kbd> для отмены)\"\n\n#: /views/index.handlebars\nmsgid \"Loading Virginmap (press <kbd>X</kbd> to cancel)\"\nmsgstr \"Загрузка Virginmap (нажмите <kbd>X</kbd> для отмены)\"\n\n#: /views/index.handlebars\nmsgid \"Logout\"\nmsgstr \"Выйти\"\n\n#: /views/index.handlebars\nmsgid \"Canvas:\"\nmsgstr \"Полотно:\"\n\n#: /views/index.handlebars\nmsgid \"N/A\"\nmsgstr \"N/A\"\n\n#: /views/index.handlebars\nmsgid \"All Time:\"\nmsgstr \"Общее:\"\n\n#: /views/index.handlebars\nmsgid \"Loading online user count&hellip;\"\nmsgstr \"Загрузка пользователей в сети&hellip;\"\n\n#: /views/index.handlebars /public/admin/admin.js /public/include/lookup.js\nmsgid \"Pixels\"\nmsgstr \"Пиксели\"\n\n#: /views/index.handlebars\nmsgid \"Undo\"\nmsgstr \"Отменить\"\n\n#: /views/index.handlebars\nmsgid \"You are not signed in.\"\nmsgstr \"Вы не авторизованы.\"\n\n#: /views/index.handlebars /public/include/user.js\nmsgid \"Sign in with...\"\nmsgstr \"Авторизоваться с...\"\n\n#: /views/index.handlebars\nmsgid \"Loading...\"\nmsgstr \"Загрузка...\"\n\n#: /views/index.handlebars\nmsgid \"Sign up\"\nmsgstr \"Зарегистрироваться\"\n\n#: /views/index.handlebars\nmsgid \"Pick a username\"\nmsgstr \"Выберите имя пользователя\"\n\n#: /views/index.handlebars\nmsgid \"Username:\"\nmsgstr \"Имя пользователя:\"\n\n#: /views/index.handlebars\nmsgid \"Discord Tag (Optional):\"\nmsgstr \"Метка Discord (Опционально)\"\n\n#: /views/index.handlebars\nmsgid \"Drag and drop template image\"\nmsgstr \"Перетащить шаблон\"\n\n#: /views/index.handlebars\nmsgid \"Exit\"\nmsgstr \"Выход\"\n\n#: /views/index.handlebars /views/profile.handlebars\nmsgid \"Info\"\nmsgstr \"Информация\"\n\n#: /views/index.handlebars\nmsgid \"Close Panel\"\nmsgstr \"Закрыть панель\"\n\n#: /views/index.handlebars /public/include/chat.js\nmsgid \"Chat\"\nmsgstr \"Чат\"\n\n#: /views/index.handlebars\nmsgid \"Pings\"\nmsgstr \"Упоминания\"\n\n#: /views/index.handlebars\nmsgid \"Settings\"\nmsgstr \"Настройки\"\n\n#: /views/index.handlebars\nmsgid \"Jump To Bottom\"\nmsgstr \"Переместиться вниз\"\n\n#: /views/index.handlebars\nmsgid \"Replying to\"\nmsgstr \"\"\n\n#: /views/index.handlebars /public/include/chat.js\nmsgid \"On\"\nmsgstr \"Включить\"\n\n#: /views/index.handlebars\nmsgid \"Emoji\"\nmsgstr \"Эмодзи\"\n\n#: /views/index.handlebars\nmsgid \"Search\"\nmsgstr \"Поиск\"\n\n#: /views/index.handlebars\nmsgid \"keybinds;keys;keyboard;hotkeys\"\nmsgstr \"горячие клавиши;клавиши;клавиатура;горячие клавиши\"\n\n#: /views/index.handlebars\nmsgid \"Keybinds\"\nmsgstr \"Горячие клавиши\"\n\n#: /views/index.handlebars\nmsgid \"general\"\nmsgstr \"общие\"\n\n#: /views/index.handlebars\nmsgid \"General\"\nmsgstr \"Общие\"\n\n#: /views/index.handlebars\nmsgid \"move;moving;panning;drag\"\nmsgstr \"движение;двигаться;перемещение;перетаскивать\"\n\n#: /views/index.handlebars\nmsgid \"Mouse/arrows/wasd to pan\"\nmsgstr \"Мышь/стрелки/wasd для перемещения\"\n\n#: /views/index.handlebars\nmsgid \"mousewheel;zooming\"\nmsgstr \"колесо мыши;приближение\"\n\n#: /views/index.handlebars\nmsgid \"Scroll/pinch to zoom\"\nmsgstr \"СКМ для приближения\"\n\n#: /views/index.handlebars\nmsgid \"scroll;zooming\"\nmsgstr \"СКМ;приближение\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>+</kbd>/<kbd>-</kbd> or <kbd>Q</kbd>/<kbd>E</kbd> to zoom\"\nmsgstr \"<kbd>+</kbd>/<kbd>-</kbd> или <kbd>Q</kbd>/<kbd>E</kbd> для приближения\"\n\n#: /views/index.handlebars\nmsgid \"lookups\"\nmsgstr \"просмотры\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>Shift</kbd> + Click/Hold touch to lookup pixel\"\nmsgstr \"<kbd>Shift</kbd> + Нажать/удерживать для информации о пикселе\"\n\n#: /views/index.handlebars\nmsgid \"overlays;alignment;grid hidden;grid shown;hide grid;show grid\"\nmsgstr \"оверлеи;расположение;сетка скрыта;сетка показана;убрать сетку;показать сетку\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>G</kbd> to toggle grid\"\nmsgstr \"<kbd>G</kbd> для включения сетки\"\n\n#: /views/index.handlebars\nmsgid \"close;information shown;information hidden;info shown;info hidden;hide information;show information\"\nmsgstr \"закрыть;информация показана;информация скрыта;информация показана;информация скрыта;скрыть информацию;показать информацию\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>I</kbd> to open info\"\nmsgstr \"<kbd>I</kbd> чтобы открыть окно информации\"\n\n#: /views/index.handlebars\nmsgid \"close;settings hidden;settings shown;hide settings;show settings\"\nmsgstr \"закрыть;настройки скрыты;настройки показаны;скрыть настройки;показать настройки\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>T</kbd> to open settings\"\nmsgstr \"<kbd>T</kbd> чтобы открыть окно настроек\"\n\n#: /views/index.handlebars\nmsgid \"close;chat hidden;chat shown;hide chat;show chat\"\nmsgstr \"закрыть;чат скрыт;чат показан;скрыть чат;показать чат\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>B</kbd> to open chat\"\nmsgstr \"<kbd>B</kbd> чтобы открыть окно чата\"\n\n#: /views/index.handlebars\nmsgid \"canvas locked;move;moving;zoom;zooming\"\nmsgstr \"зафиксировать полотно;переместить;перемещение;приблизить;приближение\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>L</kbd> to toggle locking panning of the canvas\"\nmsgstr \"<kbd>L</kbd> для включения фиксации полотна\"\n\n#: /views/index.handlebars\nmsgid \"take screenshot;image;download;picture;canvas\"\nmsgstr \"сделать скриншот;изображение;загрузка;картинка;полотно\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>P</kbd> to take a snapshot\"\nmsgstr \"<kbd>P</kbd> чтобы сохранить полотно\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels placed pixels;heatmap hidden;heatmap shown;hide heatmap;show heatmap\"\nmsgstr \"оверлей;пользовательская активность;пиксели ставят пиксели пиздец;heatmap скрыт;heatmap показан;убрать heatmap;показать heatmap\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>H</kbd> to toggle heatmap\"\nmsgstr \"<kbd>H</kbd> чтобы переключить тепловую карту\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels unplaced pixels;virginmap hidden;virginmap shown;hide virginmap;show virginmap\"\nmsgstr \"оверлеи;пользовательская активность;пиксели убирают пиксели страшно;virginmap скрыта;virginmap показана;скрыть virginmap;показать virginmap\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>X</kbd> to toggle virginmap\"\nmsgstr \"<kbd>X</kbd> чтобы переключить virginmap\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels placed pixels;wipe;clean;\"\nmsgstr \"оверлеи;пользовательская активность;пиксели ставят пиксели;стереть;очистить;\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>O</kbd> to clear heatmap\"\nmsgstr \"<kbd>O</kbd> чтобы очистить тепловую карту\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels unplaced pixels;wipe;clean;\"\nmsgstr \"оверлеи;пользовательская активность;пиксели убирают пиксели;стереть;очистить;\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>U</kbd> to clear virginmap\"\nmsgstr \"<kbd>U</kbd> чтобы очистить virginmap\"\n\n#: /views/index.handlebars\nmsgid \"next color;previous color\"\nmsgstr \"следующий цвет;предыдущий цвет\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>J</kbd>/<kbd>K</kbd> to cycle through palette colors\"\nmsgstr \"<kbd>J</kbd>/<kbd>K</kbd> чтобы перемещаться по палитре\"\n\n#: /views/index.handlebars\nmsgid \"current coordinates;coords\"\nmsgstr \"текущие координаты;корды\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>C</kbd> to copy link of moused-over coordinates\"\nmsgstr \"<kbd>C</kbd> чтобы скопировать координаты курсора\"\n\n#: /views/index.handlebars\nmsgid \"cancel selection\"\nmsgstr \"отменить выбор\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>ESC</kbd> to deselect current pixel\"\nmsgstr \"<kbd>ESC</kbd> чтобы отменить выбор текущего пикселя\"\n\n#: /views/index.handlebars\nmsgid \"recenter;jump;center on template;guides;focus\"\nmsgstr \"центрировать заново;прыжок;центрировать на шаблоне;подсказки;фокус\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>R</kbd> to center the board on the current template\"\nmsgstr \"<kbd>R</kbd> чтобы переместиться на центр шаблона\"\n\n#: /views/index.handlebars\nmsgid \"templates;guides\"\nmsgstr \"шаблоны;подсказки\"\n\n#: /views/index.handlebars\nmsgid \"Template\"\nmsgstr \"Шаблон\"\n\n#: /views/index.handlebars\nmsgid \"transparency\"\nmsgstr \"прозрачность\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>Page Up</kbd> to increase opacity\"\nmsgstr \"<kbd>Page Up</kbd> чтобы уменьшить прозрачность\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>Page Down</kbd> to decrease opacity\"\nmsgstr \"<kbd>Page Down</kbd> чтобы увеличить прозрачность\"\n\n#: /views/index.handlebars\nmsgid \"hidden;shown;hide;show\"\nmsgstr \"скрыто;показано;скрыть;показать\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>V</kbd> to toggle visibility\"\nmsgstr \"<kbd>V</kbd> чтобы переключить видимость\"\n\n#: /views/index.handlebars\nmsgid \"Note: These values are based on QWERTY keyboards. For other layouts, use the keys corresponding to the same position on a QWERTY keyboard.\"\nmsgstr \"Примечание: Все значения основаны на QWERTY-клавиатурах. В иных раскладках, используйте то же расположение клавиш, что и на QWERTY-клавиатурах.\"\n\n#: /views/index.handlebars\nmsgid \"templates;overlays;guides\"\nmsgstr \"шаблоны;оверлеи;подсказки\"\n\n#: /views/index.handlebars\nmsgid \"templates;overlays;image;pixel art\"\nmsgstr \"шаблоны;оверлеи;изображение;пиксельная картина\"\n\n#: /views/index.handlebars\nmsgid \"template enabled;template disabled;show template;hide template;template shown;template hidden\"\nmsgstr \"шаблон включен;шаблон выключен;показать шаблон;скрыть шаблон;шаблон виден;шаблон скрыт\"\n\n#: /views/index.handlebars\nmsgid \"Use template\"\nmsgstr \"Использовать шаблон\"\n\n#: /views/index.handlebars\nmsgid \"Hold down <kbd>Ctrl</kbd> (or <kbd>Option</kbd> on mac) to drag the template around\"\nmsgstr \"Удерживайте <kbd>Ctrl</kbd> (или <kbd>Option</kbd> на Mac) чтобы перетащить шаблон\"\n\n#: /views/index.handlebars\nmsgid \"template title;template name;tab name;tab title;title=\"\nmsgstr \"заголовок шаблона;имя шаблона;имя вкладки;заголовок вкладки;заголовок=\"\n\n#: /views/index.handlebars\nmsgid \"Title:\"\nmsgstr \"Заголовок:\"\n\n#: /views/index.handlebars\nmsgid \"template location source;template source URL;template URL;template=\"\nmsgstr \"источник местоположения шаблона; источник шаблона URL; шаблон URL; шаблон=\"\n\n#: /views/index.handlebars\nmsgid \"URL:\"\nmsgstr \"URL:\"\n\n#: /views/index.handlebars\nmsgid \"template position;template x;template y;template location; template vertical; template horizontal;ox=;oy=\"\nmsgstr \"позиция шаблона;x шаблона;y шаблона;местоположение шаблона; вертикаль шаблона; горизонталь шаблона;ox=;oy=\"\n\n#: /views/index.handlebars\nmsgid \"Horizontal position:\"\nmsgstr \"Горизонтальная позиция:\"\n\n#: /views/index.handlebars\nmsgid \"Vertical position:\"\nmsgstr \"Вертикальная позиция:\"\n\n#: /views/index.handlebars\nmsgid \"template width;tw=\"\nmsgstr \"ширина шаблона;tw=\"\n\n#: /views/index.handlebars\nmsgid \"Width:\"\nmsgstr \"Ширина:\"\n\n#: /views/index.handlebars\nmsgid \"Reset\"\nmsgstr \"Сброс\"\n\n#: /views/index.handlebars\nmsgid \"template style;custom template\"\nmsgstr \"стиль шаблона; пользовательский шаблон\"\n\n#: /views/index.handlebars\nmsgid \"Style:\"\nmsgstr \"Стиль\"\n\n#: /views/index.handlebars\nmsgid \"Use Source Style\"\nmsgstr \"Использовать стиль источника\"\n\n#: /views/index.handlebars\nmsgid \"1-to-1\"\nmsgstr \"1 к 1\"\n\n#: /views/index.handlebars\nmsgid \"1-to-1 (keep incorrect colors)\"\nmsgstr \"1 к 1 (сохранять неправильные цвета)\"\n\n#: /views/index.handlebars\nmsgid \"Dotted (Small, 1:2)\"\nmsgstr \"Точечный (Маленький, 1:2)\"\n\n#: /views/index.handlebars\nmsgid \"Dotted (Big, 2:2)\"\nmsgstr \"Точечный (Большой, 2:2)\"\n\n#: /views/index.handlebars\nmsgid \"Symbols\"\nmsgstr \"Символы\"\n\n#: /views/index.handlebars\nmsgid \"Numbers\"\nmsgstr \"Цифры\"\n\n#: /views/index.handlebars\nmsgid \"Custom…\"\nmsgstr \"Пользовательский…\"\n\n#: /views/index.handlebars\nmsgid \"template style source;template style URL;custom style URL;custom template\"\nmsgstr \"источник стиля шаблона; URL стиля шаблона; URL пользовательского стиля; пользовательский шаблон\"\n\n#: /views/index.handlebars\nmsgid \"Custom style URL:\"\nmsgstr \"URL пользовательского стиля\"\n\n#: /views/index.handlebars\nmsgid \"template conversion;template palette conversion;convert to palette\"\nmsgstr \"преобразование шаблона;преобразование палитры шаблона;преобразование в палитру\"\n\n#: /views/index.handlebars\nmsgid \"Color Conversion Mode:\"\nmsgstr \"Режим преобразования цвета\"\n\n#: /views/index.handlebars\nmsgid \"Unconverted\"\nmsgstr \"Непреобразованный\"\n\n#: /views/index.handlebars\nmsgid \"Nearest Custom\"\nmsgstr \"Ближайший пользовательский\"\n\n#: /views/index.handlebars\nmsgid \"template transparency;template opacity;oo=\"\nmsgstr \"позрачность шаблона;затененность шаблона;oo=\"\n\n#: /views/index.handlebars\nmsgid \"Opacity:\"\nmsgstr \"Непрозрачность:\"\n\n#: /views/index.handlebars\nmsgid \"ui;interface\"\nmsgstr \"ui;интерфейс\"\n\n#: /views/index.handlebars\nmsgid \"UI Settings\"\nmsgstr \"Настройки Интерфейса\"\n\n#: /views/index.handlebars\nmsgid \"language override;text\"\nmsgstr \"выбор языка; текст\"\n\n#: /views/index.handlebars\nmsgid \"Language override:\"\nmsgstr \"Выбор языка\"\n\n#: /views/index.handlebars\nmsgid \"Use Browser Language\"\nmsgstr \"Использовать язык браузера\"\n\n#: /views/index.handlebars\nmsgid \"English\"\nmsgstr \"Английский\"\n\n#: /views/index.handlebars\nmsgid \"Bulgarian\"\nmsgstr \"Болгарский\"\n\n#: /views/index.handlebars\nmsgid \"French\"\nmsgstr \"Французский\"\n\n#: /views/index.handlebars\nmsgid \"German\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Russian\"\nmsgstr \"Русский\"\n\n#: /views/index.handlebars\nmsgid \"Swedish\"\nmsgstr \"Шведский\"\n\n#: /views/index.handlebars\nmsgid \"Finnish\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Toki Pona\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"themes;look;stylesheets;visuals\"\nmsgstr \"темы;взгляд;таблицы стилей;визуалы\"\n\n#: /views/index.handlebars\nmsgid \"Theme:\"\nmsgstr \"Тема:\"\n\n#: /views/index.handlebars\nmsgid \"Default\"\nmsgstr \"По умолчанию\"\n\n#: /views/index.handlebars\nmsgid \"hide reticule;hide reticle;reticule shown reticle shown;reticule hidden;reticle hidden\"\nmsgstr \"скрыть перекрестие;скрыть перекрестие;перекрестие показано перекрестие показано;перекрестие скрыто;перекрестие скрыто\"\n\n#: /views/index.handlebars\nmsgid \"Show reticule\"\nmsgstr \"Показать прицел\"\n\n#: /views/index.handlebars\nmsgid \"hide cursor;cursor shown;cursor hidden\"\nmsgstr \"скрыть курсор;курсор показан;курсор скрыт\"\n\n#: /views/index.handlebars\nmsgid \"Show cursor\"\nmsgstr \"Показать курсор\"\n\n#: /views/index.handlebars\nmsgid \"darkness filter\"\nmsgstr \"фильтр тьмы\"\n\n#: /views/index.handlebars\nmsgid \"Enable color brightness\"\nmsgstr \"Нстроить яркость\"\n\n#: /views/index.handlebars\nmsgid \"Warning: Known to cause fuzziness in Chrome on some Mac/Linux installs\"\nmsgstr \"Внимание: Известно, что это приводит к нечеткости в Chrome на некоторых системах Mac/Linux\"\n\n#: /views/index.handlebars\nmsgid \"Color brightness:\"\nmsgstr \"Цветовая насыщенность:\"\n\n#: /views/index.handlebars\nmsgid \"keep current selected;keep curent color;place\"\nmsgstr \"удерживать выбранное;удерживать текущий цвет;поставить\"\n\n#: /views/index.handlebars\nmsgid \"Deselect color after placing\"\nmsgstr \"Сбросить цвет после установки пикселя\"\n\n#: /views/index.handlebars\nmsgid \"mousewheel;palette scrolling\"\nmsgstr \"колесо мыши;прокрутка палитры\"\n\n#: /views/index.handlebars\nmsgid \"Enable scrolling on the palette to switch colors\"\nmsgstr \"Включить прокрутку палитры для смены цвета\"\n\n#: /views/index.handlebars\nmsgid \"reverse scrolling;mousewheel;palette scrolling;enable scrolling on the palette to switch colors\"\nmsgstr \"обратная прокрутка;колесо мыши;прокрутка палитры;включить прокрутку палитры для смены цвета\"\n\n#: /views/index.handlebars\nmsgid \"Invert scroll direction\"\nmsgstr \"Инвертировать направление прокрутки\"\n\n#: /views/index.handlebars\nmsgid \"indexed colors;palette indicies\"\nmsgstr \"индексированные цвета;индексы палитры\"\n\n#: /views/index.handlebars\nmsgid \"Add numbers to palette entries\"\nmsgstr \"Добавить номера к цветам палитры\"\n\n#: /views/index.handlebars\nmsgid \"scrollbar;palette scrolling\"\nmsgstr \"полоса прокрутки;прокрутка палитры\"\n\n#: /views/index.handlebars\nmsgid \"Enable thin scrollbar\"\nmsgstr \"Включить тонкую полосу прокрутки\"\n\n#: /views/index.handlebars\nmsgid \"scrollbar;palette scrolling;palette stack\"\nmsgstr \"полоса прокрутки;прокрутка палитры;набор палитры\"\n\n#: /views/index.handlebars\nmsgid \"Enable palette stacking\"\nmsgstr \"Включить сортировку палитры\"\n\n#: /views/index.handlebars\nmsgid \"floating bubble location\"\nmsgstr \"Местоположение окна пользователя\"\n\n#: /views/index.handlebars\nmsgid \"Bubble position:\"\nmsgstr \"Позиция окна пользователя:\"\n\n#: /views/index.handlebars\nmsgid \"Top left\"\nmsgstr \"Слева вверху\"\n\n#: /views/index.handlebars\nmsgid \"Top right\"\nmsgstr \"Справа вверху\"\n\n#: /views/index.handlebars\nmsgid \"Bottom left\"\nmsgstr \"Слева внизу\"\n\n#: /views/index.handlebars\nmsgid \"Bottom right\"\nmsgstr \"Справа внизу\"\n\n#: /views/index.handlebars\nmsgid \"broken;offset workaround\"\nmsgstr \"ошибка;обходное смещение\"\n\n#: /views/index.handlebars\nmsgid \"Attempt to fix canvas displacement bug in Chrome 78+\"\nmsgstr \"Попытка исправить ошибку смещения холста в Chrome 78+\"\n\n#: /views/index.handlebars\nmsgid \"chat;message;ping sound\"\nmsgstr \"чат;сообщение;звук оповещения\"\n\n#: /views/index.handlebars\nmsgid \"Chat Settings\"\nmsgstr \"Настройки чата\"\n\n#: /views/index.handlebars\nmsgid \"username;color;colour\"\nmsgstr \"имя пользователя;цвет;оттенок\"\n\n#: /views/index.handlebars\nmsgid \"Username Color:\"\nmsgstr \"Цвет имени пользователя:\"\n\n#: /views/index.handlebars\nmsgid \"chat message;chat ui\"\nmsgstr \"сообщение чата;UI чата\"\n\n#: /views/index.handlebars\nmsgid \"Interface\"\nmsgstr \"Интерфейс чата\"\n\n#: /views/index.handlebars\nmsgid \"enable;disable\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Enable chat\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Page must be reloaded after changing\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"chat size;chat font\"\nmsgstr \"размер чата;шрифт чата\"\n\n#: /views/index.handlebars\nmsgid \"Font Size:\"\nmsgstr \"Размер шрифта:\"\n\n#: /views/index.handlebars\nmsgid \"time;timestamps\"\nmsgstr \"время;обозначение времени\"\n\n#: /views/index.handlebars\nmsgid \"24 Hour Timestamps\"\nmsgstr \"24-часовое обозначение времени\"\n\n#: /views/index.handlebars\nmsgid \"badges;pixel count;pixels placed\"\nmsgstr \"значки;число пикселей;пикселей поставлено\"\n\n#: /views/index.handlebars\nmsgid \"Show pixel-placed badges\"\nmsgstr \"Показать значки поставленных пикселей\"\n\n#: /views/index.handlebars\nmsgid \"badges;factions\"\nmsgstr \"значки;фракции\"\n\n#: /views/index.handlebars\nmsgid \"Show faction tags\"\nmsgstr \"Отображать тэги фракций\"\n\n#: /views/index.handlebars\nmsgid \"template urls;template links;template name\"\nmsgstr \"URL шаблона;ссылки шаблона;имя шаблона\"\n\n#: /views/index.handlebars\nmsgid \"Replace template titles with URLs in chat where applicable\"\nmsgstr \"Заменить заголовки шаблонов URL-адресами в чате, где это возможно\"\n\n#: /views/index.handlebars\nmsgid \"chat orientation;chat position\"\nmsgstr \"ориентация чата;позиция чата\"\n\n#: /views/index.handlebars\nmsgid \"Enable horizontal chat\"\nmsgstr \"Включить горизонтальный чат\"\n\n#: /views/index.handlebars\nmsgid \"banner;animation\"\nmsgstr \"баннер;анимация\"\n\n#: /views/index.handlebars\nmsgid \"Enable the rotating banner under chat\"\nmsgstr \"Включить вращающийся баннер под чатом\"\n\n#: /views/index.handlebars\nmsgid \"max;messages;truncate\"\nmsgstr \"максимально;сообщения;обрезать\"\n\n#: /views/index.handlebars\nmsgid \"Maximum amount of chat messages:\"\nmsgstr \"Максимальное количество сообщений в чате:\"\n\n#: /views/index.handlebars\nmsgid \"link;url;behaviour\"\nmsgstr \"ссылка;URL;поведение\"\n\n#: /views/index.handlebars\nmsgid \"Default internal link action click:\"\nmsgstr \"Щелчок по внутренней ссылке - по умолчанию:\"\n\n#: /views/index.handlebars\nmsgid \"link;url;behaviour;external;bypass;skip\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Skip external link popup\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Note: Has no effect if external link popups are disabled by the server.\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"chat icon;chat notifications;chat ping\"\nmsgstr \"иконка чата;уведомления чата;оповещение чата\"\n\n#: /views/index.handlebars\nmsgid \"Chat icon badge mode:\"\nmsgstr \"Режим иконки чата\"\n\n#: /views/index.handlebars\nmsgid \"Show on unread ping\"\nmsgstr \"Показать непрочитанное оповещение\"\n\n#: /views/index.handlebars\nmsgid \"Show on unread message\"\nmsgstr \"Показать непрочитанное сообщение\"\n\n#: /views/index.handlebars\nmsgid \"Never show\"\nmsgstr \"Никогда не показывать\"\n\n#: /views/index.handlebars\nmsgid \"chat icon;chat notifications;chat message\"\nmsgstr \"иконка чата;уведомления чата;сообщение чата\"\n\n#: /views/index.handlebars\nmsgid \"Chat icon highlight mode:\"\nmsgstr \"Подсветка иконки чата:\"\n\n#: /views/index.handlebars\nmsgid \"ignored;ignores;unignore;blocked;blocking;unblock\"\nmsgstr \"игнорируется;игнорирования;не игнорировать;заблокирован;блокировка;разблокировать\"\n\n#: /views/index.handlebars\nmsgid \"Ignores\"\nmsgstr \"Список игнора\"\n\n#: /views/index.handlebars\nmsgid \"unignore;unblock\"\nmsgstr \"не игнорировать;разблокировать\"\n\n#: /views/index.handlebars\nmsgid \"Unignore\"\nmsgstr \"Не игнорировать\"\n\n#: /views/index.handlebars\nmsgid \"overlays;virginmap;heatmap;grid\"\nmsgstr \"оверлеи;virginmap;тепловая карта;сетка\"\n\n#: /views/index.handlebars\nmsgid \"Overlay Settings\"\nmsgstr \"Настройки оверлея\"\n\n#: /views/index.handlebars\nmsgid \"heatmap;heatmap opacity;clear heatmap\"\nmsgstr \"тепловая карта;затененность heatmap;очистить heatmap\"\n\n#: /views/index.handlebars\nmsgid \"Heatmap\"\nmsgstr \"Тепловая карта\"\n\n#: /views/index.handlebars\nmsgid \"Turn on heatmap\"\nmsgstr \"Показать тепловую карту\"\n\n#: /views/index.handlebars\nmsgid \"(toggle with <kbd>H</kbd>)\"\nmsgstr \"(чтобы переключить, нажмите <kbd>H</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"overlays;activity;pixels placed pixels;wipe;clean\"\nmsgstr \"оверлеи;активность;пиксели ставят пиксели;стереть;очистить\"\n\n#: /views/index.handlebars\nmsgid \"Clear heatmap\"\nmsgstr \"Очистить тепловую карту\"\n\n#: /views/index.handlebars\nmsgid \"(hotkey: <kbd>O</kbd>)\"\nmsgstr \"(горячая клавиша: <kbd>O</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels placed pixels;transparency\"\nmsgstr \"оверлеи;активность пользователей;пиксели ставят пиксели;прозрачность\"\n\n#: /views/index.handlebars\nmsgid \"Heatmap background opacity:\"\nmsgstr \"затененность фона тепловой карты:\"\n\n#: /views/index.handlebars\nmsgid \"virginmap;virginmap opacity;clear virginmap\"\nmsgstr \"virginmap;затененность virginmap;очистить virginmap\"\n\n#: /views/index.handlebars\nmsgid \"Virginmap\"\nmsgstr \"Virginmap (карта нетронутых пикселей)\"\n\n#: /views/index.handlebars\nmsgid \"Turn on virginmap\"\nmsgstr \"Включить virginmap\"\n\n#: /views/index.handlebars\nmsgid \"(toggle with <kbd>X</kbd>)\"\nmsgstr \"(чтобы переключить, нажмите <kbd>X</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels unplaced pixels;transparency\"\nmsgstr \"оверлеи;активность пользователей;пиксели убирают пиксели;прозрачность\"\n\n#: /views/index.handlebars\nmsgid \"Virginmap background opacity:\"\nmsgstr \"затененность фона Virginmap:\"\n\n#: /views/index.handlebars\nmsgid \"overlays;activity;pixels unplaced pixels;wipe;clean\"\nmsgstr \"оверлеи;активность;пиксели убирают пиксели;стереть;очистить\"\n\n#: /views/index.handlebars\nmsgid \"Clear virginmap\"\nmsgstr \"Очистить virginmap\"\n\n#: /views/index.handlebars\nmsgid \"(hotkey: <kbd>U</kbd>)\"\nmsgstr \"(горячая клавиша: <kbd>U</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"Layer template underneath heatmap\"\nmsgstr \"Размещение шаблона под тепловой картой\"\n\n#: /views/index.handlebars\nmsgid \"grid;toggle grid\"\nmsgstr \"сетка;переключить сетку\"\n\n#: /views/index.handlebars\nmsgid \"Grid\"\nmsgstr \"Сетка\"\n\n#: /views/index.handlebars\nmsgid \"Turn on grid\"\nmsgstr \"Включить сетку\"\n\n#: /views/index.handlebars\nmsgid \"(toggle with <kbd>G</kbd>)\"\nmsgstr \"(чтобы переключить, нажмите <kbd>G</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"controls;zooming;panning;movement\"\nmsgstr \"элементы управления;приближение;фиксация;движение\"\n\n#: /views/index.handlebars\nmsgid \"Control Settings\"\nmsgstr \"Настройки элементов управления\"\n\n#: /views/index.handlebars\nmsgid \"zooming;scrolling;scale;scaling\"\nmsgstr \"приближение;прокрутка;масштаб;масштабирование\"\n\n#: /views/index.handlebars\nmsgid \"Zooming\"\nmsgstr \"Приближение\"\n\n#: /views/index.handlebars\nmsgid \"scrolling sensitivity;zooming sensitivity;mousewheel sensitivity\"\nmsgstr \"прокрутка чувствительности;чувствительность приближения;чувствительность СКМ\"\n\n#: /views/index.handlebars\nmsgid \"Zoom sensitivity:\"\nmsgstr \"Чувствительность приближения:\"\n\n#: /views/index.handlebars\nmsgid \"zooming limit;scrolling limit;mousewheel;zooming minimum;zooming maximum\"\nmsgstr \"ограничение приближения;ограничение прокрутки;СКМ;минимальное значение приближения;максимальное значение приближения\"\n\n#: /views/index.handlebars\nmsgid \"Minimum scale:\"\nmsgstr \"Минимальный масштаб:\"\n\n#: /views/index.handlebars\nmsgid \"Maximum scale:\"\nmsgstr \"Максимальный масштаб:\"\n\n#: /views/index.handlebars\nmsgid \"rounding;zooming;scrolling;mousewheel;integer;decimal\"\nmsgstr \"округление;приближение;прокрутка;СКМ;целое число;десятичное\"\n\n#: /views/index.handlebars\nmsgid \"Round zoom values to nearest whole number\"\nmsgstr \"Округлить значения масштабирования до ближайшего целого числа\"\n\n#: /views/index.handlebars\nmsgid \"controls;miscellaneous\"\nmsgstr \"элементы управления;разное\"\n\n#: /views/index.handlebars\nmsgid \"Lock the canvas (disallow canvas drag/zoom with mouse/fingers)\"\nmsgstr \"Закрепить полотно (запрещает перетаскивание полотна/приближение с помощью мыши/пальцами)\"\n\n#: /views/index.handlebars\nmsgid \"MMB picker;mouse picker;selection;palette picker\"\nmsgstr \"выбор MMB;выбор с помощью мыши;выбор;выбор палитры\"\n\n#: /views/index.handlebars\nmsgid \"Enable middle mouse button selecting color from board\"\nmsgstr \"Включение выбора цвета с полотна средней кнопкой мыши\"\n\n#: /views/index.handlebars\nmsgid \"right click action\"\nmsgstr \"щелчок правой кнопкой мыши\"\n\n#: /views/index.handlebars\nmsgid \"Right-click action:\"\nmsgstr \"Щелчок правой кнопкой мыши:\"\n\n#: /views/index.handlebars\nmsgid \"Nothing\"\nmsgstr \"Ничего\"\n\n#: /views/index.handlebars\nmsgid \"Clear color\"\nmsgstr \"Очистить цвет\"\n\n#: /views/index.handlebars\nmsgid \"Copy color\"\nmsgstr \"Копировать цвет\"\n\n#: /views/index.handlebars\nmsgid \"Lookup\"\nmsgstr \"Просмотреть\"\n\n#: /views/index.handlebars\nmsgid \"Clear color + Lookup\"\nmsgstr \"Очистить цвет + Просмотреть\"\n\n#: /views/index.handlebars\nmsgid \"snapshots;screenshot;download;picture;canvas\"\nmsgstr \"снимки;скриншот;загрузка;картинка;полотно\"\n\n#: /views/index.handlebars\nmsgid \"Snapshot Settings\"\nmsgstr \"Настройки снимка\"\n\n#: /views/index.handlebars\nmsgid \"screenshot;snapshot;download;board;canvas\"\nmsgstr \"скриншот;снимок;загрузка;полотно;полотно\"\n\n#: /views/index.handlebars\nmsgid \"take screenshot;image;download format;picture;canvas;board\"\nmsgstr \"сделать скриншот;изображение;загрузить формат;картинка;полотно;полотно\"\n\n#: /views/index.handlebars\nmsgid \"Snapshot image format:\"\nmsgstr \"Формат снимка изображения:\"\n\n#: /views/index.handlebars\nmsgid \"PNG\"\nmsgstr \"PNG\"\n\n#: /views/index.handlebars\nmsgid \"JPEG\"\nmsgstr \"JPEG\"\n\n#: /views/index.handlebars\nmsgid \"WEBP (Chrome only)\"\nmsgstr \"WEBP (только для Chrome)\"\n\n#: /views/index.handlebars\nmsgid \"sound;notification;alert;notify;ping\"\nmsgstr \"звук;уведомление;сигнал;уведомлять;оповещение\"\n\n#: /views/index.handlebars\nmsgid \"Sound and Notification Settings\"\nmsgstr \"Параметры звука и уведомлений\"\n\n#: /views/index.handlebars\nmsgid \"audio;mute;noise;volume\"\nmsgstr \"аудио;приглушенный;шумный;громкость\"\n\n#: /views/index.handlebars\nmsgid \"Enable sound\"\nmsgstr \"Включить звук\"\n\n#: /views/index.handlebars\nmsgid \"notifs;notify;pixel notification\"\nmsgstr \"уведомления;уведомлять;уведомление пикселя\"\n\n#: /views/index.handlebars\nmsgid \"Enable pixel available notification\"\nmsgstr \"Включить уведомление о доступности пикселей\"\n\n#: /views/index.handlebars\nmsgid \"notification;pixel ready;alert\"\nmsgstr \"уведомление;пиксель готов;сигнал\"\n\n#: /views/index.handlebars\nmsgid \"Pixel Ready Notification\"\nmsgstr \"Уведомление о готовности пикселя\"\n\n#: /views/index.handlebars\nmsgid \"alert source;notify url;notify source;notification url;notification source\"\nmsgstr \"источник сигнала;уведомлять url;уведомлять источник;уведомление url;источник уведомление\"\n\n#: /views/index.handlebars\nmsgid \"Alert URL:\"\nmsgstr \"URL сигнала:\"\n\n#: /views/index.handlebars\nmsgid \"Update\"\nmsgstr \"Обновить\"\n\n#: /views/index.handlebars\nmsgid \"Test\"\nmsgstr \"Тест\"\n\n#: /views/index.handlebars\nmsgid \"sound level;audio level;mute audio;mute sound\"\nmsgstr \"уровень звука;уровень аудио;убрать звук аудио;убрать звук\"\n\n#: /views/index.handlebars\nmsgid \"Volume:\"\nmsgstr \"Громкость:\"\n\n#: /views/index.handlebars\nmsgid \"alert forewarning;alert delay; notification delay; notification forewarning\"\nmsgstr \"сигнал предупреждения;задержка сигнала; задержка уведомления; уведомление предупреждения\"\n\n#: /views/index.handlebars\nmsgid \"Delay (seconds):\"\nmsgstr \"Задержка (секунды):\"\n\n#: /views/index.handlebars\nmsgid \"chat mentions;chat pings;chat sound\"\nmsgstr \"упоминания чата;оповещения чата;звук чата\"\n\n#: /views/index.handlebars\nmsgid \"Chat Pings\"\nmsgstr \"Оповещения чата\"\n\n#: /views/index.handlebars\nmsgid \"Enable pings\"\nmsgstr \"Включить оповещения\"\n\n#: /views/index.handlebars\nmsgid \"mention sound\"\nmsgstr \"звук упоминания\"\n\n#: /views/index.handlebars\nmsgid \"Play sound on ping:\"\nmsgstr \"Проигрывать звук оповещения:\"\n\n#: /views/index.handlebars /public/include/chat.js\nmsgid \"Off\"\nmsgstr \"Отключить\"\n\n#: /views/index.handlebars\nmsgid \"Only when necessary\"\nmsgstr \"Только по необходимости\"\n\n#: /views/index.handlebars\nmsgid \"Always\"\nmsgstr \"Всегда\"\n\n#: /views/index.handlebars\nmsgid \"mention sound volume\"\nmsgstr \"громкость звука упоминания\"\n\n#: /views/index.handlebars\nmsgid \"Ping sound volume:\"\nmsgstr \"Громкость звука оповещения:\"\n\n#: /views/index.handlebars\nmsgid \"personal account\"\nmsgstr \"личный аккаунт\"\n\n#: /views/index.handlebars\nmsgid \"Account Settings\"\nmsgstr \"Настройки аккаунта\"\n\n#: /views/index.handlebars\nmsgid \"Public Discord name:\"\nmsgstr \"Метка Discord:\"\n\n#: /views/index.handlebars /public/include/chat.js\nmsgid \"Set\"\nmsgstr \"Установить\"\n\n#: /views/index.handlebars\nmsgid \"Remove\"\nmsgstr \"Удалить\"\n\n#: /views/index.handlebars\nmsgid \"Help\"\nmsgstr \"Помощь\"\n\n#: /views/index.handlebars\nmsgid \"Notifications\"\nmsgstr \"Оповещения\"\n\n#: /views/partials/faq.handlebars\nmsgid \"FAQ\"\nmsgstr \"FAQ\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Why is the cooldown as long as it is?\"\nmsgstr \"Почему время получения нового пикселя такое длинное?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"The time it takes to get a pixel is dynamic, and changes based on how many people are online. The cooldown time is longer when more users are online.\"\nmsgstr \"Время, необходимое для получения пикселя, рассчитывается динамически и изменяется в зависимости от того, сколько людей находится в сети. Время получения пикселя увеличивается, когда в сети больше пользователей.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Why does it say 0/6 pixels?\"\nmsgstr \"Почему написано 0/6 пикселей?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"This means that you are waiting for your next pixel. When you place a pixel, there is a cooldown for when you can place the next one. Over time, you can gain up to 6 \\\"stacked\\\" pixels to place at once.\"\nmsgstr \"Это означает, что вы ждете следующего пикселя. Когда вы размещаете пиксель, есть время восстановления до того, когда вы можете разместить следующий. Со временем вы можете получить до 6 накопленных пикселей, которые можете сразу же разместить.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Why does it take so long to \\\"stack\\\" pixels?\"\nmsgstr \"Почему так долго накапливаются пиксели?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"This is by design. It is better to place a pixel as soon as you get one. Pixel \\\"stacking\\\" is meant to give you a bump if you go AFK for a bit. It takes around 20-30 minutes to get a full 6/6 pixels, but it only takes around 3 minutes to place 6 pixels if you place them as soon as possible.\"\nmsgstr \"Это сделано намеренно. Лучше разместить пиксель, как только вы его получите. Накопление пикселей должно дать вам толчок, если вы отошли на некоторое время и вернулись. Чтобы получить полные 6/6 пикселей, требуется около 40 минут, но для размещения 6 пикселей, по отдельности без накопления, требуется всего около 3 минут.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I appeal a ban?\"\nmsgstr \"Как мне обжаловать бан?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Contact us on <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord</a> or send an appeal to our <a href=\\\"https://pxls.space/appeal\\\" target=\\\"_blank\\\">Google form</a> after reading the rules in the site's info panel.\"\nmsgstr \"Напишите нам в <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord</a> или отправьте обращение в нашeй <a href=\\\"https://pxls.space/appeal\\\" target=\\\"_blank\\\">Google форме</a> после прочтения правил в информационной панели сайта.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I make a template?\"\nmsgstr \"Как мне сделать шаблон?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"A template is an image link that is posted in the template textbox in the settings panel so you can place over it on the canvas. You may use a regular image link to your pixel art, but many people use 3rd party tools like <a href=\\\"https://discord.gg/5MVDCq53vC\\\" target=\\\"blank\\\">Clueless</a> to turn pixel art into a fancier link. If you need to make pixel art yourself, you can use <a href=\\\"https://www.piskelapp.com/p/create\\\" target=\\\"_blank\\\">Piskel</a> to create art to put into Clueless.\"\nmsgstr \"Шаблон — это ссылка на изображение, которая размещена в текстовом поле шаблона на панели настроек, чтобы вы могли поместить ее на холст. Вы можете использовать обычную ссылку на изображение для своего пиксельного арта, но многие люди используют сторонние инструменты, такие как <a href=\\\"https://discord.gg/5MVDCq53vC\\\" target=\\\"blank\\\">Clueless</a> чтобы превратить пиксель-арт в более красивую ссылку. Если вам нужно сделать пиксель-арт самостоятельно, вы можете использовать <a href=\\\"https://www.piskelapp.com/p/create\\\" target=\\\"_blank\\\">Piskel</a> для создания артов и для размещения их в Clueless.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I move a template?\"\nmsgstr \"Как мне подвинуть шаблон?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Hold <kbd>CTRL</kbd> (or <kbd>OPTION</kbd> on macOS) and click and drag to move it around. On mobile, you can tap and hold where you want to move the template and click \\\"Move Template Here\\\" in the pop-up.\"\nmsgstr \"Удерживайте <kbd>CTRL</kbd> (или <kbd>OPTION</kbd> на macOS), щелкните ЛКМ и перетяните куда вам нужно, чтобы переместить его. На мобильном устройстве вы можете нажать и удерживать то место, куда вы хотите переместить шаблон, и щелкнуть «Переместить шаблон сюда» во всплывающем окне.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Does the canvas reset? When?\"\nmsgstr \"Меняется ли полотно? Когда?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Yes. The canvas resets when it is completely full. A reset date is not usually decided until the canvas is full, but the average canvas life-span is around 1 month. Updates are posted in our <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord server</a> when a reset date is set.\"\nmsgstr \"Да. Полотно меняется, когда оно полностью заполнено. Дата сброса полотна обычно не определяется, пока полотно не будет заполнено, но средний срок жизни полотна составляет около 1 месяца. Обновления размещены в нашем <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Дискорде</a> когда установлена дата сброса.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Where can I see the past canvases?\"\nmsgstr \"Где я могу увидеть прошлые полотна?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"The past canvases are featured on our <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord server</a>, or the <a href=\\\"https://archives.pxls.space\\\" target=\\\"_blank\\\">archives</a>, which records timelapses and a lot of useful information on each canvas.\"\nmsgstr \"Прошлые полотна представлены на нашем сайте, <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Дискорде</a>, или на стороннем веб-сайте <a href=\\\"https://pxlsfiddle.com\\\" target=\\\"_blank\\\">PxlsFiddle</a>, который записывает таймлапсы и много полезной информации по каждому полотну.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I see who placed a pixel?\"\nmsgstr \"Как мне посмотреть, кто поставил пиксель?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"By shift-clicking (or tap and hold on mobile) a pixel, you can see who placed a pixel, how many pixels they have placed, and when they placed it.\"\nmsgstr \"Удерживая нажатой клавишу Shift и щелкнув ЛКМ на пиксель (или нажмите и удерживайте ЛКМ/на экране телефона), вы можете увидеть, кто разместил пиксель, сколько пикселей они разместили и когда они разместили его.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I report someone?\"\nmsgstr \"Как пожаловаться на кого-то или написать о нарушении правил?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Shift-click (or tap and hold on mobile) on a pixel, and click the Report button.\"\nmsgstr \"Удерживая нажатой клавишу Shift щелкните ЛКМ на пиксель (или нажмите и удерживайте ЛКМ/на экране телефона), нажмите кнопку «Жалоба» (Report). В чате вы можете просто нажать на ник нарушителя и нажать кнопку «Жалоба» (Report).\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I change the color of my name in the chat?\"\nmsgstr \"Как поменять цвет моего ника в чате?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"There is a \\\"Username Color\\\" option near the bottom of the settings panel.\"\nmsgstr \"В нижней части панели настроек есть опция «Цвет имени пользователя».\"\n\n#: /views/partials/faq.handlebars\nmsgid \"What is a \\\"virginmap\\\"?\"\nmsgstr \"Что такое \\\"virginmap\\\"?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"The virginmap shows which pixels have not yet been placed on (or “virgin” pixels).\"\nmsgstr \"Virginmap показывает, какие пиксели еще не были размещены на полотне (или “девственные” пиксели).\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I report bugs?\"\nmsgstr \"Как мне сообщить о багах (ошибках) сайта?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Submit bugs to the #dev-and-bugs forum in the <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord server</a>. If you have found an exploit, please message one of the staff members privately (through DMs) or open a modmail by DMing pxls.mail#8384.\"\nmsgstr \"Отправляйте сообщения об багах в #dev-and-bugs канал в <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Дискорде</a>. Если вы обнаружили эксплойт, сообщите об этом одному из модераторов/администраторов в частном порядке (через личные сообщения в Дискорде).\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I get more info or contact staff?\"\nmsgstr \"Как мне получить дополнительную информацию или связаться с администраторами?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Check the info panel (the icon on the top left) for more details and links, or join our <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord server</a>, where a staff member will gladly respond.\"\nmsgstr \"Просмотрите информационную панель (значок в левом верхнем углу) для получения более подробной информации и ссылок, или присоединитесь к нашему <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Дискорду</a>, где члены команды модерации с радостью ответят.\"\n\n#: /views/partials/info.handlebars\nmsgid \"Welcome!\"\nmsgstr \"Добро пожаловать!\"\n\n#: /views/partials/info.handlebars\nmsgid \"Welcome to pxls.space! Pxls is a multiplayer online collaborative canvas based on Reddit's <a href=\\\"https://www.reddit.com/r/place\\\" target=\\\"_blank\\\">r/place</a> event from 2017 that allows you to create anything you can imagine, one pixel at a time. Join hundreds of other players in the Pxls community and create amazing works of art together as a team, or solo.\"\nmsgstr \"Добро пожаловать на pxls.space! Pxls - это многопользовательский онлайн-холст для совместной работы, который позволяет вам создавать все, что вы можете вообразить, по одному пикселю за раз. Присоединяйтесь к сотням других игроков в сообществе Pxls и создавайте потрясающие произведения искусства вместе в команде, или в одиночку.\"\n\n#: /views/partials/info.handlebars\nmsgid \"The best place to reach staff and fellow community is in the discord!\"\nmsgstr \"Лучшее место для общения с сотрудниками модерации и сообществом - это наш Дискорд!\"\n\n#: /views/partials/info.handlebars\nmsgid \"Check out our social media pages, and please take the time to read the rules below. Have fun creating (or changing) art!\"\nmsgstr \"Посетите наши страницы в социальных сетях и пожалуйста, прочитайте приведенные ниже правила. Развлекайтесь, создавая (или меняя) рисунки!\"\n\n#: /views/partials/info.handlebars\nmsgid \"Canvas Rules\"\nmsgstr \"Правила полотна\"\n\n#: /views/partials/info.handlebars\nmsgid \"We pride ourselves on trying to keep an open canvas for all free from outside interference on our end, and especially censorship. However, for the good of the community and on accounts of our own beliefs, please acknowledge and obey the following guidelines:\"\nmsgstr \"Мы гордимся тем, что пытаемся сохранить нашу площадку открытой для всех, свободной от внешнего вмешательства с нашей стороны, и особенно от цензуры. Однако ради блага сообщества и исходя из наших собственных убеждений, пожалуйста, примите во внимание следующие правила и соблюдайте их:\"\n\n#: /views/partials/info.handlebars\nmsgid \"No hateful imagery or derogatory speech. This includes but is not limited to words such as <i>f****t</i>, <i>n****r</i>, etc; as well as the Swastika, Hammer and Sickle, and any symbols of terrorism.\"\nmsgstr \"Никаких символов ненависти или уничижительных речей. Это включает, но не ограничивается такими словами, как <i>f****t (пидор)</i>, <i>n****r (нигер)</i>, и т.д.; так же как свастика и любые другие символы терроризма.\"\n\n#: /views/partials/info.handlebars\nmsgid \"No NSFW or NSFL content.\"\nmsgstr \"Никакого NSFW или NSFL контента.\"\n\n#: /views/partials/info.handlebars\nmsgid \"No nudity or otherwise sexually explicit content\"\nmsgstr \"Запрещено изображение обнаженной натуры или иной контент откровенно сексуального характера.\"\n\n#: /views/partials/info.handlebars\nmsgid \"No female-presenting nipples/bare breasts, genitalia, sexual fluids\"\nmsgstr \"Никаких женских сосков/обнаженной груди, гениталий, половых жидкостей.\"\n\n#: /views/partials/info.handlebars\nmsgid \"No sexual imagery/erotica\"\nmsgstr \"Никаких сексуальных образов/эротики\"\n\n#: /views/partials/info.handlebars\nmsgid \"No excessive blood or otherwise obscene/shocking content\"\nmsgstr \"Запрещены изображения с чрезмерным количеством крови или иного непристойного/шокирующего содержания\"\n\n#: /views/partials/info.handlebars\nmsgid \"No more than <b>one</b> account per user, no exceptions. Multiple account users will be banned from creating art on the canvas.\"\nmsgstr \"Не более чем <b>один</b> аккаунт на пользователя, без исключений. Пользователям, владеющими несколькими аккаунтами будет запрещено создавать изображения на холсте.\"\n\n#: /views/partials/info.handlebars\nmsgid \"No auto-placement tools of any kind, you must place the pixels manually.\"\nmsgstr \"Никаких инструментов автоматического размещения, вы должны ставить пиксели вручную.\"\n\n#: /views/partials/info.handlebars\nmsgid \"Do not abuse site functionality, such as reports or lookups. (e.g. automated reporting/lookups, etc.)\"\nmsgstr \"Не злоупотребляйте функциями сайта, такими как жалобы (report) или просмотр пикселей на полотне. (например, автоматические жалобы/просмотр пикселей и т. д.)\"\n\n#: /views/partials/info.handlebars\nmsgid \"Any automated aggregation of data from user lookups is not allowed, and will result in a ban.\"\nmsgstr \"Любое автоматическое сохранение данных из просмотров пикселей пользователей запрещено и приведет к бану.\"\n\n#: /views/partials/info.handlebars\nmsgid \"Staff have final say in any rule disputes\"\nmsgstr \"Персонал модерации сайта имеет последнее слово в любых спорах о правилах\"\n\n#: /views/partials/info.handlebars\nmsgid \"If you feel a moderator has acted inappropriately, please report it to an administrator.\"\nmsgstr \"Если вы считаете, что модератор действовал ненадлежащим образом, сообщите об этом администратору.\"\n\n#: /views/partials/info.handlebars\nmsgid \"If you believe you have been falsely banned you may contact a moderator or administrator.\"\nmsgstr \"Если вы считаете, что вас забанили по ошибке, вы можете связаться с модератором или администратором.\"\n\n#: /views/partials/info.handlebars\nmsgid \"Chat Rules\"\nmsgstr \"Правила чата\"\n\n#: /views/partials/info.handlebars\nmsgid \"Keep chat civil. No harassment or homophobic/transphobic/disablist language.\"\nmsgstr \"Поддерживайте вежливость в чате. Запрещены оскорбления или гомофобные/трансфобные высказывания/оскорбления инвалидов.\"\n\n#: /views/partials/info.handlebars\nmsgid \"No hate speech. This includes emoji/symbols/ASCII art.\"\nmsgstr \"Никаких ненавистнических высказываний. Сюда же входят эмодзи/символы/изображения ASCII.\"\n\n#: /views/partials/info.handlebars\nmsgid \"Normal swearing/etc is allowed\"\nmsgstr \"Резрешены обычные ругательства и т.п.\"\n\n#: /views/partials/info.handlebars\nmsgid \"No spamming\"\nmsgstr \"Никакого спама\"\n\n#: /views/partials/info.handlebars\nmsgid \"This includes excessive ASCII art/emojis/symbols/whitespace\"\nmsgstr \"Это включает в себя чрезмерное количество изображений ASCII/смайлов/символов/пробелов.\"\n\n#: /views/partials/info.handlebars\nmsgid \"No \\\"copy pasta\\\"s\"\nmsgstr \"Никаких копирований (паст) - например скопированные анекдоты, тексты песен и т.д.\"\n\n#: /views/partials/info.handlebars\nmsgid \"No links to sites that actively break the canvas or chat rules (e.g. porn sites)\"\nmsgstr \"Запрещены ссылки на сайты, которые активно нарушают правила полотна или чата (например, порносайты)\"\n\n#: /views/partials/info.handlebars\nmsgid \"No symbology which break the canvas or chat rules (e.g. NSFW ASCII art)\"\nmsgstr \"Никаких символов, нарушающих правила полотна или чата (например, NSFW ASCII изображения)\"\n\n#: /views/partials/info.handlebars\nmsgid \"No personal information\"\nmsgstr \"Запрещена личная информация и ее распространение\"\n\n#: /views/partials/info.handlebars\nmsgid \"Links\"\nmsgstr \"Ссылки\"\n\n#: /views/partials/info.handlebars\nmsgid \"Terms of Service\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Privacy Policy\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Discord (main hub)\"\nmsgstr \"Discord (основной)\"\n\n#: /views/partials/info.handlebars\nmsgid \"Twitter\"\nmsgstr \"Twitter\"\n\n#: /views/partials/info.handlebars\nmsgid \"GitHub (back end)\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"GitHub (front end)\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Single-player mode\"\nmsgstr \"Одиночный режим\"\n\n#: /views/partials/info.handlebars\nmsgid \"Statistics\"\nmsgstr \"Статистика\"\n\n#: /views/partials/info.handlebars\nmsgid \"Profile (user info, factions, etc.)\"\nmsgstr \"Профиль (информация пользователя, фракции, и т.д.)\"\n\n#: /views/partials/info.handlebars\nmsgid \"Wiki\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Generator, progress checker, and monitor for Pxls templates\"\nmsgstr \"Генератор, средство проверки прогресса и мониторинг для шаблонов Pxls\"\n\n#: /views/partials/info.handlebars\nmsgid \"Archives\"\nmsgstr \"Aрхивы\"\n\n#: /views/partials/info.handlebars\nmsgid \"PxlsFiddle (archives)\"\nmsgstr \"PxlsFiddle (архивы)\"\n\n#: /views/partials/info.handlebars\nmsgid \"Donate\"\nmsgstr \"Пожертвования\"\n\n#: /views/partials/info.handlebars\nmsgid \"Donations are not accepted at this time, but this panel will be updated when they're open again!\"\nmsgstr \"Пожертвования в настоящее время не принимаются, но эта панель будет обновлена, когда они снова откроются!\"\n\n#: /views/profile.handlebars\nmsgid \"{0}'s Profile\"\nmsgstr \"{0}'s профиль\"\n\n#: /views/profile.handlebars\nmsgid \"My Data\"\nmsgstr \"Мои данные\"\n\n#: /views/profile.handlebars\nmsgid \"Reports\"\nmsgstr \"Жалобы\"\n\n#: /views/profile.handlebars\nmsgid \"Factions\"\nmsgstr \"Фракции\"\n\n#: /views/profile.handlebars\nmsgid \"Data\"\nmsgstr \"Данные\"\n\n#: /views/profile.handlebars\nmsgid \"You must be logged in to view your profile.\"\nmsgstr \"Вы должны авторизоваться, чтобы просмотреть свой профиль.\"\n\n#: /views/profile.handlebars\nmsgid \"Registration Date\"\nmsgstr \"Дата регистрации\"\n\n#: /views/profile.handlebars /public/include/lookup.js\nmsgid \"Alltime Pixels\"\nmsgstr \"Всего пикселей\"\n\n#: /views/profile.handlebars\nmsgid \"Current Canvas Pixels\"\nmsgstr \"Пиксели на этом полотне\"\n\n#: /views/profile.handlebars\nmsgid \"Discord Tag\"\nmsgstr \"Метка Дискорда\"\n\n#: /views/profile.handlebars /public/include/lookup.js\nmsgid \"Faction\"\nmsgstr \"Фракция\"\n\n#: /views/profile.handlebars\nmsgid \"None\"\nmsgstr \"Отсутствует\"\n\n#: /views/profile.handlebars /public/admin/admin.js\nmsgid \"Roles\"\nmsgstr \"Роли\"\n\n#: /views/profile.handlebars\nmsgid \"Canvas Ban Expiry\"\nmsgstr \"Срок истечения бана на полотне\"\n\n#: /views/profile.handlebars\nmsgid \"Never\"\nmsgstr \"Никогда\"\n\n#: /views/profile.handlebars\nmsgid \"Chat Ban Expiry\"\nmsgstr \"Срок истечения бана в чате\"\n\n#: /views/profile.handlebars\nmsgid \"View rankings and other stats <a href=\\\"/stats\\\">here</a>.\"\nmsgstr \"Просмотр рейтингов и другой статистики <a href=\\\"/stats\\\">здесь</a>.\"\n\n#: /views/profile.handlebars\nmsgid \"You must be logged in to view your reports.\"\nmsgstr \"Вы должны авторизоваться, чтобы просмотреть свои жалобы.\"\n\n#: /views/profile.handlebars\nmsgid \"Canvas Reports ({0}/{1} open)\"\nmsgstr \"Жалобы полотна ({0}/{1} рассматриваются)\"\n\n#. eg \"Report on Bob (closed)\n#: /views/profile.handlebars\nmsgid \"Report on {0} (closed)\"\nmsgstr \"Жалоба по {0} (решена)\"\n\n#. eg \"Report on Bob (open)\n#: /views/profile.handlebars\nmsgid \"Report on {0} (open)\"\nmsgstr \"Жалоба по {0} (рассматривается)\"\n\n#. eg \"Reported Bob on Jan 1, 1970, 00:00:00 AM (UTC)\n#: /views/profile.handlebars\nmsgid \"Reported {0} on {1}\"\nmsgstr \"Отправлено жалоб {0} из {1}\"\n\n#: /views/profile.handlebars\nmsgid \"There are no canvas reports to show.\"\nmsgstr \"Нет жалоб по полотну для отображения.\"\n\n#: /views/profile.handlebars\nmsgid \"Chat Reports ({0}/{1} open)\"\nmsgstr \"Жалобы чата ({0}/{1} рассматривается)\"\n\n#: /views/profile.handlebars\nmsgid \"There are no chat reports to show.\"\nmsgstr \"Нет жалоб по чату для отображения.\"\n\n#: /views/profile.handlebars\nmsgid \"You must be logged in to manage your factions.\"\nmsgstr \"Вы должны авторизоваться, чтобы управлять своими фракциями.\"\n\n#: /views/profile.handlebars\nmsgid \"You are faction restricted and cannot create new factions. If you believe this is an error, please contact a moderator.\"\nmsgstr \"Вы ограничены определенным количеством фракций и не можете создавать новые. Если вы считаете, что это ошибка, обратитесь к модератору.\"\n\n#: /views/profile.handlebars\nmsgid \"You are canvas banned and cannot create new factions. If you believe this is an error, please contact a moderator.\"\nmsgstr \"Вы забанены на полотне и не можете создавать новые фракции. Если вы считаете, что это ошибка, обратитесь к модератору.\"\n\n#: /views/profile.handlebars\nmsgid \"You must have at least {0} all-time pixels to create a faction.\"\nmsgstr \"Вы должны иметь как минимум {0} общего количества пикселей для создания фракции.\"\n\n#: /views/profile.handlebars\nmsgid \"Create\"\nmsgstr \"Создать\"\n\n#: /views/profile.handlebars\nmsgid \"Join\"\nmsgstr \"Войти\"\n\n#: /views/profile.handlebars\nmsgid \"This is your currently displayed faction.\"\nmsgstr \"Это ваша текущая отображаемая фракция.\"\n\n#. eg \"Pixelers (members: 100, ID: 1)\"\n#: /views/profile.handlebars\nmsgid \"{0} (members: {1}, ID: {2})\"\nmsgstr \"{0} (членов: {1}, ID: {2})\"\n\n#: /views/profile.handlebars\nmsgid \"Owner: {0}\"\nmsgstr \"Владелец: {0}\"\n\n#. makes the faction no longer the one displayed for the current user\n#: /views/profile.handlebars\nmsgid \"Remove Displayed\"\nmsgstr \"Отменить отображение\"\n\n#. makes the faction the one displayed for the current user\n#: /views/profile.handlebars\nmsgid \"Set Displayed\"\nmsgstr \"Отобразить\"\n\n#: /views/profile.handlebars\nmsgid \"Members\"\nmsgstr \"Члены\"\n\n#: /views/profile.handlebars\nmsgid \"Edit\"\nmsgstr \"Редактировать\"\n\n#: /views/profile.handlebars /public/include/chat.js\nmsgid \"Delete\"\nmsgstr \"Удалить\"\n\n#: /views/profile.handlebars\nmsgid \"Leave\"\nmsgstr \"Покинуть\"\n\n#: /views/profile.handlebars\nmsgid \"You are not in any factions yet!\"\nmsgstr \"Вы еще не состоите ни в одной фракции!\"\n\n#: /views/profile.handlebars\nmsgid \"You must be logged in to view your data.\"\nmsgstr \"Вы должны авторизоваться, чтобы увидеть свои данные.\"\n\n#: /views/profile.handlebars\nmsgid \"Log Keys\"\nmsgstr \"Ключи полотна\"\n\n#: /views/profile.handlebars\nmsgid \"Log keys can be used by those who have them to tell which pixels you placed on previous canvases.\"\nmsgstr \"Вы можете использовать эти ключи, чтобы определить, какие пиксели вы разместили на предыдущих полотнах.\"\n\n#: /views/profile.handlebars\nmsgid \"You can see the public <a href=\\\"https://pxls.space/extra/logs/\\\" target=\\\"_blank\\\">Pxls Logs</a> to learn more.\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Canvas Code\"\nmsgstr \"Код полотна\"\n\n#: /views/profile.handlebars\nmsgid \"Log Key\"\nmsgstr \"Ключ\"\n\n#: /views/profile.handlebars\nmsgid \"You have no log keys yet!\"\nmsgstr \"У вас еще нет ключей полотна!\"\n\n#: /views/profile.handlebars\nmsgid \"Log keys should show up here after a canvas you have placed on ends.\"\nmsgstr \"Ключи должны показываться здесь после окончания полотна, на котором вы ставили пиксели\"\n\n#: /views/profile.handlebars\nmsgid \"Members of {0} ([{1}])\"\nmsgstr \"Члены {0} ([{1}])\"\n\n#: /views/profile.handlebars /public/admin/admin.js /public/include/lookup.js\nmsgid \"Close\"\nmsgstr \"Закрыть\"\n\n#: /views/profile.handlebars\nmsgid \"Faction Members\"\nmsgstr \"Члены фракции\"\n\n#. This loop only fires when on our own profile. We can't leave a faction we own, we can only transfer ownership, so no point in showing ourselves in the member list.\n#. since we can't leave the faction until we transfer, if there's only one member in the list it's assumed to be the owner. we don't want to show ourself in the list\n#: /views/profile.handlebars\nmsgid \"Transfer Ownership\"\nmsgstr \"Передать полномочия\"\n\n#. bans a user from the faction\n#: /views/profile.handlebars /public/include/chat.js\nmsgid \"Ban\"\nmsgstr \"Бан\"\n\n#: /views/profile.handlebars\nmsgid \"Nothing to see here!\"\nmsgstr \"Здесь ничего нет, сталкер, проходи не задерживайся!\"\n\n#: /views/profile.handlebars\nmsgid \"Faction Bans\"\nmsgstr \"Баны фракции\"\n\n#: /views/profile.handlebars /public/admin/admin.js /public/include/chat.js\nmsgid \"Unban\"\nmsgstr \"Разбанить\"\n\n#: /views/profile.handlebars\nmsgid \"Find A Faction\"\nmsgstr \"Найти фракцию\"\n\n#: /views/profile.handlebars\nmsgid \"Search:\"\nmsgstr \"Поиск:\"\n\n#: /views/profile.handlebars\nmsgid \"Enter a search term to get started.\"\nmsgstr \"Введите поисковый запрос, чтобы начать.\"\n\n#: /views/profile.handlebars\nmsgid \"Load More\"\nmsgstr \"Загрузить больше\"\n\n#: /public/admin/admin.js\nmsgid \"Send alert...\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Rule #1: Hateful/derogatory speech or symbols\"\nmsgstr \"Правило #1: Ненавистнические/уничижительные высказывания или символы\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Rule #2: Nudity, genitalia, or non-PG-13 content\"\nmsgstr \"Правило #2: Нагота, гениталии или не 13+ контент\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Rule #3: Multi-account\"\nmsgstr \"Правило #3: Мультиаккаунт\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Rule #4: Botting\"\nmsgstr \"Правило #4: Ботоводство\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Other (specify below)\"\nmsgstr \"Другое (укажите ниже)\"\n\n#: /public/admin/admin.js /public/include/chat.js /public/include/lookup.js\nmsgid \"Additional information (if applicable)\"\nmsgstr \"Дополнительная информация (если применимо)\"\n\n#. \"Revert pixels of the last *n* hours\", part before 'n'\n#: /public/admin/admin.js\nmsgid \"Revert pixels of the last \"\nmsgstr \"\"\n\n#. \"Revert pixels of the last *n* hours\", part after 'n'\n#: /public/admin/admin.js\nmsgid \" hours\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"You must specify the details.\"\nmsgstr \"Вы должны уточнить детали.\"\n\n#: /public/admin/admin.js\nmsgid \"Something went wrong! Perhaps insufficient permissions?\"\nmsgstr \"Что-то пошло не так! Возможно недостаточно прав?\"\n\n#: /public/admin/admin.js\nmsgid \"Shadowban user\"\nmsgstr \"Дать теневой бан\"\n\n#: /public/admin/admin.js\nmsgid \"Shadowbanned user\"\nmsgstr \"Пользователь с теневым баном\"\n\n#: /public/admin/admin.js\nmsgid \"Permaban user\"\nmsgstr \"Забанить навечно\"\n\n#: /public/admin/admin.js\nmsgid \"Permabanned user\"\nmsgstr \"Забаненный навечно пользователь\"\n\n#: /public/admin/admin.js\nmsgid \"Ban user\"\nmsgstr \"Забанить пользователя\"\n\n#: /public/admin/admin.js\nmsgid \"Banned user\"\nmsgstr \"Забаненный пользователь\"\n\n#: /public/admin/admin.js\nmsgid \"Unbanned user ${username}\"\nmsgstr \"Разбаненный пользователь ${username}\"\n\n#. Context: ban type\n#: /public/admin/admin.js\nmsgid \"shadow\"\nmsgstr \"скрытно\"\n\n#: /public/admin/admin.js\nmsgid \"never\"\nmsgstr \"никогда\"\n\n#: /public/admin/admin.js\nmsgid \"permanent\"\nmsgstr \"навечно\"\n\n#: /public/admin/admin.js /public/include/chat.js /public/include/uiHelper.js\n#: /public/include/user.js\nmsgid \"Yes\"\nmsgstr \"Да\"\n\n#: /public/admin/admin.js /public/include/chat.js /public/include/uiHelper.js\n#: /public/include/user.js\nmsgid \"No\"\nmsgstr \"Нет\"\n\n#: /public/admin/admin.js\nmsgid \"Yes (permanent)\"\nmsgstr \"Да (навечно)\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Username\"\nmsgstr \"Имя пользователя\"\n\n#: /public/admin/admin.js /public/include/chat.js\nmsgid \"Profile\"\nmsgstr \"Профиль\"\n\n#: /public/admin/admin.js\nmsgid \"Logins\"\nmsgstr \"Логины\"\n\n#: /public/admin/admin.js\nmsgid \"All Time Pixels\"\nmsgstr \"Все пиксели\"\n\n#: /public/admin/admin.js /public/include/user.js\nmsgid \"Rename Requested\"\nmsgstr \"Переименование запрошено\"\n\n#: /public/admin/admin.js\nmsgid \"Discord Name\"\nmsgstr \"Ник Discord\"\n\n#: /public/admin/admin.js /public/include/user.js\nmsgid \"Banned\"\nmsgstr \"Забанен\"\n\n#: /public/admin/admin.js\nmsgid \"Chatbanned\"\nmsgstr \"Забанен в чате\"\n\n#: /public/admin/admin.js\nmsgid \"Ban Reason\"\nmsgstr \"Причина бана\"\n\n#: /public/admin/admin.js\nmsgid \"Ban Expiracy\"\nmsgstr \"Истечение бана\"\n\n#: /public/admin/admin.js\nmsgid \"Chatban Reason\"\nmsgstr \"Причина чат-бана\"\n\n#: /public/admin/admin.js\nmsgid \"(canvas ban)\"\nmsgstr \"(бан на полотне)\"\n\n#: /public/admin/admin.js\nmsgid \"when canvas ban ends\"\nmsgstr \"когда истекает бан канваса\"\n\n#: /public/admin/admin.js\nmsgid \"Chatban Expires\"\nmsgstr \"Истечение чат-бана\"\n\n#: /public/admin/admin.js\nmsgid \"Ban (24h)\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Permaban\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Shadowban\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Custom ban length: \"\nmsgstr \"\"\n\n#. Admin check. Example: type = 'username', arg = 'pxlsuser94'\n#: /public/admin/admin.js\nmsgid \"${type} ${arg} not found.\"\nmsgstr \"${type} ${arg} не найден\"\n\n#: /public/admin/admin.js\nmsgid \"Unban Reason:\"\nmsgstr \"Причина разбана\"\n\n#: /public/admin/admin.js\nmsgid \"Unbanning ${username}\"\nmsgstr \"Разбан ${username}\"\n\n#: /public/admin/admin.js /public/include/chat.js /public/include/lookup.js\n#: /public/include/user.js\nmsgid \"Cancel\"\nmsgstr \"Отменить\"\n\n#. Moderator panel label\n#: /public/admin/admin.js\nmsgid \"MOD\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Ignore cooldown\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Place any color\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Ignore placemap\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Ban user (24h)\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Unban user\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Check user\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"profile\"\nmsgstr \"профиль\"\n\n#: /public/admin/admin.js\nmsgid \"User Agent\"\nmsgstr \"Пользовательский агент\"\n\n#: /public/admin/admin.js\nmsgid \"Send Alert\"\nmsgstr \"Отправить предупреждение\"\n\n#: /public/admin/admin.js\nmsgid \"Mod Actions\"\nmsgstr \"Действия модератора\"\n\n#: /public/admin/admin.js\nmsgid \"More...\"\nmsgstr \"\"\n\n#. Snapshot save name\n#: /public/include/board.js\nmsgid \"pxls canvas\"\nmsgstr \"полотно pxls\"\n\n#. template link action\n#: /public/include/chat.js\nmsgid \"Ask\"\nmsgstr \"Всплывающее окно\"\n\n#: /public/include/chat.js\nmsgid \"Open in a new tab\"\nmsgstr \"Открыть в новой вкладке\"\n\n#: /public/include/chat.js\nmsgid \"Open in current tab (replacing template)\"\nmsgstr \"Открыть в текущей вкладке (заменить шаблон)\"\n\n#: /public/include/chat.js\nmsgid \"Jump to coordinates without replacing template\"\nmsgstr \"Перейти к координатам без замены шаблона\"\n\n#: /public/include/chat.js\nmsgid \"Please upload your template image to a third-party image host.\"\nmsgstr \"Пожалуйста, загрузите изображение вашего шаблона на сторонний хостинг.\"\n\n#: /public/include/chat.js\nmsgid \"You must have at least \"\nmsgstr \"Вы должны иметь хотя бы \"\n\n#: /public/include/chat.js\nmsgid \" pixels to send links.\"\nmsgstr \" пикселей, для отправки ссылок.\"\n\n#: /public/include/chat.js\nmsgid \"You must be logged in to chat.\"\nmsgstr \"Вы должны быть авторизованы в чате.\"\n\n#: /public/include/chat.js\nmsgid \"No Results\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Reply\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"none provided\"\nmsgstr \"не предусмотрено\"\n\n#: /public/include/chat.js\nmsgid \"Purged by ${purge.initiator} with reason: ${reason}\"\nmsgstr \"Удалено ${purge.initiator} по причине: ${reason}\"\n\n#: /public/include/chat.js\nmsgid \"External Link\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"This link is taking you to the following website:\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"The operators of this website have no responsibility or control over the contents hosted at {0}. Are you sure you want to go there?\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Note: You can disable this popup in settings.\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Visit Site\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"template:\"\nmsgstr \"шаблон:\"\n\n#: /public/include/chat.js\nmsgid \"Open Failed\"\nmsgstr \"Не удалось открыть\"\n\n#: /public/include/chat.js\nmsgid \"Failed to automatically open in a new tab\"\nmsgstr \"Не удалось автоматически открыть в новой вкладке\"\n\n#: /public/include/chat.js\nmsgid \"Click here to open in a new tab instead\"\nmsgstr \"Нажмите здесь, чтобы вместо этого открыть в новой вкладке\"\n\n#: /public/include/chat.js\nmsgid \"Open Template\"\nmsgstr \"Открыть шаблон\"\n\n#: /public/include/chat.js\nmsgid \"This link will overwrite your current template. What would you like to do?\"\nmsgstr \"Эта ссылка перезапишет ваш текущий шаблон. Что бы вы хотели сделать?\"\n\n#: /public/include/chat.js\nmsgid \"Note: You can set a default action in the settings menu which bypasses this popup completely.\"\nmsgstr \"Примечание: В меню настроек можно установить действие по умолчанию, которое полностью обходит это всплывающее окно.\"\n\n#: /public/include/chat.js\nmsgid \"OK\"\nmsgstr \"\"\n\n#: /public/include/chat.js /public/include/lookup.js\nmsgid \"Report\"\nmsgstr \"Жалоба\"\n\n#: /public/include/chat.js\nmsgid \"Mention\"\nmsgstr \"Упомянуть\"\n\n#: /public/include/chat.js\nmsgid \"Ignore\"\nmsgstr \"Игнорировать\"\n\n#: /public/include/chat.js\nmsgid \"Chat (un)ban\"\nmsgstr \"Чат-бан (разбан)\"\n\n#: /public/include/chat.js\nmsgid \"Purge User\"\nmsgstr \"Удалить все сообщения\"\n\n#: /public/include/chat.js\nmsgid \"Mod Lookup\"\nmsgstr \"Окно модера\"\n\n#: /public/include/chat.js\nmsgid \"Chat Lookup\"\nmsgstr \"Проверка чата\"\n\n#: /public/include/chat.js\nmsgid \"Enter a reason for your report\"\nmsgstr \"Введите причину вашей жалобы\"\n\n#: /public/include/chat.js\nmsgid \"You are reporting a chat message from ${reportTarget} with the content:\"\nmsgstr \"\"\n\n#: /public/include/chat.js /public/include/lookup.js\nmsgid \"Sent report!\"\nmsgstr \"\"\n\n#: /public/include/chat.js /public/include/lookup.js\nmsgid \"Error sending report.\"\nmsgstr \"Ошибка отправки жалобы\"\n\n#: /public/include/chat.js\nmsgid \"Report User\"\nmsgstr \"Пожаловаться\"\n\n#: /public/include/chat.js\nmsgid \"User ignored. You can unignore from chat settings.\"\nmsgstr \"Пользователь игнорируется. Вы можете снять игнор в настройках чата\"\n\n#: /public/include/chat.js\nmsgid \"Failed to ignore user. Either they\\\\'re already ignored, or an error occurred. If the problem persists, contact a developer.\"\nmsgstr \"Ошибка игнора пользователя. Либо он уже игнорируется, либо произошла ошибка. Если проблема не устранится, обратитесь к разработчику.\"\n\n#: /public/include/chat.js\nmsgid \"Permanent\"\nmsgstr \"Навечно\"\n\n#: /public/include/chat.js\nmsgid \"Temporary\"\nmsgstr \"Временно\"\n\n#: /public/include/chat.js\nmsgid \"Rule 3: Spam\"\nmsgstr \"Правило 3: Спам\"\n\n#: /public/include/chat.js\nmsgid \"Rule 1: Chat civility\"\nmsgstr \"Правило 1: Вежливость в чате\"\n\n#: /public/include/chat.js\nmsgid \"Rule 2: Hate Speech\"\nmsgstr \"Правило 2: Ненавистнические высказывания\"\n\n#: /public/include/chat.js\nmsgid \"Rule 5: NSFW\"\nmsgstr \"Правило 5: NSFW\"\n\n#: /public/include/chat.js\nmsgid \"Custom\"\nmsgstr \"Другое\"\n\n#: /public/include/chat.js\nmsgid \"Banning:\"\nmsgstr \"Забанить:\"\n\n#: /public/include/chat.js\nmsgid \"Message:\"\nmsgstr \"Сообщение:\"\n\n#: /public/include/chat.js\nmsgid \"Ban Length\"\nmsgstr \"Длительность бана\"\n\n#: /public/include/chat.js\nmsgid \"Reason\"\nmsgstr \"Причина\"\n\n#: /public/include/chat.js\nmsgid \"Purge Messages\"\nmsgstr \"Удалить сообщения\"\n\n#: /public/include/chat.js\nmsgid \"Purging all messages is disabled during snip mode\"\nmsgstr \"Удаление всех сообщений отключено в режиме snip\"\n\n#: /public/include/chat.js\nmsgid \"Silent (no purge message)\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Custom reason\"\nmsgstr \"Другая причина\"\n\n#: /public/include/chat.js\nmsgid \"Additional information:\"\nmsgstr \"Дополнительная информация:\"\n\n#: /public/include/chat.js\nmsgid \"Chatban initiated\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Error occurred while chatbanning\"\nmsgstr \"Произошла ошибка при чат-бане\"\n\n#: /public/include/chat.js\nmsgid \"Chatban\"\nmsgstr \"Чат-бан\"\n\n#: /public/include/chat.js\nmsgid \"Failed to delete\"\nmsgstr \"Ошибка удаления\"\n\n#: /public/include/chat.js\nmsgid \"ID: \"\nmsgstr \"ID: \"\n\n#: /public/include/chat.js\nmsgid \"User: \"\nmsgstr \"Пользователь: \"\n\n#: /public/include/chat.js\nmsgid \"Message: \"\nmsgstr \"Сообщение: \"\n\n#: /public/include/chat.js\nmsgid \"Reason: \"\nmsgstr \"Причина: \"\n\n#: /public/include/chat.js\nmsgid \"Delete Message\"\nmsgstr \"Удалить сообщение\"\n\n#: /public/include/chat.js\nmsgid \"Purge\"\nmsgstr \"Удалить все сообщения\"\n\n#: /public/include/chat.js\nmsgid \"Selected Message\"\nmsgstr \"Выбранное сообщение\"\n\n#: /public/include/chat.js\nmsgid \"Purge Reason\"\nmsgstr \"Причина удаления\"\n\n#: /public/include/chat.js\nmsgid \"User purged\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Error sending purge.\"\nmsgstr \"Ошибка удаления\"\n\n#: /public/include/chat.js\nmsgid \"Toggle Rename Request\"\nmsgstr \"Переключить запрос на переименование\"\n\n#: /public/include/chat.js\nmsgid \"Select one of the options below to set the current rename request state.\"\nmsgstr \"Выберите один из вариантов ниже, чтобы установить текущее состояние запроса на переименование.\"\n\n#: /public/include/chat.js\nmsgid \"Rename request updated\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"An unknown error occurred. Please contact a developer\"\nmsgstr \"Произошла неизвестная ошибка. Пожалуйста обратитесь к разработчику\"\n\n#: /public/include/chat.js\nmsgid \"New Name: \"\nmsgstr \"Новое имя: \"\n\n#: /public/include/chat.js\nmsgid \"Enter the new name for the user below. Please note that if you\\\\'re trying to change the caps, you\\\\'ll have to rename to something else first.\"\nmsgstr \"Введите новое имя для пользователя ниже. Пожалуйста заметьте, что если вы хотите изметь заглавные буквы, вам сначала придется переименовать их во что-то другое.\"\n\n#: /public/include/chat.js\nmsgid \"User renamed\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Force Rename\"\nmsgstr \"Принудительно переименовать\"\n\n#: /public/include/chat.js\nmsgid \"You cannot use chat while canvas banned.\"\nmsgstr \"Вы не можете использовать чат, пока забанены на полотне.\"\n\n#: /public/include/lookup.js\nmsgid \"Sending...\"\nmsgstr \"Отправка...\"\n\n#: /public/include/lookup.js\nmsgid \"additional information:\"\nmsgstr \"дополнительная информация:\"\n\n#: /public/include/lookup.js\nmsgid \"Report Pixel\"\nmsgstr \"Пожаловаться\"\n\n#: /public/include/lookup.js\nmsgid \"This pixel is background (was not placed by a user).\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"Hide sensitive information\"\nmsgstr \"Скрыть конфиденциальную информацию\"\n\n#: /public/include/lookup.js\nmsgid \"Move Template Here\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"An error occurred, either you aren't logged in or you may be attempting to look up users too fast. Please try again in 60 seconds\"\nmsgstr \"Произошла ошибка, либо вы не авторизованы, либо вы используете поиск слишком часто. Повторите попытку через 60 секунд.\"\n\n#: /public/include/lookup.js\nmsgid \"Coords\"\nmsgstr \"Координаты\"\n\n#: /public/include/lookup.js\nmsgid \"View Profile\"\nmsgstr \"Просмотреть профиль\"\n\n#: /public/include/lookup.js\nmsgid \"Origin\"\nmsgstr \"Источник\"\n\n#: /public/include/lookup.js\nmsgid \"Part of a nuke\"\nmsgstr \"Часть нюка\"\n\n#: /public/include/lookup.js\nmsgid \"Placed by a staff member using placement overrides\"\nmsgstr \"Размещено модератором с использованием специальных инструментов\"\n\n#: /public/include/lookup.js\nmsgid \"Time\"\nmsgstr \"Время\"\n\n#: /public/include/lookup.js\nmsgid \"just now\"\nmsgstr \"только что\"\n\n#: /public/include/lookup.js\nmsgid \"${hoursStr}:${minuteStr}:${secsStr} ago\"\nmsgstr \"${hoursStr}:${minuteStr}:${secsStr} назад\"\n\n#: /public/include/lookup.js\nmsgid \"Discord\"\nmsgstr \"Дискорд\"\n\n#: /public/include/notifications.js\nmsgid \"Posted by ${notification.who}\"\nmsgstr \"Сообщение от ${notification.who}\"\n\n#: /public/include/notifications.js\nmsgid \"Expires ${expiry}\"\nmsgstr \"Истекает ${expiry}\"\n\n#: /public/include/template.js\nmsgid \"There was an error getting the image\"\nmsgstr \"Произошла ошибка при получении изображения\"\n\n#: /public/include/timer.js\nmsgid \"Your next pixel will be available in ${delay} seconds!\"\nmsgstr \"Ваш следующий пиксель будет доступен через ${delay} секунд!\"\n\n#: /public/include/timer.js\nmsgid \"Your next pixel has been available for ${alertDelay} seconds!\"\nmsgstr \"Ваш следующий пиксель был доступен в течение ${alertDelay} секунд!\"\n\n#: /public/include/timer.js\nmsgid \"Your next pixel is available!\"\nmsgstr \"Ваш следующий пиксель доступен!\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Dark\"\nmsgstr \"Темная\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Darker\"\nmsgstr \"Темнее тёмного\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Blue\"\nmsgstr \"Синяя\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Purple\"\nmsgstr \"Фиолетовая\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Green\"\nmsgstr \"Зеленая\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Matte\"\nmsgstr \"Матовая\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Terminal\"\nmsgstr \"Матрица\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Red\"\nmsgstr \"Красная\"\n\n#: /public/include/uiHelper.js\nmsgid \"A new ${type} report has been received.\"\nmsgstr \"\"\n\n#: /public/include/uiHelper.js\nmsgid \"Cannot fetch local files. Use the file selector in template settings.\"\nmsgstr \"Невозможно получить локальные файлы. Используйте кнопку [Выбрать файл] в настройках шаблона.\"\n\n#: /public/include/uiHelper.js\nmsgid \"Redirect Warning\"\nmsgstr \"Предупреждение о перенаправлении\"\n\n#: /public/include/uiHelper.js\nmsgid \"Are you sure you want to redirect to the following URL?\"\nmsgstr \"Вы уверены, что хотите перейти по указанной ссылке?\"\n\n#: /public/include/uiHelper.js\nmsgid \"Drag and dropped file must be a valid image.\"\nmsgstr \"Перетаскиваемый файл должен быть допустимым изображением.\"\n\n#: /public/include/uiHelper.js\nmsgid \"Discord name updated successfully\"\nmsgstr \"Ник Discord успешно обновлен\"\n\n#: /public/include/uiHelper.js\nmsgid \"Couldn\\\\'t change discord name: \"\nmsgstr \"Не удалось изменить ник дискорда: \"\n\n#: /public/include/user.js\nmsgid \"By logging in or registering, you agree to the <a href=\\\"{0}\\\" target=\\\"_blank\\\">terms of use</a> and <a href=\\\"{1}\\\" target=\\\"_blank\\\">privacy policy</a>.\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"Sign in with {0}\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"New Accounts Disabled\"\nmsgstr \"Новые аккаунты отключены\"\n\n#: /public/include/user.js\nmsgid \"online\"\nmsgstr \"онлайн\"\n\n#: /public/include/user.js\nmsgid \"Sign Out\"\nmsgstr \"Выйти\"\n\n#: /public/include/user.js\nmsgid \"Are you sure you want to sign out?\"\nmsgstr \"Вы уверены что хотите выйти?\"\n\n#: /public/include/user.js\nmsgid \"You are permanently banned.\"\nmsgstr \"Вы забанены навсегда.\"\n\n#: /public/include/user.js\nmsgid \"You are temporarily banned and will not be allowed to place until ${timestamp}\"\nmsgstr \"Вы временно забанены и не сможете размещать пиксели до ${timestamp}\"\n\n#: /public/include/user.js\nmsgid \"You can contact us using one of the links in the info menu.\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"If you think this was an error, please contact us using one of the links in the info tab.\"\nmsgstr \"Если вы считаете, что это была ошибка, свяжитесь с нами, используя одну из ссылок на вкладке информации.\"\n\n#: /public/include/user.js\nmsgid \"Ban reason:\"\nmsgstr \"Причина бана:\"\n\n#: /public/include/user.js\nmsgid \"An unknown error occurred. Please contact staff on discord\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"Staff have required you to change your username, this usually means your name breaks one of our rules.\"\nmsgstr \"Модерация потребовала от вас сменить имя пользователя, обычно это означает, что ваше имя пользователя нарушает одно из наших правил.\"\n\n#: /public/include/user.js\nmsgid \"If you disagree, please contact us on Discord (link in the info panel).\"\nmsgstr \"Если вы не согласны, свяжитесь с нами в Discord (ссылка на информационной панели).\"\n\n#: /public/include/user.js\nmsgid \"New Username:\"\nmsgstr \"Новое имя пользователя:\"\n\n#: /public/include/user.js\nmsgid \"Not now\"\nmsgstr \"Не сейчас\"\n\n#: /public/include/user.js\nmsgid \"Change\"\nmsgstr \"Изменить\"\n\n#: /public/include/user.js\nmsgid \"You must change your username.\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"Click here to continue.\"\nmsgstr \"\"\n\n#: /public/pxls.js\nmsgid \"Alert\"\nmsgstr \"Предупреждение\"\n\n#~ msgid \"Subreddit\"\n#~ msgstr \"Subreddit\"\n\n#~ msgid \"GitHub\"\n#~ msgstr \"GitHub\"\n";

const locale_ru_46ts_7410c7fb = () => poToMessages(source$3);

const source$2 = "msgid \"\"\nmsgstr \"\"\n\"Project-Id-Version: Pxls\\n\"\n\"POT-Creation-Date: 2024-09-07T20:41:44.977Z\\n\"\n\"PO-Revision-Date: 2023-12-15 08:20+0000\\n\"\n\"Last-Translator: Weblate Admin <thiscamefrom@pxls.space>\\n\"\n\"Language-Team: Swedish <https://weblate.pxls.space/projects/pxls-space/pxls-web/sv/>\\n\"\n\"Language: sv\\n\"\n\"Content-Type: text/plain; charset=UTF-8\\n\"\n\"Content-Transfer-Encoding: 8bit\\n\"\n\"Plural-Forms: nplurals=2; plural=n != 1;\\n\"\n\"X-Generator: Weblate 5.2.1\\n\"\n\n#: /views/error.handlebars /views/profile.handlebars /public/include/user.js\nmsgid \"My Profile\"\nmsgstr \"Min Profil\"\n\n#: /views/error.handlebars /views/profile.handlebars\nmsgid \"My Factions\"\nmsgstr \"Mina Grupper\"\n\n#. HTTP status code name\n#: /views/error.handlebars\nmsgid \"Not Found\"\nmsgstr \"Inte hittad\"\n\n#: /views/error.handlebars\nmsgid \"The content you requested could not be found at this URL. If you believe this is an error, please contact a developer.\"\nmsgstr \"Innehållet du försökte nå kunde inte bli hittad vid denna URL. Om du tror att detta är ett fel, snälla kontakta en utvecklare av hemsidan.\"\n\n#. links to the homepage (the app itself)\n#: /views/error.handlebars\nmsgid \"Back to Pxls\"\nmsgstr \"Tillbaka till Pxls\"\n\n#. HTTP status code name\n#: /views/error.handlebars\nmsgid \"Not Authenticated\"\nmsgstr \"Inte Autentiserad\"\n\n#: /views/error.handlebars\nmsgid \"You must be logged in to access this data. Please go back to pxls and go through the authentication process.\"\nmsgstr \"Du måste vara inloggad för att kunna nå denna data. Snälla gå tillbaka till pxls och gå igenom autentiserings processen.\"\n\n#. HTTP status code name\n#: /views/error.handlebars\nmsgid \"Not Allowed\"\nmsgstr \"Inte tillåten\"\n\n#: /views/error.handlebars\nmsgid \"The action you attempted to perform is not allowed or resulted in an error. Please ensure you have access to the endpoint and try again later.\"\nmsgstr \"Handlingen du försökte utföra är inte tillåten eller resulterade i ett fell. Snälla försäkra att du har tillgång till slutpunket och försök igen senare.\"\n\n#: /views/index.handlebars\nmsgid \"Place pixels with people to create art\"\nmsgstr \"Placera pixlar med personer för att göra konst\"\n\n#: /views/index.handlebars\nmsgid \"Lost connection to server, reconnecting...\"\nmsgstr \"Förlorade anslutning till servern, försöker återansluta...\"\n\n#: /views/index.handlebars\nmsgid \"Loading Heatmap (press <kbd>H</kbd> to cancel)\"\nmsgstr \"Läser in Värmekartan (tryck på <kbd>H</kbd> för att avbryta)\"\n\n#: /views/index.handlebars\nmsgid \"Loading Virginmap (press <kbd>X</kbd> to cancel)\"\nmsgstr \"Läser in Oskuldsskartan (tryck på <kbd>X</kbd> för att avbryta)\"\n\n#: /views/index.handlebars\nmsgid \"Logout\"\nmsgstr \"Logga ut\"\n\n#: /views/index.handlebars\nmsgid \"Canvas:\"\nmsgstr \"Kanvas:\"\n\n#: /views/index.handlebars\nmsgid \"N/A\"\nmsgstr \"N/A\"\n\n#: /views/index.handlebars\nmsgid \"All Time:\"\nmsgstr \"Heltid:\"\n\n#: /views/index.handlebars\nmsgid \"Loading online user count&hellip;\"\nmsgstr \"Laddar in aktiva antalet användare&hellip;\"\n\n#: /views/index.handlebars /public/admin/admin.js /public/include/lookup.js\nmsgid \"Pixels\"\nmsgstr \"Pixlar\"\n\n#: /views/index.handlebars\nmsgid \"Undo\"\nmsgstr \"Ångra\"\n\n#: /views/index.handlebars\nmsgid \"You are not signed in.\"\nmsgstr \"Du är inte inloggad.\"\n\n#: /views/index.handlebars /public/include/user.js\nmsgid \"Sign in with...\"\nmsgstr \"Logga in med...\"\n\n#: /views/index.handlebars\nmsgid \"Loading...\"\nmsgstr \"Läser in...\"\n\n#: /views/index.handlebars\nmsgid \"Sign up\"\nmsgstr \"Gör ett konto\"\n\n#: /views/index.handlebars\nmsgid \"Pick a username\"\nmsgstr \"Välj ett användarnamn\"\n\n#: /views/index.handlebars\nmsgid \"Username:\"\nmsgstr \"Användarnamn:\"\n\n#: /views/index.handlebars\nmsgid \"Discord Tag (Optional):\"\nmsgstr \"Discord Tag (Frivilligt):\"\n\n#: /views/index.handlebars\nmsgid \"Drag and drop template image\"\nmsgstr \"Dra och släpp templatebilden\"\n\n#: /views/index.handlebars\nmsgid \"Exit\"\nmsgstr \"Utgång\"\n\n#: /views/index.handlebars /views/profile.handlebars\nmsgid \"Info\"\nmsgstr \"Info\"\n\n#: /views/index.handlebars\nmsgid \"Close Panel\"\nmsgstr \"Stäng Panel\"\n\n#: /views/index.handlebars /public/include/chat.js\nmsgid \"Chat\"\nmsgstr \"Chatt\"\n\n#: /views/index.handlebars\nmsgid \"Pings\"\nmsgstr \"Notiser\"\n\n#: /views/index.handlebars\nmsgid \"Settings\"\nmsgstr \"Inställningar\"\n\n#: /views/index.handlebars\nmsgid \"Jump To Bottom\"\nmsgstr \"Hoppa till botten\"\n\n#: /views/index.handlebars\nmsgid \"Replying to\"\nmsgstr \"Svarar\"\n\n#: /views/index.handlebars /public/include/chat.js\nmsgid \"On\"\nmsgstr \"På\"\n\n#: /views/index.handlebars\nmsgid \"Emoji\"\nmsgstr \"Emoji\"\n\n#: /views/index.handlebars\nmsgid \"Search\"\nmsgstr \"Sök\"\n\n#: /views/index.handlebars\nmsgid \"keybinds;keys;keyboard;hotkeys\"\nmsgstr \"tangentbindningar;tangenter;tangentbord;snabbtangenter\"\n\n#: /views/index.handlebars\nmsgid \"Keybinds\"\nmsgstr \"Tangentbindningar\"\n\n#: /views/index.handlebars\nmsgid \"general\"\nmsgstr \"allmän\"\n\n#: /views/index.handlebars\nmsgid \"General\"\nmsgstr \"Allmän\"\n\n#: /views/index.handlebars\nmsgid \"move;moving;panning;drag\"\nmsgstr \"flytta;flyttar;panorera;dra\"\n\n#: /views/index.handlebars\nmsgid \"Mouse/arrows/wasd to pan\"\nmsgstr \"Mus/pilar/wasd för att panorera\"\n\n#: /views/index.handlebars\nmsgid \"mousewheel;zooming\"\nmsgstr \"mushjul;zommning\"\n\n#: /views/index.handlebars\nmsgid \"Scroll/pinch to zoom\"\nmsgstr \"Skrolla/nyp skärmen för att zomma\"\n\n#: /views/index.handlebars\nmsgid \"scroll;zooming\"\nmsgstr \"skrolla;zommning\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>+</kbd>/<kbd>-</kbd> or <kbd>Q</kbd>/<kbd>E</kbd> to zoom\"\nmsgstr \"<kbd>+</kbd>/<kbd>-</kbd> eller <kbd>Q</kbd>/<kbd>E</kbd> för att zooma\"\n\n#: /views/index.handlebars\nmsgid \"lookups\"\nmsgstr \"uppslagningar\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>Shift</kbd> + Click/Hold touch to lookup pixel\"\nmsgstr \"<kbd>Skift</kbd> + Klicka/håll för att kolla upp pixeln\"\n\n#: /views/index.handlebars\nmsgid \"overlays;alignment;grid hidden;grid shown;hide grid;show grid\"\nmsgstr \"överlägg;inriktning,rutnät gömd;rutnät visad; göm rutnät; visa rutnät\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>G</kbd> to toggle grid\"\nmsgstr \"<kbd>G</kbd> för att växla rutnät\"\n\n#: /views/index.handlebars\nmsgid \"close;information shown;information hidden;info shown;info hidden;hide information;show information\"\nmsgstr \"stäng;information visad; information gömd; info visad; info gömd;göm information;visa information\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>I</kbd> to open info\"\nmsgstr \"<kbd>I</kbd> för att öppna info\"\n\n#: /views/index.handlebars\nmsgid \"close;settings hidden;settings shown;hide settings;show settings\"\nmsgstr \"stäng;inställningar gömda;inställningar visade;göm inställningar;visa inställningar\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>T</kbd> to open settings\"\nmsgstr \"<kbd>T</kbd> för att öppna inställningar\"\n\n#: /views/index.handlebars\nmsgid \"close;chat hidden;chat shown;hide chat;show chat\"\nmsgstr \"stäng;chatten gömd; chatten visad;göm chatten;visa chatten\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>B</kbd> to open chat\"\nmsgstr \"<kbd>B</kbd> för att öppna chatten\"\n\n#: /views/index.handlebars\nmsgid \"canvas locked;move;moving;zoom;zooming\"\nmsgstr \"kanvas låst;flytta;flyttar;zooma;zommning\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>L</kbd> to toggle locking panning of the canvas\"\nmsgstr \"<kbd>L</kbd> för att växla låsningen av panoreringen av kanvasen\"\n\n#: /views/index.handlebars\nmsgid \"take screenshot;image;download;picture;canvas\"\nmsgstr \"ta skärmbild;bild;ladda ner;bild;kanvas\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>P</kbd> to take a snapshot\"\nmsgstr \"<kbd>P</kbd> för att ta en skärmbild\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels placed pixels;heatmap hidden;heatmap shown;hide heatmap;show heatmap\"\nmsgstr \"överlägg;användarsaktivitet;pixlar placerade;värmekarta gömd;värmekarta visad;göm värmekarta;visa värmekarta\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>H</kbd> to toggle heatmap\"\nmsgstr \"<kbd>H</kbd> för att växla värmekartan\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels unplaced pixels;virginmap hidden;virginmap shown;hide virginmap;show virginmap\"\nmsgstr \"överlägg;användarsaktivitet;pixlar oplacerade pixlar;oskuldskartan gömd;oskuldskartan visad;göm oskuldskartan;visa oskuldskartan\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>X</kbd> to toggle virginmap\"\nmsgstr \"<kbd>X</kbd> för att växla oskuldskartan\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels placed pixels;wipe;clean;\"\nmsgstr \"överlägg;användarsaktivitet;pixler placerade pixlar;rensa;rent;\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>O</kbd> to clear heatmap\"\nmsgstr \"<kbd>O</kbd> för att rensa värmekartan\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels unplaced pixels;wipe;clean;\"\nmsgstr \"överlägg;användarsaktivitet;pixlar oplacerade pixlar;rensa;rent;\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>U</kbd> to clear virginmap\"\nmsgstr \"<kbd>U</kbd> för att rensa oskuldskartan\"\n\n#: /views/index.handlebars\nmsgid \"next color;previous color\"\nmsgstr \"nästa färg;förra färgen\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>J</kbd>/<kbd>K</kbd> to cycle through palette colors\"\nmsgstr \"<kbd>J</kbd>/<kbd>K</kbd> för att växla mellan palettfärgerna\"\n\n#: /views/index.handlebars\nmsgid \"current coordinates;coords\"\nmsgstr \"nuvarande koordinater;koordinater\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>C</kbd> to copy link of moused-over coordinates\"\nmsgstr \"<kbd>C</kbd> för att kopiera koordinaterna vid muspekaren till en länk\"\n\n#: /views/index.handlebars\nmsgid \"cancel selection\"\nmsgstr \"ångra val\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>ESC</kbd> to deselect current pixel\"\nmsgstr \"<kbd>ESC</kbd> för att avmarkera din aktuella pixel\"\n\n#: /views/index.handlebars\nmsgid \"recenter;jump;center on template;guides;focus\"\nmsgstr \"omcentrera;hopa;center av\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>R</kbd> to center the board on the current template\"\nmsgstr \"<kbd>R</kbd> för att gå till mitten av nuvarande templaten\"\n\n#: /views/index.handlebars\nmsgid \"templates;guides\"\nmsgstr \"template;guider\"\n\n#: /views/index.handlebars\nmsgid \"Template\"\nmsgstr \"Template\"\n\n#: /views/index.handlebars\nmsgid \"transparency\"\nmsgstr \"genomskinlighet\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>Page Up</kbd> to increase opacity\"\nmsgstr \"<kbd>Page Up</kbd> för att hoja opacitet\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>Page Down</kbd> to decrease opacity\"\nmsgstr \"<kbd>Page Down</kbd> för att sänka opacitet\"\n\n#: /views/index.handlebars\nmsgid \"hidden;shown;hide;show\"\nmsgstr \"gömd;visad;gömma;visa\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>V</kbd> to toggle visibility\"\nmsgstr \"<kbd>V</kbd> för att växla synlighet\"\n\n#: /views/index.handlebars\nmsgid \"Note: These values are based on QWERTY keyboards. For other layouts, use the keys corresponding to the same position on a QWERTY keyboard.\"\nmsgstr \"Notera: Dessa värden är baserade på QWERTY tangentbord. För andra layouter, använd tangenterna som har samma position på ett QWERTY tangentbord.\"\n\n#: /views/index.handlebars\nmsgid \"templates;overlays;guides\"\nmsgstr \"templater;överlägg;guider\"\n\n#: /views/index.handlebars\nmsgid \"templates;overlays;image;pixel art\"\nmsgstr \"templater;överlägg;bilder;pixelkonst\"\n\n#: /views/index.handlebars\nmsgid \"template enabled;template disabled;show template;hide template;template shown;template hidden\"\nmsgstr \"template aktiverade;templater avstängda;visa template;göm template;template visad;template gömd\"\n\n#: /views/index.handlebars\nmsgid \"Use template\"\nmsgstr \"Använd template\"\n\n#: /views/index.handlebars\nmsgid \"Hold down <kbd>Ctrl</kbd> (or <kbd>Option</kbd> on mac) to drag the template around\"\nmsgstr \"Håll ner <kbd>Ctrl</kbd> (eller <kbd>Option</kbd> på en mac) för att dra runt templaten\"\n\n#: /views/index.handlebars\nmsgid \"template title;template name;tab name;tab title;title=\"\nmsgstr \"template titel;template namn;flik namn;flik titel;title=\"\n\n#: /views/index.handlebars\nmsgid \"Title:\"\nmsgstr \"Titel:\"\n\n#: /views/index.handlebars\nmsgid \"template location source;template source URL;template URL;template=\"\nmsgstr \"template plats ursprung;template ursprungs URL;template URL;template=\"\n\n#: /views/index.handlebars\nmsgid \"URL:\"\nmsgstr \"URL:\"\n\n#: /views/index.handlebars\nmsgid \"template position;template x;template y;template location; template vertical; template horizontal;ox=;oy=\"\nmsgstr \"template position;template x;template y;template position; template vertikal; template horisontell;ox=;oy=\"\n\n#: /views/index.handlebars\nmsgid \"Horizontal position:\"\nmsgstr \"Horisontell position:\"\n\n#: /views/index.handlebars\nmsgid \"Vertical position:\"\nmsgstr \"Vertikal position:\"\n\n#: /views/index.handlebars\nmsgid \"template width;tw=\"\nmsgstr \"template bred:tw=\"\n\n#: /views/index.handlebars\nmsgid \"Width:\"\nmsgstr \"Bred:\"\n\n#: /views/index.handlebars\nmsgid \"Reset\"\nmsgstr \"Nollställ\"\n\n#: /views/index.handlebars\nmsgid \"template style;custom template\"\nmsgstr \"template stil;anpassad template\"\n\n#: /views/index.handlebars\nmsgid \"Style:\"\nmsgstr \"Stil:\"\n\n#: /views/index.handlebars\nmsgid \"Use Source Style\"\nmsgstr \"Använd Ursprungs Färger\"\n\n#: /views/index.handlebars\nmsgid \"1-to-1\"\nmsgstr \"1-till-1\"\n\n#: /views/index.handlebars\nmsgid \"1-to-1 (keep incorrect colors)\"\nmsgstr \"1-till-1 (behåll inkorrekta färger)\"\n\n#: /views/index.handlebars\nmsgid \"Dotted (Small, 1:2)\"\nmsgstr \"Prickad (Liten; 1:2\"\n\n#: /views/index.handlebars\nmsgid \"Dotted (Big, 2:2)\"\nmsgstr \"Prickad (Stor, 2:2)\"\n\n#: /views/index.handlebars\nmsgid \"Symbols\"\nmsgstr \"Symboler\"\n\n#: /views/index.handlebars\nmsgid \"Numbers\"\nmsgstr \"Nummer\"\n\n#: /views/index.handlebars\nmsgid \"Custom…\"\nmsgstr \"Anpassad…\"\n\n#: /views/index.handlebars\nmsgid \"template style source;template style URL;custom style URL;custom template\"\nmsgstr \"template stil ursprung;template stil URL;valfri stil URL;valfri template\"\n\n#: /views/index.handlebars\nmsgid \"Custom style URL:\"\nmsgstr \"Anpassad stil URL:\"\n\n#: /views/index.handlebars\nmsgid \"template conversion;template palette conversion;convert to palette\"\nmsgstr \"template omvandla;template palett omvandling;omvandla till palett\"\n\n#: /views/index.handlebars\nmsgid \"Color Conversion Mode:\"\nmsgstr \"Färg omvandlings läge:\"\n\n#: /views/index.handlebars\nmsgid \"Unconverted\"\nmsgstr \"Okonverterad\"\n\n#: /views/index.handlebars\nmsgid \"Nearest Custom\"\nmsgstr \"Närmast Anpassning\"\n\n#: /views/index.handlebars\nmsgid \"template transparency;template opacity;oo=\"\nmsgstr \"template genomskinlighet;template opacitet;oo=\"\n\n#: /views/index.handlebars\nmsgid \"Opacity:\"\nmsgstr \"Opacitet:\"\n\n#: /views/index.handlebars\nmsgid \"ui;interface\"\nmsgstr \"uI;interfas\"\n\n#: /views/index.handlebars\nmsgid \"UI Settings\"\nmsgstr \"UI Inställningar\"\n\n#: /views/index.handlebars\nmsgid \"language override;text\"\nmsgstr \"språk överskrida;text\"\n\n#: /views/index.handlebars\nmsgid \"Language override:\"\nmsgstr \"Språk överskriddelse:\"\n\n#: /views/index.handlebars\nmsgid \"Use Browser Language\"\nmsgstr \"Använd Webbläsarens Språk\"\n\n#: /views/index.handlebars\nmsgid \"English\"\nmsgstr \"Engelska\"\n\n#: /views/index.handlebars\nmsgid \"Bulgarian\"\nmsgstr \"Bulgariska\"\n\n#: /views/index.handlebars\nmsgid \"French\"\nmsgstr \"Franska\"\n\n#: /views/index.handlebars\nmsgid \"German\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Russian\"\nmsgstr \"Ryska\"\n\n#: /views/index.handlebars\nmsgid \"Swedish\"\nmsgstr \"Svenska\"\n\n#: /views/index.handlebars\nmsgid \"Finnish\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Toki Pona\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"themes;look;stylesheets;visuals\"\nmsgstr \"teman;titta;stilmallar;visueller\"\n\n#: /views/index.handlebars\nmsgid \"Theme:\"\nmsgstr \"Tema:\"\n\n#: /views/index.handlebars\nmsgid \"Default\"\nmsgstr \"Standard\"\n\n#: /views/index.handlebars\nmsgid \"hide reticule;hide reticle;reticule shown reticle shown;reticule hidden;reticle hidden\"\nmsgstr \"göm hårkors;göm hårkors;hårkors visad hårkors visad;hårkors gömd;hårkors gömd\"\n\n#: /views/index.handlebars\nmsgid \"Show reticule\"\nmsgstr \"Visa hårkors\"\n\n#: /views/index.handlebars\nmsgid \"hide cursor;cursor shown;cursor hidden\"\nmsgstr \"göm muspekaren;muspekare visad;muspekaren gömd\"\n\n#: /views/index.handlebars\nmsgid \"Show cursor\"\nmsgstr \"Visa muspekaren\"\n\n#: /views/index.handlebars\nmsgid \"darkness filter\"\nmsgstr \"mörknadsfilter\"\n\n#: /views/index.handlebars\nmsgid \"Enable color brightness\"\nmsgstr \"Aktivera färgljusstyrka\"\n\n#: /views/index.handlebars\nmsgid \"Warning: Known to cause fuzziness in Chrome on some Mac/Linux installs\"\nmsgstr \"Warning: Känd att orsaka luddighet i Chrome på vissa Mac/Linux installeringar\"\n\n#: /views/index.handlebars\nmsgid \"Color brightness:\"\nmsgstr \"Färg ljusstyrka:\"\n\n#: /views/index.handlebars\nmsgid \"keep current selected;keep curent color;place\"\nmsgstr \"behåll aktuellt vald;behåll vald färg;placera\"\n\n#: /views/index.handlebars\nmsgid \"Deselect color after placing\"\nmsgstr \"Välj bort färg efter placerande\"\n\n#: /views/index.handlebars\nmsgid \"mousewheel;palette scrolling\"\nmsgstr \"mushjul;palett scrollande\"\n\n#: /views/index.handlebars\nmsgid \"Enable scrolling on the palette to switch colors\"\nmsgstr \"Aktivera scrollande på paletten för att växla mellan färgerna\"\n\n#: /views/index.handlebars\nmsgid \"reverse scrolling;mousewheel;palette scrolling;enable scrolling on the palette to switch colors\"\nmsgstr \"omvänd skrollning;mushjul;palett skrollande;aktivera skollning på färgpaletten för att byta färger\"\n\n#: /views/index.handlebars\nmsgid \"Invert scroll direction\"\nmsgstr \"Invertera skroll direktion\"\n\n#: /views/index.handlebars\nmsgid \"indexed colors;palette indicies\"\nmsgstr \"indexerade färger;palett index\"\n\n#: /views/index.handlebars\nmsgid \"Add numbers to palette entries\"\nmsgstr \"Lägg till nummber till palett entréerna\"\n\n#: /views/index.handlebars\nmsgid \"scrollbar;palette scrolling\"\nmsgstr \"skrollbar;palett skrollning\"\n\n#: /views/index.handlebars\nmsgid \"Enable thin scrollbar\"\nmsgstr \"Aktivera tun skrollbar\"\n\n#: /views/index.handlebars\nmsgid \"scrollbar;palette scrolling;palette stack\"\nmsgstr \"skrollbar;palett skrollning;palettstapel\"\n\n#: /views/index.handlebars\nmsgid \"Enable palette stacking\"\nmsgstr \"Akrivera palett stapling\"\n\n#: /views/index.handlebars\nmsgid \"floating bubble location\"\nmsgstr \"statistikbubbelns position\"\n\n#: /views/index.handlebars\nmsgid \"Bubble position:\"\nmsgstr \"Statistikbubblans position:\"\n\n#: /views/index.handlebars\nmsgid \"Top left\"\nmsgstr \"Toppen till vänster\"\n\n#: /views/index.handlebars\nmsgid \"Top right\"\nmsgstr \"Toppen till höger\"\n\n#: /views/index.handlebars\nmsgid \"Bottom left\"\nmsgstr \"Botten till vänster\"\n\n#: /views/index.handlebars\nmsgid \"Bottom right\"\nmsgstr \"Botten till höger\"\n\n#: /views/index.handlebars\nmsgid \"broken;offset workaround\"\nmsgstr \"trasig;offset lösning\"\n\n#: /views/index.handlebars\nmsgid \"Attempt to fix canvas displacement bug in Chrome 78+\"\nmsgstr \"Försök till att fixa kanvasförskjutnings buggen i Chrome 78+\"\n\n#: /views/index.handlebars\nmsgid \"chat;message;ping sound\"\nmsgstr \"chatt;medellande;notis;ljud\"\n\n#: /views/index.handlebars\nmsgid \"Chat Settings\"\nmsgstr \"Chatt Inställningar\"\n\n#: /views/index.handlebars\nmsgid \"username;color;colour\"\nmsgstr \"användarnamn;färg;färg\"\n\n#: /views/index.handlebars\nmsgid \"Username Color:\"\nmsgstr \"Användarnamnsfärg:\"\n\n#: /views/index.handlebars\nmsgid \"chat message;chat ui\"\nmsgstr \"chatt medellande;chat ui\"\n\n#: /views/index.handlebars\nmsgid \"Interface\"\nmsgstr \"Interfas\"\n\n#: /views/index.handlebars\nmsgid \"enable;disable\"\nmsgstr \"aktivera;avaktivera\"\n\n#: /views/index.handlebars\nmsgid \"Enable chat\"\nmsgstr \"Aktivera chatten\"\n\n#: /views/index.handlebars\nmsgid \"Page must be reloaded after changing\"\nmsgstr \"Sidan måste laddas om efter ändringen\"\n\n#: /views/index.handlebars\nmsgid \"chat size;chat font\"\nmsgstr \"chatt storlek;chatt typsnitt\"\n\n#: /views/index.handlebars\nmsgid \"Font Size:\"\nmsgstr \"Typsnittsstorlek:\"\n\n#: /views/index.handlebars\nmsgid \"time;timestamps\"\nmsgstr \"tid;tidsstämpel\"\n\n#: /views/index.handlebars\nmsgid \"24 Hour Timestamps\"\nmsgstr \"24 timmars tidsstämplar\"\n\n#: /views/index.handlebars\nmsgid \"badges;pixel count;pixels placed\"\nmsgstr \"brickor;pixel mängd;pixlar placerade\"\n\n#: /views/index.handlebars\nmsgid \"Show pixel-placed badges\"\nmsgstr \"Visa pixlar-placerade brickor\"\n\n#: /views/index.handlebars\nmsgid \"badges;factions\"\nmsgstr \"brickor;grupper\"\n\n#: /views/index.handlebars\nmsgid \"Show faction tags\"\nmsgstr \"Visa grupp taggar\"\n\n#: /views/index.handlebars\nmsgid \"template urls;template links;template name\"\nmsgstr \"template urls;template länkar;template namn\"\n\n#: /views/index.handlebars\nmsgid \"Replace template titles with URLs in chat where applicable\"\nmsgstr \"Byt ut template titlar med URL'er i chatten när det är möjligt\"\n\n#: /views/index.handlebars\nmsgid \"chat orientation;chat position\"\nmsgstr \"chattorientering;chattposition\"\n\n#: /views/index.handlebars\nmsgid \"Enable horizontal chat\"\nmsgstr \"Aktivera horisontell chatt\"\n\n#: /views/index.handlebars\nmsgid \"banner;animation\"\nmsgstr \"banderoll;animation\"\n\n#: /views/index.handlebars\nmsgid \"Enable the rotating banner under chat\"\nmsgstr \"Aktivera den roterande banderrolen under chatten\"\n\n#: /views/index.handlebars\nmsgid \"max;messages;truncate\"\nmsgstr \"max;medellande;stympa\"\n\n#: /views/index.handlebars\nmsgid \"Maximum amount of chat messages:\"\nmsgstr \"Maximala antalet av chattmedellanden:\"\n\n#: /views/index.handlebars\nmsgid \"link;url;behaviour\"\nmsgstr \"länk;url;beteende\"\n\n#: /views/index.handlebars\nmsgid \"Default internal link action click:\"\nmsgstr \"Standard intern länk vid åtgärd click:\"\n\n#: /views/index.handlebars\nmsgid \"link;url;behaviour;external;bypass;skip\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Skip external link popup\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Note: Has no effect if external link popups are disabled by the server.\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"chat icon;chat notifications;chat ping\"\nmsgstr \"chattikon;chat notification;chat notis\"\n\n#: /views/index.handlebars\nmsgid \"Chat icon badge mode:\"\nmsgstr \"Chatt ikonbrickorsläge:\"\n\n#: /views/index.handlebars\nmsgid \"Show on unread ping\"\nmsgstr \"Visa vid oläst notis\"\n\n#: /views/index.handlebars\nmsgid \"Show on unread message\"\nmsgstr \"Visa vid oläst medellande\"\n\n#: /views/index.handlebars\nmsgid \"Never show\"\nmsgstr \"Visa aldrig\"\n\n#: /views/index.handlebars\nmsgid \"chat icon;chat notifications;chat message\"\nmsgstr \"chatt ikon;chatt notificationer;chatt medellanden\"\n\n#: /views/index.handlebars\nmsgid \"Chat icon highlight mode:\"\nmsgstr \"Chatt ikon markeriksläge:\"\n\n#: /views/index.handlebars\nmsgid \"ignored;ignores;unignore;blocked;blocking;unblock\"\nmsgstr \"ignorerad;ignorerar;oignorera;blockerad;blockning;oblocka\"\n\n#: /views/index.handlebars\nmsgid \"Ignores\"\nmsgstr \"Ignorerar\"\n\n#: /views/index.handlebars\nmsgid \"unignore;unblock\"\nmsgstr \"oignorera;oblocka\"\n\n#: /views/index.handlebars\nmsgid \"Unignore\"\nmsgstr \"Oginorera\"\n\n#: /views/index.handlebars\nmsgid \"overlays;virginmap;heatmap;grid\"\nmsgstr \"överlägg;oskuldskarta;värmekarta;rutnät\"\n\n#: /views/index.handlebars\nmsgid \"Overlay Settings\"\nmsgstr \"Överläggsinställningar\"\n\n#: /views/index.handlebars\nmsgid \"heatmap;heatmap opacity;clear heatmap\"\nmsgstr \"värmekarta;värmekartans opacitet;rensa värmekarta\"\n\n#: /views/index.handlebars\nmsgid \"Heatmap\"\nmsgstr \"Värmekarta\"\n\n#: /views/index.handlebars\nmsgid \"Turn on heatmap\"\nmsgstr \"Aktivera värmekartan\"\n\n#: /views/index.handlebars\nmsgid \"(toggle with <kbd>H</kbd>)\"\nmsgstr \"(växla med <kbd>H</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"overlays;activity;pixels placed pixels;wipe;clean\"\nmsgstr \"överlägg;aktivitet;pixlar placerade pixlar;rensa\"\n\n#: /views/index.handlebars\nmsgid \"Clear heatmap\"\nmsgstr \"Rensa värmekarta\"\n\n#: /views/index.handlebars\nmsgid \"(hotkey: <kbd>O</kbd>)\"\nmsgstr \"(snabbtangent: <kbd>O</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels placed pixels;transparency\"\nmsgstr \"överlägg;användarsaktivitet;pixlar placerade pixlar;genomskinlighet\"\n\n#: /views/index.handlebars\nmsgid \"Heatmap background opacity:\"\nmsgstr \"Värmekartabackgrunds opacitet:\"\n\n#: /views/index.handlebars\nmsgid \"virginmap;virginmap opacity;clear virginmap\"\nmsgstr \"oskuldskarta;oskuldskartan opacitet;rensa oskuldskartan\"\n\n#: /views/index.handlebars\nmsgid \"Virginmap\"\nmsgstr \"oskuldskartan\"\n\n#: /views/index.handlebars\nmsgid \"Turn on virginmap\"\nmsgstr \"Aktivera oskuldskartan\"\n\n#: /views/index.handlebars\nmsgid \"(toggle with <kbd>X</kbd>)\"\nmsgstr \"(växla med <kbd>X</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels unplaced pixels;transparency\"\nmsgstr \"överlägg;användarsaktivitet;pixlar oplacerade pixlar;genomskinlighet\"\n\n#: /views/index.handlebars\nmsgid \"Virginmap background opacity:\"\nmsgstr \"oskuldskartans backgrundsopacitet:\"\n\n#: /views/index.handlebars\nmsgid \"overlays;activity;pixels unplaced pixels;wipe;clean\"\nmsgstr \"överlägg;aktivitet;pixlar oplacerade pixlar;rensa;rensa\"\n\n#: /views/index.handlebars\nmsgid \"Clear virginmap\"\nmsgstr \"Rensa oskuldskartan\"\n\n#: /views/index.handlebars\nmsgid \"(hotkey: <kbd>U</kbd>)\"\nmsgstr \"(snabbtangent: <kbd>U</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"Layer template underneath heatmap\"\nmsgstr \"Lagra templaten under värmekartan\"\n\n#: /views/index.handlebars\nmsgid \"grid;toggle grid\"\nmsgstr \"rutnät;växla rutnät\"\n\n#: /views/index.handlebars\nmsgid \"Grid\"\nmsgstr \"Rutnät\"\n\n#: /views/index.handlebars\nmsgid \"Turn on grid\"\nmsgstr \"Aktivera rutnät\"\n\n#: /views/index.handlebars\nmsgid \"(toggle with <kbd>G</kbd>)\"\nmsgstr \"(växla med <kbd>G</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"controls;zooming;panning;movement\"\nmsgstr \"kontroller;zoomning;panorering;rörelse\"\n\n#: /views/index.handlebars\nmsgid \"Control Settings\"\nmsgstr \"Kontrollinställningar\"\n\n#: /views/index.handlebars\nmsgid \"zooming;scrolling;scale;scaling\"\nmsgstr \"zommning;skollning;skala;skalning\"\n\n#: /views/index.handlebars\nmsgid \"Zooming\"\nmsgstr \"Zoomning\"\n\n#: /views/index.handlebars\nmsgid \"scrolling sensitivity;zooming sensitivity;mousewheel sensitivity\"\nmsgstr \"skrollningskänslighet;zoomningkänslighet;mushjulets känslighet\"\n\n#: /views/index.handlebars\nmsgid \"Zoom sensitivity:\"\nmsgstr \"Zommkänsligheten:\"\n\n#: /views/index.handlebars\nmsgid \"zooming limit;scrolling limit;mousewheel;zooming minimum;zooming maximum\"\nmsgstr \"zoomningsbegränsingen\"\n\n#: /views/index.handlebars\nmsgid \"Minimum scale:\"\nmsgstr \"Minimum skala:\"\n\n#: /views/index.handlebars\nmsgid \"Maximum scale:\"\nmsgstr \"Maximum skala:\"\n\n#: /views/index.handlebars\nmsgid \"rounding;zooming;scrolling;mousewheel;integer;decimal\"\nmsgstr \"rundning;zoomning;skrollning;mushjul;heltal;decimaltal\"\n\n#: /views/index.handlebars\nmsgid \"Round zoom values to nearest whole number\"\nmsgstr \"Runda zoomningsvärden till närmaste heltal\"\n\n#: /views/index.handlebars\nmsgid \"controls;miscellaneous\"\nmsgstr \"kontroller,diverse\"\n\n#: /views/index.handlebars\nmsgid \"Lock the canvas (disallow canvas drag/zoom with mouse/fingers)\"\nmsgstr \"Lås kanvas vid plats (förbjuder kanvasen att förflytas/zommas ut med mus/fingrar)\"\n\n#: /views/index.handlebars\nmsgid \"MMB picker;mouse picker;selection;palette picker\"\nmsgstr \"MMB väljare;mus väljare;val;palett väljare\"\n\n#: /views/index.handlebars\nmsgid \"Enable middle mouse button selecting color from board\"\nmsgstr \"Aktivera mellersta mus knappet för att välja färgerna från kanvasen\"\n\n#: /views/index.handlebars\nmsgid \"right click action\"\nmsgstr \"höger klicks handling\"\n\n#: /views/index.handlebars\nmsgid \"Right-click action:\"\nmsgstr \"Höger-klicks handling:\"\n\n#: /views/index.handlebars\nmsgid \"Nothing\"\nmsgstr \"Inget\"\n\n#: /views/index.handlebars\nmsgid \"Clear color\"\nmsgstr \"Rensa färg\"\n\n#: /views/index.handlebars\nmsgid \"Copy color\"\nmsgstr \"Kopiera färg\"\n\n#: /views/index.handlebars\nmsgid \"Lookup\"\nmsgstr \"Kolla upp\"\n\n#: /views/index.handlebars\nmsgid \"Clear color + Lookup\"\nmsgstr \"Rensa färg + Kolla upp\"\n\n#: /views/index.handlebars\nmsgid \"snapshots;screenshot;download;picture;canvas\"\nmsgstr \"skärmbild;skärmbild;ladda ner;bild;kanvas\"\n\n#: /views/index.handlebars\nmsgid \"Snapshot Settings\"\nmsgstr \"Skärmbildsinställningar\"\n\n#: /views/index.handlebars\nmsgid \"screenshot;snapshot;download;board;canvas\"\nmsgstr \"skärmbild;skärmbild;ladda ner;kanvas;kanvas\"\n\n#: /views/index.handlebars\nmsgid \"take screenshot;image;download format;picture;canvas;board\"\nmsgstr \"ta skärmbild;bild;nerladdningsformat;bild;kanvas;kanvas\"\n\n#: /views/index.handlebars\nmsgid \"Snapshot image format:\"\nmsgstr \"Skärmbildsformat:\"\n\n#: /views/index.handlebars\nmsgid \"PNG\"\nmsgstr \"PNG\"\n\n#: /views/index.handlebars\nmsgid \"JPEG\"\nmsgstr \"JPEG\"\n\n#: /views/index.handlebars\nmsgid \"WEBP (Chrome only)\"\nmsgstr \"WEBP (bara på Chrome)\"\n\n#: /views/index.handlebars\nmsgid \"sound;notification;alert;notify;ping\"\nmsgstr \"ljud;notification;larm;notifiera;notis\"\n\n#: /views/index.handlebars\nmsgid \"Sound and Notification Settings\"\nmsgstr \"Ljud och Notificationsinställningar\"\n\n#: /views/index.handlebars\nmsgid \"audio;mute;noise;volume\"\nmsgstr \"audio;dämpa;ljud;volym\"\n\n#: /views/index.handlebars\nmsgid \"Enable sound\"\nmsgstr \"Aktivera ljud\"\n\n#: /views/index.handlebars\nmsgid \"notifs;notify;pixel notification\"\nmsgstr \"notiser;notifiera;pixelsnotification\"\n\n#: /views/index.handlebars\nmsgid \"Enable pixel available notification\"\nmsgstr \"Aktivera notificationer för tillgänglig pixel\"\n\n#: /views/index.handlebars\nmsgid \"notification;pixel ready;alert\"\nmsgstr \"notification;pixel redo;larma\"\n\n#: /views/index.handlebars\nmsgid \"Pixel Ready Notification\"\nmsgstr \"Pixel Redo Notification\"\n\n#: /views/index.handlebars\nmsgid \"alert source;notify url;notify source;notification url;notification source\"\nmsgstr \"larma källa;notifiera url;notifiera källa;notifications url;notifications källa\"\n\n#: /views/index.handlebars\nmsgid \"Alert URL:\"\nmsgstr \"Alert URL:\"\n\n#: /views/index.handlebars\nmsgid \"Update\"\nmsgstr \"Updatera\"\n\n#: /views/index.handlebars\nmsgid \"Test\"\nmsgstr \"Test\"\n\n#: /views/index.handlebars\nmsgid \"sound level;audio level;mute audio;mute sound\"\nmsgstr \"ljudnivå;audionivå;dämp audio;dämp ljud\"\n\n#: /views/index.handlebars\nmsgid \"Volume:\"\nmsgstr \"Volym:\"\n\n#: /views/index.handlebars\nmsgid \"alert forewarning;alert delay; notification delay; notification forewarning\"\nmsgstr \"varna för förvarning;varningsfördröjning; notifications fördräjning;notifications förvarning\"\n\n#: /views/index.handlebars\nmsgid \"Delay (seconds):\"\nmsgstr \"Fördröjning (sekunder):\"\n\n#: /views/index.handlebars\nmsgid \"chat mentions;chat pings;chat sound\"\nmsgstr \"chatt nämningar;chatt notiser;chatt ljud\"\n\n#: /views/index.handlebars\nmsgid \"Chat Pings\"\nmsgstr \"Chatt Notiser\"\n\n#: /views/index.handlebars\nmsgid \"Enable pings\"\nmsgstr \"Aktivera notiser\"\n\n#: /views/index.handlebars\nmsgid \"mention sound\"\nmsgstr \"nämningsljud\"\n\n#: /views/index.handlebars\nmsgid \"Play sound on ping:\"\nmsgstr \"Spela ljud vid nämning:\"\n\n#: /views/index.handlebars /public/include/chat.js\nmsgid \"Off\"\nmsgstr \"Av\"\n\n#: /views/index.handlebars\nmsgid \"Only when necessary\"\nmsgstr \"Bara om nödvänding\"\n\n#: /views/index.handlebars\nmsgid \"Always\"\nmsgstr \"Alltid\"\n\n#: /views/index.handlebars\nmsgid \"mention sound volume\"\nmsgstr \"nämningsljud volym\"\n\n#: /views/index.handlebars\nmsgid \"Ping sound volume:\"\nmsgstr \"Notis ljud volym:\"\n\n#: /views/index.handlebars\nmsgid \"personal account\"\nmsgstr \"personligt konto\"\n\n#: /views/index.handlebars\nmsgid \"Account Settings\"\nmsgstr \"Konto inställningar\"\n\n#: /views/index.handlebars\nmsgid \"Public Discord name:\"\nmsgstr \"Publikt Discord namn:\"\n\n#: /views/index.handlebars /public/include/chat.js\nmsgid \"Set\"\nmsgstr \"Sätt\"\n\n#: /views/index.handlebars\nmsgid \"Remove\"\nmsgstr \"Ta bort\"\n\n#: /views/index.handlebars\nmsgid \"Help\"\nmsgstr \"Hjälp\"\n\n#: /views/index.handlebars\nmsgid \"Notifications\"\nmsgstr \"Notificationer\"\n\n#: /views/partials/faq.handlebars\nmsgid \"FAQ\"\nmsgstr \"FAQ\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Why is the cooldown as long as it is?\"\nmsgstr \"Varför är väntningstiden så lång som den är?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"The time it takes to get a pixel is dynamic, and changes based on how many people are online. The cooldown time is longer when more users are online.\"\nmsgstr \"Tiden som det tar för att placera en pixel är dynamisk, och ändras i förhållande med antalet av personer som är online. Väntetiden blir längre destå mer användare är online.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Why does it say 0/6 pixels?\"\nmsgstr \"Varför står det 0/6 pixlar?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"This means that you are waiting for your next pixel. When you place a pixel, there is a cooldown for when you can place the next one. Over time, you can gain up to 6 \\\"stacked\\\" pixels to place at once.\"\nmsgstr \"Detta betyder att du väntar på din nästa pixel. När du placerar en pixel, så finns det en väntetid tills du kan placera en till. Om man väntar lite längre så kan man få upp till 6 stycken \\\"staplade\\\" pixlar som du kan placera samtidigt.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Why does it take so long to \\\"stack\\\" pixels?\"\nmsgstr \"Varför tar det en så long tid att \\\"stapla\\\" pixlar?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"This is by design. It is better to place a pixel as soon as you get one. Pixel \\\"stacking\\\" is meant to give you a bump if you go AFK for a bit. It takes around 20-30 minutes to get a full 6/6 pixels, but it only takes around 3 minutes to place 6 pixels if you place them as soon as possible.\"\nmsgstr \"Det är designat så här. Det är bättre att placera en pixel så fort du får den. Pixel \\\"staplande\\\" är mer för dom som går AFK. Det tar runt 40 minuter för att få 6/6 pixlar, medans det bara tar runt 3 minuter för att placera lika många om man gör det så fort man får dom.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I appeal a ban?\"\nmsgstr \"Hur kan jag vädja en banlyselse?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Contact us on <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord</a> or send an appeal to our <a href=\\\"https://pxls.space/appeal\\\" target=\\\"_blank\\\">Google form</a> after reading the rules in the site's info panel.\"\nmsgstr \"Kontakta oss på <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord</a> eller skicka in en vädjandesbegära till vår <a href=\\\"https://pxls.space/appeal\\\" target=\\\"_blank\\\">Google form</a> efter du har läst sidans regler i info panelen.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I make a template?\"\nmsgstr \"Hur gör jag ett template?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"A template is an image link that is posted in the template textbox in the settings panel so you can place over it on the canvas. You may use a regular image link to your pixel art, but many people use 3rd party tools like <a href=\\\"https://discord.gg/5MVDCq53vC\\\" target=\\\"blank\\\">Clueless</a> to turn pixel art into a fancier link. If you need to make pixel art yourself, you can use <a href=\\\"https://www.piskelapp.com/p/create\\\" target=\\\"_blank\\\">Piskel</a> to create art to put into Clueless.\"\nmsgstr \"Ett template är en bildlänk som är inlagd i template textrutan i inställningspanelen så att du kan placera den över kanvasen. Du kan använda en normal bild länk till din pixelkonst, men många personer anväder tredje parti verktyg som <a href=\\\"https://discord.gg/5MVDCq53vC\\\" target=\\\"blank\\\">Clueless</a> för att få det i en finare länk. Om du behöver göra pixelkonst själv så kan du använda <a href=\\\"https://www.piskelapp.com/p/create\\\" target=\\\"_blank\\\">Piskel</a> för att göra konst som du sedan kan lägga in på Clueless.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I move a template?\"\nmsgstr \"Hur flyttar jag ett template?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Hold <kbd>CTRL</kbd> (or <kbd>OPTION</kbd> on macOS) and click and drag to move it around. On mobile, you can tap and hold where you want to move the template and click \\\"Move Template Here\\\" in the pop-up.\"\nmsgstr \"Håll ner <kbd>CTRL</kbd> (eller <kbd>OPTION</kbd> på macOS) och klicka och dra för att flytta runt på den. På telefon så kan du trycka var du vill flytta templaten och sedan klicka \\\"Flytta template\\\" i popupen.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Does the canvas reset? When?\"\nmsgstr \"Resetas kanvasnen? När?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Yes. The canvas resets when it is completely full. A reset date is not usually decided until the canvas is full, but the average canvas life-span is around 1 month. Updates are posted in our <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord server</a> when a reset date is set.\"\nmsgstr \"Ja. Kanvasen resetas när den är nästan helt full. Ett reset datum är inte bestämt tills kanvasen är full, men den normala lifslängden för en kanvas är runt 1 månad. Updateringar är inlaggda på vår <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord server</a> när ett reset datum har blivit valt.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Where can I see the past canvases?\"\nmsgstr \"Vart kan jag se dom föredetta kanvaserna?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"The past canvases are featured on our <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord server</a>, or the <a href=\\\"https://archives.pxls.space\\\" target=\\\"_blank\\\">archives</a>, which records timelapses and a lot of useful information on each canvas.\"\nmsgstr \"De föredetta kanvas är sparade på vår <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord server</a>, och på tredje parti hemsidan <a href=\\\"https://pxlsfiddle.com\\\" target=\\\"_blank\\\">PxlsFiddle</a>, vilket sparar bilder av under kanvasen som sedan blir gjorda till en timelapse, och väldigt mycket information om kanvaserna.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I see who placed a pixel?\"\nmsgstr \"Hur kan jag se vem som placerade en pixel?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"By shift-clicking (or tap and hold on mobile) a pixel, you can see who placed a pixel, how many pixels they have placed, and when they placed it.\"\nmsgstr \"Genom att skift-clicka (eller genom att trycka och hålla på mobil) en pixel, så kan man se vem som placerade en pixel, hur många dom har placerat totalt, och när dom placerade den.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I report someone?\"\nmsgstr \"Hur raporterar jag någon?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Shift-click (or tap and hold on mobile) on a pixel, and click the Report button.\"\nmsgstr \"Skift-clicka på (eller tryck och håll på mobil) en pixel och tryck på Report knappen.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I change the color of my name in the chat?\"\nmsgstr \"Hur ändrar jag färgen på mitt namn i chatten?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"There is a \\\"Username Color\\\" option near the bottom of the settings panel.\"\nmsgstr \"Det finns en \\\"Namn Färg\\\" inställning nära botten av inställnings panelen.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"What is a \\\"virginmap\\\"?\"\nmsgstr \"Vad är en \\\"Oskuldsskarta\\\"?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"The virginmap shows which pixels have not yet been placed on (or “virgin” pixels).\"\nmsgstr \"Oskuldskartan visar vilka pixlar som inte har blivit placerad på än (eller \\\"oskuld\\\" pixlar).\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I report bugs?\"\nmsgstr \"Hur kan jag raportera buggar?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Submit bugs to the #dev-and-bugs forum in the <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord server</a>. If you have found an exploit, please message one of the staff members privately (through DMs) or open a modmail by DMing pxls.mail#8384.\"\nmsgstr \"Skicka in buggar på #dev-and-bugs forumet i <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord servern</a>. Om du har hittat en så kallad exploit, meddela snälla någon anställd privat (genom direkta meddelanden) eller öppna en modmail genom att skicka ett medellande till pxls.mail#8384.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I get more info or contact staff?\"\nmsgstr \"Hur kan jag få mer info eller kontakta någon anställd?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Check the info panel (the icon on the top left) for more details and links, or join our <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord server</a>, where a staff member will gladly respond.\"\nmsgstr \"Kolla i info panelen (iconen i övre vänstra hörnet) för mer detaljer och länkar, eller gå med i vår <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord server</a>, då en av våra anställda kan gladeligen hjälpa till.\"\n\n#: /views/partials/info.handlebars\nmsgid \"Welcome!\"\nmsgstr \"Välkommen!\"\n\n#: /views/partials/info.handlebars\nmsgid \"Welcome to pxls.space! Pxls is a multiplayer online collaborative canvas based on Reddit's <a href=\\\"https://www.reddit.com/r/place\\\" target=\\\"_blank\\\">r/place</a> event from 2017 that allows you to create anything you can imagine, one pixel at a time. Join hundreds of other players in the Pxls community and create amazing works of art together as a team, or solo.\"\nmsgstr \"Välkommen till pxls.space! Pxls är ett fler-spelare online samarbets kanvas baserad på <a href=\\\"https://www.reddit.com/r/place\\\" target=\\\"_blank\\\">/r/place</a>, som låter dig göra vad som helst som du kan komma på, en pixel åt gången. Gå med hundratals av andra spelare i Pxls gemensamheten och gör fantastiska konstverk tillsammans som ett team, eller solo.\"\n\n#: /views/partials/info.handlebars\nmsgid \"The best place to reach staff and fellow community is in the discord!\"\nmsgstr \"Den bästa platsen att nå moderatorerna och vårt gemenskap i discord servern!\"\n\n#: /views/partials/info.handlebars\nmsgid \"Check out our social media pages, and please take the time to read the rules below. Have fun creating (or changing) art!\"\nmsgstr \"Kolla på våra sociala medier sidor, och snälla ta den tid som behövs för att läsa igenom reglerna vi har. Ha kul med görandet av (eller att ändra) konst!\"\n\n#: /views/partials/info.handlebars\nmsgid \"Canvas Rules\"\nmsgstr \"Kanvas Regler\"\n\n#: /views/partials/info.handlebars\nmsgid \"We pride ourselves on trying to keep an open canvas for all free from outside interference on our end, and especially censorship. However, for the good of the community and on accounts of our own beliefs, please acknowledge and obey the following guidelines:\"\nmsgstr \"Vi är stolta över att försöka hålla en öppen kanvas för alla, fri från yttre störning på vår sida, speciellt censoring. Men, för vårt gemenskaps bästa och på grund av vår egen tro, snälla acceptera oc följ dem följande reglerna:\"\n\n#: /views/partials/info.handlebars\nmsgid \"No hateful imagery or derogatory speech. This includes but is not limited to words such as <i>f****t</i>, <i>n****r</i>, etc; as well as the Swastika, Hammer and Sickle, and any symbols of terrorism.\"\nmsgstr \"Inga hatfyllda bilder eller förkränkande språk. Detta inkluderar, men är inte begränsat till ord som <i>f****t</i>, <i>n****r</i>, etc; ävensom Hakkorset, Hammare och Skäran, eller andra symboler av terrorism.\"\n\n#: /views/partials/info.handlebars\nmsgid \"No NSFW or NSFL content.\"\nmsgstr \"Inget NSFW (Not Safe For Work) eller NSFL (Not Safe For Life) innehåll.\"\n\n#: /views/partials/info.handlebars\nmsgid \"No nudity or otherwise sexually explicit content\"\nmsgstr \"Ingen nakenhet eller annars sexuellt explicit innehåll\"\n\n#: /views/partials/info.handlebars\nmsgid \"No female-presenting nipples/bare breasts, genitalia, sexual fluids\"\nmsgstr \"Inga kvinno-presenterande nippel/bara bröst, genitalier eller sexuella vätskor\"\n\n#: /views/partials/info.handlebars\nmsgid \"No sexual imagery/erotica\"\nmsgstr \"Inget sexuellt eller erotiska konstverk\"\n\n#: /views/partials/info.handlebars\nmsgid \"No excessive blood or otherwise obscene/shocking content\"\nmsgstr \"Ingen överdrivet mängd med blod eller annars obscen/shockerande innehåll\"\n\n#: /views/partials/info.handlebars\nmsgid \"No more than <b>one</b> account per user, no exceptions. Multiple account users will be banned from creating art on the canvas.\"\nmsgstr \"Inga mer än <b>ett</b> konto per användare, inga undantag. Fler-konto användare kommer att bli förbjudna från att göra konst på kanvasen.\"\n\n#: /views/partials/info.handlebars\nmsgid \"No auto-placement tools of any kind, you must place the pixels manually.\"\nmsgstr \"Inga auto-placerande verktyg av något slag, du måste placera alla pixlar manuellt.\"\n\n#: /views/partials/info.handlebars\nmsgid \"Do not abuse site functionality, such as reports or lookups. (e.g. automated reporting/lookups, etc.)\"\nmsgstr \"Missbruka inte hemsidans fuctioner, som reportrar eller användar-uppslagningar. (t.ex. automatiskt reportering/nvändar-uppslagningar, etc.)\"\n\n#: /views/partials/info.handlebars\nmsgid \"Any automated aggregation of data from user lookups is not allowed, and will result in a ban.\"\nmsgstr \"Någon sorts automatiserad aggregering av data från användar-uppslagningar är inte tillåtet, och kommer resultera i en bannlysning från hemsidan.\"\n\n#: /views/partials/info.handlebars\nmsgid \"Staff have final say in any rule disputes\"\nmsgstr \"Moderatorer har sista ordet i alla regel konflikter\"\n\n#: /views/partials/info.handlebars\nmsgid \"If you feel a moderator has acted inappropriately, please report it to an administrator.\"\nmsgstr \"Om du känner att en moderator har agerat olämpligt, snälla raportera det till en administrator.\"\n\n#: /views/partials/info.handlebars\nmsgid \"If you believe you have been falsely banned you may contact a moderator or administrator.\"\nmsgstr \"Om du tror att du har blivit falskt bannlyst från sidan, så kan du kontakta en moderator eller administrator.\"\n\n#: /views/partials/info.handlebars\nmsgid \"Chat Rules\"\nmsgstr \"Chatt Regler\"\n\n#: /views/partials/info.handlebars\nmsgid \"Keep chat civil. No harassment or homophobic/transphobic/disablist language.\"\nmsgstr \"Håll chatten civil. Du får ej trakassera någon, eller använda homofobiskt/transfobiskt/funkofobiskt språk.\"\n\n#: /views/partials/info.handlebars\nmsgid \"No hate speech. This includes emoji/symbols/ASCII art.\"\nmsgstr \"Inget hatspråk. Detta inkluderar emojis/symboler/ASCII konst.\"\n\n#: /views/partials/info.handlebars\nmsgid \"Normal swearing/etc is allowed\"\nmsgstr \"Normalt svärande är tillåtet\"\n\n#: /views/partials/info.handlebars\nmsgid \"No spamming\"\nmsgstr \"Inget spammande\"\n\n#: /views/partials/info.handlebars\nmsgid \"This includes excessive ASCII art/emojis/symbols/whitespace\"\nmsgstr \"Detta inkluderar överdrivet ASCII konst/emojis/symboler/tomrum\"\n\n#: /views/partials/info.handlebars\nmsgid \"No \\\"copy pasta\\\"s\"\nmsgstr \"Inga \\\"copy pasta\\\"s\"\n\n#: /views/partials/info.handlebars\nmsgid \"No links to sites that actively break the canvas or chat rules (e.g. porn sites)\"\nmsgstr \"Inga länkar till sidor som aktivt bryter mot kanvas eller chatt regler (t.ex. porr sidor)\"\n\n#: /views/partials/info.handlebars\nmsgid \"No symbology which break the canvas or chat rules (e.g. NSFW ASCII art)\"\nmsgstr \"Inget symbolik vilket bryter mot kanvas eller chatt regler (t.ex. NSFW ASCII konst)\"\n\n#: /views/partials/info.handlebars\nmsgid \"No personal information\"\nmsgstr \"Inge personlig information\"\n\n#: /views/partials/info.handlebars\nmsgid \"Links\"\nmsgstr \"Länkar\"\n\n#: /views/partials/info.handlebars\nmsgid \"Terms of Service\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Privacy Policy\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Discord (main hub)\"\nmsgstr \"Discord (huvud hubben)\"\n\n#: /views/partials/info.handlebars\nmsgid \"Twitter\"\nmsgstr \"Twitter\"\n\n#: /views/partials/info.handlebars\nmsgid \"GitHub (back end)\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"GitHub (front end)\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Single-player mode\"\nmsgstr \"Enspelarsläge\"\n\n#: /views/partials/info.handlebars\nmsgid \"Statistics\"\nmsgstr \"Statestiker\"\n\n#: /views/partials/info.handlebars\nmsgid \"Profile (user info, factions, etc.)\"\nmsgstr \"Profil (användar info, gruber, etc.)\"\n\n#: /views/partials/info.handlebars\nmsgid \"Wiki\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Generator, progress checker, and monitor for Pxls templates\"\nmsgstr \"Genererare, utvecklingskollare, och övervakare för Pxls template\"\n\n#: /views/partials/info.handlebars\nmsgid \"Archives\"\nmsgstr \"Arkiv\"\n\n#: /views/partials/info.handlebars\nmsgid \"PxlsFiddle (archives)\"\nmsgstr \"PxlsFiddle (arkiv)\"\n\n#: /views/partials/info.handlebars\nmsgid \"Donate\"\nmsgstr \"Donera\"\n\n#: /views/partials/info.handlebars\nmsgid \"Donations are not accepted at this time, but this panel will be updated when they're open again!\"\nmsgstr \"Donationer är inte accepterade vid denna tid, men denna panel kommer att bli updaterad så fort dom är öppna igen!\"\n\n#: /views/profile.handlebars\nmsgid \"{0}'s Profile\"\nmsgstr \"{0}'s Profil\"\n\n#: /views/profile.handlebars\nmsgid \"My Data\"\nmsgstr \"Min Data\"\n\n#: /views/profile.handlebars\nmsgid \"Reports\"\nmsgstr \"Reporter\"\n\n#: /views/profile.handlebars\nmsgid \"Factions\"\nmsgstr \"Grupper\"\n\n#: /views/profile.handlebars\nmsgid \"Data\"\nmsgstr \"Data\"\n\n#: /views/profile.handlebars\nmsgid \"You must be logged in to view your profile.\"\nmsgstr \"Du måste vara inloggad för att kunna se din profil.\"\n\n#: /views/profile.handlebars\nmsgid \"Registration Date\"\nmsgstr \"Registrerings Datum\"\n\n#: /views/profile.handlebars /public/include/lookup.js\nmsgid \"Alltime Pixels\"\nmsgstr \"Heltids Pixlar\"\n\n#: /views/profile.handlebars\nmsgid \"Current Canvas Pixels\"\nmsgstr \"Nuvarande Kanvas Pixlar\"\n\n#: /views/profile.handlebars\nmsgid \"Discord Tag\"\nmsgstr \"Discord Tag\"\n\n#: /views/profile.handlebars /public/include/lookup.js\nmsgid \"Faction\"\nmsgstr \"Grupp\"\n\n#: /views/profile.handlebars\nmsgid \"None\"\nmsgstr \"Ingen\"\n\n#: /views/profile.handlebars /public/admin/admin.js\nmsgid \"Roles\"\nmsgstr \"Roler\"\n\n#: /views/profile.handlebars\nmsgid \"Canvas Ban Expiry\"\nmsgstr \"Kanvas Bannlysning Utgång\"\n\n#: /views/profile.handlebars\nmsgid \"Never\"\nmsgstr \"Aldrig\"\n\n#: /views/profile.handlebars\nmsgid \"Chat Ban Expiry\"\nmsgstr \"Chat Bannlysning Utgång\"\n\n#: /views/profile.handlebars\nmsgid \"View rankings and other stats <a href=\\\"/stats\\\">here</a>.\"\nmsgstr \"Kolla rankningar och andra statistiker <a href=\\\"/stats\\\">här</a>.\"\n\n#: /views/profile.handlebars\nmsgid \"You must be logged in to view your reports.\"\nmsgstr \"Du måste vara inloggad för att kunna se dinna raporter.\"\n\n#: /views/profile.handlebars\nmsgid \"Canvas Reports ({0}/{1} open)\"\nmsgstr \"Kanvas Reporter ({0}/{1} öppen)\"\n\n#. eg \"Report on Bob (closed)\n#: /views/profile.handlebars\nmsgid \"Report on {0} (closed)\"\nmsgstr \"Report på {0} (sluten)\"\n\n#. eg \"Report on Bob (open)\n#: /views/profile.handlebars\nmsgid \"Report on {0} (open)\"\nmsgstr \"Report på {0} (öppen)\"\n\n#. eg \"Reported Bob on Jan 1, 1970, 00:00:00 AM (UTC)\n#: /views/profile.handlebars\nmsgid \"Reported {0} on {1}\"\nmsgstr \"Reporterade {0} på {1}\"\n\n#: /views/profile.handlebars\nmsgid \"There are no canvas reports to show.\"\nmsgstr \"Det finns inga kanvas reporter att visa.\"\n\n#: /views/profile.handlebars\nmsgid \"Chat Reports ({0}/{1} open)\"\nmsgstr \"Chatt Reporter ({0}/{1} öppen)\"\n\n#: /views/profile.handlebars\nmsgid \"There are no chat reports to show.\"\nmsgstr \"Det finns inga chatt raporter att visa.\"\n\n#: /views/profile.handlebars\nmsgid \"You must be logged in to manage your factions.\"\nmsgstr \"Du måste vara inloggad för att kunna hantera dinna grupper.\"\n\n#: /views/profile.handlebars\nmsgid \"You are faction restricted and cannot create new factions. If you believe this is an error, please contact a moderator.\"\nmsgstr \"Du är grupp begränsad och kan inte göra nya grupper. Om du tror att detta är ett fel, snälla kontakta en moderator.\"\n\n#: /views/profile.handlebars\nmsgid \"You are canvas banned and cannot create new factions. If you believe this is an error, please contact a moderator.\"\nmsgstr \"Du är kanvas-bannlyst och kan inte göra nya grupper. Om du tror att detta är ett fel, snälla kontakta en moderator.\"\n\n#: /views/profile.handlebars\nmsgid \"You must have at least {0} all-time pixels to create a faction.\"\nmsgstr \"Du måste ha minst {0} heltid pixlar placerade för att kunna göra en grupp.\"\n\n#: /views/profile.handlebars\nmsgid \"Create\"\nmsgstr \"Skapa\"\n\n#: /views/profile.handlebars\nmsgid \"Join\"\nmsgstr \"Gå med\"\n\n#: /views/profile.handlebars\nmsgid \"This is your currently displayed faction.\"\nmsgstr \"Det här är ditt nuvarande visad grupp.\"\n\n#. eg \"Pixelers (members: 100, ID: 1)\"\n#: /views/profile.handlebars\nmsgid \"{0} (members: {1}, ID: {2})\"\nmsgstr \"{0} (medlemmar: {1}, ID: {2})\"\n\n#: /views/profile.handlebars\nmsgid \"Owner: {0}\"\nmsgstr \"Ägare: {0}\"\n\n#. makes the faction no longer the one displayed for the current user\n#: /views/profile.handlebars\nmsgid \"Remove Displayed\"\nmsgstr \"Ta Bort Visad Grupp\"\n\n#. makes the faction the one displayed for the current user\n#: /views/profile.handlebars\nmsgid \"Set Displayed\"\nmsgstr \"Sätt Visad Grupp\"\n\n#: /views/profile.handlebars\nmsgid \"Members\"\nmsgstr \"Medlemmar\"\n\n#: /views/profile.handlebars\nmsgid \"Edit\"\nmsgstr \"Redigera\"\n\n#: /views/profile.handlebars /public/include/chat.js\nmsgid \"Delete\"\nmsgstr \"Ta bort\"\n\n#: /views/profile.handlebars\nmsgid \"Leave\"\nmsgstr \"Lämna\"\n\n#: /views/profile.handlebars\nmsgid \"You are not in any factions yet!\"\nmsgstr \"Du är inte i någon grupp ännu!\"\n\n#: /views/profile.handlebars\nmsgid \"You must be logged in to view your data.\"\nmsgstr \"Du måste vara inloggad för att kunna se din data.\"\n\n#: /views/profile.handlebars\nmsgid \"Log Keys\"\nmsgstr \"Logg Nycklar\"\n\n#: /views/profile.handlebars\nmsgid \"Log keys can be used by those who have them to tell which pixels you placed on previous canvases.\"\nmsgstr \"Logg nycklar kan bli använda av dom som har dom för att se vilka pixlar du placerat på en föredetta kanvas.\"\n\n#: /views/profile.handlebars\nmsgid \"You can see the public <a href=\\\"https://pxls.space/extra/logs/\\\" target=\\\"_blank\\\">Pxls Logs</a> to learn more.\"\nmsgstr \"Allmänt tillgängliga loggfiler med mer information finns <a href=\\\"https://pxls.space/extra/logs/\\\" target=\\\"_blank\\\">här</a>.\"\n\n#: /views/profile.handlebars\nmsgid \"Canvas Code\"\nmsgstr \"Kanvas Kod\"\n\n#: /views/profile.handlebars\nmsgid \"Log Key\"\nmsgstr \"Logg Nyckel\"\n\n#: /views/profile.handlebars\nmsgid \"You have no log keys yet!\"\nmsgstr \"Du har inga log nycklar ännu!\"\n\n#: /views/profile.handlebars\nmsgid \"Log keys should show up here after a canvas you have placed on ends.\"\nmsgstr \"Logg nycklar borde visas up här efter en kanvas du har placerat på tar slut.\"\n\n#: /views/profile.handlebars\nmsgid \"Members of {0} ([{1}])\"\nmsgstr \"Medlemamr av {0} ([{1}])\"\n\n#: /views/profile.handlebars /public/admin/admin.js /public/include/lookup.js\nmsgid \"Close\"\nmsgstr \"Stäng\"\n\n#: /views/profile.handlebars\nmsgid \"Faction Members\"\nmsgstr \"Grupp Medlemmar\"\n\n#. This loop only fires when on our own profile. We can't leave a faction we own, we can only transfer ownership, so no point in showing ourselves in the member list.\n#. since we can't leave the faction until we transfer, if there's only one member in the list it's assumed to be the owner. we don't want to show ourself in the list\n#: /views/profile.handlebars\nmsgid \"Transfer Ownership\"\nmsgstr \"Överför Ägande\"\n\n#. bans a user from the faction\n#: /views/profile.handlebars /public/include/chat.js\nmsgid \"Ban\"\nmsgstr \"Bannlysning\"\n\n#: /views/profile.handlebars\nmsgid \"Nothing to see here!\"\nmsgstr \"Inget att se här!\"\n\n#: /views/profile.handlebars\nmsgid \"Faction Bans\"\nmsgstr \"Grupp Bannlysningar\"\n\n#: /views/profile.handlebars /public/admin/admin.js /public/include/chat.js\nmsgid \"Unban\"\nmsgstr \"Ta Bort Bannlysning\"\n\n#: /views/profile.handlebars\nmsgid \"Find A Faction\"\nmsgstr \"Hitta En Grupp\"\n\n#: /views/profile.handlebars\nmsgid \"Search:\"\nmsgstr \"Sök:\"\n\n#: /views/profile.handlebars\nmsgid \"Enter a search term to get started.\"\nmsgstr \"Skriv in en sök-term för att börja.\"\n\n#: /views/profile.handlebars\nmsgid \"Load More\"\nmsgstr \"Ladda mer\"\n\n#: /public/admin/admin.js\nmsgid \"Send alert...\"\nmsgstr \"Skicka varning...\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Rule #1: Hateful/derogatory speech or symbols\"\nmsgstr \"Regel #1: Hatfult/kränkande språk eller symboler\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Rule #2: Nudity, genitalia, or non-PG-13 content\"\nmsgstr \"Regel #2: Nakenhet, genitalier eller icke-PG-13 innehåll\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Rule #3: Multi-account\"\nmsgstr \"Regel #3: Flera konton\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Rule #4: Botting\"\nmsgstr \"Regel #4: Botting\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Other (specify below)\"\nmsgstr \"Annat (specifiera under)\"\n\n#: /public/admin/admin.js /public/include/chat.js /public/include/lookup.js\nmsgid \"Additional information (if applicable)\"\nmsgstr \"Ytterligare information (om tillämpligt)\"\n\n#. \"Revert pixels of the last *n* hours\", part before 'n'\n#: /public/admin/admin.js\nmsgid \"Revert pixels of the last \"\nmsgstr \"Återställ pixlar för de senaste \"\n\n#. \"Revert pixels of the last *n* hours\", part after 'n'\n#: /public/admin/admin.js\nmsgid \" hours\"\nmsgstr \" timmar\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"You must specify the details.\"\nmsgstr \"Du måste specifiera detaljerna.\"\n\n#: /public/admin/admin.js\nmsgid \"Something went wrong! Perhaps insufficient permissions?\"\nmsgstr \"Något gick fel! Har du kanske otillräckliga behörigheter?\"\n\n#: /public/admin/admin.js\nmsgid \"Shadowban user\"\nmsgstr \"Shadowban användare\"\n\n#: /public/admin/admin.js\nmsgid \"Shadowbanned user\"\nmsgstr \"Shadowbannad användare\"\n\n#: /public/admin/admin.js\nmsgid \"Permaban user\"\nmsgstr \"Permabannlys användare\"\n\n#: /public/admin/admin.js\nmsgid \"Permabanned user\"\nmsgstr \"Permabannlyste användare\"\n\n#: /public/admin/admin.js\nmsgid \"Ban user\"\nmsgstr \"Bannlys användare\"\n\n#: /public/admin/admin.js\nmsgid \"Banned user\"\nmsgstr \"Bannlyste användare\"\n\n#: /public/admin/admin.js\nmsgid \"Unbanned user ${username}\"\nmsgstr \"Ångrade bannlysning hos ${username}\"\n\n#. Context: ban type\n#: /public/admin/admin.js\nmsgid \"shadow\"\nmsgstr \"shadow\"\n\n#: /public/admin/admin.js\nmsgid \"never\"\nmsgstr \"aldrig\"\n\n#: /public/admin/admin.js\nmsgid \"permanent\"\nmsgstr \"permanent\"\n\n#: /public/admin/admin.js /public/include/chat.js /public/include/uiHelper.js\n#: /public/include/user.js\nmsgid \"Yes\"\nmsgstr \"Ja\"\n\n#: /public/admin/admin.js /public/include/chat.js /public/include/uiHelper.js\n#: /public/include/user.js\nmsgid \"No\"\nmsgstr \"Nej\"\n\n#: /public/admin/admin.js\nmsgid \"Yes (permanent)\"\nmsgstr \"Ja (permanent)\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Username\"\nmsgstr \"Användarnamn\"\n\n#: /public/admin/admin.js /public/include/chat.js\nmsgid \"Profile\"\nmsgstr \"Profil\"\n\n#: /public/admin/admin.js\nmsgid \"Logins\"\nmsgstr \"Inloggningar\"\n\n#: /public/admin/admin.js\nmsgid \"All Time Pixels\"\nmsgstr \"Heltids Pixlar\"\n\n#: /public/admin/admin.js /public/include/user.js\nmsgid \"Rename Requested\"\nmsgstr \"Namnbyte Begärd\"\n\n#: /public/admin/admin.js\nmsgid \"Discord Name\"\nmsgstr \"Discord Namn\"\n\n#: /public/admin/admin.js /public/include/user.js\nmsgid \"Banned\"\nmsgstr \"Bannlyst\"\n\n#: /public/admin/admin.js\nmsgid \"Chatbanned\"\nmsgstr \"Chattbannlyst\"\n\n#: /public/admin/admin.js\nmsgid \"Ban Reason\"\nmsgstr \"Bannlysnings Anledning\"\n\n#: /public/admin/admin.js\nmsgid \"Ban Expiracy\"\nmsgstr \"Utgånbsdatum För Bannlyssning\"\n\n#: /public/admin/admin.js\nmsgid \"Chatban Reason\"\nmsgstr \"Chattban Anledning\"\n\n#: /public/admin/admin.js\nmsgid \"(canvas ban)\"\nmsgstr \"(kanvas bannlysning)\"\n\n#: /public/admin/admin.js\nmsgid \"when canvas ban ends\"\nmsgstr \"när kanvasbannlysningen tar slut\"\n\n#: /public/admin/admin.js\nmsgid \"Chatban Expires\"\nmsgstr \"Chattban Går Ut\"\n\n#: /public/admin/admin.js\nmsgid \"Ban (24h)\"\nmsgstr \"Bannlyss (24h)\"\n\n#: /public/admin/admin.js\nmsgid \"Permaban\"\nmsgstr \"Permabannlys\"\n\n#: /public/admin/admin.js\nmsgid \"Shadowban\"\nmsgstr \"Shadowban\"\n\n#: /public/admin/admin.js\nmsgid \"Custom ban length: \"\nmsgstr \"Frivilig bannlyssnings längd: \"\n\n#. Admin check. Example: type = 'username', arg = 'pxlsuser94'\n#: /public/admin/admin.js\nmsgid \"${type} ${arg} not found.\"\nmsgstr \"{type} ${arg} inte hittad.\"\n\n#: /public/admin/admin.js\nmsgid \"Unban Reason:\"\nmsgstr \"Tog Bort Bannlyssning, Anledningar är:\"\n\n#: /public/admin/admin.js\nmsgid \"Unbanning ${username}\"\nmsgstr \"Tar Bort Bannlysning på ${username}\"\n\n#: /public/admin/admin.js /public/include/chat.js /public/include/lookup.js\n#: /public/include/user.js\nmsgid \"Cancel\"\nmsgstr \"Avbryt\"\n\n#. Moderator panel label\n#: /public/admin/admin.js\nmsgid \"MOD\"\nmsgstr \"MODERATOR\"\n\n#: /public/admin/admin.js\nmsgid \"Ignore cooldown\"\nmsgstr \"Ignorera väntetid\"\n\n#: /public/admin/admin.js\nmsgid \"Place any color\"\nmsgstr \"Placera valfri färg\"\n\n#: /public/admin/admin.js\nmsgid \"Ignore placemap\"\nmsgstr \"Ignorera placeringskarta\"\n\n#: /public/admin/admin.js\nmsgid \"Ban user (24h)\"\nmsgstr \"Bannlys användare (24h)\"\n\n#: /public/admin/admin.js\nmsgid \"Unban user\"\nmsgstr \"Ta bort bannlysning på användare\"\n\n#: /public/admin/admin.js\nmsgid \"Check user\"\nmsgstr \"Kolla användare\"\n\n#: /public/admin/admin.js\nmsgid \"profile\"\nmsgstr \"profil\"\n\n#: /public/admin/admin.js\nmsgid \"User Agent\"\nmsgstr \"Användar Agent\"\n\n#: /public/admin/admin.js\nmsgid \"Send Alert\"\nmsgstr \"Skicka en Varning\"\n\n#: /public/admin/admin.js\nmsgid \"Mod Actions\"\nmsgstr \"Mod Aktioner\"\n\n#: /public/admin/admin.js\nmsgid \"More...\"\nmsgstr \"Mer...\"\n\n#. Snapshot save name\n#: /public/include/board.js\nmsgid \"pxls canvas\"\nmsgstr \"pxls kanvas\"\n\n#. template link action\n#: /public/include/chat.js\nmsgid \"Ask\"\nmsgstr \"Fråga\"\n\n#: /public/include/chat.js\nmsgid \"Open in a new tab\"\nmsgstr \"Öppna i ett nytt fönster\"\n\n#: /public/include/chat.js\nmsgid \"Open in current tab (replacing template)\"\nmsgstr \"Öppna i nuvarande fönster (byter ut nuvarande template)\"\n\n#: /public/include/chat.js\nmsgid \"Jump to coordinates without replacing template\"\nmsgstr \"Hoppa till koordinaterna utan att byta template\"\n\n#: /public/include/chat.js\nmsgid \"Please upload your template image to a third-party image host.\"\nmsgstr \"Snälla ladda up din template bild till ett tredje parti bildhemsida.\"\n\n#: /public/include/chat.js\nmsgid \"You must have at least \"\nmsgstr \"Du måste ha minst \"\n\n#: /public/include/chat.js\nmsgid \" pixels to send links.\"\nmsgstr \" pixlar för att kunna skicka länkar.\"\n\n#: /public/include/chat.js\nmsgid \"You must be logged in to chat.\"\nmsgstr \"Du måste vara inloggad för att chatta.\"\n\n#: /public/include/chat.js\nmsgid \"No Results\"\nmsgstr \"Inga resultat\"\n\n#: /public/include/chat.js\nmsgid \"Reply\"\nmsgstr \"Svara\"\n\n#: /public/include/chat.js\nmsgid \"none provided\"\nmsgstr \"inga givna\"\n\n#: /public/include/chat.js\nmsgid \"Purged by ${purge.initiator} with reason: ${reason}\"\nmsgstr \"Utrensad av ${purge.initiator} med resonemangen: ${reason}\"\n\n#: /public/include/chat.js\nmsgid \"External Link\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"This link is taking you to the following website:\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"The operators of this website have no responsibility or control over the contents hosted at {0}. Are you sure you want to go there?\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Note: You can disable this popup in settings.\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Visit Site\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"template:\"\nmsgstr \"template:\"\n\n#: /public/include/chat.js\nmsgid \"Open Failed\"\nmsgstr \"Öppning Misslyckad\"\n\n#: /public/include/chat.js\nmsgid \"Failed to automatically open in a new tab\"\nmsgstr \"Misslyckade att automatiskt öppna i nytt fönster\"\n\n#: /public/include/chat.js\nmsgid \"Click here to open in a new tab instead\"\nmsgstr \"Tryck här för att öppna i ett nytt fönster istället\"\n\n#: /public/include/chat.js\nmsgid \"Open Template\"\nmsgstr \"Öppna Template\"\n\n#: /public/include/chat.js\nmsgid \"This link will overwrite your current template. What would you like to do?\"\nmsgstr \"Denna länk kommer att överskriva din nuvarande template. Vad skulle du vilja göra?\"\n\n#: /public/include/chat.js\nmsgid \"Note: You can set a default action in the settings menu which bypasses this popup completely.\"\nmsgstr \"Notera: Du kan ställa in en standard aktion i inställningsmenyn vilket ignorerar denna popup helt.\"\n\n#: /public/include/chat.js\nmsgid \"OK\"\nmsgstr \"OK\"\n\n#: /public/include/chat.js /public/include/lookup.js\nmsgid \"Report\"\nmsgstr \"Reportera\"\n\n#: /public/include/chat.js\nmsgid \"Mention\"\nmsgstr \"Nämn\"\n\n#: /public/include/chat.js\nmsgid \"Ignore\"\nmsgstr \"Ignorera\"\n\n#: /public/include/chat.js\nmsgid \"Chat (un)ban\"\nmsgstr \"Chatt (ta bort)bannlys\"\n\n#: /public/include/chat.js\nmsgid \"Purge User\"\nmsgstr \"Utrensa Användare\"\n\n#: /public/include/chat.js\nmsgid \"Mod Lookup\"\nmsgstr \"Moderator Uppslagningar\"\n\n#: /public/include/chat.js\nmsgid \"Chat Lookup\"\nmsgstr \"Chatt Uppslagningar\"\n\n#: /public/include/chat.js\nmsgid \"Enter a reason for your report\"\nmsgstr \"Skriv in en anledning till din report\"\n\n#: /public/include/chat.js\nmsgid \"You are reporting a chat message from ${reportTarget} with the content:\"\nmsgstr \"Du raporterar ett chatt medellande från ${reportTarget} med innehållet:\"\n\n#: /public/include/chat.js /public/include/lookup.js\nmsgid \"Sent report!\"\nmsgstr \"Skickade raport!\"\n\n#: /public/include/chat.js /public/include/lookup.js\nmsgid \"Error sending report.\"\nmsgstr \"Ett fel uppstod med skickandet av reporten.\"\n\n#: /public/include/chat.js\nmsgid \"Report User\"\nmsgstr \"Reportera användare\"\n\n#: /public/include/chat.js\nmsgid \"User ignored. You can unignore from chat settings.\"\nmsgstr \"Användare ignorerad. Du kan ändra detta i chatt inställningarna.\"\n\n#: /public/include/chat.js\nmsgid \"Failed to ignore user. Either they\\\\'re already ignored, or an error occurred. If the problem persists, contact a developer.\"\nmsgstr \"Misslyckade att ignorera användare. Antingen är dom redan ignorerade, eller ett fel uppstod. Om problemet fortsätter, kontakta en utvecklare.\"\n\n#: /public/include/chat.js\nmsgid \"Permanent\"\nmsgstr \"Permanent\"\n\n#: /public/include/chat.js\nmsgid \"Temporary\"\nmsgstr \"Temporär\"\n\n#: /public/include/chat.js\nmsgid \"Rule 3: Spam\"\nmsgstr \"Regel 3: Spam\"\n\n#: /public/include/chat.js\nmsgid \"Rule 1: Chat civility\"\nmsgstr \"Regel 1: Chatt civilitet\"\n\n#: /public/include/chat.js\nmsgid \"Rule 2: Hate Speech\"\nmsgstr \"Regel 2: Hatspråk\"\n\n#: /public/include/chat.js\nmsgid \"Rule 5: NSFW\"\nmsgstr \"Regel 5: NSFW\"\n\n#: /public/include/chat.js\nmsgid \"Custom\"\nmsgstr \"Valfri\"\n\n#: /public/include/chat.js\nmsgid \"Banning:\"\nmsgstr \"Bannlysning:\"\n\n#: /public/include/chat.js\nmsgid \"Message:\"\nmsgstr \"Meddelande:\"\n\n#: /public/include/chat.js\nmsgid \"Ban Length\"\nmsgstr \"Bannlysnings Längd\"\n\n#: /public/include/chat.js\nmsgid \"Reason\"\nmsgstr \"Anledning\"\n\n#: /public/include/chat.js\nmsgid \"Purge Messages\"\nmsgstr \"Rensa Meddelanden\"\n\n#: /public/include/chat.js\nmsgid \"Purging all messages is disabled during snip mode\"\nmsgstr \"Rensning av alla meddelanden är avaktiverat under -snip- läge\"\n\n#: /public/include/chat.js\nmsgid \"Silent (no purge message)\"\nmsgstr \"Tyst (inget rensnings meddelande)\"\n\n#: /public/include/chat.js\nmsgid \"Custom reason\"\nmsgstr \"Valfri anledning\"\n\n#: /public/include/chat.js\nmsgid \"Additional information:\"\nmsgstr \"Ytterligare information:\"\n\n#: /public/include/chat.js\nmsgid \"Chatban initiated\"\nmsgstr \"Chatt bannlysning påbörjad\"\n\n#: /public/include/chat.js\nmsgid \"Error occurred while chatbanning\"\nmsgstr \"Ett fel uppstod under chatt bannlyssning\"\n\n#: /public/include/chat.js\nmsgid \"Chatban\"\nmsgstr \"Chatt bannlysning\"\n\n#: /public/include/chat.js\nmsgid \"Failed to delete\"\nmsgstr \"Misslyckades att ta bort\"\n\n#: /public/include/chat.js\nmsgid \"ID: \"\nmsgstr \"ID: \"\n\n#: /public/include/chat.js\nmsgid \"User: \"\nmsgstr \"Användare: \"\n\n#: /public/include/chat.js\nmsgid \"Message: \"\nmsgstr \"Meddelande: \"\n\n#: /public/include/chat.js\nmsgid \"Reason: \"\nmsgstr \"Anledning: \"\n\n#: /public/include/chat.js\nmsgid \"Delete Message\"\nmsgstr \"Ta Bort Meddelande\"\n\n#: /public/include/chat.js\nmsgid \"Purge\"\nmsgstr \"Rensa\"\n\n#: /public/include/chat.js\nmsgid \"Selected Message\"\nmsgstr \"Valt Meddelande\"\n\n#: /public/include/chat.js\nmsgid \"Purge Reason\"\nmsgstr \"Rensnings Anledning\"\n\n#: /public/include/chat.js\nmsgid \"User purged\"\nmsgstr \"Användare rensad\"\n\n#: /public/include/chat.js\nmsgid \"Error sending purge.\"\nmsgstr \"Ett fel uppstod med genomförningen av rensandet.\"\n\n#: /public/include/chat.js\nmsgid \"Toggle Rename Request\"\nmsgstr \"Växla Omdöpnings Begäran\"\n\n#: /public/include/chat.js\nmsgid \"Select one of the options below to set the current rename request state.\"\nmsgstr \"Välj någon av alternativen under för att ställa in nuvarande omdöpnings begärande status.\"\n\n#: /public/include/chat.js\nmsgid \"Rename request updated\"\nmsgstr \"Namnbyte begäran updaterad\"\n\n#: /public/include/chat.js\nmsgid \"An unknown error occurred. Please contact a developer\"\nmsgstr \"Ett okänt fel uppstod. Snälla kontakta en utvecklare\"\n\n#: /public/include/chat.js\nmsgid \"New Name: \"\nmsgstr \"Nytt Namn: \"\n\n#: /public/include/chat.js\nmsgid \"Enter the new name for the user below. Please note that if you\\\\'re trying to change the caps, you\\\\'ll have to rename to something else first.\"\nmsgstr \"Skriv in det nya namnet för användaren nedan. Snälla notera att om du försöker byta stora bokstäver eller små bokstäver, så måste du byta namnet till något annat först.\"\n\n#: /public/include/chat.js\nmsgid \"User renamed\"\nmsgstr \"Användarsnamn bytt\"\n\n#: /public/include/chat.js\nmsgid \"Force Rename\"\nmsgstr \"Tvång namnbytelse\"\n\n#: /public/include/chat.js\nmsgid \"You cannot use chat while canvas banned.\"\nmsgstr \"Du kan inte använda chatten medans du är kanvas bannlyst.\"\n\n#: /public/include/lookup.js\nmsgid \"Sending...\"\nmsgstr \"Skickar...\"\n\n#: /public/include/lookup.js\nmsgid \"additional information:\"\nmsgstr \"ytterligare information:\"\n\n#: /public/include/lookup.js\nmsgid \"Report Pixel\"\nmsgstr \"Reportera Pixel\"\n\n#: /public/include/lookup.js\nmsgid \"This pixel is background (was not placed by a user).\"\nmsgstr \"Den här pixel är background (inte placerad av en användare).\"\n\n#: /public/include/lookup.js\nmsgid \"Hide sensitive information\"\nmsgstr \"Göm sensitive information\"\n\n#: /public/include/lookup.js\nmsgid \"Move Template Here\"\nmsgstr \"Flytta Template\"\n\n#: /public/include/lookup.js\nmsgid \"An error occurred, either you aren't logged in or you may be attempting to look up users too fast. Please try again in 60 seconds\"\nmsgstr \"Ett fel uppstod, antingen är du inte inloggad eller så försöker du kolla upp användare för snabbt. Snälla försök igen om 60 sekunder\"\n\n#: /public/include/lookup.js\nmsgid \"Coords\"\nmsgstr \"Koordinater\"\n\n#: /public/include/lookup.js\nmsgid \"View Profile\"\nmsgstr \"Visa Profil\"\n\n#: /public/include/lookup.js\nmsgid \"Origin\"\nmsgstr \"Ursprung\"\n\n#: /public/include/lookup.js\nmsgid \"Part of a nuke\"\nmsgstr \"Del av mass-bannlyssning\"\n\n#: /public/include/lookup.js\nmsgid \"Placed by a staff member using placement overrides\"\nmsgstr \"Placerad av pxls moderatorer genom placering överskridande\"\n\n#: /public/include/lookup.js\nmsgid \"Time\"\nmsgstr \"Tid\"\n\n#: /public/include/lookup.js\nmsgid \"just now\"\nmsgstr \"just nu\"\n\n#: /public/include/lookup.js\nmsgid \"${hoursStr}:${minuteStr}:${secsStr} ago\"\nmsgstr \"${hoursStr}:${minuteStr}:${secsStr} sen\"\n\n#: /public/include/lookup.js\nmsgid \"Discord\"\nmsgstr \"Discord\"\n\n#: /public/include/notifications.js\nmsgid \"Posted by ${notification.who}\"\nmsgstr \"Utlagd av ${notification.who}\"\n\n#: /public/include/notifications.js\nmsgid \"Expires ${expiry}\"\nmsgstr \"Går ut ${expiry}\"\n\n#: /public/include/template.js\nmsgid \"There was an error getting the image\"\nmsgstr \"Det uppstod ett fel vid erhållandet av bilden\"\n\n#: /public/include/timer.js\nmsgid \"Your next pixel will be available in ${delay} seconds!\"\nmsgstr \"Din nästa pixel kommer att vara tillgänglig inom ${delay} sekunder!\"\n\n#: /public/include/timer.js\nmsgid \"Your next pixel has been available for ${alertDelay} seconds!\"\nmsgstr \"Din nästa pixel har varit tillgänglig för ${alertDelay} sekunder!\"\n\n#: /public/include/timer.js\nmsgid \"Your next pixel is available!\"\nmsgstr \"Din nästa pixel är tillgänglig!\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Dark\"\nmsgstr \"Mörk\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Darker\"\nmsgstr \"Mörkare\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Blue\"\nmsgstr \"Blå\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Purple\"\nmsgstr \"Lila\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Green\"\nmsgstr \"Grön\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Matte\"\nmsgstr \"Matt\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Terminal\"\nmsgstr \"Terminal\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Red\"\nmsgstr \"Röd\"\n\n#: /public/include/uiHelper.js\nmsgid \"A new ${type} report has been received.\"\nmsgstr \"En ny ${type} har blivit mottagen.\"\n\n#: /public/include/uiHelper.js\nmsgid \"Cannot fetch local files. Use the file selector in template settings.\"\nmsgstr \"Kan inte nå lokala filer. Använd fil väljaren i template inställningarna.\"\n\n#: /public/include/uiHelper.js\nmsgid \"Redirect Warning\"\nmsgstr \"Förflyttnings varning\"\n\n#: /public/include/uiHelper.js\nmsgid \"Are you sure you want to redirect to the following URL?\"\nmsgstr \"Är du säker på att du vill följa länken?\"\n\n#: /public/include/uiHelper.js\nmsgid \"Drag and dropped file must be a valid image.\"\nmsgstr \"Indragen fil måste vara en giltig bild.\"\n\n#: /public/include/uiHelper.js\nmsgid \"Discord name updated successfully\"\nmsgstr \"Discord namn uppdatering lyckades\"\n\n#: /public/include/uiHelper.js\nmsgid \"Couldn\\\\'t change discord name: \"\nmsgstr \"Kan inte ändra discord namn: \"\n\n#: /public/include/user.js\nmsgid \"By logging in or registering, you agree to the <a href=\\\"{0}\\\" target=\\\"_blank\\\">terms of use</a> and <a href=\\\"{1}\\\" target=\\\"_blank\\\">privacy policy</a>.\"\nmsgstr \"Genom att du loggar in eller registrerar dig, så godkänner du <a href=\\\"{0}\\\">användarvillkoren</a> och <a href=\\\"{1}\\\">integritetspolicyn</a>\"\n\n#: /public/include/user.js\nmsgid \"Sign in with {0}\"\nmsgstr \"Logga in med {0}\"\n\n#: /public/include/user.js\nmsgid \"New Accounts Disabled\"\nmsgstr \"Nytt Konto Avstängt\"\n\n#: /public/include/user.js\nmsgid \"online\"\nmsgstr \"online\"\n\n#: /public/include/user.js\nmsgid \"Sign Out\"\nmsgstr \"Logga ut\"\n\n#: /public/include/user.js\nmsgid \"Are you sure you want to sign out?\"\nmsgstr \"Är du säker att du vill logga ut?\"\n\n#: /public/include/user.js\nmsgid \"You are permanently banned.\"\nmsgstr \"Du är permanent bannlyst.\"\n\n#: /public/include/user.js\nmsgid \"You are temporarily banned and will not be allowed to place until ${timestamp}\"\nmsgstr \"Du är temporärt bannlyst och du är inte tillåten att placera tills ${timestamp}\"\n\n#: /public/include/user.js\nmsgid \"You can contact us using one of the links in the info menu.\"\nmsgstr \"Du kan kontakta oss genom att använda en av länkarna i info menyn.\"\n\n#: /public/include/user.js\nmsgid \"If you think this was an error, please contact us using one of the links in the info tab.\"\nmsgstr \"Om du tror att detta var ett misstag, snälla kontakta oss genom någon av länkarna i info panelen.\"\n\n#: /public/include/user.js\nmsgid \"Ban reason:\"\nmsgstr \"Bannlysnings Anledning:\"\n\n#: /public/include/user.js\nmsgid \"An unknown error occurred. Please contact staff on discord\"\nmsgstr \"Ett okänt fel uppstod. Snälla kontakta moderatorerna på discord\"\n\n#: /public/include/user.js\nmsgid \"Staff have required you to change your username, this usually means your name breaks one of our rules.\"\nmsgstr \"Moderatorerna kräver att du ändrar ditt användarnamn, detta brukar betyda att ditt namn bryter mot någon av våra regler.\"\n\n#: /public/include/user.js\nmsgid \"If you disagree, please contact us on Discord (link in the info panel).\"\nmsgstr \"Om du inte håller med, snälla kontakta oss på Discord (länk finns i info panelen).\"\n\n#: /public/include/user.js\nmsgid \"New Username:\"\nmsgstr \"Nytt Användarnamn:\"\n\n#: /public/include/user.js\nmsgid \"Not now\"\nmsgstr \"Inte nu\"\n\n#: /public/include/user.js\nmsgid \"Change\"\nmsgstr \"Ändra\"\n\n#: /public/include/user.js\nmsgid \"You must change your username.\"\nmsgstr \"Du måste ändra ditt användarnamn.\"\n\n#: /public/include/user.js\nmsgid \"Click here to continue.\"\nmsgstr \"Klicka här för att fortsätta.\"\n\n#: /public/pxls.js\nmsgid \"Alert\"\nmsgstr \"Alert\"\n\n#~ msgid \"Subreddit\"\n#~ msgstr \"Subreddit\"\n\n#~ msgid \"GitHub\"\n#~ msgstr \"GitHub\"\n\n#~ msgid \"You are not signed in.&nbsp;<a href=\\\"#\\\">Sign in with...</a>\"\n#~ msgstr \"Du är inte inloggad. &nbsp;<a href=\\\"#\\\">Logga in med...</a>\"\n";

const locale_sv_46ts_01ec50e1 = () => poToMessages(source$2);

const source$1 = "msgid \"\"\nmsgstr \"\"\n\"Project-Id-Version: Pxls\\n\"\n\"POT-Creation-Date: 2024-09-07T20:41:44.977Z\\n\"\n\"Language: fi\\n\"\n\"Content-Type: text/plain; charset=UTF-8\\n\"\n\n#: /views/error.handlebars /views/profile.handlebars /public/include/user.js\nmsgid \"My Profile\"\nmsgstr \"Profiilini\"\n\n#: /views/error.handlebars /views/profile.handlebars\nmsgid \"My Factions\"\nmsgstr \"Ryhmäni\"\n\n#. HTTP status code name\n#: /views/error.handlebars\nmsgid \"Not Found\"\nmsgstr \"Ei löydetty\"\n\n#: /views/error.handlebars\nmsgid \"The content you requested could not be found at this URL. If you believe this is an error, please contact a developer.\"\nmsgstr \"Sisältö jota yrität saada ei löytynyt tästä URL osoitteesta. Jos uskot tämän olevan virhe, ota yhteyttä kehittäjään.\"\n\n#. links to the homepage (the app itself)\n#: /views/error.handlebars\nmsgid \"Back to Pxls\"\nmsgstr \"Palaa Pxlsiin\"\n\n#. HTTP status code name\n#: /views/error.handlebars\nmsgid \"Not Authenticated\"\nmsgstr \"Ei Vahvistettu\"\n\n#: /views/error.handlebars\nmsgid \"You must be logged in to access this data. Please go back to pxls and go through the authentication process.\"\nmsgstr \"Sinun täytyy olla kirjautunut sisään pystyäksesi näkemään tämän datan. Ole hyvä ja palaa pxlsiin käydäksesi läpi kirjautumisprosessin.\"\n\n#. HTTP status code name\n#: /views/error.handlebars\nmsgid \"Not Allowed\"\nmsgstr \"Ei Lupaa\"\n\n#: /views/error.handlebars\nmsgid \"The action you attempted to perform is not allowed or resulted in an error. Please ensure you have access to the endpoint and try again later.\"\nmsgstr \"Toiminto jonka yritit suorittaa ei ole sallittu tai johti virheeseen. Varmista että päätepiste on käytettävissäsi ja yritä uudelleen.\"\n\n#: /views/index.handlebars\nmsgid \"Place pixels with people to create art\"\nmsgstr \"Aseta pikseleitä muiden kanssa luodaksesi taidetta\"\n\n#: /views/index.handlebars\nmsgid \"Lost connection to server, reconnecting...\"\nmsgstr \"Yhteys palvelimeen katkesi, yhdistetään uudelleen...\"\n\n#: /views/index.handlebars\nmsgid \"Loading Heatmap (press <kbd>H</kbd> to cancel)\"\nmsgstr \"Ladataan lämpökarttaa (paina <kbd>H</kbd> peruaksesi)\"\n\n#: /views/index.handlebars\nmsgid \"Loading Virginmap (press <kbd>X</kbd> to cancel)\"\nmsgstr \"Ladataan neitsytkarttaa (paina <kbd>X</kbd> peruaksesi)\"\n\n#: /views/index.handlebars\nmsgid \"Logout\"\nmsgstr \"Kirjaudu ulos\"\n\n#: /views/index.handlebars\nmsgid \"Canvas:\"\nmsgstr \"Kanvas:\"\n\n#: /views/index.handlebars\nmsgid \"N/A\"\nmsgstr \"N/A\"\n\n#: /views/index.handlebars\nmsgid \"All Time:\"\nmsgstr \"Kaikki:\"\n\n#: /views/index.handlebars\nmsgid \"Loading online user count&hellip;\"\nmsgstr \"Ladataan actiivisten käyttäjien lukumäärää&hellip;\"\n\n#: /views/index.handlebars /public/admin/admin.js /public/include/lookup.js\nmsgid \"Pixels\"\nmsgstr \"Pixeliä\"\n\n#: /views/index.handlebars\nmsgid \"Undo\"\nmsgstr \"Peruuta\"\n\n#: /views/index.handlebars\nmsgid \"You are not signed in.\"\nmsgstr \"Et ole kirjautunut sisään.\"\n\n#: /views/index.handlebars /public/include/user.js\nmsgid \"Sign in with...\"\nmsgstr \"Kirjaudu sisään käyttäen...\"\n\n#: /views/index.handlebars\nmsgid \"Loading...\"\nmsgstr \"Ladataan...\"\n\n#: /views/index.handlebars\nmsgid \"Sign up\"\nmsgstr \"Rekisteröidy\"\n\n#: /views/index.handlebars\nmsgid \"Pick a username\"\nmsgstr \"Valitse käyttäjänimi\"\n\n#: /views/index.handlebars\nmsgid \"Username:\"\nmsgstr \"Käyttäjänimi:\"\n\n#: /views/index.handlebars\nmsgid \"Discord Tag (Optional):\"\nmsgstr \"Discord Tagi (Vapaaehtoinen):\"\n\n#: /views/index.handlebars\nmsgid \"Drag and drop template image\"\nmsgstr \"Vedä ja pudota mallikuva\"\n\n#: /views/index.handlebars\nmsgid \"Exit\"\nmsgstr \"Poistu\"\n\n#: /views/index.handlebars /views/profile.handlebars\nmsgid \"Info\"\nmsgstr \"Tietoja\"\n\n#: /views/index.handlebars\nmsgid \"Close Panel\"\nmsgstr \"Sulje Paneeli\"\n\n#: /views/index.handlebars /public/include/chat.js\nmsgid \"Chat\"\nmsgstr \"Chatti\"\n\n#: /views/index.handlebars\nmsgid \"Pings\"\nmsgstr \"Pingit\"\n\n#: /views/index.handlebars\nmsgid \"Settings\"\nmsgstr \"Asetukset\"\n\n#: /views/index.handlebars\nmsgid \"Jump To Bottom\"\nmsgstr \"Siirry pohjalle\"\n\n#: /views/index.handlebars\nmsgid \"Replying to\"\nmsgstr \"Vastataan käyttäjälle\"\n\n#: /views/index.handlebars /public/include/chat.js\nmsgid \"On\"\nmsgstr \"Päällä\"\n\n#: /views/index.handlebars\nmsgid \"Emoji\"\nmsgstr \"Emoji\"\n\n#: /views/index.handlebars\nmsgid \"Search\"\nmsgstr \"Etsi\"\n\n#: /views/index.handlebars\nmsgid \"keybinds;keys;keyboard;hotkeys\"\nmsgstr \"näppäinsidokset;näppäimet;näppäimistö;pikanäppäimet\"\n\n#: /views/index.handlebars\nmsgid \"Keybinds\"\nmsgstr \"Näppäinsidokset\"\n\n#: /views/index.handlebars\nmsgid \"general\"\nmsgstr \"yleiset\"\n\n#: /views/index.handlebars\nmsgid \"General\"\nmsgstr \"Yleiset\"\n\n#: /views/index.handlebars\nmsgid \"move;moving;panning;drag\"\nmsgstr \"liiku;liikkuminen;siirtäminen;vedä\"\n\n#: /views/index.handlebars\nmsgid \"Mouse/arrows/wasd to pan\"\nmsgstr \"Hiiri/nuolet/wasd siirtyäksesi\"\n\n#: /views/index.handlebars\nmsgid \"mousewheel;zooming\"\nmsgstr \"hiiren rulla;zoomaaminen\"\n\n#: /views/index.handlebars\nmsgid \"Scroll/pinch to zoom\"\nmsgstr \"Rullaa/nipistä zoomataksesi\"\n\n#: /views/index.handlebars\nmsgid \"scroll;zooming\"\nmsgstr \"rullaa;zoomaaminen\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>+</kbd>/<kbd>-</kbd> or <kbd>Q</kbd>/<kbd>E</kbd> to zoom\"\nmsgstr \"<kbd>+</kbd>/<kbd>-</kbd> tai <kbd>Q</kbd>/<kbd>E</kbd> zoomataksesi\"\n\n#: /views/index.handlebars\nmsgid \"lookups\"\nmsgstr \"tarkastelut\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>Shift</kbd> + Click/Hold touch to lookup pixel\"\nmsgstr \"<kbd>Shift</kbd> + Click/Pidä kosketusta pohjassa tarkastellaksesi pixeliä\"\n\n#: /views/index.handlebars\nmsgid \"overlays;alignment;grid hidden;grid shown;hide grid;show grid\"\nmsgstr \"näkymät;linjaus;ruudukko piilotettu;ruudukko näytetty;piilota ruudukko;näytä ruudukko\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>G</kbd> to toggle grid\"\nmsgstr \"<kbd>G</kbd> kytkeäksesi ruudukon\"\n\n#: /views/index.handlebars\nmsgid \"close;information shown;information hidden;info shown;info hidden;hide information;show information\"\nmsgstr \"sulje;tiedot näytetty;tiedot piilotetty;tieto näytetty;tieto piilotetty;piilota tiedot;näytä tiedot\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>I</kbd> to open info\"\nmsgstr \"<kbd>I</kbd> avataksesi tiedot\"\n\n#: /views/index.handlebars\nmsgid \"close;settings hidden;settings shown;hide settings;show settings\"\nmsgstr \"sulje;asetukset piilotettu;asetukset näytetty;piilota asetukset;näytä asetukset\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>T</kbd> to open settings\"\nmsgstr \"<kbd>T</kbd> avataksesi asetukset\"\n\n#: /views/index.handlebars\nmsgid \"close;chat hidden;chat shown;hide chat;show chat\"\nmsgstr \"sulje;chatti piilotetty;chatti näytetty;piilota chatti;näytä chatti\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>B</kbd> to open chat\"\nmsgstr \"<kbd>B</kbd> avataksesi chatin\"\n\n#: /views/index.handlebars\nmsgid \"canvas locked;move;moving;zoom;zooming\"\nmsgstr \"kanvas lukittu;liiku;liikkuminen;zoom;zoomaaminen\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>L</kbd> to toggle locking panning of the canvas\"\nmsgstr \"<kbd>L</kbd> kytkeäksesi kanvasin siirtämisen\"\n\n#: /views/index.handlebars\nmsgid \"take screenshot;image;download;picture;canvas\"\nmsgstr \"ota kuvankaappaus;kuva;lataa;kuva;kanvas\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>P</kbd> to take a snapshot\"\nmsgstr \"<kbd>P</kbd> ottaaksesi kaappauksen\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels placed pixels;heatmap hidden;heatmap shown;hide heatmap;show heatmap\"\nmsgstr \"näkymät;käyttäjän aktiviteetti;pikseleitä asetettuja pixeleitä;lämpökartta piilotettu;lämpökartta näytetty;piilota lämpökartta;näytä lämpökartta\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>H</kbd> to toggle heatmap\"\nmsgstr \"<kbd>H</kbd> kytkeäksesi lämpokartan\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels unplaced pixels;virginmap hidden;virginmap shown;hide virginmap;show virginmap\"\nmsgstr \"näkymät;käyttäjän aktiviteetti;pikseleitä asettamattomia pikseleitä;neitsytkartta piilotettu;neitsytkartta näytetty;piilota neitsytkartta;näytä neitsytkartta\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>X</kbd> to toggle virginmap\"\nmsgstr \"<kbd>X</kbd> kytkeäksesi neitsytkartan\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels placed pixels;wipe;clean;\"\nmsgstr \"näkymät;käyttäjän aktiviteetti;pikseleitä asetettuja pixeleitä;pyyhi;puhdista;\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>O</kbd> to clear heatmap\"\nmsgstr \"<kbd>O</kbd> tyhjentääksesi lämpökartan\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels unplaced pixels;wipe;clean;\"\nmsgstr \"näkymät;käyttäjän aktiviteetti;pikseleitä asettamattomia pikseleitä;pyyhi;puhdista;\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>U</kbd> to clear virginmap\"\nmsgstr \"<kbd>U</kbd> tyhjentääksesi neitsytkartan\"\n\n#: /views/index.handlebars\nmsgid \"next color;previous color\"\nmsgstr \"seuraava väri;edellinen väri\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>J</kbd>/<kbd>K</kbd> to cycle through palette colors\"\nmsgstr \"<kbd>J</kbd>/<kbd>K</kbd> käydäksesi läpi paletin värit\"\n\n#: /views/index.handlebars\nmsgid \"current coordinates;coords\"\nmsgstr \"nykyiset koordinaatit;koordinaatit\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>C</kbd> to copy link of moused-over coordinates\"\nmsgstr \"<kbd>C</kbd> kopioidaksesi linkki hiiren osoittamiin koordinaatteihin\"\n\n#: /views/index.handlebars\nmsgid \"cancel selection\"\nmsgstr \"peruuta valinta\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>ESC</kbd> to deselect current pixel\"\nmsgstr \"<kbd>ESC</kbd> postaaksesi nykyinen pikselivalinta\"\n\n#: /views/index.handlebars\nmsgid \"recenter;jump;center on template;guides;focus\"\nmsgstr \"uudelleenkeskitä;siirry;keskitä malliin;ohjeet;keskitys\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>R</kbd> to center the board on the current template\"\nmsgstr \"<kbd>R</kbd> keskittääksesi näkymän nykyiseen malliin\"\n\n#: /views/index.handlebars\nmsgid \"templates;guides\"\nmsgstr \"mallit;ohjeet\"\n\n#: /views/index.handlebars\nmsgid \"Template\"\nmsgstr \"Malli\"\n\n#: /views/index.handlebars\nmsgid \"transparency\"\nmsgstr \"läpinäkyvyys\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>Page Up</kbd> to increase opacity\"\nmsgstr \"<kbd>Page Up</kbd> lisätäksesi opasiteettiä\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>Page Down</kbd> to decrease opacity\"\nmsgstr \"<kbd>Page Down</kbd> vähentääksesi opasiteettiä\"\n\n#: /views/index.handlebars\nmsgid \"hidden;shown;hide;show\"\nmsgstr \"piilotettu;näytetty;piilota;näytetty\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>V</kbd> to toggle visibility\"\nmsgstr \"<kbd>V</kbd> kytkeäksesi näkyvyyden\"\n\n#: /views/index.handlebars\nmsgid \"Note: These values are based on QWERTY keyboards. For other layouts, use the keys corresponding to the same position on a QWERTY keyboard.\"\nmsgstr \"Huom: Nämä arvot perustuvat QWERTY näppäimistöasetteluun. Muilla asetteluilla käytä QWERTY näppimiston sijainteja vastaavissa sijainneissa olevia näppäimiä.\"\n\n#: /views/index.handlebars\nmsgid \"templates;overlays;guides\"\nmsgstr \"mallit;näkymät;ohjeet\"\n\n#: /views/index.handlebars\nmsgid \"templates;overlays;image;pixel art\"\nmsgstr \"mallit;näkymät;kuva;pikselitaide\"\n\n#: /views/index.handlebars\nmsgid \"template enabled;template disabled;show template;hide template;template shown;template hidden\"\nmsgstr \"malli käytössä;malli possa käytöstä;näytä malli;piilota malli;malli näytetty;malli piilotettu\"\n\n#: /views/index.handlebars\nmsgid \"Use template\"\nmsgstr \"Käytä mallia\"\n\n#: /views/index.handlebars\nmsgid \"Hold down <kbd>Ctrl</kbd> (or <kbd>Option</kbd> on mac) to drag the template around\"\nmsgstr \"Pidä <kbd>Ctrl</kbd> (tai <kbd>Option</kbd> macillä) siirtääksesi mallia\"\n\n#: /views/index.handlebars\nmsgid \"template title;template name;tab name;tab title;title=\"\nmsgstr \"mallin otsikko;mallin nimi;välilehden nimi;välilehden otsikko;title=\"\n\n#: /views/index.handlebars\nmsgid \"Title:\"\nmsgstr \"Otsikko:\"\n\n#: /views/index.handlebars\nmsgid \"template location source;template source URL;template URL;template=\"\nmsgstr \"mallin sijainnin lähde;mallin lähde URL;mallin URL;template=\"\n\n#: /views/index.handlebars\nmsgid \"URL:\"\nmsgstr \"URL:\"\n\n#: /views/index.handlebars\nmsgid \"template position;template x;template y;template location; template vertical; template horizontal;ox=;oy=\"\nmsgstr \"mallin sijainti;mallin x;mallin y;mallin sijainti; malling pystysuunta; mallin vaakasuunta;ox=;oy=\"\n\n#: /views/index.handlebars\nmsgid \"Horizontal position:\"\nmsgstr \"Vaakassuntainen sijainti:\"\n\n#: /views/index.handlebars\nmsgid \"Vertical position:\"\nmsgstr \"Pystysuuntainen sijainti:\"\n\n#: /views/index.handlebars\nmsgid \"template width;tw=\"\nmsgstr \"mallin leveys;tw=\"\n\n#: /views/index.handlebars\nmsgid \"Width:\"\nmsgstr \"Leveys:\"\n\n#: /views/index.handlebars\nmsgid \"Reset\"\nmsgstr \"Palauta\"\n\n#: /views/index.handlebars\nmsgid \"template style;custom template\"\nmsgstr \"mallin tyyli;oma malli;muokatty malli\"\n\n#: /views/index.handlebars\nmsgid \"Style:\"\nmsgstr \"Tyyli:\"\n\n#: /views/index.handlebars\nmsgid \"Use Source Style\"\nmsgstr \"Keytä lähteen tyyliä\"\n\n#: /views/index.handlebars\nmsgid \"1-to-1\"\nmsgstr \"yksi-yhteen\"\n\n#: /views/index.handlebars\nmsgid \"1-to-1 (keep incorrect colors)\"\nmsgstr \"yksi-yhteen (pidä virheelliset värit)\"\n\n#: /views/index.handlebars\nmsgid \"Dotted (Small, 1:2)\"\nmsgstr \"Pisteet (Pieni, 1:2)\"\n\n#: /views/index.handlebars\nmsgid \"Dotted (Big, 2:2)\"\nmsgstr \"Pisteet (Suuri, 2:2)\"\n\n#: /views/index.handlebars\nmsgid \"Symbols\"\nmsgstr \"Symbolit\"\n\n#: /views/index.handlebars\nmsgid \"Numbers\"\nmsgstr \"Numerot\"\n\n#: /views/index.handlebars\nmsgid \"Custom…\"\nmsgstr \"Muokattu…\"\n\n#: /views/index.handlebars\nmsgid \"template style source;template style URL;custom style URL;custom template\"\nmsgstr \"mallin tyyli lähde;mallih tyylin URL;muokatun tyylin URL;muokattu malli\"\n\n#: /views/index.handlebars\nmsgid \"Custom style URL:\"\nmsgstr \"Muokatun tyylin URL:\"\n\n#: /views/index.handlebars\nmsgid \"template conversion;template palette conversion;convert to palette\"\nmsgstr \"mallin muuntaminen;mallin paletin muuntaminen;muunna palettiin\"\n\n#: /views/index.handlebars\nmsgid \"Color Conversion Mode:\"\nmsgstr \"Värinmuunnostila:\"\n\n#: /views/index.handlebars\nmsgid \"Unconverted\"\nmsgstr \"Muuttumaton\"\n\n#: /views/index.handlebars\nmsgid \"Nearest Custom\"\nmsgstr \"Lähin muokattu\"\n\n#: /views/index.handlebars\nmsgid \"template transparency;template opacity;oo=\"\nmsgstr \"mallin läpinäkyvyys;mallin opasiteetti;oo=\"\n\n#: /views/index.handlebars\nmsgid \"Opacity:\"\nmsgstr \"Opasiteetti:\"\n\n#: /views/index.handlebars\nmsgid \"ui;interface\"\nmsgstr \"ui;käyttöliittymä\"\n\n#: /views/index.handlebars\nmsgid \"UI Settings\"\nmsgstr \"UI Asetukset\"\n\n#: /views/index.handlebars\nmsgid \"language override;text\"\nmsgstr \"kielen ylikirjoitus;teksti\"\n\n#: /views/index.handlebars\nmsgid \"Language override:\"\nmsgstr \"Kielen ylikirjoitus:\"\n\n#: /views/index.handlebars\nmsgid \"Use Browser Language\"\nmsgstr \"Käytä Selaimen Kieltä\"\n\n#: /views/index.handlebars\nmsgid \"English\"\nmsgstr \"englanti\"\n\n#: /views/index.handlebars\nmsgid \"Bulgarian\"\nmsgstr \"bulgaria\"\n\n#: /views/index.handlebars\nmsgid \"French\"\nmsgstr \"ranska\"\n\n#: /views/index.handlebars\nmsgid \"German\"\nmsgstr \"saksa\"\n\n#: /views/index.handlebars\nmsgid \"Russian\"\nmsgstr \"vänäjä\"\n\n#: /views/index.handlebars\nmsgid \"Swedish\"\nmsgstr \"ruotsi\"\n\n#: /views/index.handlebars\nmsgid \"Finnish\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Toki Pona\"\nmsgstr \"Toki Pona\"\n\n#: /views/index.handlebars\nmsgid \"themes;look;stylesheets;visuals\"\nmsgstr \"teemat;ulkonäky;tyylisivut;visuaalit\"\n\n#: /views/index.handlebars\nmsgid \"Theme:\"\nmsgstr \"Teema:\"\n\n#: /views/index.handlebars\nmsgid \"Default\"\nmsgstr \"Oletus\"\n\n#: /views/index.handlebars\nmsgid \"hide reticule;hide reticle;reticule shown reticle shown;reticule hidden;reticle hidden\"\nmsgstr \"piilota ristikko;ristikko näytetty;ristikko piilotettu\"\n\n#: /views/index.handlebars\nmsgid \"Show reticule\"\nmsgstr \"Näytä ristikko\"\n\n#: /views/index.handlebars\nmsgid \"hide cursor;cursor shown;cursor hidden\"\nmsgstr \"piilota kursori;kursori näytettu;kursori piilotettu\"\n\n#: /views/index.handlebars\nmsgid \"Show cursor\"\nmsgstr \"Näytä kursori\"\n\n#: /views/index.handlebars\nmsgid \"darkness filter\"\nmsgstr \"pimeys suodatin\"\n\n#: /views/index.handlebars\nmsgid \"Enable color brightness\"\nmsgstr \"Ota värien kirkkaus käyttöön\"\n\n#: /views/index.handlebars\nmsgid \"Warning: Known to cause fuzziness in Chrome on some Mac/Linux installs\"\nmsgstr \"Varoitus: Tiedetään aiheuttavan sumuisuutta Chromessa Mac/Linux asennuksilla\"\n\n#: /views/index.handlebars\nmsgid \"Color brightness:\"\nmsgstr \"Värien kirkkaus:\"\n\n#: /views/index.handlebars\nmsgid \"keep current selected;keep curent color;place\"\nmsgstr \"pidä tällä hetkellä valittu;pidä nykyinen väri;aseta\"\n\n#: /views/index.handlebars\nmsgid \"Deselect color after placing\"\nmsgstr \"Poista värin valinta asettamisen jälkeen\"\n\n#: /views/index.handlebars\nmsgid \"mousewheel;palette scrolling\"\nmsgstr \"hiiren rulla;paletin rullaminen\"\n\n#: /views/index.handlebars\nmsgid \"Enable scrolling on the palette to switch colors\"\nmsgstr \"Ota käyttöön paletin rullaminen värien vaihtamiseksi\"\n\n#: /views/index.handlebars\nmsgid \"reverse scrolling;mousewheel;palette scrolling;enable scrolling on the palette to switch colors\"\nmsgstr \"rullaaminen takaperin;hiiren rulla;paletin rullaaminen;ota käyttöön paletin rullaminen värien vaihtamiseksi\"\n\n#: /views/index.handlebars\nmsgid \"Invert scroll direction\"\nmsgstr \"Käännä rullamisen suunta\"\n\n#: /views/index.handlebars\nmsgid \"indexed colors;palette indicies\"\nmsgstr \"indeksoidut värit;paletti-indeksit\"\n\n#: /views/index.handlebars\nmsgid \"Add numbers to palette entries\"\nmsgstr \"Lisää numerot paletin kohteisiin\"\n\n#: /views/index.handlebars\nmsgid \"scrollbar;palette scrolling\"\nmsgstr \"rullauspalkki;paletin rullaaminen\"\n\n#: /views/index.handlebars\nmsgid \"Enable thin scrollbar\"\nmsgstr \"Ota ohut rullauspalkki käyttöön\"\n\n#: /views/index.handlebars\nmsgid \"scrollbar;palette scrolling;palette stack\"\nmsgstr \"rullauspalkki;paletin rullaaminen;paletin pinoutuminen\"\n\n#: /views/index.handlebars\nmsgid \"Enable palette stacking\"\nmsgstr \"Ota paletin pinoutuminen käyttöön\"\n\n#: /views/index.handlebars\nmsgid \"floating bubble location\"\nmsgstr \"kelluvan kuplan sijainti\"\n\n#: /views/index.handlebars\nmsgid \"Bubble position:\"\nmsgstr \"Kuplan sijainti:\"\n\n#: /views/index.handlebars\nmsgid \"Top left\"\nmsgstr \"Ylävasen\"\n\n#: /views/index.handlebars\nmsgid \"Top right\"\nmsgstr \"Yläoikea\"\n\n#: /views/index.handlebars\nmsgid \"Bottom left\"\nmsgstr \"Alavasen\"\n\n#: /views/index.handlebars\nmsgid \"Bottom right\"\nmsgstr \"Alaoikea\"\n\n#: /views/index.handlebars\nmsgid \"broken;offset workaround\"\nmsgstr \"rikki;offsetin kiertotapa\"\n\n#: /views/index.handlebars\nmsgid \"Attempt to fix canvas displacement bug in Chrome 78+\"\nmsgstr \"Yritä korjata kanvasin siirtymä bugi Chrome versiossa 78+\"\n\n#: /views/index.handlebars\nmsgid \"chat;message;ping sound\"\nmsgstr \"Chatti;viesti;ping ääni\"\n\n#: /views/index.handlebars\nmsgid \"Chat Settings\"\nmsgstr \"Chatin asetukset\"\n\n#: /views/index.handlebars\nmsgid \"username;color;colour\"\nmsgstr \"käyttäjänimi;väri\"\n\n#: /views/index.handlebars\nmsgid \"Username Color:\"\nmsgstr \"Käyttäjänimen Väri:\"\n\n#: /views/index.handlebars\nmsgid \"chat message;chat ui\"\nmsgstr \"chattiviesti;chatin ui\"\n\n#: /views/index.handlebars\nmsgid \"Interface\"\nmsgstr \"käyttöliittymä\"\n\n#: /views/index.handlebars\nmsgid \"enable;disable\"\nmsgstr \"ota käyttöön;poista käytöstä\"\n\n#: /views/index.handlebars\nmsgid \"Enable chat\"\nmsgstr \"Ota chatti käyttöön\"\n\n#: /views/index.handlebars\nmsgid \"Page must be reloaded after changing\"\nmsgstr \"Sivu täytyy ladata uudestaan muuttamisen jälkeen\"\n\n#: /views/index.handlebars\nmsgid \"chat size;chat font\"\nmsgstr \"chatin koko;chatin fontti\"\n\n#: /views/index.handlebars\nmsgid \"Font Size:\"\nmsgstr \"Fontin koko:\"\n\n#: /views/index.handlebars\nmsgid \"time;timestamps\"\nmsgstr \"aika;timestampit\"\n\n#: /views/index.handlebars\nmsgid \"24 Hour Timestamps\"\nmsgstr \"24-Tunnin Timestampit\"\n\n#: /views/index.handlebars\nmsgid \"badges;pixel count;pixels placed\"\nmsgstr \"merkit;pikselien määrä;pikseleitä asetettu\"\n\n#: /views/index.handlebars\nmsgid \"Show pixel-placed badges\"\nmsgstr \"Näytä pikseleitä-asetettu merkit\"\n\n#: /views/index.handlebars\nmsgid \"badges;factions\"\nmsgstr \"merkit;ryhmät\"\n\n#: /views/index.handlebars\nmsgid \"Show faction tags\"\nmsgstr \"Näytä rymien tagit\"\n\n#: /views/index.handlebars\nmsgid \"template urls;template links;template name\"\nmsgstr \"mallien url;mallien linkit;mallin nimi\"\n\n#: /views/index.handlebars\nmsgid \"Replace template titles with URLs in chat where applicable\"\nmsgstr \"Korvaa mallien otsikot URL-osoitteilla chatissä kun mahdollista\"\n\n#: /views/index.handlebars\nmsgid \"chat orientation;chat position\"\nmsgstr \"chatin suunta;chatin sijainti\"\n\n#: /views/index.handlebars\nmsgid \"Enable horizontal chat\"\nmsgstr \"Ota käyttöön Vaakassuntainen chatti\"\n\n#: /views/index.handlebars\nmsgid \"banner;animation\"\nmsgstr \"banneri;animaatio\"\n\n#: /views/index.handlebars\nmsgid \"Enable the rotating banner under chat\"\nmsgstr \"Ota keyttöön muuttuva banneri chatin alla\"\n\n#: /views/index.handlebars\nmsgid \"max;messages;truncate\"\nmsgstr \"maksimi;viestit;katkaise\"\n\n#: /views/index.handlebars\nmsgid \"Maximum amount of chat messages:\"\nmsgstr \"Maksimimäärä chattiviestejä:\"\n\n#: /views/index.handlebars\nmsgid \"link;url;behaviour\"\nmsgstr \"linkki;url;käyttäytyminen\"\n\n#: /views/index.handlebars\nmsgid \"Default internal link action click:\"\nmsgstr \"Oletus sisäisen linkin klikkaustoiminto:\"\n\n#: /views/index.handlebars\nmsgid \"link;url;behaviour;external;bypass;skip\"\nmsgstr \"linkki;url;käyttäytyminen;ulkoinen;ohitus;ohita\"\n\n#: /views/index.handlebars\nmsgid \"Skip external link popup\"\nmsgstr \"Ohita ulkoisten linkkien popupit\"\n\n#: /views/index.handlebars\nmsgid \"Note: Has no effect if external link popups are disabled by the server.\"\nmsgstr \"Huom: Vaikutusta ei ole jos ulkoisten linkkien popupit on poistettu käytöstä palvelimella.\"\n\n#: /views/index.handlebars\nmsgid \"chat icon;chat notifications;chat ping\"\nmsgstr \"chattikuvake;chatti-ilmoitukset;chattipingi\"\n\n#: /views/index.handlebars\nmsgid \"Chat icon badge mode:\"\nmsgstr \"Chattikuvakkeen merrkitila:\"\n\n#: /views/index.handlebars\nmsgid \"Show on unread ping\"\nmsgstr \"Näytä lukemattomalla pingillä\"\n\n#: /views/index.handlebars\nmsgid \"Show on unread message\"\nmsgstr \"Näytä lukemattomalla viestillä\"\n\n#: /views/index.handlebars\nmsgid \"Never show\"\nmsgstr \"Älä näytäs\"\n\n#: /views/index.handlebars\nmsgid \"chat icon;chat notifications;chat message\"\nmsgstr \"chatin kuvake;chatin ilmoitukset;chattiviesti\"\n\n#: /views/index.handlebars\nmsgid \"Chat icon highlight mode:\"\nmsgstr \"Chattikuvakkeen highlighting tila:\"\n\n#: /views/index.handlebars\nmsgid \"ignored;ignores;unignore;blocked;blocking;unblock\"\nmsgstr \"ei huomioitu;ei huomioi;älä ole huomioimatta;estetty;estäminen;poista esto\"\n\n#: /views/index.handlebars\nmsgid \"Ignores\"\nmsgstr \"Ei huomioi\"\n\n#: /views/index.handlebars\nmsgid \"unignore;unblock\"\nmsgstr \"älä ole huomioimatta;posta esto\"\n\n#: /views/index.handlebars\nmsgid \"Unignore\"\nmsgstr \"Älä ole huomioimatta\"\n\n#: /views/index.handlebars\nmsgid \"overlays;virginmap;heatmap;grid\"\nmsgstr \"näkymät;neitsytkartta;lämpökartta;ruudukko\"\n\n#: /views/index.handlebars\nmsgid \"Overlay Settings\"\nmsgstr \"Näkymien asetukset\"\n\n#: /views/index.handlebars\nmsgid \"heatmap;heatmap opacity;clear heatmap\"\nmsgstr \"lämpökartta;lämpokartan opasiteetti;tyhjennä lämpökartta\"\n\n#: /views/index.handlebars\nmsgid \"Heatmap\"\nmsgstr \"Lämpökartta\"\n\n#: /views/index.handlebars\nmsgid \"Turn on heatmap\"\nmsgstr \"Laita lämpökartta päälle\"\n\n#: /views/index.handlebars\nmsgid \"(toggle with <kbd>H</kbd>)\"\nmsgstr \"(kytke käyttämällä <kbd>H</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"overlays;activity;pixels placed pixels;wipe;clean\"\nmsgstr \"näkymät;aktiviteetti;oikseleitä asetettuja pikseleitä;tyhjennä;puhdista\"\n\n#: /views/index.handlebars\nmsgid \"Clear heatmap\"\nmsgstr \"Tyhjennä lämpökartta\"\n\n#: /views/index.handlebars\nmsgid \"(hotkey: <kbd>O</kbd>)\"\nmsgstr \"(pikanäppäin: <kbd>O</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels placed pixels;transparency\"\nmsgstr \"näkymät;käyttäjän aktiivisuus;pikseleitä asetettuja pikseleitä;läpinäkyvyys\"\n\n#: /views/index.handlebars\nmsgid \"Heatmap background opacity:\"\nmsgstr \"Lämpökartan taustan opasiteetti:\"\n\n#: /views/index.handlebars\nmsgid \"virginmap;virginmap opacity;clear virginmap\"\nmsgstr \"neitsytkartta;neitsytkartan opasiteetti;tyhjennä neitsytkartta\"\n\n#: /views/index.handlebars\nmsgid \"Virginmap\"\nmsgstr \"Neitsytkartta\"\n\n#: /views/index.handlebars\nmsgid \"Turn on virginmap\"\nmsgstr \"Laita Neitsytkartta päälle\"\n\n#: /views/index.handlebars\nmsgid \"(toggle with <kbd>X</kbd>)\"\nmsgstr \"(kytke kyttämällä <kbd>X</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels unplaced pixels;transparency\"\nmsgstr \"näkymät;keyttäjien aktiivisuus;pikseleitä asettamattomia pikseleitä;läpinäkyvyys\"\n\n#: /views/index.handlebars\nmsgid \"Virginmap background opacity:\"\nmsgstr \"Neitsytkartan taustan opasiteetti:\"\n\n#: /views/index.handlebars\nmsgid \"overlays;activity;pixels unplaced pixels;wipe;clean\"\nmsgstr \"näkymät;aktiviteetti;pikseleitä asettamattomia pikseleitä;tyhjennä;puhdista\"\n\n#: /views/index.handlebars\nmsgid \"Clear virginmap\"\nmsgstr \"Tyhjennä neitsytkartta\"\n\n#: /views/index.handlebars\nmsgid \"(hotkey: <kbd>U</kbd>)\"\nmsgstr \"(pikanäppäin: <kbd>U</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"Layer template underneath heatmap\"\nmsgstr \"Laita malli lämpökartan taakse\"\n\n#: /views/index.handlebars\nmsgid \"grid;toggle grid\"\nmsgstr \"ruudukko;kytke ruudukko\"\n\n#: /views/index.handlebars\nmsgid \"Grid\"\nmsgstr \"Ruudukko\"\n\n#: /views/index.handlebars\nmsgid \"Turn on grid\"\nmsgstr \"Laita ruudukko päälle\"\n\n#: /views/index.handlebars\nmsgid \"(toggle with <kbd>G</kbd>)\"\nmsgstr \"(kytke käyttämällä <kbd>G</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"controls;zooming;panning;movement\"\nmsgstr \"kontrollit;zoomaaminen;siirtyminen;liike\"\n\n#: /views/index.handlebars\nmsgid \"Control Settings\"\nmsgstr \"Kontrolliasetukset\"\n\n#: /views/index.handlebars\nmsgid \"zooming;scrolling;scale;scaling\"\nmsgstr \"zoomaaminen;rullaaminen;skaala;skaalaaminen\"\n\n#: /views/index.handlebars\nmsgid \"Zooming\"\nmsgstr \"Zoomaaminen\"\n\n#: /views/index.handlebars\nmsgid \"scrolling sensitivity;zooming sensitivity;mousewheel sensitivity\"\nmsgstr \"rullaamisen herkkyys;zoomaamisen herkkyys;hiiren rullan herkkyys\"\n\n#: /views/index.handlebars\nmsgid \"Zoom sensitivity:\"\nmsgstr \"Zoomaamisen herkkkyys:\"\n\n#: /views/index.handlebars\nmsgid \"zooming limit;scrolling limit;mousewheel;zooming minimum;zooming maximum\"\nmsgstr \"zoomaamisen raja;rullaamisen raja;hiiren rulla;zoomaamisen minimi;zoomaamisen maksimi\"\n\n#: /views/index.handlebars\nmsgid \"Minimum scale:\"\nmsgstr \"Minimiskaala:\"\n\n#: /views/index.handlebars\nmsgid \"Maximum scale:\"\nmsgstr \"Maksimiskaala:\"\n\n#: /views/index.handlebars\nmsgid \"rounding;zooming;scrolling;mousewheel;integer;decimal\"\nmsgstr \"pyöristäminen;zoomaaminen;rullaaminen;hiiren rulla;kokonaisluku;desimaali\"\n\n#: /views/index.handlebars\nmsgid \"Round zoom values to nearest whole number\"\nmsgstr \"Pyöristä zoomausarvot lähimpään kokonaislukuun\"\n\n#: /views/index.handlebars\nmsgid \"controls;miscellaneous\"\nmsgstr \"kontrollit;sekalaiset\"\n\n#: /views/index.handlebars\nmsgid \"Lock the canvas (disallow canvas drag/zoom with mouse/fingers)\"\nmsgstr \"Lukitse kanvas (älä salli kanvasin vetämistä/hiirellä zoomaamista/sormia)\"\n\n#: /views/index.handlebars\nmsgid \"MMB picker;mouse picker;selection;palette picker\"\nmsgstr \"MMB valitsin;hiiren valitsin;valinta;paletin valitsin\"\n\n#: /views/index.handlebars\nmsgid \"Enable middle mouse button selecting color from board\"\nmsgstr \"Ota käyyttöön värin valitseminen kentältä hiiren keskinäppäimellä\"\n\n#: /views/index.handlebars\nmsgid \"right click action\"\nmsgstr \"oikean hiiren näppäimen toiminto\"\n\n#: /views/index.handlebars\nmsgid \"Right-click action:\"\nmsgstr \"Oikean hiiren näppäimen toiminto:\"\n\n#: /views/index.handlebars\nmsgid \"Nothing\"\nmsgstr \"Ei mitään\"\n\n#: /views/index.handlebars\nmsgid \"Clear color\"\nmsgstr \"Tyhjennä väri\"\n\n#: /views/index.handlebars\nmsgid \"Copy color\"\nmsgstr \"Kopioi väri\"\n\n#: /views/index.handlebars\nmsgid \"Lookup\"\nmsgstr \"Haku\"\n\n#: /views/index.handlebars\nmsgid \"Clear color + Lookup\"\nmsgstr \"Tyhjennnä väri + Haku\"\n\n#: /views/index.handlebars\nmsgid \"snapshots;screenshot;download;picture;canvas\"\nmsgstr \"snapshotit;kuvankaappaukset;lataa;kuva;kanvaasi\"\n\n#: /views/index.handlebars\nmsgid \"Snapshot Settings\"\nmsgstr \"Snapshottien asetukset\"\n\n#: /views/index.handlebars\nmsgid \"screenshot;snapshot;download;board;canvas\"\nmsgstr \"kuvankaappaus;snapshotti;lataa;kenttä;kanvaasi\"\n\n#: /views/index.handlebars\nmsgid \"take screenshot;image;download format;picture;canvas;board\"\nmsgstr \"ota kuvankaappaus;kuva;latausformaatti;kanvaasi;kenttä\"\n\n#: /views/index.handlebars\nmsgid \"Snapshot image format:\"\nmsgstr \"Snapshottien kuvaformaatti:\"\n\n#: /views/index.handlebars\nmsgid \"PNG\"\nmsgstr \"PNG\"\n\n#: /views/index.handlebars\nmsgid \"JPEG\"\nmsgstr \"JPEG\"\n\n#: /views/index.handlebars\nmsgid \"WEBP (Chrome only)\"\nmsgstr \"WEBP (vain Chrome)\"\n\n#: /views/index.handlebars\nmsgid \"sound;notification;alert;notify;ping\"\nmsgstr \"ääni;ilmoitus;hälytys;ilmoita;pingi\"\n\n#: /views/index.handlebars\nmsgid \"Sound and Notification Settings\"\nmsgstr \"Ääni- ja Ilmoitusasetukset\"\n\n#: /views/index.handlebars\nmsgid \"audio;mute;noise;volume\"\nmsgstr \"ääni;hiljennä;äänenvoimakkuus\"\n\n#: /views/index.handlebars\nmsgid \"Enable sound\"\nmsgstr \"Ota ääni käyttöön\"\n\n#: /views/index.handlebars\nmsgid \"notifs;notify;pixel notification\"\nmsgstr \"ilmoitukset;ilmoita;pixeli-ilmoitukset\"\n\n#: /views/index.handlebars\nmsgid \"Enable pixel available notification\"\nmsgstr \"Ota käyttöön pikseli saatavilla -ilmoitus\"\n\n#: /views/index.handlebars\nmsgid \"notification;pixel ready;alert\"\nmsgstr \"ilmoitus;piskeli valmis;hälytys\"\n\n#: /views/index.handlebars\nmsgid \"Pixel Ready Notification\"\nmsgstr \"Pikseli Valmis Ilmoitus\"\n\n#: /views/index.handlebars\nmsgid \"alert source;notify url;notify source;notification url;notification source\"\nmsgstr \"hälätyksen lähde;ilmoitus url;ilmoistuksen lähde;ilmoituksen url\"\n\n#: /views/index.handlebars\nmsgid \"Alert URL:\"\nmsgstr \"Ilmoitusäänen URL:\"\n\n#: /views/index.handlebars\nmsgid \"Update\"\nmsgstr \"Päivitä\"\n\n#: /views/index.handlebars\nmsgid \"Test\"\nmsgstr \"Testaa\"\n\n#: /views/index.handlebars\nmsgid \"sound level;audio level;mute audio;mute sound\"\nmsgstr \"äänitaso;äänen voimakkuus;mykistä äänet;mykistä ääni\"\n\n#: /views/index.handlebars\nmsgid \"Volume:\"\nmsgstr \"Äänenvoimakkuus:\"\n\n#: /views/index.handlebars\nmsgid \"alert forewarning;alert delay; notification delay; notification forewarning\"\nmsgstr \"hälytyksen esivaroitus;hälytyksen viive; ilmoituksen viive; ilmoituksen esivaroitus\"\n\n#: /views/index.handlebars\nmsgid \"Delay (seconds):\"\nmsgstr \"Viive (sekunttia):\"\n\n#: /views/index.handlebars\nmsgid \"chat mentions;chat pings;chat sound\"\nmsgstr \"chattimaininnat;chattipingit;chatin äänet\"\n\n#: /views/index.handlebars\nmsgid \"Chat Pings\"\nmsgstr \"Chattipingit\"\n\n#: /views/index.handlebars\nmsgid \"Enable pings\"\nmsgstr \"Ota pingit käyttööm\"\n\n#: /views/index.handlebars\nmsgid \"mention sound\"\nmsgstr \"mainitsemisääni\"\n\n#: /views/index.handlebars\nmsgid \"Play sound on ping:\"\nmsgstr \"Toista ääni pingille:\"\n\n#: /views/index.handlebars /public/include/chat.js\nmsgid \"Off\"\nmsgstr \"Ei käytössä\"\n\n#: /views/index.handlebars\nmsgid \"Only when necessary\"\nmsgstr \"Vain tarvittaessa\"\n\n#: /views/index.handlebars\nmsgid \"Always\"\nmsgstr \"Aina\"\n\n#: /views/index.handlebars\nmsgid \"mention sound volume\"\nmsgstr \"mainintaäänen voimakkuus\"\n\n#: /views/index.handlebars\nmsgid \"Ping sound volume:\"\nmsgstr \"Pingiäänen voimakkuus:\"\n\n#: /views/index.handlebars\nmsgid \"personal account\"\nmsgstr \"henkilökohtainen tili\"\n\n#: /views/index.handlebars\nmsgid \"Account Settings\"\nmsgstr \"Tilin Asetukset\"\n\n#: /views/index.handlebars\nmsgid \"Public Discord name:\"\nmsgstr \"Julkinen Discord nimi:\"\n\n#: /views/index.handlebars /public/include/chat.js\nmsgid \"Set\"\nmsgstr \"Aseta\"\n\n#: /views/index.handlebars\nmsgid \"Remove\"\nmsgstr \"Poista\"\n\n#: /views/index.handlebars\nmsgid \"Help\"\nmsgstr \"Ohjeet\"\n\n#: /views/index.handlebars\nmsgid \"Notifications\"\nmsgstr \"Ilmoitukset\"\n\n#: /views/partials/faq.handlebars\nmsgid \"FAQ\"\nmsgstr \"FAQ\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Why is the cooldown as long as it is?\"\nmsgstr \"Miiksi cooldown on niin pitkä kuin on?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"The time it takes to get a pixel is dynamic, and changes based on how many people are online. The cooldown time is longer when more users are online.\"\nmsgstr \"Pixelin saamiseen kuluva aika on dynaaminen ja muuttuu aktiivisena olevien käyttäjien määrän mukaan. Cooldownin aika on pidempi mitä enemmän käyttäjiä on aktiivisena.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Why does it say 0/6 pixels?\"\nmsgstr \"Mitä 0/6 pikseliä tarkoittaa?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"This means that you are waiting for your next pixel. When you place a pixel, there is a cooldown for when you can place the next one. Over time, you can gain up to 6 \\\"stacked\\\" pixels to place at once.\"\nmsgstr \"Tämä tarkoittaa, että odotat seuraavaa pikseliäsi. Pikselien asettamisella on cooldown ennen kuin voit asettaa seuraavan pikselin. Ajan kuluessa voit saada enintään 6 \\\"pinottua\\\"pikseliä jotka voit asettaa kaikki kerralla.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Why does it take so long to \\\"stack\\\" pixels?\"\nmsgstr \"Miksi pikselien \\\"pinoaminen\\\" kestää niin kauan?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"This is by design. It is better to place a pixel as soon as you get one. Pixel \\\"stacking\\\" is meant to give you a bump if you go AFK for a bit. It takes around 20-30 minutes to get a full 6/6 pixels, but it only takes around 3 minutes to place 6 pixels if you place them as soon as possible.\"\nmsgstr \"Tämä on taroituksellista. On parempi asetta pikseli heti kun saat yhden. Pikselien \\\"pinoamisen\\\" tarkoitus antaa tönäisy jos menet AFK vähäksi aikaa. Täyden 6/6 pikseliä pinon saaminen kestää noin 40 minuuttia, mutta voit asettaa 6 pikseliä vain noin 3:ssa minuutissa jos asetat ne niin pian kuin mahdollista.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I appeal a ban?\"\nmsgstr \"Kuinka valitan porttikiellosta?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Contact us on <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord</a> or send an appeal to our <a href=\\\"https://pxls.space/appeal\\\" target=\\\"_blank\\\">Google form</a> after reading the rules in the site's info panel.\"\nmsgstr \"Ota meihin yhteyttä <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discordissa</a> tai lähettä valitus <a href=\\\"https://pxls.space/appeal\\\" target=\\\"_blank\\\">Google formsissa</a> info paneelin sääntöjen lukemisen jälkeen.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I make a template?\"\nmsgstr \"Kunka teen mallin?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"A template is an image link that is posted in the template textbox in the settings panel so you can place over it on the canvas. You may use a regular image link to your pixel art, but many people use 3rd party tools like <a href=\\\"https://discord.gg/5MVDCq53vC\\\" target=\\\"blank\\\">Clueless</a> to turn pixel art into a fancier link. If you need to make pixel art yourself, you can use <a href=\\\"https://www.piskelapp.com/p/create\\\" target=\\\"_blank\\\">Piskel</a> to create art to put into Clueless.\"\nmsgstr \"Malli on kuvalinkki joka julkaistaan malli tekstikenttään asetuspaneelissa, jotta voit asettaa seen päälle kanvaasilla. Voit käyttää tavallista kuvalinkkiä pikselitaiteeseesi, mutta monet käyttävät 3. osapuolen työkaluja, kuten <a href=\\\"https://discord.gg/5MVDCq53vC\\\" target=\\\"blank\\\">Clueless</a> muuttaakseen pikselitaiteen hienompaan linkkiin. Jos sinun tarvitsee itse tehdä pikselitaidetta, voit käyttä <a href=\\\"https://www.piskelapp.com/p/create\\\" target=\\\"_blank\\\">Piskeliä</a> luodaksesi taidetta laitettavaksi Clueless:iin.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I move a template?\"\nmsgstr \"Kuinka siirrän mallia?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Hold <kbd>CTRL</kbd> (or <kbd>OPTION</kbd> on macOS) and click and drag to move it around. On mobile, you can tap and hold where you want to move the template and click \\\"Move Template Here\\\" in the pop-up.\"\nmsgstr \"Pidä <kbd>CTRL</kbd> (tai <kbd>OPTION</kbd> macOS:llä) pohjassa ja klikkaa ja vedä sitä ympräiinsä. Mobiililla voit napauttaa ja pitää pohjassa siellä minne haluat siirtää mallinn ja painaa \\\"Siirrä Malli Tänne\\\" pop-upissa.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Does the canvas reset? When?\"\nmsgstr \"Nollautuuko kanvas? Milloin?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Yes. The canvas resets when it is completely full. A reset date is not usually decided until the canvas is full, but the average canvas life-span is around 1 month. Updates are posted in our <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord server</a> when a reset date is set.\"\nmsgstr \"Kyllä. Kanvas nollautuu kun se on aivan täynnä. Nollautumispäivää ei yleensä päätetä ennen kuin kanvas on täynnä, mutta kanvaasin keskimääräinen elinikä on noin 1 kuukausi. Päivityksiä julkaistaan <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord serverillämme</a> kun Nollautumispäivä on asetettu.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Where can I see the past canvases?\"\nmsgstr \"Missä voin nähdä aikaissemmat kanvaasit?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"The past canvases are featured on our <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord server</a>, or the <a href=\\\"https://archives.pxls.space\\\" target=\\\"_blank\\\">archives</a>, which records timelapses and a lot of useful information on each canvas.\"\nmsgstr \"Aikaisemmat kanvaasit ovat esillä <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord serverillämme</a>, tai 3. osapuolen sivustolla <a href=\\\"https://pxlsfiddle.com\\\" target=\\\"_blank\\\">PxlsFiddle</a>, joka tallentaa timelapseja ja paljon hyödyllistä informaatiota jokaisesta kanvaasista.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I see who placed a pixel?\"\nmsgstr \"Kuinka näen kuka asetti pikselin?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"By shift-clicking (or tap and hold on mobile) a pixel, you can see who placed a pixel, how many pixels they have placed, and when they placed it.\"\nmsgstr \"Shift-klikkaamalla (tai napauta ja pidä pohjassa mobiililla) pikseliä, voit ähdä kuka asetti pikselin, kuinka monta pikseliä he ovat asettaneet ja milloin he asettivat sen.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I report someone?\"\nmsgstr \"Kuinka ilmiannan jonkun?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Shift-click (or tap and hold on mobile) on a pixel, and click the Report button.\"\nmsgstr \"Shift-klikkaa (tai napauta ja pidä pohjassa mobiililla) pikseliä ja paina Ilmianna painiketta.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I change the color of my name in the chat?\"\nmsgstr \"Kuinka muutan nimeni väriä chatissä?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"There is a \\\"Username Color\\\" option near the bottom of the settings panel.\"\nmsgstr \"Asetuspaneelin alaosan lähellä on \\\"Käyttäjänimen Väri\\\" asetus.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"What is a \\\"virginmap\\\"?\"\nmsgstr \"Mikä on \\\"neitsytkartta\\\"?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"The virginmap shows which pixels have not yet been placed on (or “virgin” pixels).\"\nmsgstr \"Neitsytkartta näyttää pikselit, jolle ei ole vielä asetettu (tai “neitsyyt” pikselit).\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I report bugs?\"\nmsgstr \"Kuinka raportoin bugeista?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Submit bugs to the #dev-and-bugs forum in the <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord server</a>. If you have found an exploit, please message one of the staff members privately (through DMs) or open a modmail by DMing pxls.mail#8384.\"\nmsgstr \"Lähetä bugit #dev-and-bugs -kanavalle <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord serverillä</a>.Jos olet löytänyt exploitin, ole hyvä ja lähetä viesti yhdelle henkilökuntamme jäsenistä yksityisesti (DM:ien kautta).\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I get more info or contact staff?\"\nmsgstr \"Kuinka saan lisätietoa tai otan yhteyttä henkilökuntaan?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Check the info panel (the icon on the top left) for more details and links, or join our <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord server</a>, where a staff member will gladly respond.\"\nmsgstr \"Tarkista infopaneeli (kuvake ylävasemmalla) saadaksesi lisää yksityiskohtia ja linkkejä, tai liity <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord serverillemme</a>, jossa henkilökunnan jäsenet ovat ilosia vastaamaan.\"\n\n#: /views/partials/info.handlebars\nmsgid \"Welcome!\"\nmsgstr \"Tervetuloa!\"\n\n#: /views/partials/info.handlebars\nmsgid \"Welcome to pxls.space! Pxls is a multiplayer online collaborative canvas based on Reddit's <a href=\\\"https://www.reddit.com/r/place\\\" target=\\\"_blank\\\">r/place</a> event from 2017 that allows you to create anything you can imagine, one pixel at a time. Join hundreds of other players in the Pxls community and create amazing works of art together as a team, or solo.\"\nmsgstr \"Tervetuloa pxls.space:een! Pxls on monen pelaajan yhteistyöllinen nettikanvaasi, joka perustuu Redditin <a href=\\\"https://www.reddit.com/r/place\\\" target=\\\"_blank\\\">r/place</a> -tapahtumaan vuodelta 2017. joka mahdollistaq minkä tahansi huviteltavissasi olvean luomisen pikseli kerrallaan. Liity satojen muiden pelaajien kanssa Pxls yhteisöön ja luo mahtavia taideteoksia yhdessä joukkueena, tai yksin.\"\n\n#: /views/partials/info.handlebars\nmsgid \"The best place to reach staff and fellow community is in the discord!\"\nmsgstr \"Paras paikka saavuttaa henkilökunta ja yhteisön jäseniä on Discordissa!\"\n\n#: /views/partials/info.handlebars\nmsgid \"Check out our social media pages, and please take the time to read the rules below. Have fun creating (or changing) art!\"\nmsgstr \"Käy katsomassa sosiaalisen median sivumme, ja ole hyvä ja lue säännöt alapuolella. Pidä hauskaa luodessasi (tai muuttaessasi) taidetta!\"\n\n#: /views/partials/info.handlebars\nmsgid \"Canvas Rules\"\nmsgstr \"Kanvaasin Säännöt\"\n\n#: /views/partials/info.handlebars\nmsgid \"We pride ourselves on trying to keep an open canvas for all free from outside interference on our end, and especially censorship. However, for the good of the community and on accounts of our own beliefs, please acknowledge and obey the following guidelines:\"\nmsgstr \"Olemme ylpeitä yrittäessämme pitää avoimen kanvaasin puhtaana ulkoisista häiriöistä meidän osaltamme, etenkin sensoroinnista. Kuitenkin, yhteisön hyväksi ja uskomustemme puolseta, ole hyvä ja huomioi ja noudata seuraavia ohjeita:\"\n\n#: /views/partials/info.handlebars\nmsgid \"No hateful imagery or derogatory speech. This includes but is not limited to words such as <i>f****t</i>, <i>n****r</i>, etc; as well as the Swastika, Hammer and Sickle, and any symbols of terrorism.\"\nmsgstr \"Ei vihanomaista kuvantamista tai halventavaa puhetta. Tämä sisältää mutta ei ole rajattu sanoihin kuten <i>f****t</i>, <i>n****r</i>, jne; mukaanlukien Swastika, Vasara ja Sirppi, ja mitkä tahansa muut terrorismin symbolit.\"\n\n#: /views/partials/info.handlebars\nmsgid \"No NSFW or NSFL content.\"\nmsgstr \"Ei NSFW tai NSFL sisältöä.\"\n\n#: /views/partials/info.handlebars\nmsgid \"No nudity or otherwise sexually explicit content\"\nmsgstr \"Ei alastomuutta tai muuten seksuaalista sisältöä\"\n\n#: /views/partials/info.handlebars\nmsgid \"No female-presenting nipples/bare breasts, genitalia, sexual fluids\"\nmsgstr \"Ei naista-esittäviä nännejä/paljaita rintoja, sukuelimiä, seksuaalisia nesteitä\"\n\n#: /views/partials/info.handlebars\nmsgid \"No sexual imagery/erotica\"\nmsgstr \"Ei seksuaalista kuvantamista/erotiikkaa\"\n\n#: /views/partials/info.handlebars\nmsgid \"No excessive blood or otherwise obscene/shocking content\"\nmsgstr \"Ei liioiteltua verta tai muuten säädytöntä/järkyttävää sisältöä\"\n\n#: /views/partials/info.handlebars\nmsgid \"No more than <b>one</b> account per user, no exceptions. Multiple account users will be banned from creating art on the canvas.\"\nmsgstr \"Ei enempää kuin <b>yksi</b> tili käyttäjää kohden, ei poikkeuksia. Monen tilin käyttäjät saavat porttikiellon taiteen luomisesta kanvaasille.\"\n\n#: /views/partials/info.handlebars\nmsgid \"No auto-placement tools of any kind, you must place the pixels manually.\"\nmsgstr \"Ei minkäänlaisia automaattiasetustyökaluja, sinun täytyy asettaa pikselit manuaalisesti.\"\n\n#: /views/partials/info.handlebars\nmsgid \"Do not abuse site functionality, such as reports or lookups. (e.g. automated reporting/lookups, etc.)\"\nmsgstr \"Älä hyväksikäytä sivun toimintoja, kuten raportointia tai hakuja. (esim. automatisoitu raportointi/haku, yms.)\"\n\n#: /views/partials/info.handlebars\nmsgid \"Any automated aggregation of data from user lookups is not allowed, and will result in a ban.\"\nmsgstr \"Kaikki käyttäjähakudatan automaattinen yhdistäminen on kielletty ja tulee johtamaan porttikieltoon.\"\n\n#: /views/partials/info.handlebars\nmsgid \"Staff have final say in any rule disputes\"\nmsgstr \"Henkilökunnalla on suurin päätösvalta kaikissa sääntöriidoissa\"\n\n#: /views/partials/info.handlebars\nmsgid \"If you feel a moderator has acted inappropriately, please report it to an administrator.\"\nmsgstr \"Jos tunnet moderaattorin käyttäytyneen epäsopivasti, ole hyvä ja ilmoita asiasta järjestelmänvalvojalle.\"\n\n#: /views/partials/info.handlebars\nmsgid \"If you believe you have been falsely banned you may contact a moderator or administrator.\"\nmsgstr \"Jos uskot virheellisesti saaneesi porttikiellon voit ottaa yhteyttä moderaattoriin tai järjestelmänvalvojaan.\"\n\n#: /views/partials/info.handlebars\nmsgid \"Chat Rules\"\nmsgstr \"Chatin Säännöt\"\n\n#: /views/partials/info.handlebars\nmsgid \"Keep chat civil. No harassment or homophobic/transphobic/disablist language.\"\nmsgstr \"Pidä chatti säädyllisenä. Ei haukkumista tai homophobista/transphobista/disabliststa kielenkäyttöä.\"\n\n#: /views/partials/info.handlebars\nmsgid \"No hate speech. This includes emoji/symbols/ASCII art.\"\nmsgstr \"Ei vihapuhetta. Tämä sisältää emojit/symboit/ASCII taiteen.\"\n\n#: /views/partials/info.handlebars\nmsgid \"Normal swearing/etc is allowed\"\nmsgstr \"Tavallinen kiroilu/yms on sallittua\"\n\n#: /views/partials/info.handlebars\nmsgid \"No spamming\"\nmsgstr \"Ei spämmäystä\"\n\n#: /views/partials/info.handlebars\nmsgid \"This includes excessive ASCII art/emojis/symbols/whitespace\"\nmsgstr \"Tämää sisältää liiallisen ASCII taiteen/emojit/symbolit/välilyönnit\"\n\n#: /views/partials/info.handlebars\nmsgid \"No \\\"copy pasta\\\"s\"\nmsgstr \"Ei \\\"copy pastoja\\\"\"\n\n#: /views/partials/info.handlebars\nmsgid \"No links to sites that actively break the canvas or chat rules (e.g. porn sites)\"\nmsgstr \"Ei linkkejä sivustoille jotka aktiivisesti rikkovat kanvaasin tai chatin sääntöjä (esim. porno sivustoja)\"\n\n#: /views/partials/info.handlebars\nmsgid \"No symbology which break the canvas or chat rules (e.g. NSFW ASCII art)\"\nmsgstr \"Ei symbologiaa joka rikkoo kanvaasin tai chatin sääntöjä (esim. NSFW ASCII taide)\"\n\n#: /views/partials/info.handlebars\nmsgid \"No personal information\"\nmsgstr \"Ei henkilökohtaista informaatiota\"\n\n#: /views/partials/info.handlebars\nmsgid \"Links\"\nmsgstr \"Linkit\"\n\n#: /views/partials/info.handlebars\nmsgid \"Terms of Service\"\nmsgstr \"Palvelun Ehdot\"\n\n#: /views/partials/info.handlebars\nmsgid \"Privacy Policy\"\nmsgstr \"Privacy Policy\"\n\n#: /views/partials/info.handlebars\nmsgid \"Discord (main hub)\"\nmsgstr \"Discord (pääkeskus)\"\n\n#: /views/partials/info.handlebars\nmsgid \"Twitter\"\nmsgstr \"Twitteri\"\n\n#: /views/partials/info.handlebars\nmsgid \"GitHub (back end)\"\nmsgstr \"GitHub (backendi)\"\n\n#: /views/partials/info.handlebars\nmsgid \"GitHub (front end)\"\nmsgstr \"GitHub (frontendi)\"\n\n#: /views/partials/info.handlebars\nmsgid \"Single-player mode\"\nmsgstr \"Yksinpelitila\"\n\n#: /views/partials/info.handlebars\nmsgid \"Statistics\"\nmsgstr \"Statistiikkoja\"\n\n#: /views/partials/info.handlebars\nmsgid \"Profile (user info, factions, etc.)\"\nmsgstr \"Profiili (käyttäjätietoja, ryhmät, yms.)\"\n\n#: /views/partials/info.handlebars\nmsgid \"Wiki\"\nmsgstr \"Wiki\"\n\n#: /views/partials/info.handlebars\nmsgid \"Generator, progress checker, and monitor for Pxls templates\"\nmsgstr \"Generaattori, edistyksentarkistaja, ja tarkkailija Pxls malleille\"\n\n#: /views/partials/info.handlebars\nmsgid \"Archives\"\nmsgstr \"Arkistot\"\n\n#: /views/partials/info.handlebars\nmsgid \"PxlsFiddle (archives)\"\nmsgstr \"PxlsFiddle (arkistot)\"\n\n#: /views/partials/info.handlebars\nmsgid \"Donate\"\nmsgstr \"Lahjoita\"\n\n#: /views/partials/info.handlebars\nmsgid \"Donations are not accepted at this time, but this panel will be updated when they're open again!\"\nmsgstr \"Lahjoituksia ei tällä hetkellä oteta vastaan, mutta tämö paneeli päivitetään kun ne ovet taas avoimet!\"\n\n#: /views/profile.handlebars\nmsgid \"{0}'s Profile\"\nmsgstr \"{0}:n Profiili\"\n\n#: /views/profile.handlebars\nmsgid \"My Data\"\nmsgstr \"Datani\"\n\n#: /views/profile.handlebars\nmsgid \"Reports\"\nmsgstr \"Ilmiannot\"\n\n#: /views/profile.handlebars\nmsgid \"Factions\"\nmsgstr \"Ryhmät\"\n\n#: /views/profile.handlebars\nmsgid \"Data\"\nmsgstr \"Data\"\n\n#: /views/profile.handlebars\nmsgid \"You must be logged in to view your profile.\"\nmsgstr \"Sinun täytyy olla kirjautunut sisään nähdäksesi profiilisi.\"\n\n#: /views/profile.handlebars\nmsgid \"Registration Date\"\nmsgstr \"Rekisteröitymispäivä\"\n\n#: /views/profile.handlebars /public/include/lookup.js\nmsgid \"Alltime Pixels\"\nmsgstr \"Kaiken Ajan Pikselit\"\n\n#: /views/profile.handlebars\nmsgid \"Current Canvas Pixels\"\nmsgstr \"Nykyisen Kanvaasin Pikselit\"\n\n#: /views/profile.handlebars\nmsgid \"Discord Tag\"\nmsgstr \"Discord Tagi\"\n\n#: /views/profile.handlebars /public/include/lookup.js\nmsgid \"Faction\"\nmsgstr \"Ryhmät\"\n\n#: /views/profile.handlebars\nmsgid \"None\"\nmsgstr \"Ei mitään\"\n\n#: /views/profile.handlebars /public/admin/admin.js\nmsgid \"Roles\"\nmsgstr \"Roolit\"\n\n#: /views/profile.handlebars\nmsgid \"Canvas Ban Expiry\"\nmsgstr \"Kanvaasiporttikiellon Päättymisaika\"\n\n#: /views/profile.handlebars\nmsgid \"Never\"\nmsgstr \"Ei koskaan\"\n\n#: /views/profile.handlebars\nmsgid \"Chat Ban Expiry\"\nmsgstr \"Chattiporttikiellon Päättymisaika\"\n\n#: /views/profile.handlebars\nmsgid \"View rankings and other stats <a href=\\\"/stats\\\">here</a>.\"\nmsgstr \"Katso listasijoitkuskia ja muita statistiikkoja <a href=\\\"/stats\\\">täällä</a>.\"\n\n#: /views/profile.handlebars\nmsgid \"You must be logged in to view your reports.\"\nmsgstr \"Sinun täytyy olla kirjautunut sisään nähdäksesi ilmiantosi.\"\n\n#: /views/profile.handlebars\nmsgid \"Canvas Reports ({0}/{1} open)\"\nmsgstr \"Kanvaasi-ilmiannot ({0}/{1} avoinna)\"\n\n#. eg \"Report on Bob (closed)\n#: /views/profile.handlebars\nmsgid \"Report on {0} (closed)\"\nmsgstr \"Ilmiannettu {0} (suljettu)\"\n\n#. eg \"Report on Bob (open)\n#: /views/profile.handlebars\nmsgid \"Report on {0} (open)\"\nmsgstr \"Ilmiannettu {0} (avoinna)\"\n\n#. eg \"Reported Bob on Jan 1, 1970, 00:00:00 AM (UTC)\n#: /views/profile.handlebars\nmsgid \"Reported {0} on {1}\"\nmsgstr \"Ilmiannettiin {0} aikaan {1}\"\n\n#: /views/profile.handlebars\nmsgid \"There are no canvas reports to show.\"\nmsgstr \"Ei kanvaasi-ilmiantoja näytettävissä.\"\n\n#: /views/profile.handlebars\nmsgid \"Chat Reports ({0}/{1} open)\"\nmsgstr \"Chatti-ilmiannot ({0}/{1} avoinna)\"\n\n#: /views/profile.handlebars\nmsgid \"There are no chat reports to show.\"\nmsgstr \"Ei chatti-ilmiantoja näytettävissä.\"\n\n#: /views/profile.handlebars\nmsgid \"You must be logged in to manage your factions.\"\nmsgstr \"Sinun täytyy olla kirjautunut sisään hallitaksesi ryhmiäsi.\"\n\n#: /views/profile.handlebars\nmsgid \"You are faction restricted and cannot create new factions. If you believe this is an error, please contact a moderator.\"\nmsgstr \"Olet ryhmärajoitettu ja et voi luoda uusia ryhmiä. Jos uskot tämän olevan virhe, ole hyvä ja ota yhteys moderaattoriin.\"\n\n#: /views/profile.handlebars\nmsgid \"You are canvas banned and cannot create new factions. If you believe this is an error, please contact a moderator.\"\nmsgstr \"Sinulla on kanvaasiporttikielto ja et voi luoda uusi ryhmiä. Jos uskot tämän olevan virhe, ole hyvä ja ota yhteys moderaattoriin.\"\n\n#: /views/profile.handlebars\nmsgid \"You must have at least {0} all-time pixels to create a faction.\"\nmsgstr \"Sinullä täytyy olla ainakin {0} pixeliä kaikelta ajalta luodakses ryhmän.\"\n\n#: /views/profile.handlebars\nmsgid \"Create\"\nmsgstr \"Luo\"\n\n#: /views/profile.handlebars\nmsgid \"Join\"\nmsgstr \"Liity\"\n\n#: /views/profile.handlebars\nmsgid \"This is your currently displayed faction.\"\nmsgstr \"Tämä on tällä hetkellä esitetty ryhmäsi.\"\n\n#. eg \"Pixelers (members: 100, ID: 1)\"\n#: /views/profile.handlebars\nmsgid \"{0} (members: {1}, ID: {2})\"\nmsgstr \"{0} (jäsenet: {1}, ID: {2})\"\n\n#: /views/profile.handlebars\nmsgid \"Owner: {0}\"\nmsgstr \"Omistaja: {0}\"\n\n#. makes the faction no longer the one displayed for the current user\n#: /views/profile.handlebars\nmsgid \"Remove Displayed\"\nmsgstr \"Poista Esitetty\"\n\n#. makes the faction the one displayed for the current user\n#: /views/profile.handlebars\nmsgid \"Set Displayed\"\nmsgstr \"Aseta Esitetty\"\n\n#: /views/profile.handlebars\nmsgid \"Members\"\nmsgstr \"Jäsenet\"\n\n#: /views/profile.handlebars\nmsgid \"Edit\"\nmsgstr \"Muokkaa\"\n\n#: /views/profile.handlebars /public/include/chat.js\nmsgid \"Delete\"\nmsgstr \"Poista\"\n\n#: /views/profile.handlebars\nmsgid \"Leave\"\nmsgstr \"Poistu\"\n\n#: /views/profile.handlebars\nmsgid \"You are not in any factions yet!\"\nmsgstr \"Et ole vielä yhdessäkään ryhmässä!\"\n\n#: /views/profile.handlebars\nmsgid \"You must be logged in to view your data.\"\nmsgstr \"Sinun täytyy olla kirjautunut sisään nähdäksesi datasi.\"\n\n#: /views/profile.handlebars\nmsgid \"Log Keys\"\nmsgstr \"Logiavaimet\"\n\n#: /views/profile.handlebars\nmsgid \"Log keys can be used by those who have them to tell which pixels you placed on previous canvases.\"\nmsgstr \"Ne, joilla on logiavain voivat keyttää sitä selvittääkseen mitkä pikselit asetit aikaisemmilla kanvaaseilla.\"\n\n#: /views/profile.handlebars\nmsgid \"You can see the public <a href=\\\"https://pxls.space/extra/logs/\\\" target=\\\"_blank\\\">Pxls Logs</a> to learn more.\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Canvas Code\"\nmsgstr \"Kanvaasikoodi\"\n\n#: /views/profile.handlebars\nmsgid \"Log Key\"\nmsgstr \"Logiavain\"\n\n#: /views/profile.handlebars\nmsgid \"You have no log keys yet!\"\nmsgstr \"Sinulla ei vielä ole yhtään logiavaimia!\"\n\n#: /views/profile.handlebars\nmsgid \"Log keys should show up here after a canvas you have placed on ends.\"\nmsgstr \"Logiavaimien pitäisi tulla näkyviin täällä kun kanvaasi jolla olet asettanut päättyy.\"\n\n#: /views/profile.handlebars\nmsgid \"Members of {0} ([{1}])\"\nmsgstr \"{0}:n jäsenet ([{1}])\"\n\n#: /views/profile.handlebars /public/admin/admin.js /public/include/lookup.js\nmsgid \"Close\"\nmsgstr \"Sulje\"\n\n#: /views/profile.handlebars\nmsgid \"Faction Members\"\nmsgstr \"Ryhmän jäsenet\"\n\n#. This loop only fires when on our own profile. We can't leave a faction we own, we can only transfer ownership, so no point in showing ourselves in the member list.\n#. since we can't leave the faction until we transfer, if there's only one member in the list it's assumed to be the owner. we don't want to show ourself in the list\n#: /views/profile.handlebars\nmsgid \"Transfer Ownership\"\nmsgstr \"Siirrä Omistus\"\n\n#. bans a user from the faction\n#: /views/profile.handlebars /public/include/chat.js\nmsgid \"Ban\"\nmsgstr \"Anna Porttikielto\"\n\n#: /views/profile.handlebars\nmsgid \"Nothing to see here!\"\nmsgstr \"Ei mitään nähtävää!\"\n\n#: /views/profile.handlebars\nmsgid \"Faction Bans\"\nmsgstr \"Ryhmäporttikiellot\"\n\n#: /views/profile.handlebars /public/admin/admin.js /public/include/chat.js\nmsgid \"Unban\"\nmsgstr \"Poista Porttikielto\"\n\n#: /views/profile.handlebars\nmsgid \"Find A Faction\"\nmsgstr \"Löydä Ryhmä\"\n\n#: /views/profile.handlebars\nmsgid \"Search:\"\nmsgstr \"Etsi:\"\n\n#: /views/profile.handlebars\nmsgid \"Enter a search term to get started.\"\nmsgstr \"Anna hakutermi aloittaaksesi.\"\n\n#: /views/profile.handlebars\nmsgid \"Load More\"\nmsgstr \"Lataa Lisää\"\n\n#: /public/admin/admin.js\nmsgid \"Send alert...\"\nmsgstr \"Lähetä hälytys...\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Rule #1: Hateful/derogatory speech or symbols\"\nmsgstr \"Sääntö #1: Vihamielinen/halventava puhe tai sumbolit\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Rule #2: Nudity, genitalia, or non-PG-13 content\"\nmsgstr \"Sääntö #2: Alastomuus, sukupuolielimet, tai ei-PG-13 sisältö\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Rule #3: Multi-account\"\nmsgstr \"Sääntö #3: Monta tiliä\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Rule #4: Botting\"\nmsgstr \"Sääntö #4: Bottaaminen\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Other (specify below)\"\nmsgstr \"Muu (määrittele alla)\"\n\n#: /public/admin/admin.js /public/include/chat.js /public/include/lookup.js\nmsgid \"Additional information (if applicable)\"\nmsgstr \"Lisätiedot (jos sovellettavissa)\"\n\n#. \"Revert pixels of the last *n* hours\", part before 'n'\n#: /public/admin/admin.js\nmsgid \"Revert pixels of the last \"\nmsgstr \"Palauta pikselit edellisen \"\n\n#. \"Revert pixels of the last *n* hours\", part after 'n'\n#: /public/admin/admin.js\nmsgid \" hours\"\nmsgstr \" tunnin ajalta\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"You must specify the details.\"\nmsgstr \"Sinun täytyy määrittää yksityiskohdat.\"\n\n#: /public/admin/admin.js\nmsgid \"Something went wrong! Perhaps insufficient permissions?\"\nmsgstr \"Jokin meni pieleen! Mahdollisesti oikeuksien puute?\"\n\n#: /public/admin/admin.js\nmsgid \"Shadowban user\"\nmsgstr \"Piiloporttikiellä käyttäjä\"\n\n#: /public/admin/admin.js\nmsgid \"Shadowbanned user\"\nmsgstr \"Piiloporttikielletty käyttäjä\"\n\n#: /public/admin/admin.js\nmsgid \"Permaban user\"\nmsgstr \"Porttikiellä käyttäjä lopullisesti\"\n\n#: /public/admin/admin.js\nmsgid \"Permabanned user\"\nmsgstr \"Lopullisesti porttikielletty käyttäjä\"\n\n#: /public/admin/admin.js\nmsgid \"Ban user\"\nmsgstr \"Porttikiellä käyttäjä\"\n\n#: /public/admin/admin.js\nmsgid \"Banned user\"\nmsgstr \"Porttikielletty käyttäjä\"\n\n#: /public/admin/admin.js\nmsgid \"Unbanned user ${username}\"\nmsgstr \"Poistettu porttikielto käyttäjältä ${username}\"\n\n#. Context: ban type\n#: /public/admin/admin.js\nmsgid \"shadow\"\nmsgstr \"piilo\"\n\n#: /public/admin/admin.js\nmsgid \"never\"\nmsgstr \"ei koskaan\"\n\n#: /public/admin/admin.js\nmsgid \"permanent\"\nmsgstr \"lopullinen\"\n\n#: /public/admin/admin.js /public/include/chat.js /public/include/uiHelper.js\n#: /public/include/user.js\nmsgid \"Yes\"\nmsgstr \"Kyllä\"\n\n#: /public/admin/admin.js /public/include/chat.js /public/include/uiHelper.js\n#: /public/include/user.js\nmsgid \"No\"\nmsgstr \"Ei\"\n\n#: /public/admin/admin.js\nmsgid \"Yes (permanent)\"\nmsgstr \"Kyllä (lopullinen)\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Username\"\nmsgstr \"Käyttäjänimi\"\n\n#: /public/admin/admin.js /public/include/chat.js\nmsgid \"Profile\"\nmsgstr \"Profiili\"\n\n#: /public/admin/admin.js\nmsgid \"Logins\"\nmsgstr \"Kirjautumiset\"\n\n#: /public/admin/admin.js\nmsgid \"All Time Pixels\"\nmsgstr \"Kaiken Ajan Pikselit\"\n\n#: /public/admin/admin.js /public/include/user.js\nmsgid \"Rename Requested\"\nmsgstr \"Nimenvaihto Pyydetty\"\n\n#: /public/admin/admin.js\nmsgid \"Discord Name\"\nmsgstr \"Discord Nimi\"\n\n#: /public/admin/admin.js /public/include/user.js\nmsgid \"Banned\"\nmsgstr \"Porttikielletty\"\n\n#: /public/admin/admin.js\nmsgid \"Chatbanned\"\nmsgstr \"Chattiporttikielletty\"\n\n#: /public/admin/admin.js\nmsgid \"Ban Reason\"\nmsgstr \"Porttikiellon Syy\"\n\n#: /public/admin/admin.js\nmsgid \"Ban Expiracy\"\nmsgstr \"Porttikiellon Päättyminen\"\n\n#: /public/admin/admin.js\nmsgid \"Chatban Reason\"\nmsgstr \"Chattiporttikiellon Syy\"\n\n#: /public/admin/admin.js\nmsgid \"(canvas ban)\"\nmsgstr \"(kanvaasiporttikielto)\"\n\n#: /public/admin/admin.js\nmsgid \"when canvas ban ends\"\nmsgstr \"milloin kanvaasiporttikielto päättyy\"\n\n#: /public/admin/admin.js\nmsgid \"Chatban Expires\"\nmsgstr \"Chattiporttikielto Päättyy\"\n\n#: /public/admin/admin.js\nmsgid \"Ban (24h)\"\nmsgstr \"Porttikiellä (24h)\"\n\n#: /public/admin/admin.js\nmsgid \"Permaban\"\nmsgstr \"Porttikiellä Lopullisesti\"\n\n#: /public/admin/admin.js\nmsgid \"Shadowban\"\nmsgstr \"Piiloporttikiellä\"\n\n#: /public/admin/admin.js\nmsgid \"Custom ban length: \"\nmsgstr \"Muokattu porttikiellon pituus: \"\n\n#. Admin check. Example: type = 'username', arg = 'pxlsuser94'\n#: /public/admin/admin.js\nmsgid \"${type} ${arg} not found.\"\nmsgstr \"${type} ${arg} ei löydetty.\"\n\n#: /public/admin/admin.js\nmsgid \"Unban Reason:\"\nmsgstr \"Porttikiellon Poistamisen Syy:\"\n\n#: /public/admin/admin.js\nmsgid \"Unbanning ${username}\"\nmsgstr \"Poistetaan porttikielto keyttäjältä ${username}\"\n\n#: /public/admin/admin.js /public/include/chat.js /public/include/lookup.js\n#: /public/include/user.js\nmsgid \"Cancel\"\nmsgstr \"Peruuta\"\n\n#. Moderator panel label\n#: /public/admin/admin.js\nmsgid \"MOD\"\nmsgstr \"MODERAATTORI\"\n\n#: /public/admin/admin.js\nmsgid \"Ignore cooldown\"\nmsgstr \"Jätä viive huomioimatta\"\n\n#: /public/admin/admin.js\nmsgid \"Place any color\"\nmsgstr \"Aseta mikä tahansa väri\"\n\n#: /public/admin/admin.js\nmsgid \"Ignore placemap\"\nmsgstr \"Jätä asetuskartta huomioimatta\"\n\n#: /public/admin/admin.js\nmsgid \"Ban user (24h)\"\nmsgstr \"Porttikiellä käyttäjä (24h)\"\n\n#: /public/admin/admin.js\nmsgid \"Unban user\"\nmsgstr \"Poista käyttäjän porttikielto\"\n\n#: /public/admin/admin.js\nmsgid \"Check user\"\nmsgstr \"Tarkista käyttäjä\"\n\n#: /public/admin/admin.js\nmsgid \"profile\"\nmsgstr \"profiili\"\n\n#: /public/admin/admin.js\nmsgid \"User Agent\"\nmsgstr \"Käyttäjäagentti\"\n\n#: /public/admin/admin.js\nmsgid \"Send Alert\"\nmsgstr \"Lähetä Hälytys\"\n\n#: /public/admin/admin.js\nmsgid \"Mod Actions\"\nmsgstr \"Moderaattoritoiminnot\"\n\n#: /public/admin/admin.js\nmsgid \"More...\"\nmsgstr \"Lisää...\"\n\n#. Snapshot save name\n#: /public/include/board.js\nmsgid \"pxls canvas\"\nmsgstr \"pxls kanvaasi\"\n\n#. template link action\n#: /public/include/chat.js\nmsgid \"Ask\"\nmsgstr \"Kysy\"\n\n#: /public/include/chat.js\nmsgid \"Open in a new tab\"\nmsgstr \"Avaa uudessa välilehdessä\"\n\n#: /public/include/chat.js\nmsgid \"Open in current tab (replacing template)\"\nmsgstr \"Avaa nykyisessä välilehdessä (malli korvautuu)\"\n\n#: /public/include/chat.js\nmsgid \"Jump to coordinates without replacing template\"\nmsgstr \"Mene koordinaatteihin korvaamatta mallia\"\n\n#: /public/include/chat.js\nmsgid \"Please upload your template image to a third-party image host.\"\nmsgstr \"Ole hyvä ja lataa mallikuvasi kolmannen osapuolen kuvapalvelimelle.\"\n\n#: /public/include/chat.js\nmsgid \"You must have at least \"\nmsgstr \"Sinulla täytyy olla ainakin \"\n\n#: /public/include/chat.js\nmsgid \" pixels to send links.\"\nmsgstr \" pikseliä lähettääksesi linkkejä.\"\n\n#: /public/include/chat.js\nmsgid \"You must be logged in to chat.\"\nmsgstr \"Sinun täytyy olla kirjautunut sisään käyttääksesi chattia.\"\n\n#: /public/include/chat.js\nmsgid \"No Results\"\nmsgstr \"Ei Tuloksia\"\n\n#: /public/include/chat.js\nmsgid \"Reply\"\nmsgstr \"Vastaa\"\n\n#: /public/include/chat.js\nmsgid \"none provided\"\nmsgstr \"ei mitään annettu\"\n\n#: /public/include/chat.js\nmsgid \"Purged by ${purge.initiator} with reason: ${reason}\"\nmsgstr \"Puhdistettu ${purge.initiator} toimesta syystä: ${reason}\"\n\n#: /public/include/chat.js\nmsgid \"External Link\"\nmsgstr \"Ulkoinen Linkki\"\n\n#: /public/include/chat.js\nmsgid \"This link is taking you to the following website:\"\nmsgstr \"Tämä linkki vie sinut seuraavalle verkkosivulle:\"\n\n#: /public/include/chat.js\nmsgid \"The operators of this website have no responsibility or control over the contents hosted at {0}. Are you sure you want to go there?\"\nmsgstr \"Tämän sivuston operoijilla ei ole vastuuta tai hallintaa sisältöön, joka sijaitsee kohteessa {0}. Oletko varma että haluat mennä sinne?\"\n\n#: /public/include/chat.js\nmsgid \"Note: You can disable this popup in settings.\"\nmsgstr \"Huom: Voit kytkeä tämän ponnahdusikkunan pois käytöstä asetuksissa.\"\n\n#: /public/include/chat.js\nmsgid \"Visit Site\"\nmsgstr \"Vieraile Sivustolla\"\n\n#: /public/include/chat.js\nmsgid \"template:\"\nmsgstr \"malli:\"\n\n#: /public/include/chat.js\nmsgid \"Open Failed\"\nmsgstr \"Avaaminen Epäonnistui\"\n\n#: /public/include/chat.js\nmsgid \"Failed to automatically open in a new tab\"\nmsgstr \"Avaaminen automaattisesti uudessa ikkunassa epäonnistui\"\n\n#: /public/include/chat.js\nmsgid \"Click here to open in a new tab instead\"\nmsgstr \"Paina tästä sen sijaan avataksesi uudessa välilehdessä\"\n\n#: /public/include/chat.js\nmsgid \"Open Template\"\nmsgstr \"Avaa Malli\"\n\n#: /public/include/chat.js\nmsgid \"This link will overwrite your current template. What would you like to do?\"\nmsgstr \"Tämä linkki korvaa nykyisen mallisi. Mitä haluaisit tehdä?\"\n\n#: /public/include/chat.js\nmsgid \"Note: You can set a default action in the settings menu which bypasses this popup completely.\"\nmsgstr \"Huom: Voit asettaa oletustoiminnon asetusvalikossa, jolloin ohitat tämän ponnahdusikkunan kokonaan.\"\n\n#: /public/include/chat.js\nmsgid \"OK\"\nmsgstr \"OK\"\n\n#: /public/include/chat.js /public/include/lookup.js\nmsgid \"Report\"\nmsgstr \"Ilmianna\"\n\n#: /public/include/chat.js\nmsgid \"Mention\"\nmsgstr \"Mainitse\"\n\n#: /public/include/chat.js\nmsgid \"Ignore\"\nmsgstr \"Älä Huomioi\"\n\n#: /public/include/chat.js\nmsgid \"Chat (un)ban\"\nmsgstr \"Chatti porttikiellä/poista porttikielto\"\n\n#: /public/include/chat.js\nmsgid \"Purge User\"\nmsgstr \"Siivoa Käyttäjä\"\n\n#: /public/include/chat.js\nmsgid \"Mod Lookup\"\nmsgstr \"Moderaattorihaku\"\n\n#: /public/include/chat.js\nmsgid \"Chat Lookup\"\nmsgstr \"Chattihaku\"\n\n#: /public/include/chat.js\nmsgid \"Enter a reason for your report\"\nmsgstr \"Anna syy ilmiannollesi\"\n\n#: /public/include/chat.js\nmsgid \"You are reporting a chat message from ${reportTarget} with the content:\"\nmsgstr \"Olet ilmiantamassa viestin käyttäjältä ${reportTarget}, jonka sisältö on:\"\n\n#: /public/include/chat.js /public/include/lookup.js\nmsgid \"Sent report!\"\nmsgstr \"Ilmianto lähetetty!\"\n\n#: /public/include/chat.js /public/include/lookup.js\nmsgid \"Error sending report.\"\nmsgstr \"Virhe ilmiantoa lähettäessä.\"\n\n#: /public/include/chat.js\nmsgid \"Report User\"\nmsgstr \"Ilmianna Käyttäjä\"\n\n#: /public/include/chat.js\nmsgid \"User ignored. You can unignore from chat settings.\"\nmsgstr \"Käyttäjää ei huomioida. Voit poistaa huomitta jättämisen chattiasetuksissa.\"\n\n#: /public/include/chat.js\nmsgid \"Failed to ignore user. Either they\\\\'re already ignored, or an error occurred. If the problem persists, contact a developer.\"\nmsgstr \"Käyttäjän huomioimatta jättäminen epäonnistui. Joko hän on jo asetettu olemaan huomioimatta, tai virhe tapahtui. Jos ongelma toistuu, ota yhteys kehittäjään.\"\n\n#: /public/include/chat.js\nmsgid \"Permanent\"\nmsgstr \"Lopullinen\"\n\n#: /public/include/chat.js\nmsgid \"Temporary\"\nmsgstr \"Väliaikainen\"\n\n#: /public/include/chat.js\nmsgid \"Rule 3: Spam\"\nmsgstr \"Sääntö 3: Spämmääminen\"\n\n#: /public/include/chat.js\nmsgid \"Rule 1: Chat civility\"\nmsgstr \"Sääntö 1: Chatin säävyllisyys\"\n\n#: /public/include/chat.js\nmsgid \"Rule 2: Hate Speech\"\nmsgstr \"Sääntö 2: Vihapuhe\"\n\n#: /public/include/chat.js\nmsgid \"Rule 5: NSFW\"\nmsgstr \"Sääntö 5: NSFW\"\n\n#: /public/include/chat.js\nmsgid \"Custom\"\nmsgstr \"Muokattu\"\n\n#: /public/include/chat.js\nmsgid \"Banning:\"\nmsgstr \"Porttikielletään:\"\n\n#: /public/include/chat.js\nmsgid \"Message:\"\nmsgstr \"Viesti:\"\n\n#: /public/include/chat.js\nmsgid \"Ban Length\"\nmsgstr \"Portttikiellon Pituus\"\n\n#: /public/include/chat.js\nmsgid \"Reason\"\nmsgstr \"Syy\"\n\n#: /public/include/chat.js\nmsgid \"Purge Messages\"\nmsgstr \"Siivoa Viestit\"\n\n#: /public/include/chat.js\nmsgid \"Purging all messages is disabled during snip mode\"\nmsgstr \"Kaikkien viestien puhdistaminen on poistettu käytöstä leikkaustilassa\"\n\n#: /public/include/chat.js\nmsgid \"Silent (no purge message)\"\nmsgstr \"Hiljainen (ei siivousviestiä)\"\n\n#: /public/include/chat.js\nmsgid \"Custom reason\"\nmsgstr \"Muokattu syy\"\n\n#: /public/include/chat.js\nmsgid \"Additional information:\"\nmsgstr \"Lisätietoja:\"\n\n#: /public/include/chat.js\nmsgid \"Chatban initiated\"\nmsgstr \"Chattiporttikielto käynnistetty\"\n\n#: /public/include/chat.js\nmsgid \"Error occurred while chatbanning\"\nmsgstr \"Virhe tapahtui chattiporttikieltäessä\"\n\n#: /public/include/chat.js\nmsgid \"Chatban\"\nmsgstr \"Chattiporttikielto\"\n\n#: /public/include/chat.js\nmsgid \"Failed to delete\"\nmsgstr \"Poistaminen epäonnistui\"\n\n#: /public/include/chat.js\nmsgid \"ID: \"\nmsgstr \"ID: \"\n\n#: /public/include/chat.js\nmsgid \"User: \"\nmsgstr \"Käyttäjä: \"\n\n#: /public/include/chat.js\nmsgid \"Message: \"\nmsgstr \"Viesti: \"\n\n#: /public/include/chat.js\nmsgid \"Reason: \"\nmsgstr \"Syy: \"\n\n#: /public/include/chat.js\nmsgid \"Delete Message\"\nmsgstr \"Poista Viesti\"\n\n#: /public/include/chat.js\nmsgid \"Purge\"\nmsgstr \"Siivoa\"\n\n#: /public/include/chat.js\nmsgid \"Selected Message\"\nmsgstr \"Valittu Viesti\"\n\n#: /public/include/chat.js\nmsgid \"Purge Reason\"\nmsgstr \"Siiivoamisen Syy\"\n\n#: /public/include/chat.js\nmsgid \"User purged\"\nmsgstr \"Käyttäjä siivottu\"\n\n#: /public/include/chat.js\nmsgid \"Error sending purge.\"\nmsgstr \"Virhe siivousta lähettäessä.\"\n\n#: /public/include/chat.js\nmsgid \"Toggle Rename Request\"\nmsgstr \"Kytke Nimenvaihtopyyntö\"\n\n#: /public/include/chat.js\nmsgid \"Select one of the options below to set the current rename request state.\"\nmsgstr \"Valitse yksi alla olevista vaihtoehdoista asettaaksesi nykyisen uudelleennimeämispyynnön tilan.\"\n\n#: /public/include/chat.js\nmsgid \"Rename request updated\"\nmsgstr \"Uudelleenniemämispyyntö päivitetty\"\n\n#: /public/include/chat.js\nmsgid \"An unknown error occurred. Please contact a developer\"\nmsgstr \"Tuntematon virhe tapahtui. Ole hyvä ja ota yhteys kehittäjään\"\n\n#: /public/include/chat.js\nmsgid \"New Name: \"\nmsgstr \"Uusi Nimi: \"\n\n#: /public/include/chat.js\nmsgid \"Enter the new name for the user below. Please note that if you\\\\'re trying to change the caps, you\\\\'ll have to rename to something else first.\"\nmsgstr \"Anna uusi nimi käyttäjälle alla. Huomio, että jos olet muuttamassa kirjainkokoja, sinun täytyy ensin vaihtaa nimi johonkin muuhun.\"\n\n#: /public/include/chat.js\nmsgid \"User renamed\"\nmsgstr \"Käyttäjän nimi vaihdettu\"\n\n#: /public/include/chat.js\nmsgid \"Force Rename\"\nmsgstr \"Pakota Uudelleennimeäminen\"\n\n#: /public/include/chat.js\nmsgid \"You cannot use chat while canvas banned.\"\nmsgstr \"Et voi käyttää chattia kun sinulla on kanvaasiporttikielto.\"\n\n#: /public/include/lookup.js\nmsgid \"Sending...\"\nmsgstr \"Lähetetään...\"\n\n#: /public/include/lookup.js\nmsgid \"additional information:\"\nmsgstr \"lisätietoja:\"\n\n#: /public/include/lookup.js\nmsgid \"Report Pixel\"\nmsgstr \"Ilmianna pikseli\"\n\n#: /public/include/lookup.js\nmsgid \"This pixel is background (was not placed by a user).\"\nmsgstr \"Tämä pikseli on osa taustaa (ei ole käyttäjän asettama).\"\n\n#: /public/include/lookup.js\nmsgid \"Hide sensitive information\"\nmsgstr \"Piilota arkaluonteiset tiedot\"\n\n#: /public/include/lookup.js\nmsgid \"Move Template Here\"\nmsgstr \"Siirrä Malli Tänne\"\n\n#: /public/include/lookup.js\nmsgid \"An error occurred, either you aren't logged in or you may be attempting to look up users too fast. Please try again in 60 seconds\"\nmsgstr \"Virhe tapahtui, joko et ole kirjautuut sisään tai yrität hakea käyttäjiiä liian nopeasti. Ole hyvä ja yritä uudelleen 69 sekunnin kuluttua\"\n\n#: /public/include/lookup.js\nmsgid \"Coords\"\nmsgstr \"Koordinaatit\"\n\n#: /public/include/lookup.js\nmsgid \"View Profile\"\nmsgstr \"Katso Profiili\"\n\n#: /public/include/lookup.js\nmsgid \"Origin\"\nmsgstr \"Lähde\"\n\n#: /public/include/lookup.js\nmsgid \"Part of a nuke\"\nmsgstr \"Osa pommitusta\"\n\n#: /public/include/lookup.js\nmsgid \"Placed by a staff member using placement overrides\"\nmsgstr \"Henkilökunnan jäsenen asettama käyttäen asetusohitusta\"\n\n#: /public/include/lookup.js\nmsgid \"Time\"\nmsgstr \"Aika\"\n\n#: /public/include/lookup.js\nmsgid \"just now\"\nmsgstr \"juuri nyt\"\n\n#: /public/include/lookup.js\nmsgid \"${hoursStr}:${minuteStr}:${secsStr} ago\"\nmsgstr \"${hoursStr}:${minuteStr}:${secsStr} sitten\"\n\n#: /public/include/lookup.js\nmsgid \"Discord\"\nmsgstr \"Discord\"\n\n#: /public/include/notifications.js\nmsgid \"Posted by ${notification.who}\"\nmsgstr \"Julkaissut ${notification.who}\"\n\n#: /public/include/notifications.js\nmsgid \"Expires ${expiry}\"\nmsgstr \"Vanhenee ${expiry}\"\n\n#: /public/include/template.js\nmsgid \"There was an error getting the image\"\nmsgstr \"Tapahtui virhe hankkiessa kuvaa\"\n\n#: /public/include/timer.js\nmsgid \"Your next pixel will be available in ${delay} seconds!\"\nmsgstr \"Seuraava pikselisi tulee olemaan saatavilla ${delay} sekunnissa!\"\n\n#: /public/include/timer.js\nmsgid \"Your next pixel has been available for ${alertDelay} seconds!\"\nmsgstr \"Seuraava pikseilisi on ollut saatavilla ${alertDelay} sekuntia!\"\n\n#: /public/include/timer.js\nmsgid \"Your next pixel is available!\"\nmsgstr \"Seuraava pikselisi on saatavilla!\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Dark\"\nmsgstr \"Tumma\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Darker\"\nmsgstr \"Tummempi\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Blue\"\nmsgstr \"Sininen\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Purple\"\nmsgstr \"Violetti\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Green\"\nmsgstr \"Vihreä\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Matte\"\nmsgstr \"Matta\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Terminal\"\nmsgstr \"Terminaali\"\n\n#. theme name\n#: /public/include/uiHelper.js\nmsgid \"Red\"\nmsgstr \"Punainen\"\n\n#: /public/include/uiHelper.js\nmsgid \"A new ${type} report has been received.\"\nmsgstr \"Uusi ${type} ilmianto on saatu.\"\n\n#: /public/include/uiHelper.js\nmsgid \"Cannot fetch local files. Use the file selector in template settings.\"\nmsgstr \"Ei voida noutaa paikallisia tiedostoja. Käytä tiedostonvalitsinta malliasetuksissa.\"\n\n#: /public/include/uiHelper.js\nmsgid \"Redirect Warning\"\nmsgstr \"Uudelleenohjausvaroitus\"\n\n#: /public/include/uiHelper.js\nmsgid \"Are you sure you want to redirect to the following URL?\"\nmsgstr \"Oletko varma että haluat uudelleenohjata seuraavaan URL:n?\"\n\n#: /public/include/uiHelper.js\nmsgid \"Drag and dropped file must be a valid image.\"\nmsgstr \"Vedetyn ja pudotetun tiedoston täytyy olla oikeamuotoinen kuva\"\n\n#: /public/include/uiHelper.js\nmsgid \"Discord name updated successfully\"\nmsgstr \"Discord nimi päivitetty onnistuneesti\"\n\n#: /public/include/uiHelper.js\nmsgid \"Couldn\\\\'t change discord name: \"\nmsgstr \"Ei voitu muuttaa Discord nimeä: \"\n\n#: /public/include/user.js\nmsgid \"By logging in or registering, you agree to the <a href=\\\"{0}\\\" target=\\\"_blank\\\">terms of use</a> and <a href=\\\"{1}\\\" target=\\\"_blank\\\">privacy policy</a>.\"\nmsgstr \"Krjautumalla sisään ja rekisteröitymällä hyväksyt <a href=\\\"{0}\\\" target=\\\"_blank\\\">käyttöehdot</a> ja <a href=\\\"{1}\\\" target=\\\"_blank\\\">tietosuojakäytännön</a>.\"\n\n#: /public/include/user.js\nmsgid \"Sign in with {0}\"\nmsgstr \"Kirjaudu sisään käyttäen {0}\"\n\n#: /public/include/user.js\nmsgid \"New Accounts Disabled\"\nmsgstr \"Uudet Tilit Poistettu käytöstä\"\n\n#: /public/include/user.js\nmsgid \"online\"\nmsgstr \"paikalla\"\n\n#: /public/include/user.js\nmsgid \"Sign Out\"\nmsgstr \"Kirjaudu Ulos\"\n\n#: /public/include/user.js\nmsgid \"Are you sure you want to sign out?\"\nmsgstr \"Oletko varma että haluat kirjautua ulos?\"\n\n#: /public/include/user.js\nmsgid \"You are permanently banned.\"\nmsgstr \"Sinulla on lopullinen porttikielto.\"\n\n#: /public/include/user.js\nmsgid \"You are temporarily banned and will not be allowed to place until ${timestamp}\"\nmsgstr \"Sinulla on väliaikainen porttikielto ja et voi asettaa ennen aikaa ${timestamp}\"\n\n#: /public/include/user.js\nmsgid \"You can contact us using one of the links in the info menu.\"\nmsgstr \"Voit ottaa meihin yhteyttä käyttäen jotain infovalikon linkeistä.\"\n\n#: /public/include/user.js\nmsgid \"If you think this was an error, please contact us using one of the links in the info tab.\"\nmsgstr \"Jos arvelet tämän olevan virhe, ole hyvä ja ota meihin yhteyttä käyttäen jotain infovälilehden linkeistä.\"\n\n#: /public/include/user.js\nmsgid \"Ban reason:\"\nmsgstr \"Porttikiellon syy:\"\n\n#: /public/include/user.js\nmsgid \"An unknown error occurred. Please contact staff on discord\"\nmsgstr \"Tuntematon virhe tapahtui. Ole hyvä ja ota yhteyttä henkilökuntaan Discordissa\"\n\n#: /public/include/user.js\nmsgid \"Staff have required you to change your username, this usually means your name breaks one of our rules.\"\nmsgstr \"Henkilökunta on vaatinut sinun vaihtavan käyttäjänimesi, yleensä tämä tarkoittaa että nimesi rikkoo jotain säännöistämme.\"\n\n#: /public/include/user.js\nmsgid \"If you disagree, please contact us on Discord (link in the info panel).\"\nmsgstr \"Jos arvelet toisin, ole hyvä ja ota meihin yhteyttä Discordissa (linkki infopaneelissa).\"\n\n#: /public/include/user.js\nmsgid \"New Username:\"\nmsgstr \"Uuusi Käyttäjänimi:\"\n\n#: /public/include/user.js\nmsgid \"Not now\"\nmsgstr \"Ei nyt\"\n\n#: /public/include/user.js\nmsgid \"Change\"\nmsgstr \"Vaihda\"\n\n#: /public/include/user.js\nmsgid \"You must change your username.\"\nmsgstr \"Sinun täytyy vaihtaa käyttäjänimesi.\"\n\n#: /public/include/user.js\nmsgid \"Click here to continue.\"\nmsgstr \"Paina tästä jatkaaksesi.\"\n\n#: /public/pxls.js\nmsgid \"Alert\"\nmsgstr \"Hälytys\"\n";

const locale_fi_46ts_106cf8c0 = () => poToMessages(source$1);

const source = "msgid \"\"\nmsgstr \"\"\n\"Project-Id-Version: Pxls\\n\"\n\"POT-Creation-Date: 2023-12-15T14:09:43.864Z\\n\"\n\"PO-Revision-Date: 2024-04-14 10:06-0400\\n\"\n\"Last-Translator: Mikarific <mikerific2@gmail.com>\\n\"\n\"Language-Team: Toki Pona \"\n\"<https://weblate.pxls.space/projects/pxls-space/pxls-web/tok/>\\n\"\n\"Language: tok\\n\"\n\"Content-Type: text/plain; charset=utf-8\\n\"\n\"Content-Transfer-Encoding: 8bit\\n\"\n\"Plural-Forms: nplurals=1; plural=0;\\n\"\n\"X-Generator: PO File Editor https://pofile.net/free-po-editor\\n\"\n\n#: /views/error.handlebars /views/profile.handlebars /public/include/user.js\nmsgid \"My Profile\"\nmsgstr \"lipu mi\"\n\n#: /views/error.handlebars /views/profile.handlebars\nmsgid \"My Factions\"\nmsgstr \"kulupu mi\"\n\n#: /views/error.handlebars\n#. HTTP status code name\nmsgid \"Not Found\"\nmsgstr \"\"\n\n#: /views/error.handlebars\nmsgid \"\"\n\"The content you requested could not be found at this URL. If you believe \"\n\"this is an error, please contact a developer.\"\nmsgstr \"\"\n\"lipu ni li jo e ijo ala. ni li powe la, sina ken toki tawa jan pali pi musi \"\n\"Pxls.\"\n\n#: /views/error.handlebars\n#. links to the homepage (the app itself)\nmsgid \"Back to Pxls\"\nmsgstr \"o tawa musi Pxls\"\n\n#: /views/error.handlebars\n#. HTTP status code name\nmsgid \"Not Authenticated\"\nmsgstr \"\"\n\n#: /views/error.handlebars\nmsgid \"\"\n\"You must be logged in to access this data. Please go back to pxls and go \"\n\"through the authentication process.\"\nmsgstr \"\"\n\n#: /views/error.handlebars\n#. HTTP status code name\nmsgid \"Not Allowed\"\nmsgstr \"\"\n\n#: /views/error.handlebars\nmsgid \"\"\n\"The action you attempted to perform is not allowed or resulted in an error. \"\n\"Please ensure you have access to the endpoint and try again later.\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Place pixels with people to create art\"\nmsgstr \"o pana e leko li pali e sitelen lon poka jan ante\"\n\n#: /views/index.handlebars\nmsgid \"Lost connection to server, reconnecting...\"\nmsgstr \"mi ken ala toki tawa ilo la, mi toki sin...\"\n\n#: /views/index.handlebars\nmsgid \"Loading Heatmap (press <kbd>H</kbd> to cancel)\"\nmsgstr \"sitelen seli li kama lon (sina wile ala la, o kepeken e nena <kbd>H</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"Loading Virginmap (press <kbd>X</kbd> to cancel)\"\nmsgstr \"\"\n\"sitelen pi leko ala li kama lon (sina wile ala la, o kepeken e nena \"\n\"<kbd>X</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"Logout\"\nmsgstr \"o tawa\"\n\n#: /views/index.handlebars\nmsgid \"Canvas:\"\nmsgstr \"sitelen ni:\"\n\n#: /views/index.handlebars\nmsgid \"N/A\"\nmsgstr \"ala\"\n\n#: /views/index.handlebars\nmsgid \"All Time:\"\nmsgstr \"sitelen ale:\"\n\n#: /views/index.handlebars\nmsgid \"Loading online user count&hellip;\"\nmsgstr \"nanpa jan li kama lon&hellip;\"\n\n#: /views/index.handlebars /public/admin/admin.js /public/include/lookup.js\nmsgid \"Pixels\"\nmsgstr \"leko\"\n\n#: /views/index.handlebars\nmsgid \"Undo\"\nmsgstr \"o weka e leko sina\"\n\n#: /views/index.handlebars\nmsgid \"You are not signed in.\"\nmsgstr \"sina weka.\"\n\n#: /views/index.handlebars /public/include/user.js\nmsgid \"Sign in with...\"\nmsgstr \"kama la kepeken seme?\"\n\n#: /views/index.handlebars\nmsgid \"Loading...\"\nmsgstr \"mi kama lon...\"\n\n#: /views/index.handlebars\nmsgid \"Sign up\"\nmsgstr \"o jo e lipu jan\"\n\n#: /views/index.handlebars\nmsgid \"Pick a username\"\nmsgstr \"o pana e nimi sina tawa mi\"\n\n#: /views/index.handlebars\nmsgid \"Username:\"\nmsgstr \"nimi sina:\"\n\n#: /views/index.handlebars\nmsgid \"Discord Tag (Optional):\"\nmsgstr \"sina wile la, nimi sina pi ilo Siko:\"\n\n#: /views/index.handlebars\nmsgid \"Drag and drop template image\"\nmsgstr \"o pana e ilo sitelen tawa mi\"\n\n#: /views/index.handlebars\nmsgid \"Exit\"\nmsgstr \"\"\n\n#: /views/index.handlebars /views/profile.handlebars\nmsgid \"Info\"\nmsgstr \"sona suli\"\n\n#: /views/index.handlebars\nmsgid \"Close Panel\"\nmsgstr \"o weka e lipu ni\"\n\n#: /views/index.handlebars /public/include/chat.js\nmsgid \"Chat\"\nmsgstr \"poki toki\"\n\n#: /views/index.handlebars\nmsgid \"Pings\"\nmsgstr \"mu tawa sina\"\n\n#: /views/index.handlebars\nmsgid \"Settings\"\nmsgstr \"ante\"\n\n#: /views/index.handlebars\nmsgid \"Jump To Bottom\"\nmsgstr \"o lon anpa\"\n\n#: /views/index.handlebars\nmsgid \"Replying to\"\nmsgstr \"o toki tawa jan\"\n\n#: /views/index.handlebars /public/include/chat.js\nmsgid \"On\"\nmsgstr \"mu\"\n\n#: /views/index.handlebars\nmsgid \"Emoji\"\nmsgstr \"sitelen Emosi\"\n\n#: /views/index.handlebars\nmsgid \"Search\"\nmsgstr \"o alasa\"\n\n#: /views/index.handlebars\nmsgid \"keybinds;keys;keyboard;hotkeys\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Keybinds\"\nmsgstr \"ilo nena\"\n\n#: /views/index.handlebars\nmsgid \"general\"\nmsgstr \"ijo\"\n\n#: /views/index.handlebars\nmsgid \"General\"\nmsgstr \"ijo\"\n\n#: /views/index.handlebars\nmsgid \"move;moving;panning;drag\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Mouse/arrows/wasd to pan\"\nmsgstr \"sina wile tawa supa la, sina ken kepeken e ilo misa e ilo ←→↑↓ e ilo WASD.\"\n\n#: /views/index.handlebars\nmsgid \"mousewheel;zooming\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Scroll/pinch to zoom\"\nmsgstr \"sina wile tawa suli la, sina ken tawa sike e nena lon ilo misa.\"\n\n#: /views/index.handlebars\nmsgid \"scroll;zooming\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>+</kbd>/<kbd>-</kbd> or <kbd>Q</kbd>/<kbd>E</kbd> to zoom\"\nmsgstr \"\"\n\"nena <kbd>+</kbd>/nena <kbd>-</kbd> en nena <kbd>Q</kbd>/nena <kbd>E</kbd> \"\n\"li ken tawa suli.\"\n\n#: /views/index.handlebars\nmsgid \"lookups\"\nmsgstr \"alasa\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>Shift</kbd> + Click/Hold touch to lookup pixel\"\nmsgstr \"\"\n\"sina kepeken e nena <kbd>Shift</kbd> e ilo misa la, sina ken alasa e jan pi \"\n\"pali leko.\"\n\n#: /views/index.handlebars\nmsgid \"overlays;alignment;grid hidden;grid shown;hide grid;show grid\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>G</kbd> to toggle grid\"\nmsgstr \"nena <kbd>G</kbd> la, ilo palisa li kama lon.\"\n\n#: /views/index.handlebars\nmsgid \"\"\n\"close;information shown;information hidden;info shown;info hidden;hide \"\n\"information;show information\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>I</kbd> to open info\"\nmsgstr \"nena <kbd>I</kbd> la, lipu sona li kama lon.\"\n\n#: /views/index.handlebars\nmsgid \"close;settings hidden;settings shown;hide settings;show settings\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>T</kbd> to open settings\"\nmsgstr \"nena <kbd>T</kbd> la, lipu ante li kama lon.\"\n\n#: /views/index.handlebars\nmsgid \"close;chat hidden;chat shown;hide chat;show chat\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>B</kbd> to open chat\"\nmsgstr \"nena <kbd>B</kbd> la, poki toki li kama lon.\"\n\n#: /views/index.handlebars\nmsgid \"canvas locked;move;moving;zoom;zooming\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>L</kbd> to toggle locking panning of the canvas\"\nmsgstr \"nena <kbd>L</kbd> la, sitelen li ken ala tawa.\"\n\n#: /views/index.handlebars\nmsgid \"take screenshot;image;download;picture;canvas\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>P</kbd> to take a snapshot\"\nmsgstr \"nena <kbd>P</kbd> la, sina lanpan e sitelen.\"\n\n#: /views/index.handlebars\nmsgid \"\"\n\"overlays;user activity;pixels placed pixels;heatmap hidden;heatmap \"\n\"shown;hide heatmap;show heatmap\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>H</kbd> to toggle heatmap\"\nmsgstr \"nena <kbd>H</kbd> la, sina lon e sitelen seli.\"\n\n#: /views/index.handlebars\nmsgid \"\"\n\"overlays;user activity;pixels unplaced pixels;virginmap hidden;virginmap \"\n\"shown;hide virginmap;show virginmap\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>X</kbd> to toggle virginmap\"\nmsgstr \"nena <kbd>X</kbd> la, sina lon e sitelen pi leko ala.\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels placed pixels;wipe;clean;\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>O</kbd> to clear heatmap\"\nmsgstr \"nena <kbd>O</kbd> la, sina weka e sona pi sitelen seli.\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels unplaced pixels;wipe;clean;\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>U</kbd> to clear virginmap\"\nmsgstr \"nena <kbd>U</kbd> la, sina weka e sona pi sitelen pi leko ala.\"\n\n#: /views/index.handlebars\nmsgid \"next color;previous color\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>J</kbd>/<kbd>K</kbd> to cycle through palette colors\"\nmsgstr \"nena <kbd>J</kbd>/<kbd>K</kbd> la, sina ante e kule leko.\"\n\n#: /views/index.handlebars\nmsgid \"current coordinates;coords\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>C</kbd> to copy link of moused-over coordinates\"\nmsgstr \"nena <kbd>C</kbd> la, sina lanpan e ilo linluwi pi lon sina.\"\n\n#: /views/index.handlebars\nmsgid \"cancel selection\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>ESC</kbd> to deselect current pixel\"\nmsgstr \"nena <kbd>ESC</kbd> la, sina jo ala e kule leko.\"\n\n#: /views/index.handlebars\nmsgid \"recenter;jump;center on template;guides;focus\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>R</kbd> to center the board on the current template\"\nmsgstr \"nena <kbd>R</kbd> la, sina lukin e ilo sitelen sina.\"\n\n#: /views/index.handlebars\nmsgid \"templates;guides\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Template\"\nmsgstr \"ilo sitelen\"\n\n#: /views/index.handlebars\nmsgid \"transparency\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>Page Up</kbd> to increase opacity\"\nmsgstr \"nena <kbd>Page Up</kbd> la, sina suli e lon pi ilo sitelen sina.\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>Page Down</kbd> to decrease opacity\"\nmsgstr \"nena <kbd>Page Down</kbd> la, sina lili e lon pi ilo sitelen sina.\"\n\n#: /views/index.handlebars\nmsgid \"hidden;shown;hide;show\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"<kbd>V</kbd> to toggle visibility\"\nmsgstr \"\"\n\"nena <kbd>V</kbd> la, sina weka e ilo sitelen sina anu lon e ilo sitelen \"\n\"sina.\"\n\n#: /views/index.handlebars\nmsgid \"\"\n\"Note: These values are based on QWERTY keyboards. For other layouts, use \"\n\"the keys corresponding to the same position on a QWERTY keyboard.\"\nmsgstr \"\"\n\"IJO SULI: nasin ni li nasin pi ilo pi nena mute pi nasin QWERTY. sina jo e \"\n\"ilo ante pi nena mute la, ijo li lon sama pi nasin QWERTY.\"\n\n#: /views/index.handlebars\nmsgid \"templates;overlays;guides\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"templates;overlays;image;pixel art\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"\"\n\"template enabled;template disabled;show template;hide template;template \"\n\"shown;template hidden\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Use template\"\nmsgstr \"o kepeken e ilo sitelen\"\n\n#: /views/index.handlebars\nmsgid \"\"\n\"Hold down <kbd>Ctrl</kbd> (or <kbd>Option</kbd> on mac) to drag the \"\n\"template around\"\nmsgstr \"\"\n\"sina wile tawa supa e ilo sitelen la, o awen kepeken e nena <kbd>Ctrl</kbd> \"\n\"(sina kepeken e ilo MacOS la, o kepeken e nena <kbd>Option</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"template title;template name;tab name;tab title;title=\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Title:\"\nmsgstr \"nimi pi ilo sitelen:\"\n\n#: /views/index.handlebars\nmsgid \"template location source;template source URL;template URL;template=\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"URL:\"\nmsgstr \"tan pi ilo sitelen (ilo linluwi):\"\n\n#: /views/index.handlebars\nmsgid \"\"\n\"template position;template x;template y;template location; template \"\n\"vertical; template horizontal;ox=;oy=\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Horizontal position:\"\nmsgstr \"nanpa X pi ilo sitelen:\"\n\n#: /views/index.handlebars\nmsgid \"Vertical position:\"\nmsgstr \"nanpa Y pi ilo sitelen:\"\n\n#: /views/index.handlebars\nmsgid \"template width;tw=\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Width:\"\nmsgstr \"nanpa suli pi ilo sitelen:\"\n\n#: /views/index.handlebars\nmsgid \"Reset\"\nmsgstr \"o sin\"\n\n#: /views/index.handlebars\nmsgid \"template style;custom template\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Style:\"\nmsgstr \"nasin pi ilo sitelen:\"\n\n#: /views/index.handlebars\nmsgid \"Use Source Style\"\nmsgstr \"nasin ala\"\n\n#: /views/index.handlebars\nmsgid \"1-to-1\"\nmsgstr \"nasin pi nanpa wan\"\n\n#: /views/index.handlebars\nmsgid \"1-to-1 (keep incorrect colors)\"\nmsgstr \"nasin pi nanpa wan (o awen e kule powe)\"\n\n#: /views/index.handlebars\nmsgid \"Dotted (Small, 1:2)\"\nmsgstr \"nasin sike (lili, 1:2)\"\n\n#: /views/index.handlebars\nmsgid \"Dotted (Big, 2:2)\"\nmsgstr \"nasin sike (suli, 2:2)\"\n\n#: /views/index.handlebars\nmsgid \"Symbols\"\nmsgstr \"nasin pi sitelen musi\"\n\n#: /views/index.handlebars\nmsgid \"Numbers\"\nmsgstr \"nasin nanpa\"\n\n#: /views/index.handlebars\nmsgid \"Custom…\"\nmsgstr \"nasin sina…\"\n\n#: /views/index.handlebars\nmsgid \"template style source;template style URL;custom style URL;custom template\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Custom style URL:\"\nmsgstr \"tan pi nasin pi ilo sitelen (ilo linluwi):\"\n\n#: /views/index.handlebars\nmsgid \"template conversion;template palette conversion;convert to palette\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Color Conversion Mode:\"\nmsgstr \"nasin pi ante kule:\"\n\n#: /views/index.handlebars\nmsgid \"Unconverted\"\nmsgstr \"o ante ala e kule\"\n\n#: /views/index.handlebars\nmsgid \"Nearest Custom\"\nmsgstr \"o ante e kule\"\n\n#: /views/index.handlebars\nmsgid \"template transparency;template opacity;oo=\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Opacity:\"\nmsgstr \"lon pi ilo sitelen:\"\n\n#: /views/index.handlebars\nmsgid \"ui;interface\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"UI Settings\"\nmsgstr \"ante lukin\"\n\n#: /views/index.handlebars\nmsgid \"language override;text\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Language override:\"\nmsgstr \"o kepeken e toki ni:\"\n\n#: /views/index.handlebars\nmsgid \"Use Browser Language\"\nmsgstr \"toki pi ilo sina\"\n\n#: /views/index.handlebars\nmsgid \"English\"\nmsgstr \"toki Inli\"\n\n#: /views/index.handlebars\nmsgid \"Bulgarian\"\nmsgstr \"toki Pokasi\"\n\n#: /views/index.handlebars\nmsgid \"French\"\nmsgstr \"toki Kanse\"\n\n#: /views/index.handlebars\nmsgid \"German\"\nmsgstr \"toki Tosi\"\n\n#: /views/index.handlebars\nmsgid \"Russian\"\nmsgstr \"toki Losi\"\n\n#: /views/index.handlebars\nmsgid \"Swedish\"\nmsgstr \"toki Sensa\"\n\n#: /views/index.handlebars\nmsgid \"Finnish\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Toki Pona\"\nmsgstr \"toki pona\"\n\n#: /views/index.handlebars\nmsgid \"themes;look;stylesheets;visuals\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Theme:\"\nmsgstr \"lukin lipu:\"\n\n#: /views/index.handlebars\nmsgid \"Default\"\nmsgstr \"walo\"\n\n#: /views/index.handlebars\nmsgid \"\"\n\"hide reticule;hide reticle;reticule shown reticle shown;reticule \"\n\"hidden;reticle hidden\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Show reticule\"\nmsgstr \"o lon e lukin pi leko kama lon\"\n\n#: /views/index.handlebars\nmsgid \"hide cursor;cursor shown;cursor hidden\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Show cursor\"\nmsgstr \"o lon e lukin pi kule sina\"\n\n#: /views/index.handlebars\nmsgid \"darkness filter\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Enable color brightness\"\nmsgstr \"ken pi ante pimeja\"\n\n#: /views/index.handlebars\nmsgid \"Warning: Known to cause fuzziness in Chrome on some Mac/Linux installs\"\nmsgstr \"IJO SULI: sina kepeken e ilo MacOS anu ilo Linux la, ni li ken nasa.\"\n\n#: /views/index.handlebars\nmsgid \"Color brightness:\"\nmsgstr \"pimeja kule:\"\n\n#: /views/index.handlebars\nmsgid \"keep current selected;keep curent color;place\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Deselect color after placing\"\nmsgstr \"sina pana e leko la, o jo ala e kule\"\n\n#: /views/index.handlebars\nmsgid \"mousewheel;palette scrolling\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Enable scrolling on the palette to switch colors\"\nmsgstr \"sina ken tawa e kule kepeken ilo misa\"\n\n#: /views/index.handlebars\nmsgid \"\"\n\"reverse scrolling;mousewheel;palette scrolling;enable scrolling on the \"\n\"palette to switch colors\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Invert scroll direction\"\nmsgstr \"o ante e tawa poka kule\"\n\n#: /views/index.handlebars\nmsgid \"indexed colors;palette indicies\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Add numbers to palette entries\"\nmsgstr \"o pana e nanpa tawa kule\"\n\n#: /views/index.handlebars\nmsgid \"scrollbar;palette scrolling\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Enable thin scrollbar\"\nmsgstr \"o lili e palisa tawa\"\n\n#: /views/index.handlebars\nmsgid \"scrollbar;palette scrolling;palette stack\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Enable palette stacking\"\nmsgstr \"o kulupu mute e kule\"\n\n#: /views/index.handlebars\nmsgid \"floating bubble location\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Bubble position:\"\nmsgstr \"lon pi toki suli:\"\n\n#: /views/index.handlebars\nmsgid \"Top left\"\nmsgstr \"sewi nanpa wan\"\n\n#: /views/index.handlebars\nmsgid \"Top right\"\nmsgstr \"sewi nanpa tu\"\n\n#: /views/index.handlebars\nmsgid \"Bottom left\"\nmsgstr \"anpa nanpa wan\"\n\n#: /views/index.handlebars\nmsgid \"Bottom right\"\nmsgstr \"anpa nanpa tu\"\n\n#: /views/index.handlebars\nmsgid \"broken;offset workaround\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Attempt to fix canvas displacement bug in Chrome 78+\"\nmsgstr \"o pona e nasa pi ilo Chrome pi nanpa 78+\"\n\n#: /views/index.handlebars\nmsgid \"chat;message;ping sound\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Chat Settings\"\nmsgstr \"poki toki\"\n\n#: /views/index.handlebars\nmsgid \"username;color;colour\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Username Color:\"\nmsgstr \"kule pi nimi sina:\"\n\n#: /views/index.handlebars\nmsgid \"chat message;chat ui\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Interface\"\nmsgstr \"lukin pi poki toki\"\n\n#: /views/index.handlebars\nmsgid \"enable;disable\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Enable chat\"\nmsgstr \"o lon e poki toki\"\n\n#: /views/index.handlebars\nmsgid \"Page must be reloaded after changing\"\nmsgstr \"sina ante e ni la, sina wile kama lon sin e lipu Pxls.\"\n\n#: /views/index.handlebars\nmsgid \"chat size;chat font\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Font Size:\"\nmsgstr \"nanpa pi suli toki:\"\n\n#: /views/index.handlebars\nmsgid \"time;timestamps\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"24 Hour Timestamps\"\nmsgstr \"o kepeken e nasin tenpo 24\"\n\n#: /views/index.handlebars\nmsgid \"badges;pixel count;pixels placed\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Show pixel-placed badges\"\nmsgstr \"o lon e nanpa pi pana leko\"\n\n#: /views/index.handlebars\nmsgid \"badges;factions\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Show faction tags\"\nmsgstr \"o lon e nimi pi kulupu jan\"\n\n#: /views/index.handlebars\nmsgid \"template urls;template links;template name\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Replace template titles with URLs in chat where applicable\"\nmsgstr \"ilo linluwi pi ilo sitelen li lon la, o kepeken ala e nimi ona\"\n\n#: /views/index.handlebars\nmsgid \"chat orientation;chat position\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Enable horizontal chat\"\nmsgstr \"o supa e poki toki\"\n\n#: /views/index.handlebars\nmsgid \"banner;animation\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Enable the rotating banner under chat\"\nmsgstr \"o lon e toki suli lon anpa pi poki toki\"\n\n#: /views/index.handlebars\nmsgid \"max;messages;truncate\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Maximum amount of chat messages:\"\nmsgstr \"nanpa pi toki lon poki toki:\"\n\n#: /views/index.handlebars\nmsgid \"link;url;behaviour\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Default internal link action click:\"\nmsgstr \"ilo sitelen lon poki toki la, mi pali e seme?:\"\n\n#: /views/index.handlebars\nmsgid \"link;url;behaviour;external;bypass;skip\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Skip external link popup\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Note: Has no effect if external link popups are disabled by the server.\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"chat icon;chat notifications;chat ping\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Chat icon badge mode:\"\nmsgstr \"nasin pi sike lon sitelen pi poki toki:\"\n\n#: /views/index.handlebars\nmsgid \"Show on unread ping\"\nmsgstr \"jan li mu tawa sina, o lon\"\n\n#: /views/index.handlebars\nmsgid \"Show on unread message\"\nmsgstr \"jan li toki, o lon\"\n\n#: /views/index.handlebars\nmsgid \"Never show\"\nmsgstr \"o lon ala\"\n\n#: /views/index.handlebars\nmsgid \"chat icon;chat notifications;chat message\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Chat icon highlight mode:\"\nmsgstr \"nasin pi kule lon sitelen pi poki toki:\"\n\n#: /views/index.handlebars\nmsgid \"ignored;ignores;unignore;blocked;blocking;unblock\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Ignores\"\nmsgstr \"jan weka\"\n\n#: /views/index.handlebars\nmsgid \"unignore;unblock\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Unignore\"\nmsgstr \"o weka ala\"\n\n#: /views/index.handlebars\nmsgid \"overlays;virginmap;heatmap;grid\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Overlay Settings\"\nmsgstr \"sitelen sinpin\"\n\n#: /views/index.handlebars\nmsgid \"heatmap;heatmap opacity;clear heatmap\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Heatmap\"\nmsgstr \"sitelen seli\"\n\n#: /views/index.handlebars\nmsgid \"Turn on heatmap\"\nmsgstr \"o lon e sitelen seli\"\n\n#: /views/index.handlebars\nmsgid \"(toggle with <kbd>H</kbd>)\"\nmsgstr \"(o kepeken e nena <kbd>H</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"overlays;activity;pixels placed pixels;wipe;clean\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Clear heatmap\"\nmsgstr \"o weka e sona pi sitelen seli\"\n\n#: /views/index.handlebars\nmsgid \"(hotkey: <kbd>O</kbd>)\"\nmsgstr \"(sina ken kepeken e nena <kbd>O</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels placed pixels;transparency\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Heatmap background opacity:\"\nmsgstr \"sitelen seli la, suli lukin:\"\n\n#: /views/index.handlebars\nmsgid \"virginmap;virginmap opacity;clear virginmap\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Virginmap\"\nmsgstr \"sitelen pi leko ala\"\n\n#: /views/index.handlebars\nmsgid \"Turn on virginmap\"\nmsgstr \"o lon e sitelen pi leko ala\"\n\n#: /views/index.handlebars\nmsgid \"(toggle with <kbd>X</kbd>)\"\nmsgstr \"(o kepeken e nena <kbd>X</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"overlays;user activity;pixels unplaced pixels;transparency\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Virginmap background opacity:\"\nmsgstr \"sitelen pi leko ala la, suli lukin:\"\n\n#: /views/index.handlebars\nmsgid \"overlays;activity;pixels unplaced pixels;wipe;clean\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Clear virginmap\"\nmsgstr \"sitelen pi leko ala la, o weka e sona\"\n\n#: /views/index.handlebars\nmsgid \"(hotkey: <kbd>U</kbd>)\"\nmsgstr \"(sina ken kepeken e nena <kbd>U</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"Layer template underneath heatmap\"\nmsgstr \"o monsi e ilo sitelen lon monsi pi sitelen seli\"\n\n#: /views/index.handlebars\nmsgid \"grid;toggle grid\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Grid\"\nmsgstr \"ilo palisa\"\n\n#: /views/index.handlebars\nmsgid \"Turn on grid\"\nmsgstr \"o lon e ilo palisa\"\n\n#: /views/index.handlebars\nmsgid \"(toggle with <kbd>G</kbd>)\"\nmsgstr \"(o kepeken e nena <kbd>G</kbd>)\"\n\n#: /views/index.handlebars\nmsgid \"controls;zooming;panning;movement\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Control Settings\"\nmsgstr \"nasin tawa\"\n\n#: /views/index.handlebars\nmsgid \"zooming;scrolling;scale;scaling\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Zooming\"\nmsgstr \"tawa suli\"\n\n#: /views/index.handlebars\nmsgid \"scrolling sensitivity;zooming sensitivity;mousewheel sensitivity\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Zoom sensitivity:\"\nmsgstr \"tawa pi tawa suli:\"\n\n#: /views/index.handlebars\nmsgid \"zooming limit;scrolling limit;mousewheel;zooming minimum;zooming maximum\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Minimum scale:\"\nmsgstr \"nanpa li ni, sitelen ken ala lili:\"\n\n#: /views/index.handlebars\nmsgid \"Maximum scale:\"\nmsgstr \"nanpa li ni, sitelen ken ala suli:\"\n\n#: /views/index.handlebars\nmsgid \"rounding;zooming;scrolling;mousewheel;integer;decimal\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Round zoom values to nearest whole number\"\nmsgstr \"o ante e nanpa pi suli sitelen tawa nanpa suli\"\n\n#: /views/index.handlebars\nmsgid \"controls;miscellaneous\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Lock the canvas (disallow canvas drag/zoom with mouse/fingers)\"\nmsgstr \"o weka e ken pi tawa sitelen\"\n\n#: /views/index.handlebars\nmsgid \"MMB picker;mouse picker;selection;palette picker\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Enable middle mouse button selecting color from board\"\nmsgstr \"nena lon sike pi ilo misa li ken lanpan e kule\"\n\n#: /views/index.handlebars\nmsgid \"right click action\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Right-click action:\"\nmsgstr \"nasin pi ilo tu lon ilo misa:\"\n\n#: /views/index.handlebars\nmsgid \"Nothing\"\nmsgstr \"o ala\"\n\n#: /views/index.handlebars\nmsgid \"Clear color\"\nmsgstr \"o weka e kule\"\n\n#: /views/index.handlebars\nmsgid \"Copy color\"\nmsgstr \"o lanpan e kule\"\n\n#: /views/index.handlebars\nmsgid \"Lookup\"\nmsgstr \"o alasa e jan pi pali leko\"\n\n#: /views/index.handlebars\nmsgid \"Clear color + Lookup\"\nmsgstr \"o weka e kule li alasa e jan pi pali leko\"\n\n#: /views/index.handlebars\nmsgid \"snapshots;screenshot;download;picture;canvas\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Snapshot Settings\"\nmsgstr \"nasin pi lanpan sitelen\"\n\n#: /views/index.handlebars\nmsgid \"screenshot;snapshot;download;board;canvas\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"take screenshot;image;download format;picture;canvas;board\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Snapshot image format:\"\nmsgstr \"nasin pi sitelen lanpan:\"\n\n#: /views/index.handlebars\nmsgid \"PNG\"\nmsgstr \"PNG\"\n\n#: /views/index.handlebars\nmsgid \"JPEG\"\nmsgstr \"JPEG\"\n\n#: /views/index.handlebars\nmsgid \"WEBP (Chrome only)\"\nmsgstr \"WEBP (ilo Chrome taso)\"\n\n#: /views/index.handlebars\nmsgid \"sound;notification;alert;notify;ping\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Sound and Notification Settings\"\nmsgstr \"nasin kalama en nasin mu\"\n\n#: /views/index.handlebars\nmsgid \"audio;mute;noise;volume\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Enable sound\"\nmsgstr \"kalama li lon\"\n\n#: /views/index.handlebars\nmsgid \"notifs;notify;pixel notification\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Enable pixel available notification\"\nmsgstr \"sina jo e leko la, mi mu tawa sina\"\n\n#: /views/index.handlebars\nmsgid \"notification;pixel ready;alert\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Pixel Ready Notification\"\nmsgstr \"mu pi jo leko\"\n\n#: /views/index.handlebars\nmsgid \"alert source;notify url;notify source;notification url;notification source\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Alert URL:\"\nmsgstr \"ilo linluwi pi kalama mu:\"\n\n#: /views/index.handlebars\nmsgid \"Update\"\nmsgstr \"o ante\"\n\n#: /views/index.handlebars\nmsgid \"Test\"\nmsgstr \"o kute\"\n\n#: /views/index.handlebars\nmsgid \"sound level;audio level;mute audio;mute sound\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Volume:\"\nmsgstr \"suli kalama:\"\n\n#: /views/index.handlebars\nmsgid \"alert forewarning;alert delay; notification delay; notification forewarning\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Delay (seconds):\"\nmsgstr \"nanpa awen:\"\n\n#: /views/index.handlebars\nmsgid \"chat mentions;chat pings;chat sound\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Chat Pings\"\nmsgstr \"mu pi poki toki\"\n\n#: /views/index.handlebars\nmsgid \"Enable pings\"\nmsgstr \"o lon e mu pi poki toki\"\n\n#: /views/index.handlebars\nmsgid \"mention sound\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Play sound on ping:\"\nmsgstr \"mu pi poki toki li lon la, nasin kalama li ni:\"\n\n#: /views/index.handlebars /public/include/chat.js\n#, fuzzy\nmsgid \"Off\"\nmsgstr \"mu ala\"\n\n#: /views/index.handlebars\nmsgid \"Only when necessary\"\nmsgstr \"ona li suli la, mi kalama\"\n\n#: /views/index.handlebars\nmsgid \"Always\"\nmsgstr \"tenpo ale la, mi kalama\"\n\n#: /views/index.handlebars\nmsgid \"mention sound volume\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Ping sound volume:\"\nmsgstr \"suli pi kalama mu:\"\n\n#: /views/index.handlebars\nmsgid \"personal account\"\nmsgstr \"\"\n\n#: /views/index.handlebars\nmsgid \"Account Settings\"\nmsgstr \"ante pi lipu sina\"\n\n#: /views/index.handlebars\nmsgid \"Public Discord name:\"\nmsgstr \"nimi sina pi ilo Siko:\"\n\n#: /views/index.handlebars /public/include/chat.js\nmsgid \"Set\"\nmsgstr \"o ante\"\n\n#: /views/index.handlebars\nmsgid \"Remove\"\nmsgstr \"o weka\"\n\n#: /views/index.handlebars\nmsgid \"Help\"\nmsgstr \"sona nasin\"\n\n#: /views/index.handlebars\nmsgid \"Notifications\"\nmsgstr \"sona sin\"\n\n#: /views/partials/faq.handlebars\nmsgid \"FAQ\"\nmsgstr \"wile sona pi jan mute\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Why is the cooldown as long as it is?\"\nmsgstr \"mi pana e leko la, mi awen tan seme?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"\"\n\"The time it takes to get a pixel is dynamic, and changes based on how many \"\n\"people are online. The cooldown time is longer when more users are online.\"\nmsgstr \"\"\n\"sina pana e leko la, sina awen. tenpo awen li ante. jan mute li lon la, \"\n\"tenpo awen li suli. jan lili li lon la, tenpo awen li lili.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Why does it say 0/6 pixels?\"\nmsgstr \"ona li toki e nimi \\\"0/6\\\" tan seme?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"\"\n\"This means that you are waiting for your next pixel. When you place a \"\n\"pixel, there is a cooldown for when you can place the next one. Over time, \"\n\"you can gain up to 6 \\\"stacked\\\" pixels to place at once.\"\nmsgstr \"\"\n\"ona li toki e nimi 0/6 la, sina awen. sina pana e leko la, sina ken pana e \"\n\"leko sin lon tenpo kama lili. taso, sina awen awen la, sina kama jo e leko \"\n\"mute. sina jo e leko mute la, sina ken pana e leko mute.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Why does it take so long to \\\"stack\\\" pixels?\"\nmsgstr \"\"\n\"mi kama jo e leko wan la, mi awen kepeken tenpo lili. taso, mi kama jo e \"\n\"leko mute la, mi awen kepeken tenpo mute. ni li tan seme?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"\"\n\"This is by design. It is better to place a pixel as soon as you get one. \"\n\"Pixel \\\"stacking\\\" is meant to give you a bump if you go AFK for a bit. It \"\n\"takes around 40 minutes to get a full 6/6 pixels, but it only takes around \"\n\"3 minutes to place 6 pixels if you place them as soon as possible.\"\nmsgstr \"\"\n\"ni li nasin pi musi Pxls. sina jo e leko la, o awen ala o pana e leko. sina \"\n\"jo e leko li awen la, awen pi leko sin li kepeken tenpo suli. taso, sina jo \"\n\"e leko li pana e leko la, awen pi leko sin li kepeken tenpo lili.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I appeal a ban?\"\nmsgstr \"jan pali li weka e mi. mi wile kama lon sin la, mi seme?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"\"\n\"Contact us on <a href=\\\"https://pxls.space/discord\\\" \"\n\"target=\\\"_blank\\\">Discord</a> or send an appeal to our <a \"\n\"href=\\\"https://pxls.space/appeal\\\" target=\\\"_blank\\\">Google form</a> after \"\n\"reading the rules in the site's info panel.\"\nmsgstr \"\"\n\"sina lukin e sona kulupu la, sina ken toki tawa jan pali lon <a \"\n\"href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">ilo Siko</a> li ken \"\n\"toki tawa jan pali lon <a href=\\\"https://pxls.space/appeal\\\" \"\n\"target=\\\"_blank\\\">lipu pi kama lon sin</a>.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I make a template?\"\nmsgstr \"mi pali e ilo sitelen kepeken seme?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"A template is an image link that is posted in the template textbox in the settings panel so you can place over it on the canvas. You may use a regular image link to your pixel art, but many people use 3rd party tools like <a href=\\\"https://discord.gg/5MVDCq53vC\\\" target=\\\"blank\\\">Clueless</a> to turn pixel art into a fancier link. If you need to make pixel art yourself, you can use <a href=\\\"https://www.piskelapp.com/p/create\\\" target=\\\"_blank\\\">Piskel</a> to create art to put into Clueless.\"\nmsgstr \"ilo sitelen li ilo linluwi sitelen. sina pana e ilo linluwi tawa lipu ante la, ona li kama lon sinpin sitelen. sina ken kepeken e sitelen pi namako ala... taso, jan mute li kepeken e <a href=\\\"https://discord.gg/5MVDCq53vC\\\" target=\\\"blank\\\">ilo Clueless</a>. ilo ni li namako e sitelen sina li pali e ilo linluwi namako. sina wile pali e sitelen leko la, sina ken kepeken e <a href=\\\"https://www.piskelapp.com/p/create\\\" target=\\\"_blank\\\">ilo Piskel</a>.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I move a template?\"\nmsgstr \"mi tawa e ilo sitelen kepeken seme?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"\"\n\"Hold <kbd>CTRL</kbd> (or <kbd>OPTION</kbd> on macOS) and click and drag to \"\n\"move it around. On mobile, you can tap and hold where you want to move the \"\n\"template and click \\\"Move Template Here\\\" in the pop-up.\"\nmsgstr \"\"\n\"sina wile tawa supa e ilo sitelen la, o awen kepeken e nena <kbd>Ctrl</kbd> \"\n\"(sina kepeken e ilo MacOS la, o kepeken e nena <kbd>Option</kbd>). sina \"\n\"kepeken e ilo nanpa lili la, sina ken awen luka lon lon li luka e \\\"o tawa \"\n\"e ilo sitelen\\\".\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Does the canvas reset? When?\"\nmsgstr \"sitelen li kama sin anu seme? ona li kama sin lon tenpo seme?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"\"\n\"Yes. The canvas resets when it is completely full. A reset date is not \"\n\"usually decided until the canvas is full, but the average canvas life-span \"\n\"is around 1 month. Updates are posted in our <a \"\n\"href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord server</a> \"\n\"when a reset date is set.\"\nmsgstr \"\"\n\"sitelen li jo e sitelen lili mute la, ona li kama sin. tenpo pi sitelen sin \"\n\"li kama la, jan pali li pana e tenpo tawa sina lon <a \"\n\"href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">ilo Siko</a>.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"Where can I see the past canvases?\"\nmsgstr \"mi lukin e sitelen pini lon seme?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"\"\n\"The past canvases are featured on our <a \"\n\"href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord server</a>, \"\n\"or the 3rd party website <a href=\\\"https://pxlsfiddle.com\\\" \"\n\"target=\\\"_blank\\\">PxlsFiddle</a>, which records timelapses and a lot of \"\n\"useful information on each canvas.\"\nmsgstr \"\"\n\"jan pali li pana e sitelen pini lon <a href=\\\"https://pxls.space/discord\\\" \"\n\"target=\\\"_blank\\\">ilo Siko</a>. kin la, <a href=\\\"https://pxlsfiddle.com\\\" \"\n\"target=\\\"_blank\\\">ilo PxlsFiddle</a> li pana e sitelen pini.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I see who placed a pixel?\"\nmsgstr \"mi wile alasa e jan pi pali leko la, mi seme?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"\"\n\"By shift-clicking (or tap and hold on mobile) a pixel, you can see who \"\n\"placed a pixel, how many pixels they have placed, and when they placed it.\"\nmsgstr \"\"\n\"sina kepeken e nena <kbd>Shift</kbd> li luka e ilo misa la, sina ken alasa \"\n\"e jan pi pali leko. sina kepeken e ilo nanpa lili la, sina ken awen luka.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I report someone?\"\nmsgstr \"jan li ike la, mi toki e ni tawa jan pali kepeken seme?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"\"\n\"Shift-click (or tap and hold on mobile) on a pixel, and click the Report \"\n\"button.\"\nmsgstr \"\"\n\"sina o kepeken e nena <kbd>Shift</kbd> li luka e ilo misa o alasa e jan pi \"\n\"pali leko. lipu ni la, sina ken kepeken e nena \\\"jan ni li ike\\\".\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I change the color of my name in the chat?\"\nmsgstr \"mi wile kule e nimi mi la, mi seme?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"There is a \\\"Username Color\\\" option near the bottom of the settings panel.\"\nmsgstr \"sina ken kule e nimi sina lon lipu ante.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"What is a \\\"virginmap\\\"?\"\nmsgstr \"sitelen pi leko ala li seme?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"\"\n\"The virginmap shows which pixels have not yet been placed on (or “virgin” \"\n\"pixels).\"\nmsgstr \"\"\n\"sitelen pi leko ala li sitelen pi pali jan. jan ala li pana e leko la, leko \"\n\"li laso. jan li pana e leko la, leko li pimeja.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I report bugs?\"\nmsgstr \"ilo Pxls li nasa la, mi toki tawa seme?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"\"\n\"Submit bugs to the #dev-and-bugs channel in the <a \"\n\"href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">Discord server</a>. \"\n\"If you have found an exploit, please message one of the staff members \"\n\"privately (through DMs).\"\nmsgstr \"\"\n\"sina ken toki tawa poki \\\"#dev-and-bugs\\\" lon <a \"\n\"href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">ilo Siko</a>. sina jo \"\n\"e nasa suli la, o toki tawa jan pali.\"\n\n#: /views/partials/faq.handlebars\nmsgid \"How do I get more info or contact staff?\"\nmsgstr \"mi wile kama sona anu wile toki tawa jan pali la, mi seme?\"\n\n#: /views/partials/faq.handlebars\nmsgid \"\"\n\"Check the info panel (the icon on the top left) for more details and links, \"\n\"or join our <a href=\\\"https://pxls.space/discord\\\" \"\n\"target=\\\"_blank\\\">Discord server</a>, where a staff member will gladly \"\n\"respond.\"\nmsgstr \"\"\n\"sina wile sona la, o lukin e lipu sona. sina wile toki tawa jan pali la o \"\n\"kama lon <a href=\\\"https://pxls.space/discord\\\" target=\\\"_blank\\\">ilo \"\n\"Siko</a>. sina kama lon ilo Siko la, jan pali li ken toki tawa sina.\"\n\n#: /views/partials/info.handlebars\nmsgid \"Welcome!\"\nmsgstr \"toki a!\"\n\n#: /views/partials/info.handlebars\nmsgid \"\"\n\"Welcome to pxls.space! Pxls is a multiplayer online collaborative canvas \"\n\"based on Reddit's <a href=\\\"https://www.reddit.com/r/place\\\" \"\n\"target=\\\"_blank\\\">r/place</a> event from 2017 that allows you to create \"\n\"anything you can imagine, one pixel at a time. Join hundreds of other \"\n\"players in the Pxls community and create amazing works of art together as a \"\n\"team, or solo.\"\nmsgstr \"\"\n\"toki a! ni li musi Pxls. musi Pxls li sama musi <a \"\n\"href=\\\"https://www.reddit.com/r/place\\\" target=\\\"_blank\\\">r/place</a>. sina \"\n\"pana e leko tawa ona. sina awen la, sina ken pana e leko sin tawa musi \"\n\"Pxls. jan mute li pana la, sina mute li ken pali e sitelen suli.\"\n\n#: /views/partials/info.handlebars\nmsgid \"The best place to reach staff and fellow community is in the discord!\"\nmsgstr \"\"\n\"sina wile toki tawa jan ante anu jan pali lon kulupu la, o kama lon ilo \"\n\"Siko!\"\n\n#: /views/partials/info.handlebars\nmsgid \"\"\n\"Check out our social media pages, and please take the time to read the \"\n\"rules below. Have fun creating (or changing) art!\"\nmsgstr \"o lukin e lipu ante Pxls. o lukin e nasin lawa lon anpa. o musi!\"\n\n#: /views/partials/info.handlebars\nmsgid \"Canvas Rules\"\nmsgstr \"nasin lawa sitelen\"\n\n#: /views/partials/info.handlebars\nmsgid \"\"\n\"We pride ourselves on trying to keep an open canvas for all free from \"\n\"outside interference on our end, and especially censorship. However, for \"\n\"the good of the community and on accounts of our own beliefs, please \"\n\"acknowledge and obey the following guidelines:\"\nmsgstr \"\"\n\"kulupu Pxls li wile jo e sitelen pi jan ale li wile jo e kulupu pona. tan \"\n\"ni la, sina wile awen lon kulupu ni la o sona e ni:\"\n\n#: /views/partials/info.handlebars\nmsgid \"\"\n\"No hateful imagery or derogatory speech. This includes but is not limited \"\n\"to words such as <i>f****t</i>, <i>n****r</i>, etc; as well as the \"\n\"Swastika, Hammer and Sickle, and any symbols of terrorism.\"\nmsgstr \"\"\n\"o toki pona tawa jan ale. o toki ala e nimi ike. o pali ala e sitelen ike \"\n\"tawa jan ante e sitelen \\\"Swastika\\\" e sitelen \\\"Hammer and Sickle\\\".\"\n\n#: /views/partials/info.handlebars\nmsgid \"No NSFW or NSFL content.\"\nmsgstr \"o pana ala e ijo unpa.\"\n\n#: /views/partials/info.handlebars\nmsgid \"No nudity or otherwise sexually explicit content\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"No female-presenting nipples/bare breasts, genitalia, sexual fluids\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"No sexual imagery/erotica\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"No excessive blood or otherwise obscene/shocking content\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"\"\n\"No more than <b>one</b> account per user, no exceptions. Multiple account \"\n\"users will be banned from creating art on the canvas.\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"No auto-placement tools of any kind, you must place the pixels manually.\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"\"\n\"Do not abuse site functionality, such as reports or lookups. (e.g. \"\n\"automated reporting/lookups, etc.)\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"\"\n\"Any automated aggregation of data from user lookups is not allowed, and \"\n\"will result in a ban.\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Staff have final say in any rule disputes\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"\"\n\"If you feel a moderator has acted inappropriately, please report it to an \"\n\"administrator.\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"\"\n\"If you believe you have been falsely banned you may contact a moderator or \"\n\"administrator.\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Chat Rules\"\nmsgstr \"nasin lawa pi poki toki\"\n\n#: /views/partials/info.handlebars\nmsgid \"Keep chat civil. No harassment or homophobic/transphobic/disablist language.\"\nmsgstr \"o toki pona tawa jan ale. \"\n\n#: /views/partials/info.handlebars\nmsgid \"No hate speech. This includes emoji/symbols/ASCII art.\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Normal swearing/etc is allowed\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"No spamming\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"This includes excessive ASCII art/emojis/symbols/whitespace\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"No \\\"copy pasta\\\"s\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"\"\n\"No links to sites that actively break the canvas or chat rules (e.g. porn \"\n\"sites)\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"No symbology which break the canvas or chat rules (e.g. NSFW ASCII art)\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"No personal information\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Links\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Discord (main hub)\"\nmsgstr \"ilo Siko\"\n\n#: /views/partials/info.handlebars\nmsgid \"Subreddit\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Twitter\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"GitHub\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Single-player mode\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Statistics\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Profile (user info, factions, etc.)\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Generator, progress checker, and monitor for Pxls templates\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Archives\"\nmsgstr \"sitelen pini awen\"\n\n#: /views/partials/info.handlebars\nmsgid \"PxlsFiddle (archives)\"\nmsgstr \"\"\n\n#: /views/partials/info.handlebars\nmsgid \"Donate\"\nmsgstr \"pana mani\"\n\n#: /views/partials/info.handlebars\nmsgid \"\"\n\"Donations are not accepted at this time, but this panel will be updated \"\n\"when they're open again!\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"{0}'s Profile\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"My Data\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Reports\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Factions\"\nmsgstr \"kulupu\"\n\n#: /views/profile.handlebars\nmsgid \"Data\"\nmsgstr \"sona awen\"\n\n#: /views/profile.handlebars\nmsgid \"You must be logged in to view your profile.\"\nmsgstr \"lukin e lipu sina la sina wile kama lon\"\n\n#: /views/profile.handlebars\nmsgid \"Registration Date\"\nmsgstr \"jan li kama la tenpo ni:\"\n\n#: /views/profile.handlebars /public/include/lookup.js\nmsgid \"Alltime Pixels\"\nmsgstr \"sitelen ale\"\n\n#: /views/profile.handlebars\nmsgid \"Current Canvas Pixels\"\nmsgstr \"sitelen ni\"\n\n#: /views/profile.handlebars\nmsgid \"Discord Tag\"\nmsgstr \"nimi pi ilo Siko\"\n\n#: /views/profile.handlebars /public/include/lookup.js\nmsgid \"Faction\"\nmsgstr \"kulupu\"\n\n#: /views/profile.handlebars\nmsgid \"None\"\nmsgstr \"\"\n\n#: /views/profile.handlebars /public/admin/admin.js\nmsgid \"Roles\"\nmsgstr \"nimi pali\"\n\n#: /views/profile.handlebars\nmsgid \"Canvas Ban Expiry\"\nmsgstr \"weka sitelen li pini la\"\n\n#: /views/profile.handlebars\nmsgid \"Never\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Chat Ban Expiry\"\nmsgstr \"weka toki li pini la\"\n\n#: /views/profile.handlebars\nmsgid \"View rankings and other stats <a href=\\\"/stats\\\">here</a>.\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"You must be logged in to view your reports.\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Canvas Reports ({0}/{1} open)\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\n#. eg \"Report on Bob (closed)\nmsgid \"Report on {0} (closed)\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\n#. eg \"Report on Bob (open)\nmsgid \"Report on {0} (open)\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\n#. eg \"Reported Bob on Jan 1, 1970, 00:00:00 AM (UTC)\nmsgid \"Reported {0} on {1}\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"There are no canvas reports to show.\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Chat Reports ({0}/{1} open)\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"There are no chat reports to show.\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"You must be logged in to manage your factions.\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"\"\n\"You are faction restricted and cannot create new factions. If you believe \"\n\"this is an error, please contact a moderator.\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"\"\n\"You are canvas banned and cannot create new factions. If you believe this \"\n\"is an error, please contact a moderator.\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"You must have at least {0} all-time pixels to create a faction.\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Create\"\nmsgstr \"o pali\"\n\n#: /views/profile.handlebars\nmsgid \"Join\"\nmsgstr \"o wan\"\n\n#: /views/profile.handlebars\nmsgid \"This is your currently displayed faction.\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\n#. eg \"Pixelers (members: 100, ID: 1)\"\nmsgid \"{0} (members: {1}, ID: {2})\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Owner: {0}\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\n#. makes the faction no longer the one displayed for the current user\nmsgid \"Remove Displayed\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\n#. makes the faction the one displayed for the current user\nmsgid \"Set Displayed\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Members\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Edit\"\nmsgstr \"o ante\"\n\n#: /views/profile.handlebars /public/include/chat.js\nmsgid \"Delete\"\nmsgstr \"o ala e kulupu ni\"\n\n#: /views/profile.handlebars\nmsgid \"Leave\"\nmsgstr \"o tawa\"\n\n#: /views/profile.handlebars\nmsgid \"You are not in any factions yet!\"\nmsgstr \"sina lon kulupu ala!\"\n\n#: /views/profile.handlebars\nmsgid \"You must be logged in to view your data.\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Log Keys\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"\"\n\"Log keys can be used by those who have them to tell which pixels you placed \"\n\"on previous canvases.\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"You can see the public <a href=\\\"https://pxls.space/extra/logs/\\\" target=\\\"_blank\\\">Pxls Logs</a> to learn more.\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Canvas Code\"\nmsgstr \"nanpa len\"\n\n#: /views/profile.handlebars\nmsgid \"Log Key\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"You have no log keys yet!\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Log keys should show up here after a canvas you have placed on ends.\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Members of {0} ([{1}])\"\nmsgstr \"\"\n\n#: /views/profile.handlebars /public/admin/admin.js /public/include/lookup.js\nmsgid \"Close\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Faction Members\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\n#. This loop only fires when on our own profile. We can't leave a faction we own, we can only transfer ownership, so no point in showing ourselves in the member list.\n#. since we can't leave the faction until we transfer, if there's only one member in the list it's assumed to be the owner. we don't want to show ourself in the list\nmsgid \"Transfer Ownership\"\nmsgstr \"\"\n\n#: /views/profile.handlebars /public/include/chat.js\n#. bans a user from the faction\nmsgid \"Ban\"\nmsgstr \"o weka e jan lon\"\n\n#: /views/profile.handlebars\nmsgid \"Nothing to see here!\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Faction Bans\"\nmsgstr \"\"\n\n#: /views/profile.handlebars /public/admin/admin.js /public/include/chat.js\nmsgid \"Unban\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Find A Faction\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Search:\"\nmsgstr \"alasa:\"\n\n#: /views/profile.handlebars\nmsgid \"Enter a search term to get started.\"\nmsgstr \"\"\n\n#: /views/profile.handlebars\nmsgid \"Load More\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Send alert...\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Rule #1: Hateful/derogatory speech or symbols\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Rule #2: Nudity, genitalia, or non-PG-13 content\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Rule #3: Multi-account\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Rule #4: Botting\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Other (specify below)\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/chat.js /public/include/lookup.js\nmsgid \"Additional information (if applicable)\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\n#. \"Revert pixels of the last *n* hours\", part before 'n'\nmsgid \"Revert pixels of the last \"\nmsgstr \"\"\n\n#: /public/admin/admin.js\n#. \"Revert pixels of the last *n* hours\", part after 'n'\nmsgid \" hours\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"You must specify the details.\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Something went wrong! Perhaps insufficient permissions?\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Shadowban user\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Shadowbanned user\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Permaban user\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Permabanned user\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Ban user\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Banned user\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Unbanned user ${username}\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\n#. Context: ban type\nmsgid \"shadow\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"never\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"permanent\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/chat.js /public/include/uiHelper.js\n#: /public/include/user.js\nmsgid \"Yes\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/chat.js /public/include/uiHelper.js\n#: /public/include/user.js\nmsgid \"No\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Yes (permanent)\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/lookup.js\nmsgid \"Username\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/chat.js\nmsgid \"Profile\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Logins\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"All Time Pixels\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/user.js\nmsgid \"Rename Requested\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Discord Name\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/user.js\nmsgid \"Banned\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Chatbanned\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Ban Reason\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Ban Expiracy\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Chatban Reason\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"(canvas ban)\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"when canvas ban ends\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Chatban Expires\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Ban (24h)\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Permaban\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Shadowban\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Custom ban length: \"\nmsgstr \"\"\n\n#: /public/admin/admin.js\n#. Admin check. Example: type = 'username', arg = 'pxlsuser94'\nmsgid \"${type} ${arg} not found.\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Unban Reason:\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Unbanning ${username}\"\nmsgstr \"\"\n\n#: /public/admin/admin.js /public/include/chat.js /public/include/lookup.js\n#: /public/include/user.js\nmsgid \"Cancel\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\n#. Moderator panel label\nmsgid \"MOD\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Ignore cooldown\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Place any color\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Ignore placemap\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Ban user (24h)\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Unban user\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Check user\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"profile\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"User Agent\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Send Alert\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"Mod Actions\"\nmsgstr \"\"\n\n#: /public/admin/admin.js\nmsgid \"More...\"\nmsgstr \"\"\n\n#: /public/include/board.js\n#. Snapshot save name\nmsgid \"pxls canvas\"\nmsgstr \"\"\n\n#: /public/include/chat.js\n#. template link action\nmsgid \"Ask\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Open in a new tab\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Open in current tab (replacing template)\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Jump to coordinates without replacing template\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Please upload your template image to a third-party image host.\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"You must have at least \"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \" pixels to send links.\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"You must be logged in to chat.\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"No Results\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Reply\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"none provided\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Purged by ${purge.initiator} with reason: ${reason}\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"External Link\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"This link is taking you to the following website:\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"\"\n\"The operators of this website have no responsibility or control over the \"\n\"contents hosted at {0}. Are you sure you want to go there?\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Note: You can disable this popup in settings.\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Visit Site\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"template:\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Open Failed\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Failed to automatically open in a new tab\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Click here to open in a new tab instead\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Open Template\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"This link will overwrite your current template. What would you like to do?\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"\"\n\"Note: You can set a default action in the settings menu which bypasses this \"\n\"popup completely.\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"OK\"\nmsgstr \"\"\n\n#: /public/include/chat.js /public/include/lookup.js\nmsgid \"Report\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Mention\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Ignore\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Chat (un)ban\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Purge User\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Mod Lookup\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Chat Lookup\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Enter a reason for your report\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"You are reporting a chat message from ${reportTarget} with the content:\"\nmsgstr \"\"\n\n#: /public/include/chat.js /public/include/lookup.js\nmsgid \"Sent report!\"\nmsgstr \"\"\n\n#: /public/include/chat.js /public/include/lookup.js\nmsgid \"Error sending report.\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Report User\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"User ignored. You can unignore from chat settings.\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"\"\n\"Failed to ignore user. Either they\\\\'re already ignored, or an error \"\n\"occurred. If the problem persists, contact a developer.\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Permanent\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Temporary\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Rule 3: Spam\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Rule 1: Chat civility\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Rule 2: Hate Speech\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Rule 5: NSFW\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Custom\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Banning:\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Message:\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Ban Length\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Reason\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Purge Messages\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Purging all messages is disabled during snip mode\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Silent (no purge message)\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Custom reason\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Additional information:\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Chatban initiated\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Error occurred while chatbanning\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Chatban\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Failed to delete\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"ID: \"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"User: \"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Message: \"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Reason: \"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Delete Message\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Purge\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Selected Message\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Purge Reason\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"User purged\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Error sending purge.\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Toggle Rename Request\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Select one of the options below to set the current rename request state.\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Rename request updated\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"An unknown error occurred. Please contact a developer\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"New Name: \"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"\"\n\"Enter the new name for the user below. Please note that if you\\\\'re trying \"\n\"to change the caps, you\\\\'ll have to rename to something else first.\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"User renamed\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"Force Rename\"\nmsgstr \"\"\n\n#: /public/include/chat.js\nmsgid \"You cannot use chat while canvas banned.\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"Sending...\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"additional information:\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"Report Pixel\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"This pixel is background (was not placed by a user).\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"Hide sensitive information\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"Move Template Here\"\nmsgstr \"o tawa e ilo sitelen\"\n\n#: /public/include/lookup.js\nmsgid \"\"\n\"An error occurred, either you aren't logged in or you may be attempting to \"\n\"look up users too fast. Please try again in 60 seconds\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"Coords\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"View Profile\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"Origin\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"Part of a nuke\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"Placed by a staff member using placement overrides\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"Time\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"just now\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"${hoursStr}:${minuteStr}:${secsStr} ago\"\nmsgstr \"\"\n\n#: /public/include/lookup.js\nmsgid \"Discord\"\nmsgstr \"\"\n\n#: /public/include/notifications.js\nmsgid \"Posted by ${notification.who}\"\nmsgstr \"\"\n\n#: /public/include/notifications.js\nmsgid \"Expires ${expiry}\"\nmsgstr \"\"\n\n#: /public/include/template.js\nmsgid \"There was an error getting the image\"\nmsgstr \"\"\n\n#: /public/include/timer.js\nmsgid \"Your next pixel will be available in ${delay} seconds!\"\nmsgstr \"\"\n\n#: /public/include/timer.js\nmsgid \"Your next pixel has been available for ${alertDelay} seconds!\"\nmsgstr \"\"\n\n#: /public/include/timer.js\nmsgid \"Your next pixel is available!\"\nmsgstr \"\"\n\n#: /public/include/uiHelper.js\n#. theme name\nmsgid \"Dark\"\nmsgstr \"pimeja\"\n\n#: /public/include/uiHelper.js\n#. theme name\nmsgid \"Darker\"\nmsgstr \"pimeja mute\"\n\n#: /public/include/uiHelper.js\n#. theme name\nmsgid \"Blue\"\nmsgstr \"laso telo\"\n\n#: /public/include/uiHelper.js\n#. theme name\nmsgid \"Purple\"\nmsgstr \"laso loje\"\n\n#: /public/include/uiHelper.js\n#. theme name\nmsgid \"Green\"\nmsgstr \"laso kasi\"\n\n#: /public/include/uiHelper.js\n#. theme name\nmsgid \"Matte\"\nmsgstr \"\"\n\n#: /public/include/uiHelper.js\n#. theme name\nmsgid \"Terminal\"\nmsgstr \"pimeja en laso\"\n\n#: /public/include/uiHelper.js\n#. theme name\nmsgid \"Red\"\nmsgstr \"loje\"\n\n#: /public/include/uiHelper.js\nmsgid \"A new ${type} report has been received.\"\nmsgstr \"\"\n\n#: /public/include/uiHelper.js\nmsgid \"Cannot fetch local files. Use the file selector in template settings.\"\nmsgstr \"\"\n\n#: /public/include/uiHelper.js\nmsgid \"Redirect Warning\"\nmsgstr \"\"\n\n#: /public/include/uiHelper.js\nmsgid \"Are you sure you want to redirect to the following URL?\"\nmsgstr \"\"\n\n#: /public/include/uiHelper.js\nmsgid \"Drag and dropped file must be a valid image.\"\nmsgstr \"\"\n\n#: /public/include/uiHelper.js\nmsgid \"Discord name updated successfully\"\nmsgstr \"nimi sina pi ilo Siko li ante\"\n\n#: /public/include/uiHelper.js\nmsgid \"Couldn\\\\'t change discord name: \"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"\"\n\"By logging in or registering, you agree to the <a href=\\\"{0}\\\" \"\n\"target=\\\"_blank\\\">terms of use</a> and <a href=\\\"{1}\\\" \"\n\"target=\\\"_blank\\\">privacy policy</a>.\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"Sign in with {0}\"\nmsgstr \"o kama kepeken seme?\"\n\n#: /public/include/user.js\nmsgid \"New Accounts Disabled\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"online\"\nmsgstr \"jan lon\"\n\n#: /public/include/user.js\nmsgid \"Sign Out\"\nmsgstr \"o tawa\"\n\n#: /public/include/user.js\nmsgid \"Are you sure you want to sign out?\"\nmsgstr \"sina wile ala wile tawa?\"\n\n#: /public/include/user.js\nmsgid \"You are permanently banned.\"\nmsgstr \"sina weka la tenpo ale.\"\n\n#: /public/include/user.js\nmsgid \"\"\n\"You are temporarily banned and will not be allowed to place until \"\n\"${timestamp}\"\nmsgstr \"sina weka la tenpo ni: ${timestamp}\"\n\n#: /public/include/user.js\nmsgid \"You can contact us using one of the links in the info menu.\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"\"\n\"If you think this was an error, please contact us using one of the links in \"\n\"the info tab.\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"Ban reason:\"\nmsgstr \"sina weka tan ni:\"\n\n#: /public/include/user.js\nmsgid \"An unknown error occurred. Please contact staff on discord\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"\"\n\"Staff have required you to change your username, this usually means your \"\n\"name breaks one of our rules.\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"If you disagree, please contact us on Discord (link in the info panel).\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"New Username:\"\nmsgstr \"nimi sin:\"\n\n#: /public/include/user.js\nmsgid \"Not now\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"Change\"\nmsgstr \"\"\n\n#: /public/include/user.js\nmsgid \"You must change your username.\"\nmsgstr \"sina o ante e nimi sina.\"\n\n#: /public/include/user.js\nmsgid \"Click here to continue.\"\nmsgstr \"\"\n\n#: /public/pxls.js\nmsgid \"Alert\"\nmsgstr \"\"\n";

const locale_tok_46ts_7287ce6a = () => poToMessages(source);

function compile(source) {
  const fn = (ctx) => source.replace(/\$\{([^}]+)\}/g, (match, name) => {
    const value = ctx.named(name);
    return value === void 0 ? match : String(value);
  }).replace(/\{(\d+)\}/g, (match, index) => {
    const value = ctx.list(Number(index));
    return value === void 0 ? match : String(value);
  });
  return fn;
}
const config_i18n_46config_46ts_79ba125a = () => ({
  legacy: false,
  fallbackLocale: false,
  // Missing keys fall back to the key itself (the English msgid).
  fallbackFormat: true,
  missingWarn: false,
  fallbackWarn: false,
  warnHtmlMessage: false,
  messageCompiler: (message) => {
    if (typeof message !== "string") {
      throw new TypeError("Only string messages are supported");
    }
    return compile(message);
  }
});

// @ts-nocheck
const localeCodes =  [
  "en",
  "bg",
  "fr",
  "de",
  "lv",
  "ru",
  "sv",
  "fi",
  "tok"
];
const localeLoaders = {
  en: [
    {
      key: "locale_en_46ts_673924fd",
      load: () => Promise.resolve(locale_en_46ts_673924fd),
      cache: false
    }
  ],
  bg: [
    {
      key: "locale_bg_46ts_ec5c6ddd",
      load: () => Promise.resolve(locale_bg_46ts_ec5c6ddd),
      cache: false
    }
  ],
  fr: [
    {
      key: "locale_fr_46ts_8b862775",
      load: () => Promise.resolve(locale_fr_46ts_8b862775),
      cache: false
    }
  ],
  de: [
    {
      key: "locale_de_46ts_d8ed6a5e",
      load: () => Promise.resolve(locale_de_46ts_d8ed6a5e),
      cache: false
    }
  ],
  lv: [
    {
      key: "locale_lv_46ts_525a1aa6",
      load: () => Promise.resolve(locale_lv_46ts_525a1aa6),
      cache: false
    }
  ],
  ru: [
    {
      key: "locale_ru_46ts_7410c7fb",
      load: () => Promise.resolve(locale_ru_46ts_7410c7fb),
      cache: false
    }
  ],
  sv: [
    {
      key: "locale_sv_46ts_01ec50e1",
      load: () => Promise.resolve(locale_sv_46ts_01ec50e1),
      cache: false
    }
  ],
  fi: [
    {
      key: "locale_fi_46ts_106cf8c0",
      load: () => Promise.resolve(locale_fi_46ts_106cf8c0),
      cache: false
    }
  ],
  tok: [
    {
      key: "locale_tok_46ts_7287ce6a",
      load: () => Promise.resolve(locale_tok_46ts_7287ce6a),
      cache: false
    }
  ]
};
const vueI18nConfigs = [
  () => Promise.resolve(config_i18n_46config_46ts_79ba125a)
];
const normalizedLocales = [
  {
    code: "en",
    name: "English",
    language: undefined,
    domains: [],
    defaultForDomains: []
  },
  {
    code: "bg",
    name: "Bulgarian",
    language: undefined,
    domains: [],
    defaultForDomains: []
  },
  {
    code: "fr",
    name: "French",
    language: undefined,
    domains: [],
    defaultForDomains: []
  },
  {
    code: "de",
    name: "German",
    language: undefined,
    domains: [],
    defaultForDomains: []
  },
  {
    code: "lv",
    name: "Latvian",
    language: undefined,
    domains: [],
    defaultForDomains: []
  },
  {
    code: "ru",
    name: "Russian",
    language: undefined,
    domains: [],
    defaultForDomains: []
  },
  {
    code: "sv",
    name: "Swedish",
    language: undefined,
    domains: [],
    defaultForDomains: []
  },
  {
    code: "fi",
    name: "Finnish",
    language: undefined,
    domains: [],
    defaultForDomains: []
  },
  {
    code: "tok",
    name: "Toki Pona",
    language: undefined,
    domains: [],
    defaultForDomains: []
  }
];

const setupVueI18nOptions = async (defaultLocale) => {
  const options = await loadVueI18nOptions(vueI18nConfigs);
  options.locale = defaultLocale || options.locale || "en-US";
  options.defaultLocale = defaultLocale;
  options.fallbackLocale ??= false;
  options.messages ??= {};
  for (const locale of localeCodes) {
    options.messages[locale] ??= {};
  }
  return options;
};

function defineNitroPlugin(def) {
  return def;
}

function defineRenderHandler(render) {
  const runtimeConfig = useRuntimeConfig();
  return eventHandler(async (event) => {
    const nitroApp = useNitroApp();
    const ctx = { event, render, response: void 0 };
    await nitroApp.hooks.callHook("render:before", ctx);
    if (!ctx.response) {
      if (event.path === `${runtimeConfig.app.baseURL}favicon.ico`) {
        setResponseHeader(event, "Content-Type", "image/x-icon");
        return send(
          event,
          "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        );
      }
      ctx.response = await ctx.render(event);
      if (!ctx.response) {
        const _currentStatus = getResponseStatus(event);
        setResponseStatus(event, _currentStatus === 200 ? 500 : _currentStatus);
        return send(
          event,
          "No response returned from render handler: " + event.path
        );
      }
    }
    await nitroApp.hooks.callHook("render:response", ctx.response, ctx);
    if (ctx.response.headers) {
      setResponseHeaders(event, ctx.response.headers);
    }
    if (ctx.response.statusCode || ctx.response.statusMessage) {
      setResponseStatus(
        event,
        ctx.response.statusCode,
        ctx.response.statusMessage
      );
    }
    return ctx.response.body;
  });
}

function buildAssetsDir() {
	return useRuntimeConfig().app.buildAssetsDir;
}
function buildAssetsURL(...path) {
	return joinRelativeURL(publicAssetsURL(), buildAssetsDir(), ...path);
}
function publicAssetsURL(...path) {
	const app = useRuntimeConfig().app;
	const publicBase = app.cdnURL || app.baseURL;
	return path.length ? joinRelativeURL(publicBase, ...path) : publicBase;
}

function parseAcceptLanguage(value) {
  return value.split(",").map((tag) => tag.split(";")[0]).filter(
    (tag) => !(tag === "*" || tag === "")
  );
}
function createPathIndexLanguageParser(index = 0) {
  return (path) => {
    const rawPath = typeof path === "string" ? path : path.pathname;
    const normalizedPath = rawPath.split("?")[0];
    const parts = normalizedPath.split("/");
    if (parts[0] === "") {
      parts.shift();
    }
    return parts.length > index ? parts[index] || "" : "";
  };
}

const publicFiles = ["/SLIDEIN.css","/SLIDEIN.js","/auth_done.html","/chatnotify.wav","/crel.min.js","/emoji-button.min.js","/favicon.ico","/fontawesome-all.min.css","/jquery-3.4.1.min.js","/jquery.modal.min.css","/jquery.modal.min.js","/mobile_captcha.html","/moment.min.js","/notify.wav","/place.wav","/pxls.js","/serviceWorker.js","/style.css","/twemoji.min.js","/admin/admin.css","/admin/admin.js","/include/ban.js","/include/board.js","/include/chat.js","/include/chromeOffsetWorkaround.js","/include/coords.js","/include/grid.js","/include/helpers.js","/include/lookup.js","/include/modal.js","/include/nativeNotifications.js","/include/notifications.js","/include/overlays.js","/include/panels.js","/include/place.js","/include/query.js","/include/serviceworkers.js","/include/settings.js","/include/socket.js","/include/storage.js","/include/template.js","/include/timer.js","/include/typeahead.js","/include/uiHelper.js","/include/user.js","/themes/blue.css","/themes/blurple.css","/themes/dark.css","/themes/darker.css","/themes/green.css","/themes/matte.css","/themes/pink.css","/themes/purple.css","/themes/red.css","/themes/synthwave.css","/themes/terminal.css","/webfonts/fa-brands-400.eot","/webfonts/fa-brands-400.svg","/webfonts/fa-brands-400.ttf","/webfonts/fa-brands-400.woff","/webfonts/fa-brands-400.woff2","/webfonts/fa-regular-400.eot","/webfonts/fa-regular-400.svg","/webfonts/fa-regular-400.ttf","/webfonts/fa-regular-400.woff","/webfonts/fa-regular-400.woff2","/webfonts/fa-solid-900.eot","/webfonts/fa-solid-900.svg","/webfonts/fa-solid-900.ttf","/webfonts/fa-solid-900.woff","/webfonts/fa-solid-900.woff2","/profile/css/spectrum.css","/profile/css/theme-purple.min.css","/profile/css/theme-purple.min.css.map","/profile/js/bootstrap.bundle.min.js","/profile/js/bootstrap.bundle.min.js.map","/profile/js/spectrum-min.js","/profile/css/views/index.css","/profile/js/views/profile.js","/profile/js/views/root.js"];

const files = new Set(publicFiles);
function isPublicAsset(path) {
  let decoded = path;
  try {
    decoded = decodeURIComponent(path);
  } catch {
  }
  return files.has(decoded);
}

function backendUrl(protocol = "http") {
  const { proxyTo } = useRuntimeConfig();
  return `${protocol}://${proxyTo}`;
}
function isFrontendPath(path) {
  return path === "/" || path === "/profile" || path.startsWith("/profile/") || // Nuxt internals: /_nuxt, /__nuxt_error, /_i18n, /api/_nuxt_icon …
  path.startsWith("/_") || path.startsWith("/api/_") || isPublicAsset(path);
}
function isNavigationRequest(event) {
  var _a;
  return event.method === "GET" && (getRequestHeader(event, "sec-fetch-mode") === "navigate" || ((_a = getRequestHeader(event, "accept")) != null ? _a : "").includes("text/html"));
}

function useRuntimeI18n(nuxtApp, event) {
  {
    const getRuntimeConfig = useRuntimeConfig;
    return getRuntimeConfig(event).public.i18n;
  }
}
function useI18nDetection(nuxtApp) {
  const detectBrowserLanguage = useRuntimeI18n().detectBrowserLanguage;
  const detect = detectBrowserLanguage || {};
  return {
    ...detect,
    enabled: !!detectBrowserLanguage,
    cookieKey: detect.cookieKey || "i18n_redirected"
  };
}
function resolveRootRedirect(config) {
  if (!config) {
    return void 0;
  }
  return {
    path: "/" + (isString(config) ? config : config.path).replace(/^\//, ""),
    code: !isString(config) && config.statusCode || 302
  };
}

const normalizeDomain = (domain = "") => domain.replace(/^https?:\/\//i, "").toLowerCase();
function isLocaleOnHost(locale, host) {
  return !!locale?.domains.some((x) => normalizeDomain(x) === host);
}
function resolveLocaleReach(locales, host, locale) {
  const target = locales.find((l) => l.code === locale);
  if (!target?.domains.length || isLocaleOnHost(target, host)) {
    return "here";
  }
  return locales.some((l) => isLocaleOnHost(l, host)) ? "other-domain" : "off-host";
}
function isLocaleServedOnHost(locales, host, locale) {
  return resolveLocaleReach(locales, host, locale) !== "other-domain";
}
function matchDomainLocale(locales, host, pathLocale) {
  const matches = locales.filter((locale) => isLocaleOnHost(locale, host));
  return (
    // match by current path locale
    (matches.find((l) => l.code === pathLocale) || matches.find((l) => l.defaultForDomains.some((domain) => normalizeDomain(domain) === host)) || matches[0])?.code
  );
}
function cookieSpansDomains(locales, cookieDomain) {
  const scope = cookieDomain.replace(/^\./, "").replace(/:\d+$/, "").toLowerCase();
  return locales.every(
    (l) => l.domains.concat(l.domain || []).every((domain) => {
      const host = normalizeDomain(domain).replace(/:\d+$/, "");
      return host === scope || host.endsWith("." + scope);
    })
  );
}
function withRuntimeDomain(locale, domainLocales) {
  if (typeof locale === "string") {
    return locale;
  }
  const properties = locale;
  const domain = domainLocales[properties.code]?.domain;
  if (!domain || domain === properties.domain) {
    return locale;
  }
  return {
    ...properties,
    domain,
    domains: [domain],
    defaultForDomains: properties.defaultForDomains.length ? [domain] : []
  };
}

function createLocaleConfigs(fallbackLocale) {
  const localeConfigs = {};
  for (const locale of localeCodes) {
    const fallbacks = getFallbackLocaleCodes(fallbackLocale, [locale]);
    const cacheable = isLocaleWithFallbacksCacheable(locale, fallbacks);
    localeConfigs[locale] = { fallbacks, cacheable };
  }
  return localeConfigs;
}
function getFallbackLocaleCodes(fallback, locales) {
  if (fallback === false) {
    return [];
  }
  if (isArray(fallback)) {
    return fallback;
  }
  let fallbackLocales = [];
  if (isString(fallback)) {
    if (locales.every((locale) => locale !== fallback)) {
      fallbackLocales.push(fallback);
    }
    return fallbackLocales;
  }
  const targets = [...locales, "default"];
  for (const locale of targets) {
    if (locale in fallback == false) {
      continue;
    }
    fallbackLocales = [...fallbackLocales, ...fallback[locale].filter(Boolean)];
  }
  return fallbackLocales;
}
function isLocaleCacheable(locale) {
  return localeLoaders[locale] != null && localeLoaders[locale].every((loader) => loader.cache !== false);
}
function isLocaleWithFallbacksCacheable(locale, fallbackLocales) {
  return isLocaleCacheable(locale) && fallbackLocales.every((fallbackLocale) => isLocaleCacheable(fallbackLocale));
}
function getDefaultLocaleForDomain(host, locales = normalizedLocales) {
  return locales.find((l) => l.defaultForDomains.some((domain) => normalizeDomain(domain) === host))?.code;
}
function resolveDefaultLocale(host, defaultLocale, locales = normalizedLocales) {
  const resolved = getDefaultLocaleForDomain(host, locales) || defaultLocale;
  if (resolved) {
    return resolved;
  }
  return (locales.some((l) => l.domains.length) ? locales[0]?.code : "") || "";
}
const isSupportedLocale = (locale) => localeCodes.includes(locale || "");

const storage = prefixStorage(useStorage(), "i18n");
function deepFreeze(value) {
  if (value == null || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  for (const key of Object.keys(value)) {
    deepFreeze(value[key]);
  }
  return Object.freeze(value);
}
function cachedFunctionI18n(fn, opts) {
  opts = { maxAge: 1, ...opts };
  const pending = {};
  async function get(key, resolver) {
    const isPending = pending[key];
    if (!isPending) {
      pending[key] = Promise.resolve(resolver());
    }
    try {
      return await pending[key];
    } finally {
      delete pending[key];
    }
  }
  return async (...args) => {
    const key = [opts.name, opts.getKey(...args)].join(":").replace(/:\/$/, ":index");
    const maxAge = opts.maxAge ?? 1;
    const isCacheable = !opts.shouldBypassCache(...args) && maxAge >= 0;
    const cache = isCacheable && await storage.getItemRaw(key);
    if (!cache || cache.ttl < Date.now()) {
      pending[key] = Promise.resolve(fn(...args));
      const value = await get(key, () => fn(...args));
      if (isCacheable) {
        deepFreeze(value);
        await storage.setItemRaw(key, { ttl: Date.now() + maxAge * 1e3, value, mtime: Date.now() });
      }
      return value;
    }
    return cache.value;
  };
}

const _getMessages = async (locale) => {
  return { [locale]: await getLocaleMessagesMerged(locale, localeLoaders[locale]) };
};
const _getMessagesCached = cachedFunctionI18n(_getMessages, {
  name: "messages",
  maxAge: -1 ,
  getKey: (locale) => locale,
  shouldBypassCache: (locale) => !isLocaleCacheable(locale)
});
const getMessages = _getMessagesCached;
function appContextHint(e) {
  if (!/ is not defined|Nuxt instance unavailable/.test(e.message)) {
    return "";
  }
  return ". Locale loaders run outside the Nuxt app when the server produces messages, so Nuxt app composables (`useNuxtApp`, `useState`, `useCookie`, ...) are unavailable - call them in the locale file itself to have the build keep that locale in the app instead.";
}
const _getMergedMessages = async (locale, fallbackLocales) => {
  try {
    if (fallbackLocales.length === 0) {
      return await getMessages(locale) ?? {};
    }
    const merged = {};
    const messages = await Promise.all(fallbackLocales.map(getMessages));
    for (const message of messages) {
      deepCopy(message, merged);
    }
    deepCopy(await getMessages(locale), merged);
    return merged;
  } catch (e) {
    throw new Error("Failed to merge messages: " + e.message + appContextHint(e), { cause: e });
  }
};
const getMergedMessages = cachedFunctionI18n(_getMergedMessages, {
  name: "merged-single",
  maxAge: -1 ,
  getKey: (locale, fallbackLocales) => `${locale}-[${[...new Set(fallbackLocales)].sort().join("-")}]`,
  shouldBypassCache: (locale, fallbackLocales) => !isLocaleWithFallbacksCacheable(locale, fallbackLocales)
});

function useI18nContext(event) {
  if (event.context.nuxtI18n == null) {
    throw new Error("Nuxt I18n server context has not been set up yet.");
  }
  return event.context.nuxtI18n;
}
function tryUseI18nContext(event) {
  return event.context.nuxtI18n;
}
const getHost = (event) => getRequestURL(event, { xForwardedHost: true }).host;
async function initializeI18nContext(event) {
  const runtimeI18n = useRuntimeI18n(void 0, event);
  const defaultLocale = runtimeI18n.defaultLocale || "";
  const options = await setupVueI18nOptions(resolveDefaultLocale(getHost(event), defaultLocale));
  const localeConfigs = createLocaleConfigs(options.fallbackLocale);
  const ctx = createI18nContext();
  ctx.vueI18nOptions = options;
  ctx.localeConfigs = localeConfigs;
  event.context.nuxtI18n = ctx;
  return ctx;
}
function createI18nContext() {
  return {
    messages: {},
    slp: {},
    localeConfigs: {},
    trackMap: {},
    vueI18nOptions: void 0,
    trackKey(key, locale) {
      this.trackMap[locale] ??= /* @__PURE__ */ new Set();
      this.trackMap[locale].add(key);
    },
    async loadMessages(locale) {
      const messages = await getMergedMessages(locale, this.localeConfigs?.[locale]?.fallbacks ?? []) ?? {};
      return this.vueI18nOptions?.flatJson ? cloneDeep(messages) : messages;
    }
  };
}

const appHead = {"meta":[{"charset":"utf-8"},{"name":"keywords","content":"pxls, pixels, place, place clone, art, r/place"},{"name":"google-play-app","content":"app-id=space.pxls.android"},{"name":"viewport","content":"width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"}],"link":[{"rel":"icon","href":"/favicon.ico","type":"image/x-icon"}],"style":[],"script":[],"noscript":[],"htmlAttrs":{"lang":"en"}};

const appRootTag = "div";

const appRootAttrs = {"id":"__nuxt","class":"isolate"};

const appTeleportTag = "div";

const appTeleportAttrs = {"id":"teleports"};

const appSpaLoaderTag = "div";

const appSpaLoaderAttrs = {"id":"__nuxt-loader"};

const appId = "nuxt-app";

const separator = "___";
const createTrailingSlashFormatter = (trailingSlash) => trailingSlash ? withTrailingSlash : withoutTrailingSlash;
const pathLanguageParser = createPathIndexLanguageParser(0);
const getLocaleFromRoutePath = (path) => pathLanguageParser(path);
const getLocaleFromRouteName = (name) => name.split(separator).at(1) ?? "";
function normalizeInput(input) {
  return typeof input !== "object" ? String(input) : String(input?.name || input?.path || "");
}
function getLocaleFromRoute(route) {
  const input = normalizeInput(route);
  if (input[0] === "/") {
    return getLocaleFromRoutePath(input);
  }
  const fromName = getLocaleFromRouteName(input);
  if (fromName) {
    return fromName;
  }
  if (typeof route === "object" && route?.path) {
    return getLocaleFromRoutePath(String(route.path));
  }
  return "";
}

function matchBrowserLocale(locales, browserLocales) {
  const matchedLocales = [];
  for (const [index, browserCode] of browserLocales.entries()) {
    const matchedLocale = locales.find((l) => l.language?.toLowerCase() === browserCode.toLowerCase());
    if (matchedLocale) {
      matchedLocales.push({ code: matchedLocale.code, score: 1 - index / browserLocales.length });
      break;
    }
  }
  for (const [index, browserCode] of browserLocales.entries()) {
    const languageCode = browserCode.split("-")[0].toLowerCase();
    const matchedLocale = locales.find((l) => l.language?.split("-")[0].toLowerCase() === languageCode);
    if (matchedLocale) {
      matchedLocales.push({ code: matchedLocale.code, score: 0.999 - index / browserLocales.length });
      break;
    }
  }
  return matchedLocales;
}
function compareBrowserLocale(a, b) {
  if (a.score === b.score) {
    return b.code.length - a.code.length;
  }
  return b.score - a.score;
}
function findBrowserLocale(locales, browserLocales) {
  const matchedLocales = matchBrowserLocale(
    locales.map((l) => ({ code: l.code, language: l.language || l.code })),
    browserLocales
  );
  return matchedLocales.sort(compareBrowserLocale).at(0)?.code ?? "";
}

const getCookieLocale = (event, cookieName) => (getCookie(event, cookieName)) || void 0;
const getRouteLocale = (event, route) => getLocaleFromRoute(route);
const getHeaderLocale = (event) => findBrowserLocale(normalizedLocales, parseAcceptLanguage(getRequestHeader(event, "accept-language") || ""));
const getRequestHost = (event) => getRequestURL(event, { xForwardedHost: true }).host;
const getRefererHost = (event) => {
  const referer = getRequestHeader(event, "referer");
  try {
    return referer && new URL(referer).host || void 0;
  } catch {
    return void 0;
  }
};
const getDomainLocales = (domainLocales) => normalizedLocales.map((l) => withRuntimeDomain(l, domainLocales));
const useDetectors = (event, config, nuxtApp) => {
  if (!event) {
    throw new Error("H3Event is required for server-side locale detection");
  }
  const runtimeI18n = useRuntimeI18n();
  let host;
  let locales;
  const getHost = () => host ??= getRequestHost(event);
  const getLocales = () => locales ??= getDomainLocales(runtimeI18n.domainLocales);
  return {
    cookie: () => getCookieLocale(event, config.cookieKey),
    header: () => getHeaderLocale(event) ,
    navigator: () => void 0,
    host: (path) => matchDomainLocale(getLocales(), getHost(), getLocaleFromRoutePath(path)),
    route: (path) => getRouteLocale(event, path),
    /** Passes the locale through when the current host serves it, `undefined` otherwise */
    onHost: (locale) => !locale || isLocaleServedOnHost(getLocales(), getHost(), locale) ? locale : void 0,
    /** Whether the visitor arrived from one of the configured domains */
    fromOwnDomain: () => {
      const referer = getRefererHost(event);
      return !!referer && getLocales().some((l) => isLocaleOnHost(l, referer));
    },
    /** Whether a cookie scoped to the configured `cookieDomain` is readable on every domain */
    cookieSpans: () => !!config.cookieDomain && cookieSpansDomains(getLocales(), config.cookieDomain)
  };
};
function createLocaleDetector(config) {
  const { detection} = config;
  const isSupported = config.isSupportedLocale ?? isSupportedLocale;
  function skipDetect(path, pathLocale) {
    {
      return false;
    }
  }
  return function detectLocale(detectors, route, initial) {
    const path = isString(route) ? parsePath(route).pathname : route.path;
    const pass = (locale) => locale;
    const onHost = pass;
    function* detect() {
      const detecting = initial && detection.enabled && !skipDetect(path, detectors.route(path));
      if (detecting) {
        const cookie = onHost;
        const browser = onHost;
        yield cookie(detectors.cookie());
        yield browser(detectors.header());
        yield browser(detectors.navigator());
      }
      if (detecting) {
        yield onHost(detection.fallbackLocale);
      }
    }
    for (const detected of detect()) {
      if (detected && isSupported(detected)) {
        return detected;
      }
    }
    return "";
  };
}

// Generated by @nuxtjs/i18n
const localizedPaths = [];
const pathToI18nConfig = {};
const i18nPathToPath = {};
const disabledPaths = [];

const emptyRoute = { path: "/", name: "", matched: [], params: {}, meta: {} };
function createPathMatcher(resources, config) {
  const matcher = createRouterMatcher([], {});
  for (const path of [...resources.localizedPaths, ...Object.keys(resources.i18nPathToPath)]) {
    matcher.addRoute({ path, component: () => "", meta: {} });
  }
  const disabledI18nMatcher = createRouterMatcher([], {});
  for (const path of resources.disabledPaths) {
    disabledI18nMatcher.addRoute({ path, component: () => "", meta: {} });
  }
  const formatTrailingSlash = createTrailingSlashFormatter(config.trailingSlash);
  const getI18nPathToI18nPath = (path, locale) => {
    if (!path || !locale) {
      return;
    }
    const plainPath = resources.i18nPathToPath[path] ?? path;
    const i18nConfig = resources.pathToI18nConfig[plainPath];
    if (i18nConfig == null || !(locale in i18nConfig)) {
      return plainPath;
    }
    return i18nConfig[locale] || void 0;
  };
  function isExistingNuxtRoute2(path) {
    if (path === "") {
      return;
    }
    if (path.endsWith("/__nuxt_error")) {
      return;
    }
    if (disabledI18nMatcher.resolve({ path }, emptyRoute).matched.length > 0) {
      return;
    }
    const resolvedMatch = matcher.resolve({ path }, emptyRoute);
    return resolvedMatch.matched.length > 0 ? resolvedMatch : void 0;
  }
  function matchLocalized2(path, locale, defaultLocale) {
    if (path === "") {
      return;
    }
    const parsed = parsePath(path);
    const resolvedMatch = matcher.resolve({ path: parsed.pathname || "/" }, emptyRoute);
    if (resolvedMatch.matched.length === 0) {
      return;
    }
    const alternate = getI18nPathToI18nPath(resolvedMatch.matched[0].path, locale);
    if (!alternate) {
      return;
    }
    const match = matcher.resolve({ params: resolvedMatch.params }, { ...emptyRoute, path: alternate });
    return formatTrailingSlash(withLeadingSlash(joinURL("", match.path)), true);
  }
  return { isExistingNuxtRoute: isExistingNuxtRoute2, matchLocalized: matchLocalized2 };
}
const { isExistingNuxtRoute, matchLocalized } = createPathMatcher(
  { localizedPaths, i18nPathToPath, pathToI18nConfig, disabledPaths },
  { trailingSlash: false }
);

function createRedirectResolver(config) {
  const { detection, rootRedirect, matchLocalized} = config;
  const isSupported = config.isSupportedLocale ?? isSupportedLocale;
  const detectLocale = createLocaleDetector({ detection, isSupportedLocale: isSupported});
  return function resolveRedirectPath(fullPath, path, pathLocale, defaultLocale, detectors, relocate) {
    let locale = detectLocale(detectors, fullPath, true) || defaultLocale;
    function getLocalizedMatch(locale2) {
      const res = matchLocalized(path || "/", locale2, defaultLocale);
      if (res && res !== fullPath) {
        return res;
      }
    }
    let resolvedPath = void 0;
    let redirectCode = 302;
    const pathname = parsePath(fullPath).pathname;
    if (rootRedirect && pathname === "/") {
      locale = detection.enabled && locale || defaultLocale;
      resolvedPath = isSupported(detectors.route(rootRedirect.path)) && rootRedirect.path || matchLocalized(rootRedirect.path, locale, defaultLocale);
      redirectCode = rootRedirect.code;
    } else if (config.redirectStatusCode) {
      redirectCode = config.redirectStatusCode;
    }
    switch (detection.redirectOn) {
      case "root":
        if (pathname !== "/") {
          break;
        }
      // fallthrough (root has no prefix)
      case "no prefix":
        if (pathLocale) {
          break;
        }
      // fallthrough to resolve
      case "all":
        resolvedPath ??= getLocalizedMatch(locale);
        break;
    }
    return { path: resolvedPath, code: redirectCode, locale };
  };
}

function createRedirectResponse(event, dest, code) {
  event.node.res.setHeader("location", dest);
  event.node.res.statusCode = sanitizeStatusCode(code, event.node.res.statusCode);
  return {
    headers: event.node.res.getHeaders(),
    statusCode: event.node.res.statusCode,
    body: `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${dest.replace(/"/g, "%22")}"></head></html>`
  };
}
const _MRVumxAP4LjDwURiJFxjr1S7PQh3L6ja9ygj2aA7a0 = defineNitroPlugin(async (nitro) => {
  const runtimeI18n = useRuntimeI18n();
  const rootRedirect = resolveRootRedirect(runtimeI18n.rootRedirect);
  runtimeI18n.defaultLocale || "";
  try {
    const cacheStorage = useStorage("cache");
    const cachedKeys = await cacheStorage.getKeys("nitro:handlers:i18n");
    await Promise.all(cachedKeys.map((key) => cacheStorage.removeItem(key)));
  } catch {
  }
  const detection = useI18nDetection();
  const cookieOptions = {
    path: "/",
    domain: detection.cookieDomain || void 0,
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: detection.cookieSecure
  };
  isFunction(runtimeI18n.baseUrl);
  const baseUrlGetter = (event) => {
    return "";
  };
  const resolveRedirectPath = createRedirectResolver({
    detection,
    rootRedirect,
    redirectStatusCode: runtimeI18n.redirectStatusCode,
    matchLocalized});
  nitro.hooks.hook("request", async (event) => {
    await initializeI18nContext(event);
  });
  nitro.hooks.hook("render:before", async (context) => {
    const { event } = context;
    const ctx = useI18nContext(event);
    const url = getRequestURL(event);
    const detector = useDetectors(event, detection);
    const localeSegment = detector.route(event.path);
    const pathLocale = isSupportedLocale(localeSegment) && localeSegment || void 0;
    const { pathname } = parsePath(event.path);
    const path = pathLocale ? pathname.slice(pathLocale.length + 1) || "/" : pathname;
    if (!url.pathname.includes("/_i18n") && !isExistingNuxtRoute(path)) {
      return;
    }
    const resolved = resolveRedirectPath(
      event.path,
      path,
      pathLocale,
      ctx.vueI18nOptions.defaultLocale,
      detector,
      void 0
    );
    if (resolved.path && (resolved.origin || resolved.path !== pathname)) {
      ctx.detectLocale = resolved.locale;
      detection.useCookie && (!resolved.origin || detection.cookieDomain) && setCookie(event, detection.cookieKey, resolved.locale, cookieOptions);
      context.response = createRedirectResponse(
        event,
        // the resolved path is base-free (matched against base-free routes), re-add `app.baseURL`
        joinURL(
          resolved.origin || baseUrlGetter(),
          useRuntimeConfig(event).app.baseURL,
          resolved.path + url.search
        ),
        resolved.code
      );
      return;
    }
  });
  nitro.hooks.hook("render:html", (htmlContext, { event }) => {
    tryUseI18nContext(event);
  });
});

const script = "\"use strict\";(()=>{const o=window,e=document.documentElement,c=[\"dark\",\"light\"],s=getStorageValue(\"localStorage\",\"nuxt-color-mode\")||\"system\";let r=s===\"system\"?f():s;const l=e.getAttribute(\"data-color-mode-forced\");l&&(r=l),i(r),o[\"__NUXT_COLOR_MODE__\"]={preference:s,value:r,getColorScheme:f,addColorScheme:i,removeColorScheme:d};function i(t){const a=\"\"+t+\"\",n=\"\";e.classList?e.classList.add(a):e.className+=\" \"+a,n&&e.setAttribute(\"data-\"+n,t)}function d(t){const a=\"\"+t+\"\",n=\"\";e.classList?e.classList.remove(a):e.className=e.className.replace(new RegExp(a,\"g\"),\"\"),n&&e.removeAttribute(\"data-\"+n)}function u(t){return o.matchMedia(\"(prefers-color-scheme\"+t+\")\")}function f(){if(o.matchMedia&&u(\"\").media!==\"not all\"){for(const t of c)if(u(\":\"+t).matches)return t}return\"light\"}})();function getStorageValue(o,e){switch(o){case\"localStorage\":try{return window.localStorage.getItem(e)}catch{return null}case\"sessionStorage\":try{return window.sessionStorage.getItem(e)}catch{return null}case\"cookie\":try{return getCookie(e)}catch{return null}default:return null}}function getCookie(o){const c=(\"; \"+window.document.cookie).split(\"; \"+o+\"=\");if(c.length===2){const s=c.pop();return s?s.split(\";\").shift():null}}";

const _LVD9DcDjytxaVP77bBz2_XiHxht46s0AzG8JTDIBq9E = (function(nitro) {
  nitro.hooks.hook("render:html", (htmlContext) => {
    htmlContext.head.push(`<script>${script}<\/script>`);
  });
});

const plugins = [
  _MRVumxAP4LjDwURiJFxjr1S7PQh3L6ja9ygj2aA7a0,
_LVD9DcDjytxaVP77bBz2_XiHxht46s0AzG8JTDIBq9E
];

const assets = {
  "/SLIDEIN.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"8ce-4PTcBKdcuBsTSQRK/aEQcAs0f/Q\"",
    "mtime": "2026-09-16T18:35:38.162Z",
    "size": 2254,
    "path": "../public/SLIDEIN.css"
  },
  "/SLIDEIN.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1163-pYSPmkrHCV6UR5rcCmW6DgRDpEg\"",
    "mtime": "2026-09-16T18:35:38.162Z",
    "size": 4451,
    "path": "../public/SLIDEIN.js"
  },
  "/auth_done.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"5e2-9TYjKvXnSFv5oIwRjC86dsIMF4Y\"",
    "mtime": "2026-09-16T18:35:38.162Z",
    "size": 1506,
    "path": "../public/auth_done.html"
  },
  "/crel.min.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2b6-szOSTf/Ek8/APT3tRImvVNGMQfA\"",
    "mtime": "2026-09-16T18:35:38.162Z",
    "size": 694,
    "path": "../public/crel.min.js"
  },
  "/fontawesome-all.min.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"e4d2-ADjcl8eUUVeLe9SK9gumIoK0CCs\"",
    "mtime": "2026-09-16T18:35:38.162Z",
    "size": 58578,
    "path": "../public/fontawesome-all.min.css"
  },
  "/favicon.ico": {
    "type": "image/vnd.microsoft.icon",
    "etag": "\"1855e-ZP1CeVPHCUNmISoM9fLNbCPmdnE\"",
    "mtime": "2026-09-16T18:35:38.162Z",
    "size": 99678,
    "path": "../public/favicon.ico"
  },
  "/jquery.modal.min.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"c81-ko7qrTUu5GmOwd3a0hbsOEJM/uM\"",
    "mtime": "2026-09-16T18:35:38.162Z",
    "size": 3201,
    "path": "../public/jquery.modal.min.css"
  },
  "/jquery.modal.min.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1359-pkPbhyh+bpQPur5tjP7lqHdWktg\"",
    "mtime": "2026-09-16T18:35:38.162Z",
    "size": 4953,
    "path": "../public/jquery.modal.min.js"
  },
  "/mobile_captcha.html": {
    "type": "text/html; charset=utf-8",
    "etag": "\"1ff-mL/DNu184VNeKJyS0GR+QIrYkrM\"",
    "mtime": "2026-09-16T18:35:38.162Z",
    "size": 511,
    "path": "../public/mobile_captcha.html"
  },
  "/jquery-3.4.1.min.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"15851-iFI5JDUbrAtdVg/gxXgeJVbnaT0\"",
    "mtime": "2026-09-16T18:35:38.162Z",
    "size": 88145,
    "path": "../public/jquery-3.4.1.min.js"
  },
  "/moment.min.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"d04c-aasWuoymhDGrWe/yhsftHlILyjA\"",
    "mtime": "2026-09-16T18:35:38.162Z",
    "size": 53324,
    "path": "../public/moment.min.js"
  },
  "/emoji-button.min.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3dda7-Yw8197FTcG9KlqBn41IQtNiw944\"",
    "mtime": "2026-09-16T18:35:38.162Z",
    "size": 253351,
    "path": "../public/emoji-button.min.js"
  },
  "/serviceWorker.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4c9-Xthxv0/REt7ok7H6NQD9vd7nFX0\"",
    "mtime": "2026-09-16T18:35:38.162Z",
    "size": 1225,
    "path": "../public/serviceWorker.js"
  },
  "/pxls.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1227-Yl0xCwK0uargAxwWi3oaPliRYYc\"",
    "mtime": "2026-09-16T18:35:38.162Z",
    "size": 4647,
    "path": "../public/pxls.js"
  },
  "/notify.wav": {
    "type": "audio/wav",
    "etag": "\"57e98-3977j3vjleIatERpjG0u0ZVNNYE\"",
    "mtime": "2026-09-16T18:35:38.162Z",
    "size": 360088,
    "path": "../public/notify.wav"
  },
  "/style.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"caf8-MYxkTYhM0w0OuYcCgHJNtJLx4Zk\"",
    "mtime": "2026-09-16T18:35:38.162Z",
    "size": 51960,
    "path": "../public/style.css"
  },
  "/twemoji.min.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"330c-Fw7ivboTbXcQerpIfDa7WIwspvo\"",
    "mtime": "2026-09-16T18:35:38.162Z",
    "size": 13068,
    "path": "../public/twemoji.min.js"
  },
  "/admin/admin.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"3ca-HBb1blHWhpBjCCwCXWaRdBO3ei4\"",
    "mtime": "2026-09-16T18:35:38.160Z",
    "size": 970,
    "path": "../public/admin/admin.css"
  },
  "/place.wav": {
    "type": "audio/wav",
    "etag": "\"57e98-ZB2HVJPQawZGM3YEjXyiIDLVh6Y\"",
    "mtime": "2026-09-16T18:35:38.162Z",
    "size": 360088,
    "path": "../public/place.wav"
  },
  "/admin/admin.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4ce5-etSoq0C7huQ5MHl119pRN3AfkAI\"",
    "mtime": "2026-09-16T18:35:38.160Z",
    "size": 19685,
    "path": "../public/admin/admin.js"
  },
  "/_nuxt/B98wTef_.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"6896-vr4YgdpuCxmpY/U/6vcHZH7o8wc\"",
    "mtime": "2026-09-16T18:35:38.153Z",
    "size": 26774,
    "path": "../public/_nuxt/B98wTef_.js"
  },
  "/_nuxt/42a9PVF8.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"133ab-3Jg+cLaSLIKzf9ln9uBdN4YzAm0\"",
    "mtime": "2026-09-16T18:35:38.153Z",
    "size": 78763,
    "path": "../public/_nuxt/42a9PVF8.js"
  },
  "/chatnotify.wav": {
    "type": "audio/wav",
    "etag": "\"6bb90-CpQO7sG7SmNRkcPcbPjWQh5TWy8\"",
    "mtime": "2026-09-16T18:35:38.162Z",
    "size": 441232,
    "path": "../public/chatnotify.wav"
  },
  "/_nuxt/B8NMmeg-.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"12f1e-SBFQcE7qRtGV4QmeGSl0QdKeI00\"",
    "mtime": "2026-09-16T18:35:38.153Z",
    "size": 77598,
    "path": "../public/_nuxt/B8NMmeg-.js"
  },
  "/_nuxt/BbHIfsup.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"13980-baJeIxtQzlbo1KAHuKDhDSKTrQA\"",
    "mtime": "2026-09-16T18:35:38.153Z",
    "size": 80256,
    "path": "../public/_nuxt/BbHIfsup.js"
  },
  "/_nuxt/Cc65d3N2.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"d32-XW9L7pLsDscuxgkAOeZdStA2u5U\"",
    "mtime": "2026-09-16T18:35:38.153Z",
    "size": 3378,
    "path": "../public/_nuxt/Cc65d3N2.js"
  },
  "/_nuxt/D0Vr8JmS.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1f6-crtdYt/CkG07th3Xm03i5jVHz20\"",
    "mtime": "2026-09-16T18:35:38.153Z",
    "size": 502,
    "path": "../public/_nuxt/D0Vr8JmS.js"
  },
  "/_nuxt/D2QsV1z1.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1b1-Dbh5GbaejByGBuX2ib4YCpw2S7M\"",
    "mtime": "2026-09-16T18:35:38.154Z",
    "size": 433,
    "path": "../public/_nuxt/D2QsV1z1.js"
  },
  "/_nuxt/D9fi05FQ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"e73-u4+8xJWvJrl1S4532ZNAumR1f3w\"",
    "mtime": "2026-09-16T18:35:38.154Z",
    "size": 3699,
    "path": "../public/_nuxt/D9fi05FQ.js"
  },
  "/_nuxt/CuGN0KIL.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"16e31-SSElEUXwCickJLnhG49v6aKgk84\"",
    "mtime": "2026-09-16T18:35:38.153Z",
    "size": 93745,
    "path": "../public/_nuxt/CuGN0KIL.js"
  },
  "/_nuxt/DVkGherl.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"e0-dCxjS/5pxo3AQB28w5ubV7OfXmc\"",
    "mtime": "2026-09-16T18:35:38.154Z",
    "size": 224,
    "path": "../public/_nuxt/DVkGherl.js"
  },
  "/_nuxt/D0msc4vB.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1214a-WyXpg+VjxoESH4BxvdNGGvvZXWA\"",
    "mtime": "2026-09-16T18:35:38.154Z",
    "size": 74058,
    "path": "../public/_nuxt/D0msc4vB.js"
  },
  "/_nuxt/DTXem-Ez.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"e834-5AAsqZ7dOYHHGSGw8Yv54zllB8A\"",
    "mtime": "2026-09-16T18:35:38.154Z",
    "size": 59444,
    "path": "../public/_nuxt/DTXem-Ez.js"
  },
  "/_nuxt/DsvS5aRL.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"24-HJMURMpbczb8wXxPc48fP/nt370\"",
    "mtime": "2026-09-16T18:35:38.154Z",
    "size": 36,
    "path": "../public/_nuxt/DsvS5aRL.js"
  },
  "/_nuxt/DR7pRRDJ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"f765-vqygq+tEeW0yqr6SOZAhXQbOxhM\"",
    "mtime": "2026-09-16T18:35:38.154Z",
    "size": 63333,
    "path": "../public/_nuxt/DR7pRRDJ.js"
  },
  "/_nuxt/K9wq2giD.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"13424-ucAxmI9jvK9Hn8yApuq0FNYxb4w\"",
    "mtime": "2026-09-16T18:35:38.154Z",
    "size": 78884,
    "path": "../public/_nuxt/K9wq2giD.js"
  },
  "/_nuxt/error-500.Bwd7zAaE.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"772-nqXXACYtFiPK+D42BNu4uEECARA\"",
    "mtime": "2026-09-16T18:35:38.154Z",
    "size": 1906,
    "path": "../public/_nuxt/error-500.Bwd7zAaE.css"
  },
  "/_nuxt/o8JtE5PG.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2418-rcK0vQ+L9+mNw7uJ11I4axWY14g\"",
    "mtime": "2026-09-16T18:35:38.154Z",
    "size": 9240,
    "path": "../public/_nuxt/o8JtE5PG.js"
  },
  "/_nuxt/error-404.Bb87HomL.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"97d-4h9VfBznldxjqagfMldh1hDncR0\"",
    "mtime": "2026-09-16T18:35:38.154Z",
    "size": 2429,
    "path": "../public/_nuxt/error-404.Bb87HomL.css"
  },
  "/_nuxt/HWfHlTwu.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"5e9f5-CYfmUahQHKRuCyjMbQtP7eAqBag\"",
    "mtime": "2026-09-16T18:35:38.154Z",
    "size": 387573,
    "path": "../public/_nuxt/HWfHlTwu.js"
  },
  "/_nuxt/sPSKDC2m.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"12b1b-D00X4Cz2+qORCQwIM2oqKUUbIjQ\"",
    "mtime": "2026-09-16T18:35:38.154Z",
    "size": 76571,
    "path": "../public/_nuxt/sPSKDC2m.js"
  },
  "/include/ban.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1220-PuXHTR/ZY8qBHyEcevMpmtBgf4E\"",
    "mtime": "2026-09-16T18:35:38.160Z",
    "size": 4640,
    "path": "../public/include/ban.js"
  },
  "/include/board.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"6f30-pRVsZwyv1Zo8U10HVtFexZdQLRg\"",
    "mtime": "2026-09-16T18:35:38.160Z",
    "size": 28464,
    "path": "../public/include/board.js"
  },
  "/include/chromeOffsetWorkaround.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"69a-wMCzEXPbZvSnE+Fr4N0Zoh3mcs4\"",
    "mtime": "2026-09-16T18:35:38.160Z",
    "size": 1690,
    "path": "../public/include/chromeOffsetWorkaround.js"
  },
  "/include/coords.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"cae-zLwosrtijk9a3iA7Q3kV6PavLps\"",
    "mtime": "2026-09-16T18:35:38.160Z",
    "size": 3246,
    "path": "../public/include/coords.js"
  },
  "/include/grid.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"69c-8uZFGtXW6J5OKLtWZE7FM6gkBog\"",
    "mtime": "2026-09-16T18:35:38.160Z",
    "size": 1692,
    "path": "../public/include/grid.js"
  },
  "/include/chat.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"19e7d-Qxe3biNOCVXaGaizGuoYG8ytoKs\"",
    "mtime": "2026-09-16T18:35:38.160Z",
    "size": 106109,
    "path": "../public/include/chat.js"
  },
  "/_nuxt/entry.DiJcSx4x.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"3366e-WIUP4CPskhygHCtSl8w+GsZWmLU\"",
    "mtime": "2026-09-16T18:35:38.154Z",
    "size": 210542,
    "path": "../public/_nuxt/entry.DiJcSx4x.css"
  },
  "/include/helpers.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"df9-AWSmTMgLHeJlxDb0OazoBY3oqtw\"",
    "mtime": "2026-09-16T18:35:38.160Z",
    "size": 3577,
    "path": "../public/include/helpers.js"
  },
  "/include/lookup.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2e12-lmgjo1dFwfgsxtON7gF9LsZYO5Q\"",
    "mtime": "2026-09-16T18:35:38.160Z",
    "size": 11794,
    "path": "../public/include/lookup.js"
  },
  "/include/modal.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"957-OXczx/B4sFVsyDys8rljhjdqeio\"",
    "mtime": "2026-09-16T18:35:38.160Z",
    "size": 2391,
    "path": "../public/include/modal.js"
  },
  "/include/nativeNotifications.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"5be-pWcn9accdHQJdt5L0YpHvgEOlxM\"",
    "mtime": "2026-09-16T18:35:38.160Z",
    "size": 1470,
    "path": "../public/include/nativeNotifications.js"
  },
  "/include/notifications.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"c20-4ZX+kbhQ70MdLlOWQELHfKKtlhY\"",
    "mtime": "2026-09-16T18:35:38.160Z",
    "size": 3104,
    "path": "../public/include/notifications.js"
  },
  "/include/overlays.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"27d1-E2OGqCEWKcyCvg71C9cmT39swbs\"",
    "mtime": "2026-09-16T18:35:38.160Z",
    "size": 10193,
    "path": "../public/include/overlays.js"
  },
  "/include/panels.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1376-x6qENLnlDZLLaOtEOUrRYNAEapE\"",
    "mtime": "2026-09-16T18:35:38.160Z",
    "size": 4982,
    "path": "../public/include/panels.js"
  },
  "/include/place.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"336d-qlnMLlBIwJl6qikAbhhaZpAF5S4\"",
    "mtime": "2026-09-16T18:35:38.160Z",
    "size": 13165,
    "path": "../public/include/place.js"
  },
  "/include/query.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1da9-G/mp0ZlVjIFSMm17DkvXtCnZJRI\"",
    "mtime": "2026-09-16T18:35:38.160Z",
    "size": 7593,
    "path": "../public/include/query.js"
  },
  "/include/serviceworkers.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"992-TxDR99+j+OP8DDIbGmjQE4VNTQk\"",
    "mtime": "2026-09-16T18:35:38.160Z",
    "size": 2450,
    "path": "../public/include/serviceworkers.js"
  },
  "/include/settings.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4adb-i/XopwuT3dglDPqrkTf5GvtiJes\"",
    "mtime": "2026-09-16T18:35:38.160Z",
    "size": 19163,
    "path": "../public/include/settings.js"
  },
  "/include/socket.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"a06-ta+s++7f+js++yREObLOA2HK6TM\"",
    "mtime": "2026-09-16T18:35:38.160Z",
    "size": 2566,
    "path": "../public/include/socket.js"
  },
  "/include/storage.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"88d-bdw5DZBUBP2xGUyXYLX9ZOAwIZw\"",
    "mtime": "2026-09-16T18:35:38.160Z",
    "size": 2189,
    "path": "../public/include/storage.js"
  },
  "/include/template.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"8c97-xOntoUIe0P/u6qJt34+XrbEYJLQ\"",
    "mtime": "2026-09-16T18:35:38.160Z",
    "size": 35991,
    "path": "../public/include/template.js"
  },
  "/include/timer.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1598-1gVbTVwWsRNQJ4KqId6zA6V+b5Y\"",
    "mtime": "2026-09-16T18:35:38.160Z",
    "size": 5528,
    "path": "../public/include/timer.js"
  },
  "/include/typeahead.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1d1e-I9SA5DAn/8L2/Aoa1v+lGav7zA0\"",
    "mtime": "2026-09-16T18:35:38.160Z",
    "size": 7454,
    "path": "../public/include/typeahead.js"
  },
  "/include/uiHelper.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"a5e1-OtUjaHXOOYW1qLb+c6+SgrXtdlc\"",
    "mtime": "2026-09-16T18:35:38.160Z",
    "size": 42465,
    "path": "../public/include/uiHelper.js"
  },
  "/include/user.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3e87-CKHle1g4qPWonff+y8GE0SQOAzM\"",
    "mtime": "2026-09-16T18:35:38.160Z",
    "size": 16007,
    "path": "../public/include/user.js"
  },
  "/themes/blue.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"c44-Q70rLNz1foXS3GYSts5h6h4E99Q\"",
    "mtime": "2026-09-16T18:35:38.160Z",
    "size": 3140,
    "path": "../public/themes/blue.css"
  },
  "/themes/blurple.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"588c-JLElSTja4GLfzEpPwGb0zwwMBgU\"",
    "mtime": "2026-09-16T18:35:38.160Z",
    "size": 22668,
    "path": "../public/themes/blurple.css"
  },
  "/themes/dark.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"a90-IjzWCXt0bBB58zsslgGWRNYjUu8\"",
    "mtime": "2026-09-16T18:35:38.160Z",
    "size": 2704,
    "path": "../public/themes/dark.css"
  },
  "/themes/darker.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"c1f-E2PT809+9l/RA2QGUns9KyhkWGM\"",
    "mtime": "2026-09-16T18:35:38.160Z",
    "size": 3103,
    "path": "../public/themes/darker.css"
  },
  "/themes/green.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"bdf-5XwS3jHKaDqZEsb54bMuQGM4yY4\"",
    "mtime": "2026-09-16T18:35:38.160Z",
    "size": 3039,
    "path": "../public/themes/green.css"
  },
  "/themes/matte.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"2aab-bzYhnBMTJqw6EDi6wJV6PXiq6Ow\"",
    "mtime": "2026-09-16T18:35:38.160Z",
    "size": 10923,
    "path": "../public/themes/matte.css"
  },
  "/themes/pink.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"1676-V9ovbyYaz+L9GJ2br+7xviy/Ioc\"",
    "mtime": "2026-09-16T18:35:38.161Z",
    "size": 5750,
    "path": "../public/themes/pink.css"
  },
  "/themes/purple.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"1585-uWHQqKAl3dPID0McoJg7uun3ZH4\"",
    "mtime": "2026-09-16T18:35:38.160Z",
    "size": 5509,
    "path": "../public/themes/purple.css"
  },
  "/themes/red.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"e29-LeEvkXSeMxfQBy+ZhVio4zAr4hk\"",
    "mtime": "2026-09-16T18:35:38.160Z",
    "size": 3625,
    "path": "../public/themes/red.css"
  },
  "/themes/synthwave.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"4e7d-qfe7s8SntEgvTJb+72+xfCM0waE\"",
    "mtime": "2026-09-16T18:35:38.161Z",
    "size": 20093,
    "path": "../public/themes/synthwave.css"
  },
  "/themes/terminal.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"28f1-rqDqlrujNwXTJpYVJIJIf3xJ4Wo\"",
    "mtime": "2026-09-16T18:35:38.161Z",
    "size": 10481,
    "path": "../public/themes/terminal.css"
  },
  "/webfonts/fa-brands-400.eot": {
    "type": "application/vnd.ms-fontobject",
    "etag": "\"207aa-oX2ypaNVvv0Im7bn1Tw9UBv56Cc\"",
    "mtime": "2026-09-16T18:35:38.160Z",
    "size": 133034,
    "path": "../public/webfonts/fa-brands-400.eot"
  },
  "/webfonts/fa-brands-400.woff2": {
    "type": "font/woff2",
    "etag": "\"12b44-UJmIR32nnBRsuT+3KEBfGOkjwt4\"",
    "mtime": "2026-09-16T18:35:38.161Z",
    "size": 76612,
    "path": "../public/webfonts/fa-brands-400.woff2"
  },
  "/webfonts/fa-brands-400.woff": {
    "type": "font/woff",
    "etag": "\"15ee0-hDZ4jnZnnASFtiyA63USxsLjTog\"",
    "mtime": "2026-09-16T18:35:38.161Z",
    "size": 89824,
    "path": "../public/webfonts/fa-brands-400.woff"
  },
  "/webfonts/fa-regular-400.eot": {
    "type": "application/vnd.ms-fontobject",
    "etag": "\"8656-Ypnw4yV19z2NiX+HzomYJ/meIP4\"",
    "mtime": "2026-09-16T18:35:38.161Z",
    "size": 34390,
    "path": "../public/webfonts/fa-regular-400.eot"
  },
  "/webfonts/fa-regular-400.ttf": {
    "type": "font/ttf",
    "etag": "\"852c-APVp99isJJekOyXcTTsyITvOoxs\"",
    "mtime": "2026-09-16T18:35:38.161Z",
    "size": 34092,
    "path": "../public/webfonts/fa-regular-400.ttf"
  },
  "/webfonts/fa-brands-400.ttf": {
    "type": "font/ttf",
    "etag": "\"20678-Zshu39E+Y+Dpgc6FMzXCi8LSDOw\"",
    "mtime": "2026-09-16T18:35:38.161Z",
    "size": 132728,
    "path": "../public/webfonts/fa-brands-400.ttf"
  },
  "/webfonts/fa-regular-400.woff": {
    "type": "font/woff",
    "etag": "\"41a0-hGnLPZyBif6mT2Cu8nU1CddwuN8\"",
    "mtime": "2026-09-16T18:35:38.161Z",
    "size": 16800,
    "path": "../public/webfonts/fa-regular-400.woff"
  },
  "/webfonts/fa-regular-400.woff2": {
    "type": "font/woff2",
    "etag": "\"3510-JguwGs1E2I3Lf1AaI4q5aPhr754\"",
    "mtime": "2026-09-16T18:35:38.161Z",
    "size": 13584,
    "path": "../public/webfonts/fa-regular-400.woff2"
  },
  "/webfonts/fa-regular-400.svg": {
    "type": "image/svg+xml",
    "etag": "\"233c2-M3LpKCWvOXUBPOziOQ+AYCOxsF0\"",
    "mtime": "2026-09-16T18:35:38.161Z",
    "size": 144322,
    "path": "../public/webfonts/fa-regular-400.svg"
  },
  "/webfonts/fa-solid-900.eot": {
    "type": "application/vnd.ms-fontobject",
    "etag": "\"31896-W+WUShfosyWJoS/cK4qFcMkIHbQ\"",
    "mtime": "2026-09-16T18:35:38.161Z",
    "size": 202902,
    "path": "../public/webfonts/fa-solid-900.eot"
  },
  "/webfonts/fa-solid-900.ttf": {
    "type": "font/ttf",
    "etag": "\"31778-/483360QV5a9kk0NsNN6T/JSYYw\"",
    "mtime": "2026-09-16T18:35:38.161Z",
    "size": 202616,
    "path": "../public/webfonts/fa-solid-900.ttf"
  },
  "/webfonts/fa-solid-900.woff": {
    "type": "font/woff",
    "etag": "\"19384-FcUiCQks4PtyEOQOKgGsyLSlxJQ\"",
    "mtime": "2026-09-16T18:35:38.161Z",
    "size": 103300,
    "path": "../public/webfonts/fa-solid-900.woff"
  },
  "/webfonts/fa-solid-900.woff2": {
    "type": "font/woff2",
    "etag": "\"13654-daiIFcR6JJ6ttfDtwWdZV/hgzKc\"",
    "mtime": "2026-09-16T18:35:38.161Z",
    "size": 79444,
    "path": "../public/webfonts/fa-solid-900.woff2"
  },
  "/profile/js/spectrum-min.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"7336-jfWTZLP89i9pBzsJ4TxoG5oxWJw\"",
    "mtime": "2026-09-16T18:35:38.162Z",
    "size": 29494,
    "path": "../public/profile/js/spectrum-min.js"
  },
  "/profile/css/spectrum.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"3a49-CzgJr+CdERx5OsArWoWfuhlIuDI\"",
    "mtime": "2026-09-16T18:35:38.161Z",
    "size": 14921,
    "path": "../public/profile/css/spectrum.css"
  },
  "/profile/js/bootstrap.bundle.min.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"13b3a-+sRSWQRt2QsW0lFzkQgALWegC1Q\"",
    "mtime": "2026-09-16T18:35:38.162Z",
    "size": 80698,
    "path": "../public/profile/js/bootstrap.bundle.min.js"
  },
  "/profile/css/theme-purple.min.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"2d3fd-cw28oeJiiK/61UC1iOIk7/GehNI\"",
    "mtime": "2026-09-16T18:35:38.162Z",
    "size": 185341,
    "path": "../public/profile/css/theme-purple.min.css"
  },
  "/profile/js/bootstrap.bundle.min.js.map": {
    "type": "application/json",
    "etag": "\"4da5d-0xt1sL8in65R7fhopahFcfYgGvE\"",
    "mtime": "2026-09-16T18:35:38.162Z",
    "size": 318045,
    "path": "../public/profile/js/bootstrap.bundle.min.js.map"
  },
  "/_nuxt/builds/latest.json": {
    "type": "application/json",
    "etag": "\"47-z0rOJVgKTE701loJqLrj/+vjIFU\"",
    "mtime": "2026-09-16T18:35:38.150Z",
    "size": 71,
    "path": "../public/_nuxt/builds/latest.json"
  },
  "/profile/js/views/profile.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4d75-oRtZ6AZtLyisCE3CiZxzRfhiodo\"",
    "mtime": "2026-09-16T18:35:38.161Z",
    "size": 19829,
    "path": "../public/profile/js/views/profile.js"
  },
  "/webfonts/fa-brands-400.svg": {
    "type": "image/svg+xml",
    "etag": "\"aec72-1JwHrvZBSRazxoYLQrkG45dI6EI\"",
    "mtime": "2026-09-16T18:35:38.161Z",
    "size": 715890,
    "path": "../public/webfonts/fa-brands-400.svg"
  },
  "/webfonts/fa-solid-900.svg": {
    "type": "image/svg+xml",
    "etag": "\"db192-pBFf185H7StB99Tp50SPKLo/dQg\"",
    "mtime": "2026-09-16T18:35:38.161Z",
    "size": 897426,
    "path": "../public/webfonts/fa-solid-900.svg"
  },
  "/profile/css/theme-purple.min.css.map": {
    "type": "application/json",
    "etag": "\"156272-RFqLsdjrRf5S/ixIQ2dHnlz9HQA\"",
    "mtime": "2026-09-16T18:35:38.163Z",
    "size": 1401458,
    "path": "../public/profile/css/theme-purple.min.css.map"
  },
  "/profile/js/views/root.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"22a6-j1uR3Pdt9/GGL9I7doRiFk//6xY\"",
    "mtime": "2026-09-16T18:35:38.162Z",
    "size": 8870,
    "path": "../public/profile/js/views/root.js"
  },
  "/profile/css/views/index.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"7a3-Fm6zPZ3nh0/mE6eoQ9kNfDETsY0\"",
    "mtime": "2026-09-16T18:35:38.161Z",
    "size": 1955,
    "path": "../public/profile/css/views/index.css"
  },
  "/_nuxt/builds/meta/855173e3-3785-40ab-8d55-8b89b73971da.json": {
    "type": "application/json",
    "etag": "\"58-pApQ2dLkJwD/AzOlYD5Aq/O3yXg\"",
    "mtime": "2026-09-16T18:35:38.148Z",
    "size": 88,
    "path": "../public/_nuxt/builds/meta/855173e3-3785-40ab-8d55-8b89b73971da.json"
  }
};

const _DRIVE_LETTER_START_RE = /^[A-Za-z]:\//;
function normalizeWindowsPath(input = "") {
  if (!input) {
    return input;
  }
  return input.replace(/\\/g, "/").replace(_DRIVE_LETTER_START_RE, (r) => r.toUpperCase());
}
const _IS_ABSOLUTE_RE = /^[/\\](?![/\\])|^[/\\]{2}(?!\.)|^[A-Za-z]:[/\\]/;
const _DRIVE_LETTER_RE = /^[A-Za-z]:$/;
const _ROOT_FOLDER_RE = /^\/([A-Za-z]:)?$/;
function cwd() {
  if (typeof process !== "undefined" && typeof process.cwd === "function") {
    return process.cwd().replace(/\\/g, "/");
  }
  return "/";
}
const resolve = function(...arguments_) {
  arguments_ = arguments_.map((argument) => normalizeWindowsPath(argument));
  let resolvedPath = "";
  let resolvedAbsolute = false;
  for (let index = arguments_.length - 1; index >= -1 && !resolvedAbsolute; index--) {
    const path = index >= 0 ? arguments_[index] : cwd();
    if (!path || path.length === 0) {
      continue;
    }
    resolvedPath = `${path}/${resolvedPath}`;
    resolvedAbsolute = isAbsolute(path);
  }
  resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute);
  if (resolvedAbsolute && !isAbsolute(resolvedPath)) {
    return `/${resolvedPath}`;
  }
  return resolvedPath.length > 0 ? resolvedPath : ".";
};
function normalizeString(path, allowAboveRoot) {
  let res = "";
  let lastSegmentLength = 0;
  let lastSlash = -1;
  let dots = 0;
  let char = null;
  for (let index = 0; index <= path.length; ++index) {
    if (index < path.length) {
      char = path[index];
    } else if (char === "/") {
      break;
    } else {
      char = "/";
    }
    if (char === "/") {
      if (lastSlash === index - 1 || dots === 1) ; else if (dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res[res.length - 1] !== "." || res[res.length - 2] !== ".") {
          if (res.length > 2) {
            const lastSlashIndex = res.lastIndexOf("/");
            if (lastSlashIndex === -1) {
              res = "";
              lastSegmentLength = 0;
            } else {
              res = res.slice(0, lastSlashIndex);
              lastSegmentLength = res.length - 1 - res.lastIndexOf("/");
            }
            lastSlash = index;
            dots = 0;
            continue;
          } else if (res.length > 0) {
            res = "";
            lastSegmentLength = 0;
            lastSlash = index;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          res += res.length > 0 ? "/.." : "..";
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0) {
          res += `/${path.slice(lastSlash + 1, index)}`;
        } else {
          res = path.slice(lastSlash + 1, index);
        }
        lastSegmentLength = index - lastSlash - 1;
      }
      lastSlash = index;
      dots = 0;
    } else if (char === "." && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}
const isAbsolute = function(p) {
  return _IS_ABSOLUTE_RE.test(p);
};
const relative = function(from, to) {
  const _from = resolve(from).replace(_ROOT_FOLDER_RE, "$1").split("/");
  const _to = resolve(to).replace(_ROOT_FOLDER_RE, "$1").split("/");
  if (_to[0][1] === ":" && _from[0][1] === ":" && _from[0] !== _to[0]) {
    return _to.join("/");
  }
  const _fromCopy = [..._from];
  for (const segment of _fromCopy) {
    if (_to[0] !== segment) {
      break;
    }
    _from.shift();
    _to.shift();
  }
  return [..._from.map(() => ".."), ..._to].join("/");
};
const dirname = function(p) {
  const segments = normalizeWindowsPath(p).replace(/\/$/, "").split("/").slice(0, -1);
  if (segments.length === 1 && _DRIVE_LETTER_RE.test(segments[0])) {
    segments[0] += "/";
  }
  return segments.join("/") || (isAbsolute(p) ? "/" : ".");
};

function readAsset (id) {
  const serverDir = dirname(fileURLToPath(globalThis._importMeta_.url));
  return promises.readFile(resolve(serverDir, assets[id].path))
}

const publicAssetBases = {"/_nuxt/builds/meta/":{"maxAge":31536000},"/_nuxt/builds/":{"maxAge":1},"/_nuxt/":{"maxAge":31536000}};

function isPublicAssetURL(id = '') {
  if (assets[id]) {
    return true
  }
  for (const base in publicAssetBases) {
    if (id.startsWith(base)) { return true }
  }
  return false
}

function getAsset (id) {
  return assets[id]
}

const METHODS = /* @__PURE__ */ new Set(["HEAD", "GET"]);
const EncodingMap = { gzip: ".gz", br: ".br" };
const _rXJ1Oo = eventHandler((event) => {
  if (event.method && !METHODS.has(event.method)) {
    return;
  }
  let id = decodePath(
    withLeadingSlash(withoutTrailingSlash(parseURL(event.path).pathname))
  );
  let asset;
  const encodingHeader = String(
    getRequestHeader(event, "accept-encoding") || ""
  );
  const encodings = [
    ...encodingHeader.split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(),
    ""
  ];
  for (const encoding of encodings) {
    for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
      const _asset = getAsset(_id);
      if (_asset) {
        asset = _asset;
        id = _id;
        break;
      }
    }
  }
  if (!asset) {
    if (isPublicAssetURL(id)) {
      removeResponseHeader(event, "Cache-Control");
      throw createError$1({ statusCode: 404 });
    }
    return;
  }
  if (asset.encoding !== void 0) {
    appendResponseHeader(event, "Vary", "Accept-Encoding");
  }
  const ifNotMatch = getRequestHeader(event, "if-none-match") === asset.etag;
  if (ifNotMatch) {
    setResponseStatus(event, 304, "Not Modified");
    return "";
  }
  const ifModifiedSinceH = getRequestHeader(event, "if-modified-since");
  const mtimeDate = new Date(asset.mtime);
  if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
    setResponseStatus(event, 304, "Not Modified");
    return "";
  }
  if (asset.type && !getResponseHeader(event, "Content-Type")) {
    setResponseHeader(event, "Content-Type", asset.type);
  }
  if (asset.etag && !getResponseHeader(event, "ETag")) {
    setResponseHeader(event, "ETag", asset.etag);
  }
  if (asset.mtime && !getResponseHeader(event, "Last-Modified")) {
    setResponseHeader(event, "Last-Modified", mtimeDate.toUTCString());
  }
  if (asset.encoding && !getResponseHeader(event, "Content-Encoding")) {
    setResponseHeader(event, "Content-Encoding", asset.encoding);
  }
  if (asset.size > 0 && !getResponseHeader(event, "Content-Length")) {
    setResponseHeader(event, "Content-Length", asset.size);
  }
  return readAsset(id);
});

const _T_xRPf = defineEventHandler(async (event) => {
  var _a, _b;
  const path = getRequestURL(event).pathname;
  if (path === "/ws" || isFrontendPath(path)) {
    return;
  }
  const target = backendUrl() + getRequestURL(event).pathname + getRequestURL(event).search;
  const headers = { accept: (_a = getRequestHeader(event, "accept")) != null ? _a : "*/*" };
  if (!isNavigationRequest(event)) {
    return proxyRequest(event, target, { headers, fetchOptions: { redirect: "manual" } });
  }
  let response;
  try {
    response = await fetch(target, {
      headers: { ...getProxyRequestHeaders(event), ...headers },
      redirect: "manual"
    });
  } catch (cause) {
    throw createError$1({ statusCode: 502, statusMessage: "Bad Gateway", cause });
  }
  if (response.status >= 400) {
    setResponseStatus(event, response.status);
    event.context.backendStatus = response.status;
    await ((_b = response.body) == null ? void 0 : _b.cancel());
    return;
  }
  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  return sendWebResponse(
    event,
    new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    })
  );
});

const _messagesHandler = defineEventHandler(async (event) => {
  const locale = getRouterParam(event, "locale");
  if (!locale) {
    throw createError$1({ status: 400, message: "Locale not specified." });
  }
  const ctx = useI18nContext(event);
  if (ctx.localeConfigs && locale in ctx.localeConfigs === false) {
    throw createError$1({ status: 404, message: `Locale '${locale}' not found.` });
  }
  const messages = await ctx.loadMessages(locale);
  return messages;
});
const getCacheKey = (event) => [getRouterParam(event, "locale") ?? "null", getRouterParam(event, "hash") ?? "null"].join("-");
async function shouldBypassCache(event) {
  const locale = getRouterParam(event, "locale");
  if (locale == null) {
    return false;
  }
  const ctx = tryUseI18nContext(event) || await initializeI18nContext(event);
  return !ctx.localeConfigs?.[locale]?.cacheable;
}
const _cachedMessageLoader = defineCachedFunction(_messagesHandler, {
  name: "i18n:messages-internal",
  maxAge: -1 ,
  getKey: getCacheKey,
  shouldBypassCache
});
const _messagesHandlerCached = defineCachedEventHandler(_cachedMessageLoader, {
  name: "i18n:messages",
  maxAge: -1 ,
  swr: false,
  getKey: getCacheKey,
  shouldBypassCache
});
const _gXh5St = _messagesHandlerCached;

const _SxA8c9 = defineEventHandler(() => {});

const _lazy_JuF9fG = () => import('../routes/renderer.mjs');

const handlers = [
  { route: '', handler: _rXJ1Oo, lazy: false, middleware: true, method: undefined },
  { route: '', handler: _T_xRPf, lazy: false, middleware: true, method: undefined },
  { route: '/__nuxt_error', handler: _lazy_JuF9fG, lazy: true, middleware: false, method: undefined },
  { route: '/_i18n/:hash/:locale/messages.json', handler: _gXh5St, lazy: false, middleware: false, method: undefined },
  { route: '/__nuxt_island/**', handler: _SxA8c9, lazy: false, middleware: false, method: undefined },
  { route: '/**', handler: _lazy_JuF9fG, lazy: true, middleware: false, method: undefined }
];

function createNitroApp() {
  const config = useRuntimeConfig();
  const hooks = createHooks();
  const captureError = (error, context = {}) => {
    const promise = hooks.callHookParallel("error", error, context).catch((error_) => {
      console.error("Error while capturing another error", error_);
    });
    if (context.event && isEvent(context.event)) {
      const errors = context.event.context.nitro?.errors;
      if (errors) {
        errors.push({ error, context });
      }
      if (context.event.waitUntil) {
        context.event.waitUntil(promise);
      }
    }
  };
  const h3App = createApp({
    debug: destr(false),
    onError: (error, event) => {
      captureError(error, { event, tags: ["request"] });
      return errorHandler(error, event);
    },
    onRequest: async (event) => {
      event.context.nitro = event.context.nitro || { errors: [] };
      const fetchContext = event.node.req?.__unenv__;
      if (fetchContext?._platform) {
        event.context = {
          _platform: fetchContext?._platform,
          // #3335
          ...fetchContext._platform,
          ...event.context
        };
      }
      if (!event.context.waitUntil && fetchContext?.waitUntil) {
        event.context.waitUntil = fetchContext.waitUntil;
      }
      event.fetch = (req, init) => fetchWithEvent(event, req, init, { fetch: localFetch });
      event.$fetch = (req, init) => fetchWithEvent(event, req, init, {
        fetch: $fetch
      });
      event.waitUntil = (promise) => {
        if (!event.context.nitro._waitUntilPromises) {
          event.context.nitro._waitUntilPromises = [];
        }
        event.context.nitro._waitUntilPromises.push(promise);
        if (event.context.waitUntil) {
          event.context.waitUntil(promise);
        }
      };
      event.captureError = (error, context) => {
        captureError(error, { event, ...context });
      };
      await nitroApp.hooks.callHook("request", event).catch((error) => {
        captureError(error, { event, tags: ["request"] });
      });
    },
    onBeforeResponse: async (event, response) => {
      await nitroApp.hooks.callHook("beforeResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    },
    onAfterResponse: async (event, response) => {
      await nitroApp.hooks.callHook("afterResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    }
  });
  const router = createRouter({
    preemptive: true
  });
  const nodeHandler = toNodeListener(h3App);
  const localCall = (aRequest) => b(
    nodeHandler,
    aRequest
  );
  const localFetch = (input, init) => {
    if (!input.toString().startsWith("/")) {
      return globalThis.fetch(input, init);
    }
    return C(
      nodeHandler,
      input,
      init
    ).then((response) => normalizeFetchResponse(response));
  };
  const $fetch = createFetch({
    fetch: localFetch,
    Headers: Headers$1,
    defaults: { baseURL: config.app.baseURL }
  });
  globalThis.$fetch = $fetch;
  h3App.use(createRouteRulesHandler({ localFetch }));
  for (const h of handlers) {
    let handler = h.lazy ? lazyEventHandler(h.handler) : h.handler;
    if (h.middleware || !h.route) {
      const middlewareBase = (config.app.baseURL + (h.route || "/")).replace(
        /\/+/g,
        "/"
      );
      h3App.use(middlewareBase, handler);
    } else {
      const routeRules = getRouteRulesForPath(
        h.route.replace(/:\w+|\*\*/g, "_")
      );
      if (routeRules.cache) {
        handler = cachedEventHandler(handler, {
          group: "nitro/routes",
          ...routeRules.cache
        });
      }
      router.use(h.route, handler, h.method);
    }
  }
  h3App.use(config.app.baseURL, router.handler);
  const app = {
    hooks,
    h3App,
    router,
    localCall,
    localFetch,
    captureError
  };
  return app;
}
function runNitroPlugins(nitroApp2) {
  for (const plugin of plugins) {
    try {
      plugin(nitroApp2);
    } catch (error) {
      nitroApp2.captureError(error, { tags: ["plugin"] });
      throw error;
    }
  }
}
const nitroApp = createNitroApp();
function useNitroApp() {
  return nitroApp;
}
runNitroPlugins(nitroApp);

const debug = (...args) => {
};
function GracefulShutdown(server, opts) {
  opts = opts || {};
  const options = Object.assign(
    {
      signals: "SIGINT SIGTERM",
      timeout: 3e4,
      development: false,
      forceExit: true,
      onShutdown: (signal) => Promise.resolve(signal),
      preShutdown: (signal) => Promise.resolve(signal)
    },
    opts
  );
  let isShuttingDown = false;
  const connections = {};
  let connectionCounter = 0;
  const secureConnections = {};
  let secureConnectionCounter = 0;
  let failed = false;
  let finalRun = false;
  function onceFactory() {
    let called = false;
    return (emitter, events, callback) => {
      function call() {
        if (!called) {
          called = true;
          return Reflect.apply(callback, this, arguments);
        }
      }
      for (const e of events) {
        emitter.on(e, call);
      }
    };
  }
  const signals = options.signals.split(" ").map((s) => s.trim()).filter((s) => s.length > 0);
  const once = onceFactory();
  once(process, signals, (signal) => {
    debug("received shut down signal", signal);
    shutdown(signal).then(() => {
      if (options.forceExit) {
        process.exit(failed ? 1 : 0);
      }
    }).catch((error) => {
      debug("server shut down error occurred", error);
      process.exit(1);
    });
  });
  function isFunction(functionToCheck) {
    const getType = Object.prototype.toString.call(functionToCheck);
    return /^\[object\s([A-Za-z]+)?Function]$/.test(getType);
  }
  function destroy(socket, force = false) {
    if (socket._isIdle && isShuttingDown || force) {
      socket.destroy();
      if (socket.server instanceof http.Server) {
        delete connections[socket._connectionId];
      } else {
        delete secureConnections[socket._connectionId];
      }
    }
  }
  function destroyAllConnections(force = false) {
    debug("Destroy Connections : " + (force ? "forced close" : "close"));
    let counter = 0;
    let secureCounter = 0;
    for (const key of Object.keys(connections)) {
      const socket = connections[key];
      const serverResponse = socket._httpMessage;
      if (serverResponse && !force) {
        if (!serverResponse.headersSent) {
          serverResponse.setHeader("connection", "close");
        }
      } else {
        counter++;
        destroy(socket);
      }
    }
    debug("Connections destroyed : " + counter);
    debug("Connection Counter    : " + connectionCounter);
    for (const key of Object.keys(secureConnections)) {
      const socket = secureConnections[key];
      const serverResponse = socket._httpMessage;
      if (serverResponse && !force) {
        if (!serverResponse.headersSent) {
          serverResponse.setHeader("connection", "close");
        }
      } else {
        secureCounter++;
        destroy(socket);
      }
    }
    debug("Secure Connections destroyed : " + secureCounter);
    debug("Secure Connection Counter    : " + secureConnectionCounter);
  }
  server.on("request", (req, res) => {
    req.socket._isIdle = false;
    if (isShuttingDown && !res.headersSent) {
      res.setHeader("connection", "close");
    }
    res.on("finish", () => {
      req.socket._isIdle = true;
      destroy(req.socket);
    });
  });
  server.on("connection", (socket) => {
    if (isShuttingDown) {
      socket.destroy();
    } else {
      const id = connectionCounter++;
      socket._isIdle = true;
      socket._connectionId = id;
      connections[id] = socket;
      socket.once("close", () => {
        delete connections[socket._connectionId];
      });
    }
  });
  server.on("secureConnection", (socket) => {
    if (isShuttingDown) {
      socket.destroy();
    } else {
      const id = secureConnectionCounter++;
      socket._isIdle = true;
      socket._connectionId = id;
      secureConnections[id] = socket;
      socket.once("close", () => {
        delete secureConnections[socket._connectionId];
      });
    }
  });
  process.on("close", () => {
    debug("closed");
  });
  function shutdown(sig) {
    function cleanupHttp() {
      destroyAllConnections();
      debug("Close http server");
      return new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) {
            return reject(err);
          }
          return resolve(true);
        });
      });
    }
    debug("shutdown signal - " + sig);
    if (options.development) {
      debug("DEV-Mode - immediate forceful shutdown");
      return process.exit(0);
    }
    function finalHandler() {
      if (!finalRun) {
        finalRun = true;
        if (options.finally && isFunction(options.finally)) {
          debug("executing finally()");
          options.finally();
        }
      }
      return Promise.resolve();
    }
    function waitForReadyToShutDown(totalNumInterval) {
      debug(`waitForReadyToShutDown... ${totalNumInterval}`);
      if (totalNumInterval === 0) {
        debug(
          `Could not close connections in time (${options.timeout}ms), will forcefully shut down`
        );
        return Promise.resolve(true);
      }
      const allConnectionsClosed = Object.keys(connections).length === 0 && Object.keys(secureConnections).length === 0;
      if (allConnectionsClosed) {
        debug("All connections closed. Continue to shutting down");
        return Promise.resolve(false);
      }
      debug("Schedule the next waitForReadyToShutdown");
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(waitForReadyToShutDown(totalNumInterval - 1));
        }, 250);
      });
    }
    if (isShuttingDown) {
      return Promise.resolve();
    }
    debug("shutting down");
    return options.preShutdown(sig).then(() => {
      isShuttingDown = true;
      cleanupHttp();
    }).then(() => {
      const pollIterations = options.timeout ? Math.round(options.timeout / 250) : 0;
      return waitForReadyToShutDown(pollIterations);
    }).then((force) => {
      debug("Do onShutdown now");
      if (force) {
        destroyAllConnections(force);
      }
      return options.onShutdown(sig);
    }).then(finalHandler).catch((error) => {
      const errString = typeof error === "string" ? error : JSON.stringify(error);
      debug(errString);
      failed = true;
      throw errString;
    });
  }
  function shutdownManual() {
    return shutdown("manual");
  }
  return shutdownManual;
}

function getGracefulShutdownConfig() {
  return {
    disabled: !!process.env.NITRO_SHUTDOWN_DISABLED,
    signals: (process.env.NITRO_SHUTDOWN_SIGNALS || "SIGTERM SIGINT").split(" ").map((s) => s.trim()),
    timeout: Number.parseInt(process.env.NITRO_SHUTDOWN_TIMEOUT || "", 10) || 3e4,
    forceExit: !process.env.NITRO_SHUTDOWN_NO_FORCE_EXIT
  };
}
function setupGracefulShutdown(listener, nitroApp) {
  const shutdownConfig = getGracefulShutdownConfig();
  if (shutdownConfig.disabled) {
    return;
  }
  GracefulShutdown(listener, {
    signals: shutdownConfig.signals.join(" "),
    timeout: shutdownConfig.timeout,
    forceExit: shutdownConfig.forceExit,
    onShutdown: async () => {
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.warn("Graceful shutdown timeout, force exiting...");
          resolve();
        }, shutdownConfig.timeout);
        nitroApp.hooks.callHook("close").catch((error) => {
          console.error(error);
        }).finally(() => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }
  });
}

export { trapUnhandledNodeErrors as a, useNitroApp as b, buildAssetsURL as c, destr as d, encodePath as e, appRootTag as f, appRootAttrs as g, appSpaLoaderTag as h, appSpaLoaderAttrs as i, appId as j, defineRenderHandler as k, appTeleportTag as l, appTeleportAttrs as m, getQuery as n, createError$1 as o, publicAssetsURL as p, appHead as q, getRouteRules as r, setupGracefulShutdown as s, toNodeListener as t, useRuntimeConfig as u, relative as v, joinURL as w, getResponseStatusText as x, getResponseStatus as y };
//# sourceMappingURL=nitro.mjs.map
