// pages/login-page.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { Mail, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import './login-page.css';

const logo = "/logo.svg";

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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
      navigate('/wallet', { replace: true });
    } catch {
      setError('Invalid or expired access link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await authService.requestLoginCode(email);

      if (result.success) {
        setStep('code');
      } else {
        setError(result.error || 'Failed to send code');
      }
    } catch {
      setError('Failed to send code');
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
      navigate('/wallet', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // TODO: Implementar login con Google
    console.log('Google login');
  };

  const handleAppleLogin = () => {
    // TODO: Implementar login con Apple
    console.log('Apple login');
  };

  // Loading screen cuando se está procesando token de URL
  if (isLoading && searchParams.get('token')) {
    return (
      <div className="login-page">
        <div className="login-page__hero">
          <div className="login-page__hero-bg"></div>
          <div className="login-page__hero-content">
            <img src={logo} alt="Pull" className="login-page__hero-logo" />
            <p className="login-page__hero-tagline">The management platform for venues</p>
          </div>
        </div>
        <div className="login-page__panel">
          <div className="login-page__panel-content">
            <div className="login-page__loading-state">
              <Loader2 size={48} className="login-page__spinner" />
              <p>Accessing your account...</p>
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
          <p className="login-page__hero-tagline">The management platform for venues</p>
        </div>
      </div>

      {/* Panel de login lado derecho */}
      <div className="login-page__panel">
        <div className="login-page__panel-content">
          <div className="login-page__header">
            <img src={logo} alt="Pull" className="login-page__panel-logo" />
            <h1 className="login-page__title">
              {step === 'email' ? 'Sign in' : 'Verify your email'}
            </h1>
            <p className="login-page__subtitle">
              {step === 'email'
                ? 'We\'ll send a verification code to your email'
                : `We sent a verification code to ${email}`}
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
                <button onClick={handleGoogleLogin} className="login-page__social-btn login-page__social-btn--google">
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>
                <button onClick={handleAppleLogin} className="login-page__social-btn login-page__social-btn--apple">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  <span>Continue with Apple</span>
                </button>
              </div>

              <div className="login-page__divider">
                <span>or sign in with email</span>
              </div>

              <form onSubmit={handleRequestCode} className="login-page__form">
                <div className="login-page__field">
                  <label htmlFor="email" className="login-page__label">Email</label>
                  <div className="login-page__input-wrapper">
                    <Mail size={18} className="login-page__input-icon" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="login-page__input"
                      placeholder="you@email.com"
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
                    Back
                  </button>
                  <button type="submit" disabled={isLoading} className="login-page__submit">
                    {isLoading ? (
                      <Loader2 size={18} className="login-page__spinner" />
                    ) : (
                      <>
                        <span>Next</span>
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
                  Verification code
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                  className="login-page__input login-page__input--code"
                  placeholder="XXXXXXXX"
                  required
                  maxLength={8}
                  autoFocus
                />
              </div>

              <div className="login-page__actions">
                <button
                  type="button"
                  onClick={() => { setStep('email'); setCode(''); setError(''); }}
                  className="login-page__cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || code.length !== 8}
                  className="login-page__submit"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="login-page__spinner" />
                  ) : (
                    <span>Verify</span>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleRequestCode({ preventDefault: () => {} } as React.FormEvent)}
                className="login-page__retry"
              >
                Didn't receive the code? Resend
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
