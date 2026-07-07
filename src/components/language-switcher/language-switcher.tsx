// language-switcher.tsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Globe } from 'lucide-react';
import './language-switcher.css';

interface LanguageOption {
  code: string;
  label: string;
  flag: string;
  countryCode: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'es', label: 'Español', flag: '🇬🇹', countryCode: 'gt' },
  { code: 'en', label: 'English', flag: '🇺🇸', countryCode: 'us' },
];

export const LanguageSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useParams<{ lang: string }>();

  const currentLang = lang || i18n.language || 'es';
  const currentLanguage = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (langCode: string) => {
    if (langCode === currentLang) {
      setIsOpen(false);
      return;
    }

    // Update i18n
    i18n.changeLanguage(langCode);
    localStorage.setItem('preferred-language', langCode);

    // Update URL - replace language prefix
    const pathWithoutLang = location.pathname.replace(/^\/(en|es)/, '');
    const newPath = `/${langCode}${pathWithoutLang || '/venues/aurora-hall/events'}`;

    navigate(newPath + location.search + location.hash, { replace: true });
    setIsOpen(false);
  };

  return (
    <div className="language-switcher" ref={dropdownRef}>
      <button
        className={`language-switcher__trigger ${isOpen ? 'language-switcher__trigger--open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <Globe size={16} className="language-switcher__globe" />
        <img
          src={`https://flagcdn.com/w40/${currentLanguage.countryCode}.png`}
          srcSet={`https://flagcdn.com/w80/${currentLanguage.countryCode}.png 2x`}
          width={20}
          height={15}
          alt={currentLanguage.label}
          className="language-switcher__flag"
        />
        <span className="language-switcher__code">{currentLang.toUpperCase()}</span>
        <ChevronDown
          size={14}
          className={`language-switcher__arrow ${isOpen ? 'language-switcher__arrow--open' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="language-switcher__dropdown" role="listbox">
          {LANGUAGES.map((language) => (
            <button
              key={language.code}
              className={`language-switcher__option ${language.code === currentLang ? 'language-switcher__option--active' : ''}`}
              onClick={() => handleLanguageChange(language.code)}
              role="option"
              aria-selected={language.code === currentLang}
            >
              <img
                src={`https://flagcdn.com/w40/${language.countryCode}.png`}
                srcSet={`https://flagcdn.com/w80/${language.countryCode}.png 2x`}
                width={24}
                height={18}
                alt={language.label}
                className="language-switcher__option-flag"
              />
              <span className="language-switcher__option-label">{language.label}</span>
              {language.code === currentLang && (
                <span className="language-switcher__option-check">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
