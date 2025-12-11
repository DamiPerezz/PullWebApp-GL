import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/layout';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import './not-found-page.css';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
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

            <div className="not-found-error-code">404</div>

            <h1 className="not-found-title">Page Not Found</h1>

            <p className="not-found-description">
              The page you're looking for doesn't exist or has been moved.
            </p>

            <button
              className="not-found-button"
              onClick={handleGoBack}
            >
              <ArrowLeft />
              Go Back
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};
