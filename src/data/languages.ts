// The SHIPPED live-translation languages — the single public source of truth for every language count and list
// on the marketing site. Mirrors the product picker (both clients) and backend/dealroom/lang_pref.go
// TRANSLATE_LANGS default. When the product list changes, change THIS file; every "N languages" claim reads
// LANG_COUNT and every list renders LANGUAGES. Honesty rules: never a bigger number, never a language not here.
export interface Language {
  code: string;      // product language code
  name: string;      // English name
  native: string;    // the language's own name, in its script
  rtl?: boolean;     // right-to-left script
  audio: true;       // spoken translated audio is available for every shipped language
  sample: string;    // one short translated line for demos ("Now everything makes sense!")
  region: 'global' | 'india';
}

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English',    native: 'English',   audio: true, sample: 'Now everything makes sense!', region: 'global' },
  { code: 'es', name: 'Spanish',    native: 'Español',   audio: true, sample: '¡Ahora todo tiene sentido!', region: 'global' },
  { code: 'fr', name: 'French',     native: 'Français',  audio: true, sample: 'Maintenant tout est clair !', region: 'global' },
  { code: 'hi', name: 'Hindi',      native: 'हिन्दी',     audio: true, sample: 'अब सब कुछ स्पष्ट है!', region: 'india' },
  { code: 'de', name: 'German',     native: 'Deutsch',   audio: true, sample: 'Jetzt ergibt alles Sinn!', region: 'global' },
  { code: 'zh', name: 'Chinese',    native: '中文',       audio: true, sample: '现在我完全明白了！', region: 'global' },
  { code: 'ja', name: 'Japanese',   native: '日本語',     audio: true, sample: 'とてもよくわかりました！', region: 'global' },
  { code: 'pt', name: 'Portuguese', native: 'Português', audio: true, sample: 'Agora tudo faz sentido!', region: 'global' },
  { code: 'ar', name: 'Arabic',     native: 'العربية',   rtl: true, audio: true, sample: 'الآن أصبح كل شيء واضحًا!', region: 'global' },
  { code: 'ru', name: 'Russian',    native: 'Русский',   audio: true, sample: 'Теперь всё понятно!', region: 'global' },
  { code: 'kn', name: 'Kannada',    native: 'ಕನ್ನಡ',      audio: true, sample: 'ಈಗ ಎಲ್ಲವೂ ಸ್ಪಷ್ಟವಾಗಿದೆ!', region: 'india' },
  { code: 'ta', name: 'Tamil',      native: 'தமிழ்',      audio: true, sample: 'இப்போது எல்லாம் தெளிவாக இருக்கிறது!', region: 'india' },
  { code: 'te', name: 'Telugu',     native: 'తెలుగు',     audio: true, sample: 'ఇప్పుడు అంతా స్పష్టంగా ఉంది!', region: 'india' },
  { code: 'mr', name: 'Marathi',    native: 'मराठी',      audio: true, sample: 'आता सगळं स्पष्ट झालं!', region: 'india' },
  { code: 'bn', name: 'Bengali',    native: 'বাংলা',      audio: true, sample: 'এখন সবকিছু পরিষ্কার!', region: 'india' },
  { code: 'gu', name: 'Gujarati',   native: 'ગુજરાતી',    audio: true, sample: 'હવે બધું સ્પષ્ટ છે!', region: 'india' },
  { code: 'ml', name: 'Malayalam',  native: 'മലയാളം',    audio: true, sample: 'ഇപ്പോൾ എല്ലാം വ്യക്തമാണ്!', region: 'india' },
  { code: 'pa', name: 'Punjabi',    native: 'ਪੰਜਾਬੀ',     audio: true, sample: 'ਹੁਣ ਸਭ ਕੁਝ ਸਪੱਸ਼ਟ ਹੈ!', region: 'india' },
  { code: 'ur', name: 'Urdu',       native: 'اردو',      rtl: true, audio: true, sample: 'اب سب کچھ واضح ہے!', region: 'india' },
];

export const LANG_COUNT = LANGUAGES.length; // 19
/** Distinct languages one live session can run at the same time (backend per-room cap). */
export const LANGS_PER_SESSION = 5;
export const LANG_NAMES = LANGUAGES.map((l) => l.name);
/** "English, Spanish, … and Urdu" */
export const LANG_LIST_SENTENCE = LANG_NAMES.slice(0, -1).join(', ') + ' and ' + LANG_NAMES[LANG_NAMES.length - 1];
