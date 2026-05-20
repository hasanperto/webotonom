import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AnimatePresence, motion as M, useReducedMotion } from 'framer-motion';
import { FiEye, FiEyeOff, FiLoader, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import AuthSplitShell from '../components/auth/AuthSplitShell';
import { motionEase } from '../utils/motion';
import './Auth.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { login } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const reduceMotion = useReducedMotion();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(email, password);

        if (result.success) {
            setSuccess(true);
            setLoading(false);
            const user = result.user;
            const path =
                user?.role === 'admin'
                    ? '/admin/dashboard'
                    : user?.role === 'seller'
                      ? '/seller/dashboard'
                      : '/user/dashboard';
            window.setTimeout(() => navigate(path), reduceMotion ? 0 : 720);
        } else {
            setError(result.error);
            setLoading(false);
        }
    };

    return (
        <AuthSplitShell mode="login">
            <h1 className="auth-title">{t('auth.login_title', 'Hoş Geldiniz')}</h1>
            <p className="auth-subtitle auth-subtitle--split">{t('auth.login_subtitle', 'Hesabınıza giriş yapın')}</p>

            <AnimatePresence mode="wait">
                {error ? (
                    <M.div
                        key="err"
                        role="alert"
                        className="alert alert-error"
                        initial={reduceMotion ? false : { opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                        transition={{ duration: 0.2, ease: motionEase }}
                    >
                        {error}
                    </M.div>
                ) : null}
            </AnimatePresence>

            <AnimatePresence>
                {success ? (
                    <M.div
                        key="ok"
                        className="auth-success-banner"
                        initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={reduceMotion ? undefined : { opacity: 0 }}
                        transition={{ duration: 0.25, ease: motionEase }}
                    >
                        <FiCheckCircle aria-hidden />
                        <span>{t('auth.login_success', 'Giriş başarılı, yönlendiriliyorsunuz…')}</span>
                    </M.div>
                ) : null}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className={success ? 'auth-form auth-form--disabled' : 'auth-form'}>
                <div className="auth-float">
                    <input
                        type="email"
                        id="email"
                        className="auth-float-input"
                        placeholder=" "
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        disabled={success}
                    />
                    <label htmlFor="email" className="auth-float-label">
                        {t('auth.email', 'E-posta')}
                    </label>
                </div>

                <div className="auth-float auth-float--password">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        className="auth-float-input"
                        placeholder=" "
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        disabled={success}
                    />
                    <label htmlFor="password" className="auth-float-label">
                        {t('auth.password', 'Şifre')}
                    </label>
                    <button
                        type="button"
                        className="auth-password-toggle"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? t('auth.hide_password', 'Şifreyi gizle') : t('auth.show_password', 'Şifreyi göster')}
                        disabled={success}
                    >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                </div>

                <button type="submit" className="btn btn-primary btn-block auth-submit" disabled={loading || success}>
                    {loading ? (
                        <>
                            <M.span
                                className="auth-submit-spinner"
                                animate={reduceMotion ? {} : { rotate: 360 }}
                                transition={reduceMotion ? {} : { duration: 0.85, repeat: Infinity, ease: 'linear' }}
                                aria-hidden
                            >
                                <FiLoader />
                            </M.span>
                            {t('auth.logging_in', 'Giriş Yapılıyor...')}
                        </>
                    ) : (
                        t('auth.login_button', 'Giriş Yap')
                    )}
                </button>
            </form>

            <div className="auth-links">
                {t('auth.no_account', 'Hesabınız yok mu?')}
                <Link to="/register">{t('auth.create_account', 'Hemen oluşturun')}</Link>
            </div>
        </AuthSplitShell>
    );
};

export default Login;
