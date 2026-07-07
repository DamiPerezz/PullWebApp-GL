import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '../../components/layout/layout';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import './not-found-page.css';

export const NotFoundPage = () => {
  const { t } = useTranslation();
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const currentLang = lang || 'es';

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(`/${currentLang}/venues/aurora-hall/events`);
    }
  };

  return (
    <Layout>
      <div className="not-found-wrapper">
        <div className="not-found-background" />

        <div className="not-found-content">
          <div className="not-found-card">
            <div className="not-found-icon-wrapper">
              <AlertTriangle className="not-found-icon" />
            </div>

            <div className="not-found-error-code">{t('notFound.title')}</div>

            <h1 className="not-found-title">{t('notFound.heading')}</h1>

            <p className="not-found-description">
              {t('notFound.description')}
            </p>

            <button
              className="not-found-button"
              onClick={handleGoBack}
            >
              <ArrowLeft />
              {t('buttons.goBack')}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};
