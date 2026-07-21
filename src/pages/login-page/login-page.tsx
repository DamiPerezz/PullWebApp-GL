// pages/login-page.tsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { Mail, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import './login-page.css';

const logo = "/logo.svg";

// Google Identity Services types
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleInitializeConfig) => void;
          renderButton: (element: HTMLElement, config: GoogleButtonConfig) => void;
          prompt: () => void;
          cancel: () => void;
        };
      };
    };
  }
}

interface GoogleInitializeConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  nonce?: string;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

interface GoogleButtonConfig {
  type: 'standard' | 'icon';
  theme: 'outline' | 'filled_blue' | 'filled_black';
  size: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: number;
}

interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
  clientId?: string;
}

export const LoginPage = () => {
  const { t } = useTranslation('auth');
  const { lang } = useParams<{ lang: string }>();
  const currentLang = lang || 'es';
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(true);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const googleInitializedRef = useRef(false);

  const { login, loginWithToken, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Helper function to build language-prefixed URLs
  const buildUrl = (path: string) => `/${currentLang}${path}`;

  // Manejar login con token desde URL
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      handleTokenLogin(token);
    }
  }, [searchParams]);

  const handleTokenLogin = async (token: string) => {
    setIsLoading(true);
    try {
      await loginWithToken(token);
      navigate(buildUrl('/wallet'), { replace: true });
    } catch {
      setError(t('errors.invalidToken'));
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize Google Sign-In - runs only once
  useEffect(() => {
    // Prevent multiple initializations
    if (googleInitializedRef.current) return;

    const initializeGoogleSignIn = async () => {
      try {
        // Only get client ID - nonce is optional and causes issues with React re-renders
        const clientIdResult = await authService.getGoogleClientId();

        if (!clientIdResult.success || !clientIdResult.client_id) {
          setIsGoogleLoading(false);
          return;
        }

        const clientId = clientIdResult.client_id;
        setGoogleClientId(clientId);

        // Load Google Identity Services script
        const existingScript = document.getElementById('google-gsi-script');
        if (!existingScript) {
          const script = document.createElement('script');
          script.id = 'google-gsi-script';
          script.src = 'https://accounts.google.com/gsi/client';
          script.async = true;
          script.defer = true;
          script.onload = () => {
            initializeGoogleButton(clientId);
          };
          document.head.appendChild(script);
        } else {
          // Script already loaded, initialize button
          initializeGoogleButton(clientId);
        }
      } catch (err) {
        console.error('Failed to initialize Google Sign-In:', err);
        setIsGoogleLoading(false);
      }
    };

    const initializeGoogleButton = (clientId: string) => {
      // Wait for google object to be available
      const checkGoogle = setInterval(() => {
        if (window.google?.accounts?.id && googleButtonRef.current) {
          clearInterval(checkGoogle);
          googleInitializedRef.current = true;

          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response: GoogleCredentialResponse) => {
              // Handle Google credential response directly
              setIsLoading(true);
              setError('');
              try {
                // Don't send nonce - Google token is already verified by Google
                await loginWithGoogle(response.credential);
                navigate(buildUrl('/wallet'), { replace: true });
              } catch (err: any) {
                setError(err.message || t('errors.googleFailed'));
              } finally {
                setIsLoading(false);
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          // Render the Google Sign-In button
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            type: 'standard',
            theme: 'filled_black',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            logo_alignment: 'left',
            width: 400,
          });

          setIsGoogleLoading(false);
        }
      }, 100);

      // Cleanup timeout
      setTimeout(() => {
        clearInterval(checkGoogle);
        setIsGoogleLoading(false);
      }, 5000);
    };

    initializeGoogleSignIn();
  }, [loginWithGoogle, navigate]);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await authService.requestLoginCode(email);

      if (result.success) {
        setStep('code');
      } else {
        setError(result.error || t('errors.failedSendCode'));
      }
    } catch {
      setError(t('errors.failedSendCode'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, code);
      navigate(buildUrl('/wallet'), { replace: true });
    } catch (err: any) {
      setError(err.message || t('errors.invalidCode'));
    } finally {
      setIsLoading(false);
    }
  };


  // Loading screen cuando se está procesando token de URL
  if (isLoading && searchParams.get('token')) {
    return (
      <div className="login-page">
        <div className="login-page__hero">
          <div className="login-page__hero-bg"></div>
          <div className="login-page__hero-content">
            <img src={logo} alt="Pull" className="login-page__hero-logo" />
            <p className="login-page__hero-tagline">{t('tagline')}</p>
          </div>
        </div>
        <div className="login-page__panel">
          <div className="login-page__panel-content">
            <div className="login-page__loading-state">
              <Loader2 size={48} className="login-page__spinner" />
              <p>{t('loading.accessingAccount')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      {/* Hero lado izquierdo */}
      <div className="login-page__hero">
        <div className="login-page__hero-bg"></div>
        <div className="login-page__hero-content">
          <img src={logo} alt="Pull" className="login-page__hero-logo" />
          <p className="login-page__hero-tagline">{t('tagline')}</p>
        </div>
      </div>

      {/* Panel de login lado derecho */}
      <div className="login-page__panel">
        <div className="login-page__panel-content">
          <div className="login-page__header">
            <img src={logo} alt="Pull" className="login-page__panel-logo" />
            <h1 className="login-page__title">
              {step === 'email' ? t('title.signIn') : t('title.verifyEmail')}
            </h1>
            <p className="login-page__subtitle">
              {step === 'email'
                ? t('subtitle.sendCode')
                : t('subtitle.codeSent', { email })}
            </p>
          </div>

          {error && (
            <div className="login-page__error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {step === 'email' ? (
            <>
              {/* Botones sociales */}
              <div className="login-page__social-buttons">
                {/* Google Sign-In Button - Rendered by Google Identity Services */}
                {googleClientId && (
                  <div
                    ref={googleButtonRef}
                    className="login-page__google-btn-container"
                    style={{ display: isGoogleLoading ? 'none' : 'flex', justifyContent: 'center' }}
                  />
                )}
                {isGoogleLoading && googleClientId && (
                  <div className="login-page__social-btn login-page__social-btn--google login-page__social-btn--loading">
                    <Loader2 size={20} className="login-page__spinner" />
                    <span>{t('loading.google')}</span>
                  </div>
                )}
                {!googleClientId && !isGoogleLoading && (
                  <button
                    disabled
                    className="login-page__social-btn login-page__social-btn--google login-page__social-btn--disabled"
                    title={t('social.googleUnavailable')}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>{t('social.googleUnavailable')}</span>
                  </button>
                )}
              </div>

              <div className="login-page__divider">
                <span>{t('divider.orEmail')}</span>
              </div>

              <form onSubmit={handleRequestCode} className="login-page__form">
                <div className="login-page__field">
                  <label htmlFor="email" className="login-page__label">{t('form.email')}</label>
                  <div className="login-page__input-wrapper">
                    <Mail size={18} className="login-page__input-icon" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="login-page__input"
                      placeholder={t('form.emailPlaceholder')}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="login-page__actions">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="login-page__back-btn"
                  >
                    {t('buttons.back')}
                  </button>
                  <button type="submit" disabled={isLoading} className="login-page__submit">
                    {isLoading ? (
                      <Loader2 size={18} className="login-page__spinner" />
                    ) : (
                      <>
                        <span>{t('buttons.next')}</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <form onSubmit={handleVerifyCode} className="login-page__form">
              <div className="login-page__field">
                <label htmlFor="code" className="login-page__label">
                  {t('form.verificationCode')}
                </label>
                {/* El backend genera códigos de 6 DÍGITOS (%06d) — la UI
                    pedía 8 alfanuméricos y el botón nunca se habilitaba. */}
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="login-page__input login-page__input--code"
                  placeholder="000000"
                  required
                  maxLength={6}
                  autoFocus
                />
              </div>

              <div className="login-page__actions">
                <button
                  type="button"
                  onClick={() => { setStep('email'); setCode(''); setError(''); }}
                  className="login-page__cancel-btn"
                >
                  {t('buttons.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isLoading || code.length !== 6}
                  className="login-page__submit"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="login-page__spinner" />
                  ) : (
                    <span>{t('buttons.verify')}</span>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleRequestCode({ preventDefault: () => {} } as React.FormEvent)}
                className="login-page__retry"
              >
                {t('buttons.resendCode')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
