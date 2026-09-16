import source from '../../po/Localization_fr.po?raw';
import { poToMessages } from '../po';

export default defineI18nLocale(() => poToMessages(source));
