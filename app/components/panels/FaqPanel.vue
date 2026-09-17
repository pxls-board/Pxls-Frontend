<script setup lang="ts">
const entries = [
  [
    msg('Why is the cooldown as long as it is?'),
    msg(
      'The time it takes to get a pixel is dynamic, and changes based on how many people are online. The cooldown time is longer when more users are online.',
    ),
  ],
  [
    msg('Why does it say 0/6 pixels?'),
    msg(
      'This means that you are waiting for your next pixel. When you place a pixel, there is a cooldown for when you can place the next one. Over time, you can gain up to 6 "stacked" pixels to place at once.',
    ),
  ],
  [
    msg('Why does it take so long to "stack" pixels?'),
    msg(
      'This is by design. It is better to place a pixel as soon as you get one. Pixel "stacking" is meant to give you a bump if you go AFK for a bit. It takes around 20-30 minutes to get a full 6/6 pixels, but it only takes around 3 minutes to place 6 pixels if you place them as soon as possible.',
    ),
  ],
  [
    msg('How do I appeal a ban?'),
    msg(
      'Contact us on <a href="https://pxls.space/discord" target="_blank">Discord</a> or send an appeal to our <a href="https://pxls.space/appeal" target="_blank">Google form</a> after reading the rules in the site\'s info panel.',
    ),
  ],
  [
    msg('How do I make a template?'),
    msg(
      'A template is an image link that is posted in the template textbox in the settings panel so you can place over it on the canvas. You may use a regular image link to your pixel art, but many people use 3rd party tools like <a href="https://discord.gg/5MVDCq53vC" target="blank">Clueless</a> to turn pixel art into a fancier link. If you need to make pixel art yourself, you can use <a href="https://www.piskelapp.com/p/create" target="_blank">Piskel</a> to create art to put into Clueless.',
    ),
  ],
  [
    msg('How do I move a template?'),
    msg(
      'Hold <kbd>CTRL</kbd> (or <kbd>OPTION</kbd> on macOS) and click and drag to move it around. On mobile, you can tap and hold where you want to move the template and click "Move Template Here" in the pop-up.',
    ),
  ],
  [
    msg('Does the canvas reset? When?'),
    msg(
      'Yes. The canvas resets when it is completely full. A reset date is not usually decided until the canvas is full, but the average canvas life-span is around 1 month. Updates are posted in our <a href="https://pxls.space/discord" target="_blank">Discord server</a> when a reset date is set.',
    ),
  ],
  [
    msg('Where can I see the past canvases?'),
    msg(
      'The past canvases are featured on our <a href="https://pxls.space/discord" target="_blank">Discord server</a>, or the <a href="https://archives.pxls.space" target="_blank">archives</a>, which records timelapses and a lot of useful information on each canvas.',
    ),
  ],
  [
    msg('How do I see who placed a pixel?'),
    msg(
      'By shift-clicking (or tap and hold on mobile) a pixel, you can see who placed a pixel, how many pixels they have placed, and when they placed it.',
    ),
  ],
  [
    msg('How do I report someone?'),
    msg('Shift-click (or tap and hold on mobile) on a pixel, and click the Report button.'),
  ],
  [
    msg('How do I change the color of my name in the chat?'),
    msg('There is a "Username Color" option near the bottom of the settings panel.'),
  ],
  [
    msg('What is a "virginmap"?'),
    msg('The virginmap shows which pixels have not yet been placed on (or “virgin” pixels).'),
  ],
  [
    msg('How do I report bugs?'),
    msg(
      'Submit bugs to the #dev-and-bugs forum in the <a href="https://pxls.space/discord" target="_blank">Discord server</a>. If you have found an exploit, please message one of the staff members privately (through DMs) or open a modmail by DMing pxls.mail#8384.',
    ),
  ],
  [
    msg('How do I get more info or contact staff?'),
    msg(
      'Check the info panel (the icon on the top left) for more details and links, or join our <a href="https://pxls.space/discord" target="_blank">Discord server</a>, where a staff member will gladly respond.',
    ),
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
