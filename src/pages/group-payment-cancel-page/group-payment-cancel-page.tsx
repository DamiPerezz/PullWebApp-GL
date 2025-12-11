import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../../components/layout/layout';
import { AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import './group-payment-cancel-page.css';

export const GroupPaymentCancelPage = () => {
  const [searchParams] = useSearchParams();
  const paymentLinkCode = searchParams.get('payment_link_code');
  const guestEmail = searchParams.get('guest_email');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Could fetch reservation details if needed
    setLoading(false);
  }, []);

  const handleRetry = () => {
    if (paymentLinkCode) {
      navigate(`/group/payment/${paymentLinkCode}`, {
        state: { guestEmail }
      });
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <Layout>
        <div className="group-payment-cancel-page">
          <div className="group-payment-cancel-loading">
            <div className="group-payment-cancel-spinner"></div>
            <p>Cargando...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="group-payment-cancel-page">
        <div className="group-payment-cancel-overlay" />

        <div className="group-payment-cancel-content">
          <div className="group-payment-cancel-container">
            <div className="group-payment-cancel-card">
              <div className="group-payment-cancel-icon-wrapper">
                <AlertTriangle className="group-payment-cancel-icon" />
              </div>

              <h1 className="group-payment-cancel-title">Pago Cancelado</h1>

              <div className="group-payment-cancel-description">
                <p>Tu pago fue cancelado. No se realizó ningún cargo a tu cuenta.</p>
              </div>

              <div className="group-payment-cancel-info-box">
                <h3>¿Qué pasó?</h3>
                <ul>
                  <li>El pago fue cancelado antes de completarse</li>
                  <li>No se procesó ningún cargo</li>
                  <li>Tu información está segura</li>
                  <li>Puedes intentar de nuevo cuando estés listo</li>
                </ul>
              </div>

              <div className="group-payment-cancel-actions">
                {paymentLinkCode && (
                  <button
                    onClick={handleRetry}
                    className="group-payment-cancel-btn group-payment-cancel-btn-primary"
                  >
                    <RefreshCw />
                    Intentar de nuevo
                  </button>
                )}
                <button
                  onClick={handleGoHome}
                  className="group-payment-cancel-btn group-payment-cancel-btn-secondary"
                >
                  Volver al inicio
                  <ArrowRight />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
