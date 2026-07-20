import "./venues-page.css";
import { Layout } from "../../components/layout/layout";
import { VenuesCard } from "../../components/venues-card/venues-card";
import { useEffect, useState } from "react";
import type { VenueInfo } from "../../types/types";
import { getAllVenues } from "../../controller/venues-page-controller";
import { SEO } from "../../components/seo/seo";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

export const VenuesPage = () => {
  const { t, i18n } = useTranslation('common');
  const { lang } = useParams<{ lang: string }>();
  const currentLang = lang || i18n.language || 'es';
  const [venues, setVenues] = useState<VenueInfo[]>([]);
  const [loading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    getAllVenues()
      .then((data) => {
        setVenues(data);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <Layout>
      <SEO
        title={t('venues.seo.title')}
        description={t('venues.seo.description')}
        keywords={t('venues.seo.keywords')}
        canonicalUrl={`${(typeof window!=='undefined'?window.location.origin:'https://web.pullevents.com')}/${currentLang}/venues`}
        ogTitle={t('venues.seo.ogTitle')}
        ogDescription={t('venues.seo.ogDescription')}
      />
      <div className="venues-page-wrapper">
        <div className="venues-page-background" />

        <main className="venues-page-content">
          <section className="venues-title-section">
            <h2 className="venues-main-title">
              {t('venues.discoverTitle')} <span className="venues-title-gradient">{t('venues.discoverHighlight')}</span> {t('venues.discoverTitleEnd')}
            </h2>
            <p className="venues-subtitle">{t('venues.subtitle')}</p>
          </section>

          {loading ? (
            <div className="venues-loading">
              <div className="venues-loading-spinner" />
              <p className="venues-loading-text">{t('venues.loading')}</p>
            </div>
          ) : venues.length !== 0 ? (
            <section className="venues-grid-container">
              <div className="venues-grid">
                {venues.map((venue) => (
                  <VenuesCard key={venue.id} venue={venue} />
                ))}
              </div>
            </section>
          ) : (
            <div className="venues-empty">
              <p className="venues-empty-text">{t('venues.empty')}</p>
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
};
