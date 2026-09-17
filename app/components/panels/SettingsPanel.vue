<script setup lang="ts">
import type { SelectItem } from '@nuxt/ui';
import { LOCALES } from '~~/i18n/locales';

const settingsStore = useSettingsStore();
const settings = useSettings();
const template = useTemplateStore();
const overlays = useOverlaysStore();
const timer = useTimerStore();
const ui = useUiStore();
const user = useUserStore();
const chat = useChatStore();
const place = usePlaceStore();
const { t } = useI18n();

const webkit = browserFlags().webkitBased;

const search = computed({
  get: () => settingsStore.search,
  set: (value: string) => settingsStore.filter.search(value),
});

// Clear the search when the panel closes.
onBeforeUnmount(
  pxlsEvents.subscribe('panel:closed', (panel) => {
    if (panel === 'settings') settingsStore.filter.search('');
  }),
);

// Root search scope: visible when any article matches.
const anyVisible = useSearchContainer(() => undefined);
const noResults = computed(() => search.value.trim() !== '' && !anyVisible.value);

// ---- Keybinds -------------------------------------------------------------

const generalKeybinds: [string, string][] = [
  [msg('move;moving;panning;drag'), msg('Mouse/arrows/wasd to pan')],
  [msg('mousewheel;zooming'), msg('Scroll/pinch to zoom')],
  [msg('scroll;zooming'), msg('<kbd>+</kbd>/<kbd>-</kbd> or <kbd>Q</kbd>/<kbd>E</kbd> to zoom')],
  [msg('lookups'), msg('<kbd>Shift</kbd> + Click/Hold touch to lookup pixel')],
  [msg('overlays;alignment;grid hidden;grid shown;hide grid;show grid'), msg('<kbd>G</kbd> to toggle grid')],
  [
    msg('close;information shown;information hidden;info shown;info hidden;hide information;show information'),
    msg('<kbd>I</kbd> to open info'),
  ],
  [msg('close;settings hidden;settings shown;hide settings;show settings'), msg('<kbd>T</kbd> to open settings')],
  [msg('close;chat hidden;chat shown;hide chat;show chat'), msg('<kbd>B</kbd> to open chat')],
  [msg('canvas locked;move;moving;zoom;zooming'), msg('<kbd>L</kbd> to toggle locking panning of the canvas')],
  [msg('take screenshot;image;download;picture;canvas'), msg('<kbd>P</kbd> to take a snapshot')],
  [
    msg('overlays;user activity;pixels placed pixels;heatmap hidden;heatmap shown;hide heatmap;show heatmap'),
    msg('<kbd>H</kbd> to toggle heatmap'),
  ],
  [
    msg('overlays;user activity;pixels unplaced pixels;virginmap hidden;virginmap shown;hide virginmap;show virginmap'),
    msg('<kbd>X</kbd> to toggle virginmap'),
  ],
  [msg('overlays;user activity;pixels placed pixels;wipe;clean;'), msg('<kbd>O</kbd> to clear heatmap')],
  [msg('overlays;user activity;pixels unplaced pixels;wipe;clean;'), msg('<kbd>U</kbd> to clear virginmap')],
  [msg('next color;previous color'), msg('<kbd>J</kbd>/<kbd>K</kbd> to cycle through palette colors')],
  [msg('current coordinates;coords'), msg('<kbd>C</kbd> to copy link of moused-over coordinates')],
  [msg('cancel selection'), msg('<kbd>ESC</kbd> to deselect current pixel')],
  [
    msg('recenter;jump;center on template;guides;focus'),
    msg('<kbd>R</kbd> to center the board on the current template'),
  ],
];

const templateKeybinds: [string, string][] = [
  [msg('transparency'), msg('<kbd>Page Up</kbd> to increase opacity')],
  [msg('transparency'), msg('<kbd>Page Down</kbd> to decrease opacity')],
  [msg('hidden;shown;hide;show'), msg('<kbd>V</kbd> to toggle visibility')],
];

const stripTags = (html: string) => html.replace(/<[^>]+>/g, '');

// ---- Template ---------------------------------------------------------------

