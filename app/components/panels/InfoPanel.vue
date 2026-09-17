<script setup lang="ts">
const canvasRules = [
  msg(
    'No hateful imagery or derogatory speech. This includes but is not limited to words such as <i>f****t</i>, <i>n****r</i>, etc; as well as the Swastika, Hammer and Sickle, and any symbols of terrorism.',
  ),
  {
    text: msg('No NSFW or NSFL content.'),
    children: [
      {
        text: msg('No nudity or otherwise sexually explicit content'),
        children: [msg('No female-presenting nipples/bare breasts, genitalia, sexual fluids')],
      },
      msg('No sexual imagery/erotica'),
      msg('No excessive blood or otherwise obscene/shocking content'),
    ],
  },
  msg(
    'No more than <b>one</b> account per user, no exceptions. Multiple account users will be banned from creating art on the canvas.',
  ),
  msg('No auto-placement tools of any kind, you must place the pixels manually.'),
  msg('Do not abuse site functionality, such as reports or lookups. (e.g. automated reporting/lookups, etc.)'),
  msg('Any automated aggregation of data from user lookups is not allowed, and will result in a ban.'),
  {
    text: msg('Staff have final say in any rule disputes'),
    children: [msg('If you feel a moderator has acted inappropriately, please report it to an administrator.')],
  },
];

const chatRules = [
  msg('Keep chat civil. No harassment or homophobic/transphobic/disablist language.'),
  {
    text: msg('No hate speech. This includes emoji/symbols/ASCII art.'),
    children: [msg('Normal swearing/etc is allowed')],
  },
  { text: msg('No spamming'), children: [msg('This includes excessive ASCII art/emojis/symbols/whitespace')] },
  msg('No "copy pasta"s'),
  msg('No links to sites that actively break the canvas or chat rules (e.g. porn sites)'),
  msg('No symbology which break the canvas or chat rules (e.g. NSFW ASCII art)'),
  msg('No personal information'),
  {
    text: msg('Staff have final say in any rule disputes'),
    children: [msg('If you feel a moderator has acted inappropriately, please report it to an administrator.')],
  },
];

const linkGroups = [
  [
    { href: 'https://docs.pxls.space/en/legal/terms', label: msg('Terms of Service') },
    { href: 'https://docs.pxls.space/en/legal/privacy', label: msg('Privacy Policy') },
  ],
  [
    { href: 'https://pxls.space/discord', label: msg('Discord (main hub)') },
    { href: 'https://twitter.com/pxlsspace', label: msg('Twitter') },
    { href: 'https://bsky.app/profile/pxls.space', label: msg('Bluesky') },
    { href: 'https://github.com/pxlsspace/Pxls', label: msg('GitHub (back end)') },
    { href: 'https://github.com/pxlsspace/pxls-web', label: msg('GitHub (front end)') },
    // translator: link to piskelapp.com
    { href: 'http://www.piskelapp.com/p/create/sprite', label: msg('Single-player mode') },
  ],
  [
    { href: 'https://pxls.space/stats', label: msg('Statistics') },
    { href: 'https://pxls.space/profile', label: msg('Profile (user info, factions, etc.)') },
    { href: 'https://wiki.pxls.space', label: msg('Wiki') },
    { href: 'https://archives.pxls.space/', label: msg('Archives') },
  ],
];
</script>

<template>
  <PxlsPanel panel="info" :title="$t('Info')" :icon="ICONS.info">
    <PanelSection section-id="welcome" :title="$t('Welcome!')">
      <div class="pxls-prose">
        <!-- eslint-disable vue/no-v-html -->
        <p
          v-html="
            $t(
              'Welcome to pxls.space! Pxls is a multiplayer online collaborative canvas based on Reddit\'s <a href=&quot;https://www.reddit.com/r/place&quot; target=&quot;_blank&quot;>r/place</a> event from 2017 that allows you to create anything you can imagine, one pixel at a time. Join hundreds of other players in the Pxls community and create amazing works of art together as a team, or solo.',
            )
          "
        />
        <p>{{ $t('The best place to reach staff and fellow community is in the discord!') }}</p>
        <p>
          {{
            $t(
              'Check out our social media pages, and please take the time to read the rules below. Have fun creating (or changing) art!',
            )
          }}
        </p>
      </div>
    </PanelSection>

    <PanelSection id="canvas-rules" section-id="canvas-rules" :title="$t('Canvas Rules')" title-class="text-error">
      <div class="pxls-prose">
        <p>
          {{
            $t(
              'We pride ourselves on trying to keep an open canvas for all free from outside interference on our end, and especially censorship. However, for the good of the community and on accounts of our own beliefs, please acknowledge and obey the following guidelines:',
            )
          }}
        </p>
        <RuleList :rules="canvasRules" />
        <p>{{ $t('If you believe you have been falsely banned you may contact a moderator or administrator.') }}</p>
      </div>
    </PanelSection>

    <PanelSection id="chat-rules" section-id="chat-rules" :title="$t('Chat Rules')" title-class="text-error">
      <div class="pxls-prose">
        <RuleList :rules="chatRules" />
      </div>
    </PanelSection>

    <PanelSection section-id="links" :title="$t('Links')">
      <div class="pxls-prose">
        <ul v-for="(group, index) in linkGroups" :key="index">
          <li v-for="link in group" :key="link.href">
            <a :href="link.href" target="_blank">{{ $t(link.label) }}</a>
          </li>
        </ul>
      </div>
    </PanelSection>

    <PanelSection section-id="donate" :title="$t('Donate')">
      <p class="text-sm">
        {{ $t("Donations are not accepted at this time, but this panel will be updated when they're open again!") }}
      </p>
    </PanelSection>
  </PxlsPanel>
</template>
