import source from '../../po/Localization_sv.po?raw';
import { poToMessages } from '../po';

export default defineI18nLocale(() => poToMessages(source));
