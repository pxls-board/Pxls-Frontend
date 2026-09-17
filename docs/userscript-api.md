# Userscript API

The client exposes a typed API as `window.pxls`. Types are served at
`/pxls-api.d.ts`:

```js
/// <reference path="https://pxls.space/pxls-api.d.ts" />
```

## Waiting for the app

The app loads asynchronously, so don't read `window.pxls` right away. Push a
callback onto `window.pxlsQueue`. It runs once the board and socket are ready,
or immediately if they already are:

```js
(window.pxlsQueue ??= []).push((pxls) => {
  console.log('board size', pxls.board.width, pxls.board.height);
});
```

Or listen for the event:

```js
window.addEventListener('pxls:ready', (event) => {
  const pxls = event.detail;
});
```

## Events

`pxls.on(event, handler)` returns a function that unsubscribes.

```js
const off = pxls.on('pixel', ({ x, y, color }) => {
  console.log(`pixel at ${x},${y} is now ${pxls.palette.colors[color]?.name}`);
});
// later
off();
```

| Event                                   | Payload                                  |
| --------------------------------------- | ---------------------------------------- |
| `pixel`                                 | `{ x, y, color }` for each changed pixel |
| `pixels`                                | `{ count, cause }` available pixel count |
| `cooldown`                              | `{ wait }` seconds until the next pixel  |
| `chat`                                  | chat message packet                      |
| `userinfo`                              | the signed-in user                       |
| `template`                              | template options after a change          |
| `queryUpdated`                          | `{ propName, oldValue, newValue }`       |
| `panel:opened`/`panel:closed`           | panel id                                 |
| `ack:place`/`ack:undo`                  | `{ x, y }`                               |
| `user:loginState`                       | `true`/`false`                           |
| `pixelCounts:update`                    | `{ pixelCount, pixelCountAllTime }`      |
| `chat:userIgnored`/`chat:userUnignored` | username                                 |

Every event is also dispatched on `window` as a `pxls:<event>` `CustomEvent`.

## Common tasks

```js
pxls.board.centerOn(100, 200);
pxls.board.setScale(10);
pxls.template.update({ url: 'https://example.com/art.png', x: 10, y: 20, use: true });
pxls.settings.board.grid.enable.set(true);

pxls.lookup.registerHook({
  id: 'my-hook',
  name: 'Placed by',
  get: (data) => data.username ?? null,
});

pxls.chat.registerHook({
  id: 'highlight-friends',
  get: (message) => ({ pings: message.author === 'friend' ? [message.author] : [] }),
});

pxls.overlays.add('my-overlay', async () => new ImageData(pxls.board.width, pxls.board.height));
```

See `pxls-api.d.ts` for the full surface.

## Migrating from `window.App`

`window.App` still works, but it's deprecated and logs a warning. The table
below lists replacements.

| `window.App`                                       | `window.pxls`                                         |
| -------------------------------------------------- | ----------------------------------------------------- |
| `App.centerBoardOn(x, y)`                          | `pxls.board.centerOn(x, y)`                           |
| `App.updateTemplate(t)` / `App.template.update(t)` | `pxls.template.update(t)`                             |
| `App.template.normalize(o, dir)`                   | `pxls.template.normalize(o, dir)`                     |
| `App.settings`                                     | `pxls.settings`                                       |
| `App.query.get/set/has/remove`                     | `pxls.query.get/set/has/remove`                       |
| `App.lookup.registerHook(...)`                     | `pxls.lookup.registerHook(...)`                       |
| `App.chat.registerHook(...)`                       | `pxls.chat.registerHook(...)`                         |
| `App.overlays.add(...)`                            | `pxls.overlays.add(...)`                              |
| `App.overlays.heatmap.clear()`                     | `pxls.overlays.heatmap.clear()`                       |
| `App.user.getUsername()`                           | `pxls.user.username`                                  |
| `App.user.hasPermission(p)`                        | `pxls.user.hasPermission(p)`                          |
| `App.alert(text)`                                  | `pxls.ui.alert(text)`                                 |
| `App.modal`                                        | `pxls.ui.modal`                                       |
| `App.uiHelper.tabHasFocus()`                       | `pxls.ui.tabHasFocus()`                               |
| `App.uiHelper.handleFile(input)`                   | `pxls.ui.loadTemplateFile(input)`                     |
| `App.ls` / `App.ss`                                | `pxls.storage.local` / `pxls.storage.session`         |
| jQuery `$(window).on('pxls:…')`                    | `pxls.on('…')` or `window.addEventListener('pxls:…')` |

Note that the client no longer ships jQuery for regular users.