const TEMPLATE_STYLES: [string, string][] = [
  [
    msg('1-to-1'),
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/gD1AOQaL8IZAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIklEQVQ4y2P8////fwYKABMDhWDUgFEDRg0YDAYwMjIyAgBr1AQgfweGSgAAAABJRU5ErkJggg==',
  ],
  [
    msg('1-to-1 (keep incorrect colors)'),
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAGklEQVQoz2P8//8/AymAiYFEMKphVMPQ0QAAVW0DHZ8uFaIAAAAASUVORK5CYII=',
  ],
  [
    msg('Dotted (Small, 1:2)'),
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAQAAAD9CzEMAAAAAmJLR0QA/4ePzL8AAAAzSURBVFjD7dBBDQAACMSw828aVEAI6R4T0GShGv6DECFChAgRIkSIECFChAgRIkSIruA0nub+AuTzLZoAAAAASUVORK5CYII=',
  ],
  [
    msg('Dotted (Big, 2:2)'),
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAWklEQVR42u3UwQkAIAwEwcX+e9aP2INkBvK4d2CLqva9cXv5PWgAoAGgARoAGqABoAEaABqgAaABGgAaoAGgARoAGqABoAEaABqgAaABGgAaoAGgAT/vRwOmO8dS/DI1VxCbAAAAAElFTkSuQmCC',
  ],
  [
    msg('Symbols'),
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHAAAABwAQMAAAD8LmYIAAAAAXNSR0IB2cksfwAAAAlwSFlzAAAuIwAALiMBeKU/dgAAAAZQTFRFAAAAAwMDFQUF7wAAAAJ0Uk5TAP9bkSK1AAAAuUlEQVR4nGNgQAUhjQvdz0uwMfx82OrVIgPkBj/xaOEQ6GRuP9vHAeQGsPjzyVj8LH5+iAXEDTziMd+uplHg+VE+GQaNjwHt5+WB3A+HO+bbMRACDoed+Xg0FIMW97dIMLAwNC45OF8ip+Dh8aN8Ngwsjc2sXfNFBAoePz8xX46B5+DhNj4WlpwCx+NH5W0Yan5+fn6+xU5DwWlxf58EAWs0DFC4NQX4uBaoXAFUvaNgFIyCUTAKaAYAzI49GM5w0hQAAAAASUVORK5CYII=',
  ],
  [
    msg('Numbers'),
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALAAAACwCAYAAACvt+ReAAAE10lEQVR42u3d3bKjKBQGULDy/q/MXE1VdzqRH9kqZq2bqZn5JKAmErbm5JRSSbCw0pGTlb1VdttpoAS9AUpANgW1u0q2dGxTOo7faLu92TTa7vZlozz55P2/zRyQ7RXRj97+zsyWjm1GT97aGI9kR8aWaydwxIEg7g05ms0nvcnCsq8bzrVnvVNr2RyQzReP7eeO33bBp0We/E6NnJr0nJAR7UZOpR5x/LYEC9smrCyMrETMXErpvazd4fI9c3+VnW/2teze8Ss7qwAt7ZYJ50y13deqk/fBbVYb28iY8mLZvf9ebTcnlTgeOIWAZShJyi6bfX3YOH84sfOXF7oyW3amQrXs++vMarc3m7/048w+rJT957htlU/i3HCQ93J77R7N5o4vD+/ZUvmSkRvHdiSbOvqwt/2RbA7av6cdt+0Bqw8jlMDX9M9xq5WS71xKjS5VtmxbDvZ3JJsDsvnEsU09dq+GM75MPnl72s2VQZx1JehdA23pb8/YevdDax/KhWMrM84Vy2gs7dOXuJGSZMslYLTUWbsUtbT7nm25ibqlhPqp3Z7+po7+RuyHnj707t/S8fql8/XLyHzE2qPs7bJKyTxmCgFLcimSXTa7fdiwfPn3NDGbgtq9ezYNZke++JaAbApqdzj75zrw+9rd3lrekeye1vsljmZ7+5snZL/1q2clJw3uwxnZXlGPWP3VX3PgNSh9f/HaeaeXzk+FEpzNAdl88dhSQPanjttWeafX7lZq/ZRovQPqSLanDyWo3ci70XqyvXeutbQbeVdez91onkrmmVOII3c1RV02I+8Ei2g36sc/SuOVo+WSfKS/EdOfw/2wnii7bFYpmaWZA7M8lyLZZbOvD0sUf/4z7XyJ68n++f88PfyDTw9H9WHWI0W17JFHXmqv+WnHzcymjj7Utj2yvpwC9u/yx+3uc2Al1DWddtxelfnw7DJjxI9Kt14pSuM7flY2B2TzxWO73XF7/12IM8qMtXeuEmpDCfWEsR2dSvVOu4ZuWbCMxtJaf9gkHcjNKM3WVgBqlzGl7/7+HhlfrfQ9ejdaOXqSysreKquUzNLMgVmeS5Hsstlv9wMroY5lW7+4KH1Pyr6vQiihHnsquTSMy1Pf4/v3n6w58FxK3yf7VkpWQo35M7Ol4xPzvd0SnM0B2Rw9tq1y+f7Fp4fPOHlr/SgdYysHxta7H3pOyIh2/a1kfmMK0fqJ0rrd3Uq5nh6O3Q8peP8Obywre6usUjJLMwdmeS5Fsstma6Xkb8scSqjPyC5/3Fp+nfKbI0+hRq0vp45s72MsOaC/V2eXP26z5sBKqGta/rjNWgfuyfrh7Pix/cxx2w68Iy95CvWiS5wfzt7f/rKnvi2j8egpxC2fQr355TCiXU9972xrPVF22axSMo+aQkCUsCU7lyLZM7Lhn8BKqOf39xdL31PN+kOHSqhj+yF1ju0ppe+wE9h8jKW/xK1WQj1D5GM3I9mIH5vOF49tyifwij/AfOYndk8JNqLNiDJ/CWr3tOOmlMxjphB+gPn4VErp+4Jpn3VK2TOyYXM7pWTO+h4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAE/1H4IIqRgL4W2oAAAAAElFTkSuQmCC',
  ],
];
const CUSTOM_STYLE = '__custom__';
const SOURCE_STYLE = '__source__';

const styleItems = computed<SelectItem[]>(() => [
  { label: t('Use Source Style'), value: SOURCE_STYLE },
  ...TEMPLATE_STYLES.map(([label, value]) => ({ label: t(label), value })),
  { label: t('Custom…'), value: CUSTOM_STYLE },
]);

