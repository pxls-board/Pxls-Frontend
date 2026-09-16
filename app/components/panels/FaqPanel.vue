<script setup lang="ts">
const entries = [
  [
    'Why is the cooldown as long as it is?',
    'The time it takes to get a pixel is dynamic, and changes based on how many people are online. The cooldown time is longer when more users are online.',
  ],
  [
    'Why does it say 0/6 pixels?',
    'This means that you are waiting for your next pixel. When you place a pixel, there is a cooldown for when you can place the next one. Over time, you can gain up to 6 "stacked" pixels to place at once.',
  ],
  [
    'Why does it take so long to "stack" pixels?',
    'This is by design. It is better to place a pixel as soon as you get one. Pixel "stacking" is meant to give you a bump if you go AFK for a bit. It takes around 20-30 minutes to get a full 6/6 pixels, but it only takes around 3 minutes to place 6 pixels if you place them as soon as possible.',
  ],
  [
    'How do I appeal a ban?',
    'Contact us on <a href="https://pxls.space/discord" target="_blank">Discord</a> or send an appeal to our <a href="https://pxls.space/appeal" target="_blank">Google form</a> after reading the rules in the site\'s info panel.',
  ],
  [
    'How do I make a template?',
    'A template is an image link that is posted in the template textbox in the settings panel so you can place over it on the canvas. You may use a regular image link to your pixel art, but many people use 3rd party tools like <a href="https://discord.gg/5MVDCq53vC" target="blank">Clueless</a> to turn pixel art into a fancier link. If you need to make pixel art yourself, you can use <a href="https://www.piskelapp.com/p/create" target="_blank">Piskel</a> to create art to put into Clueless.',
  ],
  [
    'How do I move a template?',
    'Hold <kbd>CTRL</kbd> (or <kbd>OPTION</kbd> on macOS) and click and drag to move it around. On mobile, you can tap and hold where you want to move the template and click "Move Template Here" in the pop-up.',
  ],
  [
    'Does the canvas reset? When?',
    'Yes. The canvas resets when it is completely full. A reset date is not usually decided until the canvas is full, but the average canvas life-span is around 1 month. Updates are posted in our <a href="https://pxls.space/discord" target="_blank">Discord server</a> when a reset date is set.',
  ],
  [
    'Where can I see the past canvases?',
    'The past canvases are featured on our <a href="https://pxls.space/discord" target="_blank">Discord server</a>, or the <a href="https://archives.pxls.space" target="_blank">archives</a>, which records timelapses and a lot of useful information on each canvas.',
  ],
  [
    'How do I see who placed a pixel?',
    'By shift-clicking (or tap and hold on mobile) a pixel, you can see who placed a pixel, how many pixels they have placed, and when they placed it.',
  ],
  ['How do I report someone?', 'Shift-click (or tap and hold on mobile) on a pixel, and click the Report button.'],
  [
    'How do I change the color of my name in the chat?',
    'There is a "Username Color" option near the bottom of the settings panel.',
  ],
  ['What is a "virginmap"?', 'The virginmap shows which pixels have not yet been placed on (or “virgin” pixels).'],
  [
    'How do I report bugs?',
    'Submit bugs to the #dev-and-bugs forum in the <a href="https://pxls.space/discord" target="_blank">Discord server</a>. If you have found an exploit, please message one of the staff members privately (through DMs) or open a modmail by DMing pxls.mail#8384.',
  ],
  [
    'How do I get more info or contact staff?',
    'Check the info panel (the icon on the top left) for more details and links, or join our <a href="https://pxls.space/discord" target="_blank">Discord server</a>, where a staff member will gladly respond.',
  ],
] as const;
</script>

<template>
  <!-- translator: FAQ panel -->
  <PxlsPanel panel="faq" :title="$t('Help')" :icon="ICONS.help" wide>
    <PanelSection :title="$t('FAQ')">
      <dl class="pxls-prose">
        <template v-for="[question, answer] in entries" :key="question">
          <dt>{{ $t(question) }}</dt>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <dd v-html="$t(answer)" />
        </template>
      </dl>
    </PanelSection>
  </PxlsPanel>
</template>
