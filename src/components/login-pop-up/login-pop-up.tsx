// login-pop-up.tsx
// SECURITY: Authentication via HttpOnly cookies - no localStorage for tokens
import { useForm } from "react-hook-form";
import { useTranslation } from 'react-i18next';
import { CloseXIcon } from "../../icons/icons";
import { useState } from "react";
import { useParams } from "react-router-dom";
import "./login-pop-up.css";
import { authenticateBooking } from "../../controller/manage-booking-page-controller";

interface LoginFormData {
  dpi: string;
  password: string;
}

export const LoginPopUp = ({
  onClose,
  handleAdminStatusChange,
}: {
  onClose: () => void;
  handleAdminStatusChange: (isAdmin: boolean) => void;
}) => {
  const { t } = useTranslation('common');
  const { reservationId } = useParams<{ reservationId: string }>();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      if (!reservationId) {
        setAuthError(t('login.reservationNotFound'));
        return;
      }

      setAuthError(null);

      const response = await authenticateBooking(reservationId, data);

      if (response.success) {
        // SECURITY: El servidor establece una cookie HttpOnly
        // No guardamos tokens en localStorage para prevenir XSS
        handleAdminStatusChange(true);

        // Close popup and reset form
        onClose();
        reset();
      } else {
        setAuthError(t('login.authFailed'));
      }
    } catch (error: any) {
      // Handle different types of errors
      if (error.response?.status === 401) {
        setAuthError(t('login.wrongCredentials'));
      } else if (error.response?.status === 404) {
        setAuthError(t('login.notFound'));
      } else if (error.response?.data?.error) {
        setAuthError(error.response.data.error);
      } else {
        setAuthError(t('login.connectionError'));
      }
    }
  };

  return (
    <div className="login-pop-up">
      <div className="login-pop-up-content">
        <h2>{t('login.title')}</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          {authError && <div className="auth-error-message">{authError}</div>}
          <div>
            <label htmlFor="dpi">{t('login.dpi')}:</label>
            <input
              type="text"
              id="dpi"
              {...register("dpi", {
                required: t('login.dpiRequired'),
                pattern: {
                  value: /^\d{13}$/,
                  message: t('login.dpiFormat'),
                },
              })}
              placeholder={t('login.dpiPlaceholder')}
              maxLength={13}
              autoComplete="off"
            />
            {errors.dpi && (
              <span className="error-message">{errors.dpi.message}</span>
            )}
          </div>
          <div>
            <label htmlFor="password">{t('login.password')}:</label>
            <input
              type="password"
              id="password"
              {...register("password", {
                required: t('login.passwordRequired'),
                minLength: {
                  value: 6,
                  message: t('login.passwordMinLength'),
                },
              })}
              placeholder={t('login.passwordPlaceholder')}
              autoComplete="current-password"
            />
            {errors.password && (
              <span className="error-message">{errors.password.message}</span>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="submit-button"
          >
            {isSubmitting ? t('login.loggingIn') : t('login.loginButton')}
          </button>
        </form>
        <button className="close-button" onClick={onClose}>
          <CloseXIcon strokeColor="white" />
        </button>
      </div>
    </div>
  );
};