const styleSource = computed({
  get: () => {
    const source = settings.board.template.style.source.value.value;
    if (!source) return SOURCE_STYLE;
    const known = TEMPLATE_STYLES.some(([, value]) => value === source);
    return known ? source : CUSTOM_STYLE;
  },
  set: (value: string) => {
    let source = value;
    if (value === CUSTOM_STYLE) source = settings.board.template.style.customsource.get();
    if (value === SOURCE_STYLE) source = '';
    settings.board.template.style.source.set(source);
  },
});

const customStyle = ref(settings.board.template.style.customsource.get());
function commitCustomStyle() {
  settings.board.template.style.customsource.set(customStyle.value);
  if (styleSource.value === CUSTOM_STYLE) {
    settings.board.template.style.source.set(customStyle.value);
  }
}

const templateUse = computed({
  get: () => template.options.use,
  set: (use: boolean) => template.update({ use }),
});

const templateUrl = ref(template.options.url);
const templateTitle = ref(template.options.title);
watch(
  () => template.options.url,
  (url) => {
    templateUrl.value = url;
  },
);
watch(
  () => template.options.title,
  (title) => {
    templateTitle.value = title;
  },
);

const templateX = computed({
  get: () => template.options.x,
  set: (x: number | null | undefined) => x != null && template.update({ x }),
});
const templateY = computed({
  get: () => template.options.y,
  set: (y: number | null | undefined) => y != null && template.update({ y }),
});
const templateWidth = computed({
  get: () => (template.options.width >= 0 ? template.options.width : template.sourceNaturalWidth || null),
  set: (width: number | null | undefined) => width != null && template.update({ width }),
});
const convertMode = computed({
  get: () => template.options.convertMode,
  set: (mode: string) => template.update({ convertMode: mode }),
});

const fileInput = ref<HTMLInputElement | null>(null);

const convertItems = computed(() => [
  { label: t('Unconverted'), value: 'unconverted' },
  { label: t('Nearest Custom'), value: 'nearestCustom' },
]);

// ---- UI --------------------------------------------------------------------

const languageItems = computed(() => [
  { label: t('Use Browser Language'), value: '' },
  ...LOCALES.map((locale) => ({ label: t(locale.name), value: locale.code })),
]);

const themeItems = computed(() => [
  { label: t('Default'), value: '-1' },
  ...THEMES.map((theme, index) => ({ label: t(theme.name), value: String(index) })),
]);

const bubblePositionItems = computed(() => [
  { label: t('Top left'), value: 'top left' },
  { label: t('Top right'), value: 'top right' },
  { label: t('Bottom left'), value: 'bottom left' },
  { label: t('Bottom right'), value: 'bottom right' },
]);

const bubbleAnimationItems = computed(() => [
  { label: t('None'), value: '' },
  { label: t('Plusone'), value: 'plusone' },
  { label: t('Shake'), value: 'shake' },
  { label: t('Shake & Plusone'), value: 'shake plusone' },
  { label: t('Bump'), value: 'bump' },
  { label: t('Bump & Plusone'), value: 'bump plusone' },
  { label: t('Pulse'), value: 'pulse' },
  { label: t('Pulse & Plusone'), value: 'pulse plusone' },
  { label: t('Pulse & Shake'), value: 'pulse shake' },
  { label: t('Pulse & Bump'), value: 'pulse bump' },
]);

watch(
  () => settings.ui.brightness.enable.value.value,
  (enabled) =>
    enabled ? settings.ui.brightness.value.controls.enable() : settings.ui.brightness.value.controls.disable(),
  { immediate: true },
);

// ---- Chat --------------------------------------------------------------------

const TEMPLATE_ACTION_LABELS = computed(() => [
  // translator: template link action
  { label: t('Ask'), value: TEMPLATE_ACTIONS.ASK },
  { label: t('Open in a new tab'), value: TEMPLATE_ACTIONS.NEW_TAB },
  { label: t('Open in current tab (replacing template)'), value: TEMPLATE_ACTIONS.CURRENT_TAB },
  { label: t('Jump to coordinates without replacing template'), value: TEMPLATE_ACTIONS.JUMP_ONLY },
]);

const iconBadgeItems = computed(() => [
  { label: t('Show on unread ping'), value: 'ping' },
  { label: t('Show on unread message'), value: 'message' },
  { label: t('Never show'), value: 'off' },
]);

const iconColorItems = computed(() => [
  { label: t('Show on unread message'), value: 'message' },
  { label: t('Show on unread ping'), value: 'ping' },
  { label: t('Never show'), value: 'off' },
]);

const nameColorItems = computed(() => {
  const hasPerm = (name: string) => user.hasPermission(`chat.usercolor.${name}`);
  const allGradients = hasPerm('gradient') || hasPerm('gradient.*');
  return [
    ...place.palette.map((color, index) => ({
      label: `${index}. ${color.name}`,
      value: index,
      color: `#${color.value}`,
      gradient: '',
    })),
    ...ui.specialChatColors
      .map((gradient, index) => ({
        label: `Gradient ${index}. ${gradient.name}`,
        value: -index - 1,
        color: '',
        gradient: `gradient ${ui.getSpecialChatColorClass(-index - 1)}`,
        allowed: allGradients || hasPerm(`gradient.${gradient.name.toLowerCase()}`),
      }))
      .filter((item) => item.allowed),
  ];
});

