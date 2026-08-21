import { Footer } from '../../components/footer/footer';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, CreditCard, Clock, CheckCircle, RefreshCw, Mail } from 'lucide-react';
import fondoImage from '../../assets/fondo.png';
import '../cookie-policy-page/cookie-policy-page.css';
import { SEO } from '../../components/seo/seo';
import { DEFAULT_VENUE_SLUG } from '../../config/venue';

/**
 * Página de "términos" del flujo de evento privado (cobro por aprobación).
 * Es la pestaña que abre el enlace "términos y condiciones" del checkbox de
 * la página de pago: recoge la explicación completa que antes saturaba el
 * modal en móvil (título + los 4 pasos + el aviso del cargo). Lee las mismas
 * claves i18n del namespace `payment` (page.private.*), así que el texto vive
 * en un solo sitio.
 */
export const PrivateEventTermsPage = () => {
  const { t, i18n } = useTranslation('payment');
  const { lang } = useParams<{ lang: string }>();
  const currentLang = lang || i18n.language || 'es';
  const buildUrl = (path: string) => `/${currentLang}${path}`;

  const steps = [
    { icon: <CreditCard size={24} />, text: t('page.private.step1') },
    { icon: <Clock size={24} />, text: t('page.private.step2') },
    { icon: <CheckCircle size={24} />, text: t('page.private.step3') },
    { icon: <RefreshCw size={24} />, text: t('page.private.step4') },
  ];

  return (
    <div className="cookie-policy-page">
      <SEO
        title={t('page.private.title')}
        description={t('page.private.termsPageSubtitle')}
        noIndex={true}
      />
      <div
        className="legal-page-background"
        style={{ backgroundImage: `url(${fondoImage})` }}
      />
      <div className="legal-page-overlay" />

      <div className="cookie-policy-container">
        <header className="cookie-policy-header">
          <div className="cookie-policy-icon">
            <Lock size={48} />
          </div>
          <h1>{t('page.private.title')}</h1>
          <p className="cookie-policy-subtitle">
            {t('page.private.termsPageSubtitle')}
          </p>
        </header>

        <main className="cookie-policy-content">
          <section className="policy-section">
            <div className="section-content">
              <p>{t('page.private.intro')}</p>

              <ul className="detailed-list">
                {steps.map((s, i) => (
                  <li key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <span style={{ flexShrink: 0, marginTop: '2px', opacity: 0.85 }}>{s.icon}</span>
                    <span>{s.text}</span>
                  </li>
                ))}
              </ul>

              <div className="info-box warning">
                <strong><CreditCard size={18} style={{ verticalAlign: 'text-bottom', marginRight: '0.4rem' }} />
                  {t('page.private.consent')}</strong>
              </div>

              <p style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', opacity: 0.85 }}>
                <Mail size={18} /> {t('page.private.foot')}
              </p>
            </div>
          </section>

          <div className="policy-footer-notice">
            <Link to={buildUrl(`/venues/${DEFAULT_VENUE_SLUG}/events`)} className="back-home-link">
              {currentLang === 'es' ? 'Volver' : 'Back'}
            </Link>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};
