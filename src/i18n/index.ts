import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import commonEN from './locales/en/common.json';
import authEN from './locales/en/auth.json';
import eventsEN from './locales/en/events.json';
import ticketsEN from './locales/en/tickets.json';
import paymentEN from './locales/en/payment.json';
import groupEN from './locales/en/group.json';
import guestListEN from './locales/en/guestList.json';
import walletEN from './locales/en/wallet.json';
import legalEN from './locales/en/legal.json';
import seoEN from './locales/en/seo.json';
import viplistEN from './locales/en/viplist.json';

import commonES from './locales/es/common.json';
import authES from './locales/es/auth.json';
import eventsES from './locales/es/events.json';
import ticketsES from './locales/es/tickets.json';
import paymentES from './locales/es/payment.json';
import groupES from './locales/es/group.json';
import guestListES from './locales/es/guestList.json';
import walletES from './locales/es/wallet.json';
import legalES from './locales/es/legal.json';
import seoES from './locales/es/seo.json';
import viplistES from './locales/es/viplist.json';

const resources = {
  en: {
    common: commonEN,
    auth: authEN,
    events: eventsEN,
    tickets: ticketsEN,
    payment: paymentEN,
    group: groupEN,
    guestList: guestListEN,
    wallet: walletEN,
    legal: legalEN,
    seo: seoEN,
    viplist: viplistEN,
  },
  es: {
    common: commonES,
    auth: authES,
    events: eventsES,
    tickets: ticketsES,
    payment: paymentES,
    group: groupES,
    guestList: guestListES,
    wallet: walletES,
    legal: legalES,
    seo: seoES,
    viplist: viplistES,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    defaultNS: 'common',
    ns: ['common', 'auth', 'events', 'tickets', 'payment', 'group', 'guestList', 'wallet', 'legal', 'seo', 'viplist'],
    supportedLngs: ['en', 'es'],

    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'preferred-language',
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;