const nameColorFeedback = ref<{ text: string; error: boolean } | null>(null);
const nameColorBusy = ref(false);
const nameColor = computed({
  get: () => user.chatNameColor,
  set: async (color: number) => {
    nameColorBusy.value = true;
    const error = await chat.setNameColor(color);
    nameColorBusy.value = false;
    nameColorFeedback.value = error ? { text: error, error: true } : { text: 'Color updated!', error: false };
    setTimeout(() => (nameColorFeedback.value = null), 2500);
  },
});
const selectedNameColor = computed(() => nameColorItems.value.find((item) => item.value === user.chatNameColor));

const ignoreSelection = ref<string | undefined>();
const ignoreFeedback = ref<{ text: string; error: boolean } | null>(null);
const sortedIgnores = computed(() =>
  chat.ignored.toSorted((a, b) => a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase())),
);

function unignore() {
  if (ignoreSelection.value && chat.removeIgnore(ignoreSelection.value)) {
    ignoreFeedback.value = { text: 'User unignored.', error: false };
    ignoreSelection.value = undefined;
  } else if (chat.ignored.length === 0) {
    ignoreFeedback.value = { text: "You haven't ignored any users. Congratulations!", error: true };
  } else {
    ignoreFeedback.value = {
      text: "Failed to unignore user. Either they weren't actually ignored, or an error occurred. Contact a developer if the problem persists.",
      error: true,
    };
  }
  setTimeout(() => (ignoreFeedback.value = null), 2500);
}

// ---- Controls / snapshots / sound ---------------------------------------------

const rightClickItems = computed(() => [
  { label: t('Nothing'), value: 'nothing' },
  { label: t('Clear color'), value: 'clear' },
  { label: t('Copy color'), value: 'copy' },
  { label: t('Lookup'), value: 'lookup' },
  { label: t('Clear color + Lookup'), value: 'clearlookup' },
]);

const snapshotItems = computed(() => [
  { label: t('PNG'), value: 'image/png' },
  { label: t('JPEG'), value: 'image/jpeg' },
  { label: t('WEBP (Chrome only)'), value: 'image/webp' },
]);

const pingAudioItems = computed(() => [
  { label: t('Off'), value: 'off' },
  { label: t('Only when necessary'), value: 'discrete' },
  { label: t('Always'), value: 'always' },
]);

function resetAlertSound() {
  timer.setAudioSource('/notify.wav');
  settings.audio.alert.src.reset();
}

const discordName = ref(ui.discordName);
watch(
  () => ui.discordName,
  (name) => {
    discordName.value = name;
  },
);
</script>

