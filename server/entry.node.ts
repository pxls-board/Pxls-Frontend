/**
 * Production server entry: Nitro's `node-server` preset entry plus a
 * WebSocket upgrade handler that forwards `/ws` to the Pxls back end.
 *
 * Nitro's route rules and `proxyRequest` only proxy plain HTTP, and the preset
 * gives no access to the underlying `http.Server`, so we provide our own.
 */
// Nitro-internal modules are resolved by the Nitro build and have no public types.
// @ts-expect-error internal virtual module
import '#nitro-internal-pollyfills';
import { Server as HttpServer } from 'node:http';
import { Server as HttpsServer } from 'node:https';
import destr from 'destr';
import { toNodeListener } from 'h3';
import { proxyUpgrade } from 'httpxy';
import { useNitroApp, useRuntimeConfig } from 'nitropack/runtime';
// @ts-expect-error internal Nitro runtime
import { setupGracefulShutdown, trapUnhandledNodeErrors } from 'nitropack/runtime/internal';

const cert = process.env.NITRO_SSL_CERT;
const key = process.env.NITRO_SSL_KEY;

const nitroApp = useNitroApp();
const listener = toNodeListener(nitroApp.h3App);
const server = cert && key ? new HttpsServer({ key, cert }, listener) : new HttpServer(listener);

const port = destr<number>(process.env.NITRO_PORT || process.env.PORT) || 3000;
const host = process.env.NITRO_HOST || process.env.HOST;
const socketPath = process.env.NITRO_UNIX_SOCKET;

server.on('upgrade', (req, socket, head) => {
  const path = new URL(req.url ?? '/', 'http://localhost').pathname;
  if (path !== '/ws') {
    socket.destroy();
    return;
  }

  const { proxyTo } = useRuntimeConfig();
  proxyUpgrade(`ws://${proxyTo}`, req, socket, head, { changeOrigin: true }).catch((error) => {
    console.error('[ws-proxy] upgrade failed:', error);
    socket.destroy();
  });
});

server.listen(socketPath ? { path: socketPath } : { port, host }, () => {
  const address = server.address();
  if (typeof address === 'string') {
    console.info(`Listening on unix socket ${address}`);
    return;
  }
  const protocol = cert && key ? 'https' : 'http';
  const hostname = address?.family === 'IPv6' ? `[${address.address}]` : address?.address;
  console.info(`Listening on ${protocol}://${hostname}:${address?.port}/`);
});

trapUnhandledNodeErrors();
setupGracefulShutdown(server, nitroApp);

export default {};
