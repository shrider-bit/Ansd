// Granny's voice lines. Phase 1 speaks these with the browser's built-in
// (free, offline-capable) speech synthesiser as a placeholder; Phase 4 swaps
// in prerecorded audio files with the same indices (see docs/AUDIO.md).

import type { Character } from './protocol';

export type VoiceLang = 'en' | 'ar';

export const VOICE_LINES: Record<VoiceLang, Record<Character, string[]>> = {
  en: {
    ahmed: [
      'Aaaaaahmeeeed... I can seeeeee youuuu!',
      'Ahmed... where are you hiding?',
      "I'm coming for you, Ahmed!",
      "You can't hide forever!",
      'Hehehehehe... I found you!',
    ],
    miral: [
      'Miraaaaaal... come out and plaaaaay!',
      "Miral... I know you're here!",
      "I'm right behind you!",
      "Miraaaaal... don't run away!",
      'Hehehehehe... I can hear you!',
    ],
  },
  ar: {
    ahmed: [
      'أحممممممد... وينك يا أحمد؟',
      'تعال هون يا شاطر!',
      'وين مستخبي؟',
      'ما راح تهرب مني!',
      'هههههههه... لقيتك!',
    ],
    miral: [
      'ميرااااال... أنا شايفتك!',
      'تعالي هون يا شاطرة!',
      'وين مستخبية؟',
      'ما راح تهربي مني!',
      'هههههههه... لقيتك!',
    ],
  },
};

export const VOICE_LINE_COUNT = 5;

/** Short labels for the Granny player's voice buttons. */
export const VOICE_BUTTON_LABELS = ['Call name', 'Where are you?', 'Coming!', "Can't hide", 'Laugh'];
