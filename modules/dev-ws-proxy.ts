import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';
import { defineNuxtModule, useLogger } from '@nuxt/kit';
import { proxyUpgrade } from 'httpxy';

type UpgradeListener = (req: IncomingMessage, socket: Duplex, head: Buffer) => void;

/**
 * Dev only: forwards `/ws` upgrades to the Pxls back end.
 *
 * Nitro's dev server hands every upgrade to its worker (`devProxy` only
 * proxies plain HTTP), so we take over `/ws` on the dev HTTP server and pass
 * everything else (e.g. Vite HMR) to the original listeners.
 * Production does the same in `server/entry.node.ts`.
 */
export default defineNuxtModule({
  meta: { name: 'pxls-dev-ws-proxy' },
  setup(_options, nuxt) {
    if (!nuxt.options.dev) return;
    const logger = useLogger('pxls');

    nuxt.hook('listen', (server) => {
      const original = server.listeners('upgrade') as UpgradeListener[];
      server.removeAllListeners('upgrade');
      server.on('upgrade', (req: IncomingMessage, socket: Duplex, head: Buffer) => {
        const path = new URL(req.url ?? '/', 'http://localhost').pathname;
        if (path !== '/ws') {
          for (const listener of original) listener.call(server, req, socket, head);
          return;
        }
        const proxyTo = String(nuxt.options.runtimeConfig.proxyTo);
        proxyUpgrade(`ws://${proxyTo}`, req, socket, head, { changeOrigin: true }).catch((error: unknown) => {
          logger.error('WebSocket proxy failed:', error);
          socket.destroy();
        });
      });
    });
  },
});
