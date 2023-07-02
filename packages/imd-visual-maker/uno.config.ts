import { defineConfig, UserConfig } from 'unocss';
import presetUno from '@unocss/preset-uno';
import presetIcons from '@unocss/preset-icons';
import presetAttributify from '@unocss/preset-attributify';

export default <UserConfig>defineConfig({
  presets: [
    presetUno(),
    presetIcons(),
    presetAttributify(),
  ],
});
