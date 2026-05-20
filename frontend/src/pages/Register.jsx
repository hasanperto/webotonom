import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AnimatePresence, motion as M, useReducedMotion } from 'framer-motion';
import { FiEye, FiEyeOff, FiLoader, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import AuthSplitShell from '../components/auth/AuthSplitShell';
import { motionEase } from '../utils/motion';
import './Auth.css';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        password_confirm: '',
        first_name: '',
        last_name: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

    const { register } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const reduceMotion = useReducedMotion();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.password_confirm) {
            setError(t('auth.passwords_mismatch', 'Şifreler eşleşmiyor'));
            return;
        }

        if (formData.password.length < 6) {
            setError(t('auth.password_min_length', 'Şifre en az 6 karakter olmalıdır'));
            return;
        }

        setLoading(true);

        const result = await register(formData);

        if (result.success) {
            setSuccess(true);
            setLoading(false);
            window.setTimeout(() => navigate('/user/dashboard'), reduceMotion ? 0 : 800);
        } else {
            setError(result.error);
            setLoading(false);
        }
    };

    return (
        <AuthSplitShell mode="register">
            <h1 className="auth-title">{t('auth.register_title', 'Aramıza Katılın')}</h1>
            <p className="auth-subtitle auth-subtitle--split">{t('auth.register_subtitle', 'Yeni bir hesap oluşturun')}</p>

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
                        transition={{ duration: 0.25, ease: motionEase }}
                    >
                        <FiCheckCircle aria-hidden />
                        <span>{t('auth.register_success', 'Kayıt tamamlandı, panele yönlendiriliyorsunuz…')}</span>
                    </M.div>
                ) : null}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className={success ? 'auth-form auth-form--disabled' : 'auth-form'}>
                <div className="auth-float">
                    <input
                        type="text"
                        id="username"
                        name="username"
                        className="auth-float-input"
                        placeholder=" "
                        value={formData.username}
                        onChange={handleChange}
                        required
                        minLength={3}
                        autoComplete="username"
                        disabled={success}
                    />
                    <label htmlFor="username" className="auth-float-label">
                        {t('auth.username', 'Kullanıcı Adı')}
                    </label>
                </div>

                <div className="auth-float">
                    <input
                        type="email"
                        id="email"
                        name="email"
                        className="auth-float-input"
                        placeholder=" "
                        value={formData.email}
                        onChange={handleChange}
                        required
                        autoComplete="email"
                        disabled={success}
                    />
                    <label htmlFor="email" className="auth-float-label">
                        {t('auth.email', 'E-posta')}
                    </label>
                </div>

                <div className="form-row auth-form-row">
                    <div className="auth-float">
                        <input
                            type="text"
                            id="first_name"
                            name="first_name"
                            className="auth-float-input"
                            placeholder=" "
                            value={formData.first_name}
                            onChange={handleChange}
                            autoComplete="given-name"
                            disabled={success}
                        />
                        <label htmlFor="first_name" className="auth-float-label">
                            {t('auth.first_name', 'Ad')}
                        </label>
                    </div>

                    <div className="auth-float">
                        <input
                            type="text"
                            id="last_name"
                            name="last_name"
                            className="auth-float-input"
                            placeholder=" "
                            value={formData.last_name}
                            onChange={handleChange}
                            autoComplete="family-name"
                            disabled={success}
                        />
                        <label htmlFor="last_name" className="auth-float-label">
                            {t('auth.last_name', 'Soyad')}
                        </label>
                    </div>
                </div>

                <div className="auth-float auth-float--password">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        className="auth-float-input"
                        placeholder=" "
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                        autoComplete="new-password"
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

                <div className="auth-float auth-float--password">
                    <input
                        type={showPasswordConfirm ? 'text' : 'password'}
                        id="password_confirm"
                        name="password_confirm"
                        className="auth-float-input"
                        placeholder=" "
                        value={formData.password_confirm}
                        onChange={handleChange}
                        required
                        minLength={6}
                        autoComplete="new-password"
                        disabled={success}
                    />
                    <label htmlFor="password_confirm" className="auth-float-label">
                        {t('auth.password_confirm', 'Şifre Tekrar')}
                    </label>
                    <button
                        type="button"
                        className="auth-password-toggle"
                        onClick={() => setShowPasswordConfirm((v) => !v)}
                        aria-label={
                            showPasswordConfirm
                                ? t('auth.hide_password_confirm', 'Şifre tekrarını gizle')
                                : t('auth.show_password_confirm', 'Şifre tekrarını göster')
                        }
                        disabled={success}
                    >
                        {showPasswordConfirm ? <FiEyeOff /> : <FiEye />}
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
                            {t('auth.registering', 'Kayıt Yapılıyor...')}
                        </>
                    ) : (
                        t('auth.register_button', 'Kayıt Ol')
                    )}
                </button>
            </form>

            <div className="auth-links">
                {t('auth.have_account', 'Zaten hesabınız var mı?')}
                <Link to="/login">{t('auth.login_link', 'Giriş yapın')}</Link>
            </div>
        </AuthSplitShell>
    );
};

export default Register;
