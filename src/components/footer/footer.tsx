import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { InstagramIcon, TikTokIcon, LinkedInIcon } from '../../icons/icons'
import './footer.css'

export const Footer = () => {
    const { t } = useTranslation();
    const { lang } = useParams<{ lang: string }>();
    const currentLang = lang || 'es';
    const currentYear = new Date().getFullYear();

    // Helper function to build language-prefixed URLs
    const buildUrl = (path: string) => `/${currentLang}${path}`;

    return (
        <footer>
            <div className="footer-content">
                <div className="footer-left">
                    <p className="footer-copyright">
                        {t('footer.copyright', { year: currentYear })}
                    </p>
                    <div className="important-documents">
                        <span>•</span>
                        <Link to={buildUrl("/privacy")}>{t('footer.privacy')}</Link>
                        <span>•</span>
                        <Link to={buildUrl("/terms")}>{t('footer.terms')}</Link>
                        <span>•</span>
                        <Link to={buildUrl("/cookie-policy")}>{t('footer.cookies')}</Link>
                    </div>
                </div>

                <div className="social-media">
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                        <InstagramIcon strokeColor="currentColor" />
                    </a>
                    <span className="social-media-separator">•</span>
                    <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                        <TikTokIcon strokeColor="currentColor" />
                    </a>
                    <span className="social-media-separator">•</span>
                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                        <LinkedInIcon strokeColor="currentColor" />
                    </a>
                </div>
            </div>
        </footer>
    )
}
