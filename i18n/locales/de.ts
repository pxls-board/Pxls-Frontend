import source from '../../po/Localization_de.po?raw';
import { poToMessages } from '../po';

export default defineI18nLocale(() => poToMessages(source));
