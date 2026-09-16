import process from 'node:process';globalThis._importMeta_={url:import.meta.url,env:process.env};import { Server as Server$1 } from 'node:http';
import { Server } from 'node:https';
import { t as toNodeListener, d as destr, u as useRuntimeConfig, a as trapUnhandledNodeErrors, s as setupGracefulShutdown, b as useNitroApp } from './chunks/nitro/nitro.mjs';
import { proxyUpgrade } from 'httpxy';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'vue-router';
import 'node:url';

const cert = process.env.NITRO_SSL_CERT;
const key = process.env.NITRO_SSL_KEY;
const nitroApp = useNitroApp();
const listener = toNodeListener(nitroApp.h3App);
const server = cert && key ? new Server({ key, cert }, listener) : new Server$1(listener);
const port = destr(process.env.NITRO_PORT || process.env.PORT) || 3e3;
const host = process.env.NITRO_HOST || process.env.HOST;
const socketPath = process.env.NITRO_UNIX_SOCKET;
server.on("upgrade", (req, socket, head) => {
  var _a;
  const path = new URL((_a = req.url) != null ? _a : "/", "http://localhost").pathname;
  if (path !== "/ws") {
    socket.destroy();
    return;
  }
  const { proxyTo } = useRuntimeConfig();
  proxyUpgrade(`ws://${proxyTo}`, req, socket, head, { changeOrigin: true }).catch((error) => {
    console.error("[ws-proxy] upgrade failed:", error);
    socket.destroy();
  });
});
server.listen(socketPath ? { path: socketPath } : { port, host }, () => {
  const address = server.address();
  if (typeof address === "string") {
    console.info(`Listening on unix socket ${address}`);
    return;
  }
  const protocol = cert && key ? "https" : "http";
  const hostname = (address == null ? void 0 : address.family) === "IPv6" ? `[${address.address}]` : address == null ? void 0 : address.address;
  console.info(`Listening on ${protocol}://${hostname}:${address == null ? void 0 : address.port}/`);
});
trapUnhandledNodeErrors();
setupGracefulShutdown(server, nitroApp);
const entry_node = {};

export { entry_node as default };
//# sourceMappingURL=index.mjs.map