<template>
  <PxlsPanel dom-id="settings" panel="settings" :title="$t('Settings')" :icon="ICONS.settings">
    <div class="sticky top-0 z-10 border-b border-default bg-pxls-panel p-3">
      <UInput
        v-model="search"
        type="search"
        :placeholder="$t('Search')"
        :icon="ICONS.search"
        class="w-full"
        @keydown.stop
        @keyup.enter="($event.target as HTMLInputElement).blur()"
      />
    </div>

    <SettingsArticle section-id="keybinds" :title="$t('Keybinds')" :keywords="$t('keybinds;keys;keyboard;hotkeys')">
      <SettingsGroup :title="$t('General')" :keywords="$t('general')">
        <SettingsItem
          v-for="[keywords, text] in generalKeybinds"
          :key="text"
          :keywords="$t(keywords)"
          :text="stripTags($t(text))"
        >
          <!-- eslint-disable-next-line vue/no-v-html -->
          <p class="text-sm" v-html="$t(text)" />
        </SettingsItem>
      </SettingsGroup>
      <SettingsGroup :title="$t('Template')" :keywords="$t('templates;guides')">
        <SettingsItem
          v-for="[keywords, text] in templateKeybinds"
          :key="text"
          :keywords="$t(keywords)"
          :text="stripTags($t(text))"
        >
          <!-- eslint-disable-next-line vue/no-v-html -->
          <p class="text-sm" v-html="$t(text)" />
        </SettingsItem>
      </SettingsGroup>
      <p class="text-xs text-muted">
        {{
          $t(
            'Note: These values are based on QWERTY keyboards. For other layouts, use the keys corresponding to the same position on a QWERTY keyboard.',
          )
        }}
      </p>
    </SettingsArticle>

    <SettingsArticle section-id="templates" :title="$t('Template')" :keywords="$t('templates;overlays;guides')">
      <SettingsGroup :keywords="$t('templates;overlays;image;pixel art')">
        <SettingsItem
          :keywords="
            $t('template enabled;template disabled;show template;hide template;template shown;template hidden')
          "
          :text="$t('Use template')"
        >
          <USwitch v-model="templateUse" :label="$t('Use template')" />
        </SettingsItem>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <p
          class="text-sm"
          v-html="$t('Hold down <kbd>Ctrl</kbd> (or <kbd>Option</kbd> on mac) to drag the template around')"
        />

        <SettingsItem :keywords="$t('template title;template name;tab name;tab title;title=')" :text="$t('Title:')">
          <UFormField :label="$t('Title:')">
            <UInput
              v-model="templateTitle"
              :disabled="!template.options.use"
              class="w-full"
              @change="template.update({ title: templateTitle })"
              @keydown.stop
            />
          </UFormField>
        </SettingsItem>

        <SettingsItem
          :keywords="$t('template location source;template source URL;template URL;template=')"
          :text="$t('URL:')"
        >
          <UFormField :label="$t('URL:')" :error="template.imageError || undefined">
            <div class="flex gap-2">
              <UInput
                v-model="templateUrl"
                autocomplete="off"
                class="flex-1"
                @change="template.update({ use: true, url: templateUrl })"
                @keydown.stop
              />
              <UButton
                :icon="ICONS.upload"
                color="neutral"
                variant="outline"
                :aria-label="$t('Drag and drop template image')"
                @click="fileInput?.click()"
              />
              <input
                ref="fileInput"
                type="file"
                class="hidden"
                accept="image/png, image/jpeg, image/webp"
                @change="ui.handleFile($event.target as HTMLInputElement)"
              />
            </div>
          </UFormField>
        </SettingsItem>

        <SettingsItem
          :keywords="
            $t(
              'template position;template x;template y;template location; template vertical; template horizontal;ox=;oy=',
            )
          "
          :text="$t('Horizontal position:')"
        >
          <div class="grid grid-cols-2 gap-3">
            <UFormField :label="$t('Horizontal position:')">
              <UInputNumber v-model="templateX" :min="0" :disabled="!template.options.use" @keydown.stop />
            </UFormField>
            <UFormField :label="$t('Vertical position:')">
              <UInputNumber v-model="templateY" :min="0" :disabled="!template.options.use" @keydown.stop />
            </UFormField>
          </div>
        </SettingsItem>

        <SettingsItem :keywords="$t('template width;tw=')" :text="$t('Width:')">
          <UFormField :label="$t('Width:')">
            <div class="flex gap-2">
              <UInputNumber v-model="templateWidth" :min="0" :disabled="!template.options.use" @keydown.stop />
              <UButton color="neutral" variant="outline" @click="template.update({ width: -1 })">
                {{ $t('Reset') }}
              </UButton>
            </div>
          </UFormField>
        </SettingsItem>

        <SettingsItem :keywords="$t('template style;custom template')" :text="$t('Style:')">
          <UFormField :label="$t('Style:')">
            <USelect v-model="styleSource" :items="styleItems" class="w-full" />
          </UFormField>
        </SettingsItem>

        <SettingsItem
          :keywords="$t('template style source;template style URL;custom style URL;custom template')"
          :text="$t('Custom style URL:')"
        >
          <UFormField :label="$t('Custom style URL:')" :error="template.styleError || undefined">
            <UInput v-model="customStyle" class="w-full" @change="commitCustomStyle" @keydown.stop />
          </UFormField>
        </SettingsItem>

        <SettingsItem
          :keywords="$t('template conversion;template palette conversion;convert to palette')"
          :text="$t('Color Conversion Mode:')"
        >
          <UFormField :label="$t('Color Conversion Mode:')">
            <USelect v-model="convertMode" :items="convertItems" class="w-full" />
          </UFormField>
        </SettingsItem>

        <SettingSlider
          :setting="settings.board.template.opacity"
          :label="$t('Opacity:')"
          :keywords="$t('template transparency;template opacity;oo=')"
          percent
        />
      </SettingsGroup>
    </SettingsArticle>

    <SettingsArticle section-id="ui" :title="$t('UI Settings')" :keywords="$t('ui;interface')">
      <SettingSelect
        :setting="settings.ui.language.override"
        :label="$t('Language override:')"
        :items="languageItems"
        :keywords="$t('language override;text')"
      />
      <SettingSelect
        :setting="settings.ui.theme.index"
        :label="$t('Theme:')"
        :items="themeItems"
        :keywords="$t('themes;look;stylesheets;visuals')"
      />
      <SettingSwitch
        :setting="settings.ui.reticule.enable"
        :label="$t('Show reticule')"
        :keywords="$t('hide reticule;hide reticle;reticule shown reticle shown;reticule hidden;reticle hidden')"
      />
      <SettingSwitch
        :setting="settings.ui.cursor.enable"
        :label="$t('Show cursor')"
        :keywords="$t('hide cursor;cursor shown;cursor hidden')"
      />
      <SettingSwitch
        :setting="settings.ui.brightness.enable"
        :label="$t('Enable color brightness')"
        :keywords="$t('darkness filter')"
      >
        <p class="flex items-center gap-1 text-xs text-warning">
          <UIcon :name="ICONS.warning" />
          {{ $t('Warning: Known to cause fuzziness in Chrome on some Mac/Linux installs') }}
        </p>
        <div class="pl-4">
          <SettingSlider :setting="settings.ui.brightness.value" :label="$t('Color brightness:')" />
        </div>
      </SettingSwitch>
      <SettingSwitch
        :setting="settings.place.deselectonplace.enable"
        :label="$t('Deselect color after placing')"
        :keywords="$t('keep current selected;keep curent color;place')"
      />
      <SettingSwitch
        :setting="settings.place.palette.scrolling.enable"
        :label="$t('Enable scrolling on the palette to switch colors')"
        :keywords="$t('mousewheel;palette scrolling')"
      >
        <div class="pl-4">
          <SettingSwitch
            :setting="settings.place.palette.scrolling.invert"
            :label="$t('Invert scroll direction')"
            :keywords="
              $t('reverse scrolling;mousewheel;palette scrolling;enable scrolling on the palette to switch colors')
            "
          />
        </div>
      </SettingSwitch>
      <SettingSwitch
        :setting="settings.ui.palette.numbers.enable"
        :label="$t('Add numbers to palette entries')"
        :keywords="$t('indexed colors;palette indicies')"
      />
      <SettingSwitch
        :setting="settings.ui.palette.scrollbar.thin.enable"
        :label="$t('Enable thin scrollbar')"
        :keywords="$t('scrollbar;palette scrolling')"
      />
      <SettingSwitch
        :setting="settings.ui.palette.stacking.enable"
        :label="$t('Enable palette stacking')"
        :keywords="$t('scrollbar;palette scrolling;palette stack')"
      />
      <SettingSelect
        :setting="settings.ui.bubble.position"
        :label="$t('Bubble position:')"
        :items="bubblePositionItems"
        :keywords="$t('floating bubble location')"
      />
      <SettingSelect
        :setting="settings.ui.bubble.animation"
        :label="$t('Bubble animation:')"
        :items="bubbleAnimationItems"
        :keywords="$t('floating bubble animation')"
      />
      <SettingSwitch
        v-if="webkit"
        :setting="settings.fix.chrome.offset.enable"
        :label="$t('Attempt to fix canvas displacement bug in Chrome 78+')"
        :keywords="$t('broken;offset workaround')"
      />
    </SettingsArticle>

    <SettingsArticle section-id="chat" :title="$t('Chat Settings')" :keywords="$t('chat;message;ping sound')">
      <SettingsGroup :keywords="$t('username;color;colour')">
        <SettingsItem :text="$t('Username Color:')">
          <UFormField
            :label="$t('Username Color:')"
            :error="nameColorFeedback?.error ? nameColorFeedback.text : undefined"
          >
            <USelect
              v-model="nameColor"
              :items="nameColorItems"
              :disabled="!user.loggedIn || nameColorBusy"
              :loading="nameColorBusy"
              class="w-full"
            >
              <template #leading>
                <span
                  v-if="selectedNameColor"
                  class="inline-block size-4 rounded-sm border border-default"
                  :class="selectedNameColor.gradient"
                  :style="{ backgroundColor: selectedNameColor.color || undefined }"
                />
              </template>
              <template #item-leading="{ item }">
                <span
                  class="inline-block size-4 rounded-sm border border-default"
                  :class="(item as (typeof nameColorItems)[number]).gradient"
                  :style="{ backgroundColor: (item as (typeof nameColorItems)[number]).color || undefined }"
                />
              </template>
            </USelect>
          </UFormField>
          <p v-if="nameColorFeedback && !nameColorFeedback.error" class="text-sm text-success">
            {{ nameColorFeedback.text }}
          </p>
        </SettingsItem>
      </SettingsGroup>

      <SettingsGroup :title="$t('Interface')" :keywords="$t('chat message;chat ui')">
        <SettingSwitch :setting="settings.chat.enable" :label="$t('Enable chat')" :keywords="$t('enable;disable')">
          <p class="flex items-center gap-1 text-xs text-muted">
            <UIcon :name="ICONS.info" />
            {{ $t('Page must be reloaded after changing') }}
          </p>
        </SettingSwitch>
        <SettingNumber
          :setting="settings.chat.font.size"
          :label="$t('Font Size:')"
          :min="1"
          :max="72"
          :keywords="$t('chat size;chat font')"
        />
        <SettingSwitch
          :setting="settings.chat.timestamps['24h']"
          :label="$t('24 Hour Timestamps')"
          :keywords="$t('time;timestamps')"
        />
        <SettingSwitch
          :setting="settings.chat.badges.enable"
          :label="$t('Show pixel-placed badges')"
          :keywords="$t('badges;pixel count;pixels placed')"
        />
        <SettingSwitch
          :setting="settings.chat.factiontags.enable"
          :label="$t('Show faction tags')"
          :keywords="$t('badges;factions')"
        />
        <SettingSwitch
          :setting="settings.chat.links.templates.preferurls"
          :label="$t('Replace template titles with URLs in chat where applicable')"
          :keywords="$t('template urls;template links;template name')"
        />
        <SettingSwitch
          :setting="settings.ui.chat.horizontal.enable"
          :label="$t('Enable horizontal chat')"
          :keywords="$t('chat orientation;chat position')"
        />
        <SettingSwitch
          :setting="settings.ui.chat.banner.enable"
          :label="$t('Enable the rotating banner under chat')"
          :keywords="$t('banner;animation')"
        />
        <SettingNumber
          :setting="settings.chat.truncate.max"
          :label="$t('Maximum amount of chat messages:')"
          :min="50"
          :keywords="$t('max;messages;truncate')"
        />
        <SettingSelect
          :setting="settings.chat.links.internal.behavior"
          :label="$t('Default internal link action click:')"
          :items="TEMPLATE_ACTION_LABELS"
          :keywords="$t('link;url;behaviour')"
        />
        <SettingSwitch
          :setting="settings.chat.links.external.skip"
          :label="$t('Skip external link popup')"
          :keywords="$t('link;url;behaviour;external;bypass;skip')"
          :description="$t('Note: Has no effect if external link popups are disabled by the server.')"
        />
        <SettingSelect
          :setting="settings.ui.chat.icon.badge"
          :label="$t('Chat icon badge mode:')"
          :items="iconBadgeItems"
          :keywords="$t('chat icon;chat notifications;chat ping')"
        />
        <SettingSelect
          :setting="settings.ui.chat.icon.color"
          :label="$t('Chat icon highlight mode:')"
          :items="iconColorItems"
          :keywords="$t('chat icon;chat notifications;chat message')"
        />
      </SettingsGroup>

      <SettingsGroup :title="$t('Ignores')" :keywords="$t('ignored;ignores;unignore;blocked;blocking;unblock')">
        <SettingsItem :keywords="$t('unignore;unblock')">
          <div class="flex gap-2">
            <USelect v-model="ignoreSelection" :items="sortedIgnores" class="flex-1 font-mono" />
            <UButton color="neutral" variant="outline" @click="unignore">{{ $t('Unignore') }}</UButton>
          </div>
          <p v-if="ignoreFeedback" class="text-sm" :class="ignoreFeedback.error ? 'text-error' : 'text-success'">
            {{ ignoreFeedback.text }}
          </p>
        </SettingsItem>
      </SettingsGroup>
    </SettingsArticle>

    <SettingsArticle
      section-id="overlays"
      :title="$t('Overlay Settings')"
      :keywords="$t('overlays;virginmap;heatmap;grid')"
    >
      <SettingsGroup :title="$t('Heatmap')" :keywords="$t('heatmap;heatmap opacity;clear heatmap')">
        <SettingSwitch
          :setting="settings.board.heatmap.enable"
          :label="$t('Turn on heatmap')"
          :keywords="
            $t('overlays;user activity;pixels placed pixels;heatmap hidden;heatmap shown;hide heatmap;show heatmap')
          "
        >
          <!-- eslint-disable-next-line vue/no-v-html -->
          <p class="text-xs text-muted" v-html="$t('(toggle with <kbd>H</kbd>)')" />
        </SettingSwitch>
        <SettingsItem :keywords="$t('overlays;activity;pixels placed pixels;wipe;clean')" :text="$t('Clear heatmap')">
          <div class="flex items-center gap-2">
            <UButton color="neutral" variant="outline" @click="overlays.get('heatmap')?.clear()">
              {{ $t('Clear heatmap') }}
            </UButton>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <span class="text-xs text-muted" v-html="$t('(hotkey: <kbd>O</kbd>)')" />
          </div>
        </SettingsItem>
        <SettingSlider
          :setting="settings.board.heatmap.opacity"
          :label="$t('Heatmap background opacity:')"
          :keywords="$t('overlays;user activity;pixels placed pixels;transparency')"
        />
      </SettingsGroup>

      <SettingsGroup :title="$t('Virginmap')" :keywords="$t('virginmap;virginmap opacity;clear virginmap')">
        <SettingSwitch
          :setting="settings.board.virginmap.enable"
          :label="$t('Turn on virginmap')"
          :keywords="
            $t(
              'overlays;user activity;pixels unplaced pixels;virginmap hidden;virginmap shown;hide virginmap;show virginmap',
            )
          "
        >
          <!-- eslint-disable-next-line vue/no-v-html -->
          <p class="text-xs text-muted" v-html="$t('(toggle with <kbd>X</kbd>)')" />
        </SettingSwitch>
        <SettingSlider
          :setting="settings.board.virginmap.opacity"
          :label="$t('Virginmap background opacity:')"
          :keywords="$t('overlays;user activity;pixels unplaced pixels;transparency')"
        />
        <SettingsItem
          :keywords="$t('overlays;activity;pixels unplaced pixels;wipe;clean')"
          :text="$t('Clear virginmap')"
        >
          <div class="flex items-center gap-2">
            <UButton color="neutral" variant="outline" @click="overlays.get('virginmap')?.clear()">
              {{ $t('Clear virginmap') }}
            </UButton>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <span class="text-xs text-muted" v-html="$t('(hotkey: <kbd>U</kbd>)')" />
          </div>
        </SettingsItem>
        <SettingSwitch
          :setting="settings.board.template.beneathoverlays"
          :label="$t('Layer template underneath heatmap')"
          keywords="overlays;virginmap;beneath;ontop of;on top of"
        />
      </SettingsGroup>

      <SettingsGroup :title="$t('Grid')" :keywords="$t('grid;toggle grid')">
        <SettingSwitch
          :setting="settings.board.grid.enable"
          :label="$t('Turn on grid')"
          :keywords="$t('overlays;alignment;grid hidden;grid shown;hide grid;show grid')"
        >
          <!-- eslint-disable-next-line vue/no-v-html -->
          <p class="text-xs text-muted" v-html="$t('(toggle with <kbd>G</kbd>)')" />
        </SettingSwitch>
      </SettingsGroup>
    </SettingsArticle>

    <SettingsArticle
      section-id="controls"
      :title="$t('Control Settings')"
      :keywords="$t('controls;zooming;panning;movement')"
    >
      <SettingsGroup :title="$t('Zooming')" :keywords="$t('zooming;scrolling;scale;scaling')">
        <SettingSlider
          :setting="settings.board.zoom.sensitivity"
          :label="$t('Zoom sensitivity:')"
          :min="1.01"
          :max="3"
          :keywords="$t('scrolling sensitivity;zooming sensitivity;mousewheel sensitivity')"
        />
        <div class="grid grid-cols-2 gap-3">
          <SettingNumber
            :setting="settings.board.zoom.limit.minimum"
            :label="$t('Minimum scale:')"
            :step="0.1"
            placeholder="0.5"
            :keywords="$t('zooming limit;scrolling limit;mousewheel;zooming minimum;zooming maximum')"
          />
          <SettingNumber
            :setting="settings.board.zoom.limit.maximum"
            :label="$t('Maximum scale:')"
            placeholder="50"
            :keywords="$t('zooming limit;scrolling limit;mousewheel;zooming minimum;zooming maximum')"
          />
        </div>
        <SettingSwitch
          :setting="settings.board.zoom.rounding.enable"
          :label="$t('Round zoom values to nearest whole number')"
          :keywords="$t('rounding;zooming;scrolling;mousewheel;integer;decimal')"
        />
      </SettingsGroup>
      <SettingsGroup title="Miscellaneous" :keywords="$t('controls;miscellaneous')">
        <SettingSwitch
          :setting="settings.board.lock.enable"
          :label="$t('Lock the canvas (disallow canvas drag/zoom with mouse/fingers)')"
          keywords="locked;move;zoom;panning"
        />
        <SettingSwitch
          :setting="settings.place.picker.enable"
          :label="$t('Enable middle mouse button selecting color from board')"
          :keywords="$t('MMB picker;mouse picker;selection;palette picker')"
        />
        <SettingSelect
          :setting="settings.place.rightclick.action"
          :label="$t('Right-click action:')"
          :items="rightClickItems"
          :keywords="$t('right click action')"
        />
      </SettingsGroup>
    </SettingsArticle>

    <SettingsArticle
      section-id="snapshots"
      :title="$t('Snapshot Settings')"
      :keywords="$t('snapshots;screenshot;download;picture;canvas')"
    >
      <SettingSelect
        :setting="settings.board.snapshot.format"
        :label="$t('Snapshot image format:')"
        :items="snapshotItems"
        :keywords="$t('take screenshot;image;download format;picture;canvas;board')"
      />
    </SettingsArticle>

    <SettingsArticle
      section-id="sound"
      :title="$t('Sound and Notification Settings')"
      :keywords="$t('sound;notification;alert;notify;ping')"
    >
      <SettingsGroup :title="$t('General')" keywords="sound;volume">
        <SettingSwitch
          :setting="settings.audio.enable"
          :label="$t('Enable sound')"
          :keywords="$t('audio;mute;noise;volume')"
        />
        <SettingSwitch
          :setting="settings.place.notification.enable"
          :label="$t('Enable pixel available notification')"
          :keywords="$t('notifs;notify;pixel notification')"
        />
      </SettingsGroup>

      <SettingsGroup :title="$t('Pixel Ready Notification')" :keywords="$t('notification;pixel ready;alert')">
        <SettingText
          :setting="settings.audio.alert.src"
          :label="$t('Alert URL:')"
          placeholder="notify.wav"
          :keywords="$t('alert source;notify url;notify source;notification url;notification source')"
        >
          <div class="flex gap-2">
            <UButton
              color="neutral"
              variant="outline"
              size="sm"
              @click="timer.setAudioSource(settings.audio.alert.src.get())"
            >
              {{ $t('Update') }}
            </UButton>
            <UButton color="neutral" variant="outline" size="sm" @click="timer.audioElem.play()">
              {{ $t('Test') }}
            </UButton>
            <UButton color="neutral" variant="outline" size="sm" @click="resetAlertSound">{{ $t('Reset') }}</UButton>
          </div>
        </SettingText>
        <SettingSlider
          :setting="settings.audio.alert.volume"
          :label="$t('Volume:')"
          :keywords="$t('sound level;audio level;mute audio;mute sound')"
          percent
        />
        <SettingNumber
          :setting="settings.place.alert.delay"
          :label="$t('Delay (seconds):')"
          :keywords="$t('alert forewarning;alert delay; notification delay; notification forewarning')"
        />
      </SettingsGroup>

      <SettingsGroup :title="$t('Chat Pings')" :keywords="$t('chat mentions;chat pings;chat sound')">
        <SettingSwitch :setting="settings.chat.pings.enable" :label="$t('Enable pings')" keywords="enable mentions" />
        <SettingSelect
          :setting="settings.chat.pings.audio.when"
          :label="$t('Play sound on ping:')"
          :items="pingAudioItems"
          :keywords="$t('mention sound')"
        />
        <SettingSlider
          :setting="settings.chat.pings.audio.volume"
          :label="$t('Ping sound volume:')"
          :keywords="$t('mention sound volume')"
          percent
        />
      </SettingsGroup>
    </SettingsArticle>

    <SettingsArticle section-id="personal-account" :title="$t('Account Settings')" :keywords="$t('personal account')">
      <SettingsGroup keywords="personal;account;user">
        <SettingsItem keywords="discord username" :text="$t('Public Discord name:')">
          <UFormField :label="$t('Public Discord name:')">
            <UInput
              v-model="discordName"
              placeholder="pxlslover1337"
              class="w-full"
              @keydown.stop
              @keydown.enter="ui.setDiscordName(discordName)"
            />
          </UFormField>
          <div class="flex gap-2">
            <UButton size="sm" @click="ui.setDiscordName(discordName)">{{ $t('Set') }}</UButton>
            <UButton color="neutral" variant="outline" size="sm" @click="ui.setDiscordName('')">
              {{ $t('Remove') }}
            </UButton>
          </div>
        </SettingsItem>
      </SettingsGroup>
    </SettingsArticle>

    <p v-if="noResults" class="mt-20 text-center text-muted italic">No Results</p>
  </PxlsPanel>
</template>
