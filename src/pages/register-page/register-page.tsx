import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User, Phone, Eye, EyeOff, UserPlus, AlertCircle, ArrowLeft } from 'lucide-react';
import './register-page.css';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    surname: '',
    phone: '',
    phone_prefix: '+502'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        surname: formData.surname,
        phone: formData.phone,
        phone_prefix: formData.phone_prefix
      });
      navigate('/wallet', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="register-page">
      <div className="register-page-bg-blur" />
      <div className="register-page__container">
        <button onClick={handleBack} className="register-page__back">
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <div className="register-page__card">
          <div className="register-page__header">
            <h1 className="register-page__title">Create Account</h1>
            <p className="register-page__subtitle">Join us and start enjoying exclusive events</p>
          </div>

          {error && (
            <div className="register-page__error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="register-page__form">
            <div className="register-page__row">
              <div className="register-page__field">
                <label htmlFor="name" className="register-page__label">
                  First Name
                </label>
                <div className="register-page__input-wrapper">
                  <User size={18} className="register-page__input-icon" />
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="register-page__input"
                    placeholder="John"
                    required
                    autoComplete="given-name"
                  />
                </div>
              </div>

              <div className="register-page__field">
                <label htmlFor="surname" className="register-page__label">
                  Last Name
                </label>
                <div className="register-page__input-wrapper">
                  <User size={18} className="register-page__input-icon" />
                  <input
                    id="surname"
                    type="text"
                    name="surname"
                    value={formData.surname}
                    onChange={handleChange}
                    className="register-page__input"
                    placeholder="Doe"
                    required
                    autoComplete="family-name"
                  />
                </div>
              </div>
            </div>

            <div className="register-page__field">
              <label htmlFor="email" className="register-page__label">
                Email
              </label>
              <div className="register-page__input-wrapper">
                <Mail size={18} className="register-page__input-icon" />
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="register-page__input"
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="register-page__field">
              <label htmlFor="phone" className="register-page__label">
                Phone (Optional)
              </label>
              <div className="register-page__input-wrapper">
                <Phone size={18} className="register-page__input-icon" />
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="register-page__input"
                  placeholder="12345678"
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="register-page__field">
              <label htmlFor="password" className="register-page__label">
                Password
              </label>
              <div className="register-page__input-wrapper">
                <Lock size={18} className="register-page__input-icon" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="register-page__input"
                  placeholder="Min. 6 characters"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="register-page__toggle-password"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="register-page__field">
              <label htmlFor="confirmPassword" className="register-page__label">
                Confirm Password
              </label>
              <div className="register-page__input-wrapper">
                <Lock size={18} className="register-page__input-icon" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="register-page__input"
                  placeholder="Confirm your password"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="register-page__toggle-password"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="register-page__submit"
            >
              {isLoading ? (
                <span className="register-page__loading">Creating account...</span>
              ) : (
                <>
                  <UserPlus size={18} />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          <div className="register-page__footer">
            <p className="register-page__footer-text">
              Already have an account?{' '}
              <Link to="/login" className="register-page__footer-link">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};