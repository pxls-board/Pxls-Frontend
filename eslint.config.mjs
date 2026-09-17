// @ts-check
import oxlint from 'eslint-plugin-oxlint';
import withNuxt from './.nuxt/eslint.config.mjs';

// oxlint does most of the linting; ESLint covers Vue template rules oxlint
// doesn't have yet. The oxlint config below turns off overlapping rules.
export default withNuxt(
  {
    ignores: ['app/vendor/**', 'public/**'],
  },
  {
    rules: {
      // Translated strings with markup are rendered with v-html on purpose.
      'vue/no-v-html': 'off',
      // Plain objects are used as maps in a few places.
      '@typescript-eslint/no-dynamic-delete': 'off',
      // Stylistic concerns are handled by oxfmt.
      'vue/html-self-closing': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/html-indent': 'off',
      'vue/html-closing-bracket-newline': 'off',
    },
  },
  ...oxlint.buildFromOxlintConfigFile('./.oxlintrc.json'),
);
