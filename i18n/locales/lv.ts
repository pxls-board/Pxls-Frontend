import source from '../../po/Localization_lv.po?raw';
import { poToMessages } from '../po';

export default defineI18nLocale(() => poToMessages(source));
