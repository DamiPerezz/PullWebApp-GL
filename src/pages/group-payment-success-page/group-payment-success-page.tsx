import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../../components/layout/layout';
import { CheckCircle, Mail, ArrowRight, Ticket } from 'lucide-react';
import './group-payment-success-page.css';

export const GroupPaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [_paymentData, _setPaymentData] = useState<any>(null);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    // TODO: Fetch payment details from backend
    // For now, just show success
    setLoading(false);
  }, [sessionId]);

  if (loading) {
    return (
      <Layout>
        <div className="group-payment-success-page">
          <div className="group-payment-success-loading">
            <div className="group-payment-success-spinner"></div>
            <p>Verificando tu pago...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!sessionId) {
    return (
      <Layout>
        <div className="group-payment-success-page">
          <div className="group-payment-success-container">
            <div className="group-payment-success-error">
              <div className="group-payment-error-icon">⚠️</div>
              <h1>Pago no encontrado</h1>
              <p>No pudimos encontrar la información de tu pago</p>
              <button onClick={() => navigate('/')} className="group-payment-success-btn group-payment-success-btn-primary">
                Volver al inicio
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="group-payment-success-page">
        <div className="group-payment-success-overlay" />

        <div className="group-payment-success-content">
          <div className="group-payment-success-container">
            <div className="group-payment-success-card">
              <div className="group-payment-success-icon-wrapper">
                <CheckCircle className="group-payment-success-icon" />
              </div>

              <h1 className="group-payment-success-title">¡Pago Completado!</h1>

              <div className="group-payment-success-description">
                <p>Tu pago ha sido procesado exitosamente. Una vez que el staff apruebe la reserva grupal, recibirás tu ticket por correo electrónico.</p>
              </div>

              <div className="group-payment-success-status-card">
                <div className="group-payment-success-status-header">
                  <Ticket />
                  <span>Esperando aprobación del staff</span>
                </div>
                <div className="group-payment-success-status-body">
                  <p>
                    La reserva grupal está siendo revisada por el staff. Cuando sea aprobada:
                  </p>
                  <div className="group-payment-success-timeline">
                    <div className="timeline-step timeline-step-completed">
                      <div className="timeline-dot"></div>
                      <div className="timeline-content">
                        <h4>Pago completado</h4>
                        <p>Tu pago fue procesado correctamente</p>
                      </div>
                    </div>
                    <div className="timeline-step timeline-step-current">
                      <div className="timeline-dot"></div>
                      <div className="timeline-content">
                        <h4>Revisión del staff</h4>
                        <p>El staff está revisando la reserva</p>
                      </div>
                    </div>
                    <div className="timeline-step">
                      <div className="timeline-dot"></div>
                      <div className="timeline-content">
                        <h4>Ticket enviado</h4>
                        <p>Recibirás tu ticket por email</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="group-payment-success-info-box">
                <div className="group-payment-success-info-icon">
                  <Mail size={24} />
                </div>
                <div className="group-payment-success-info-content">
                  <h3>¿Qué sigue?</h3>
                  <ul>
                    <li>El staff revisará la reserva grupal</li>
                    <li>Recibirás un email con tu ticket cuando sea aprobada</li>
                    <li>El anfitrión recibirá los tickets de todos los invitados que pagó</li>
                    <li>Guarda tu ticket en tu teléfono para el evento</li>
                  </ul>
                </div>
              </div>

              <div className="group-payment-success-actions">
                <button
                  onClick={() => navigate('/')}
                  className="group-payment-success-btn group-payment-success-btn-primary"
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
