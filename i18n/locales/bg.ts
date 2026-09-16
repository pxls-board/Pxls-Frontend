import source from '../../po/Localization_bg.po?raw';
import { poToMessages } from '../po';

export default defineI18nLocale(() => poToMessages(source));
