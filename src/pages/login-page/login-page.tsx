import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, ArrowLeft } from 'lucide-react';
import './login-page.css';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/wallet';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="login-page">
      <div className="login-page-bg-blur" />
      <div className="login-page__container">
        <button onClick={handleBack} className="login-page__back">
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <div className="login-page__card">
          <div className="login-page__header">
            <h1 className="login-page__title">Welcome Back</h1>
            <p className="login-page__subtitle">Sign in to access your tickets and profile</p>
          </div>

          {error && (
            <div className="login-page__error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-page__form">
            <div className="login-page__field">
              <label htmlFor="email" className="login-page__label">
                Email
              </label>
              <div className="login-page__input-wrapper">
                <Mail size={18} className="login-page__input-icon" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-page__input"
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="login-page__field">
              <label htmlFor="password" className="login-page__label">
                Password
              </label>
              <div className="login-page__input-wrapper">
                <Lock size={18} className="login-page__input-icon" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-page__input"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-page__toggle-password"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="login-page__submit"
            >
              {isLoading ? (
                <span className="login-page__loading">Signing in...</span>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <div className="login-page__footer">
            <p className="login-page__footer-text">
              Don't have an account?{' '}
              <Link to="/register" className="login-page__footer-link">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};