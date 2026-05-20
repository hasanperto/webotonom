import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from './LanguageSelector';
import {
    FiUser, FiLogOut, FiMoon, FiSun, FiChevronDown,
    FiCreditCard, FiHeadphones, FiSettings, FiUsers,
    FiPackage, FiTrendingUp, FiFileText, FiShoppingCart,
    FiUserPlus, FiLogIn, FiMenu, FiX
} from 'react-icons/fi';
import './Topbar.css';

const Topbar = ({ mobileMenuOpen, setMobileMenuOpen }) => {
    const { user, logout, isAuthenticated, isAdmin, isSeller } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { cartCount } = useCart();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [cartMenuOpen, setCartMenuOpen] = useState(false);
    const userMenuRef = useRef(null);
    const cartMenuRef = useRef(null);

    const handleLogout = () => {
        logout();
        navigate('/');
        setUserMenuOpen(false);
    };

    // Kullanıcı menüsü dışına tıklandığında kapat
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setUserMenuOpen(false);
            }
            if (cartMenuRef.current && !cartMenuRef.current.contains(event.target)) {
                setCartMenuOpen(false);
            }
        };

        if (userMenuOpen || cartMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [userMenuOpen, cartMenuOpen]);

    return (
        <div className="header-top bg-1">
            <div className="container">
                <div className="row">
                    <div className="col-md-5 col-xs-12">
                        <div className="header-top-menu">
                            <ul>
                                <li>
                                    <Link to="/tickets">
                                        <FiHeadphones /> {t('topbar.support')}
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/contact">
                                        <FiCreditCard /> {t('topbar.contact')}
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="col-md-7 col-xs-12">
                        <div className="header-top-right uyesepet">
                            <ul>
                                {/* Mobil Menü Butonu - Mobil görünümde */}
                                <li className="mobile-only">
                                    <button
                                        className="mobile-menu-toggle-topbar"
                                        onClick={() => setMobileMenuOpen && setMobileMenuOpen(!mobileMenuOpen)}
                                        aria-label="Menü"
                                    >
                                        {mobileMenuOpen ? <FiX /> : <FiMenu />}
                                    </button>
                                </li>
                                
                                <li className="desktop-only">
                                    <LanguageSelector />
                                </li>
                                <li className="desktop-only">
                                    <button
                                        onClick={toggleTheme}
                                        className="theme-toggle-topbar"
                                        aria-label={t('theme.toggle', 'Tema değiştir')}
                                    >
                                        {theme === 'light' ? <FiMoon /> : <FiSun />}
                                    </button>
                                </li>

                                {!isAuthenticated ? (
                                    <>
                                        <li>
                                            <Link to="/register">
                                                <FiUserPlus /> {t('topbar.create_account')}
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to="/login">
                                                <FiLogIn /> {t('topbar.login')}
                                            </Link>
                                        </li>
                                    </>
                                ) : (
                                    <>
                                        <li className="cart-menu-wrapper" ref={cartMenuRef}>
                                            <Link
                                                to="/cart"
                                                onClick={() => setCartMenuOpen(!cartMenuOpen)}
                                            >
                                                {t('topbar.cart')} <FiShoppingCart />
                                                {cartCount && cartCount > 0 ? (
                                                    <span className="number">{cartCount}</span>
                                                ) : null}
                                            </Link>
                                            {cartMenuOpen && (
                                                <ul className="cart">
                                                    {cartCount && cartCount > 0 ? (
                                                        <li>
                                                            <p>{t('topbar.cart.items', { count: cartCount })}</p>
                                                            <Link to="/cart" className="view-cart-btn">
                                                                {t('topbar.cart.view')}
                                                            </Link>
                                                        </li>
                                                    ) : (
                                                        <li>
                                                            <p>{t('topbar.cart.empty')}</p>
                                                        </li>
                                                    )}
                                                </ul>
                                            )}
                                        </li>
                                        <li className="user-menu-wrapper-topbar" ref={userMenuRef}>
                                            <button
                                                className="user-menu-button-topbar"
                                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                                aria-label={t('topbar.user_menu')}
                                            >
                                                <div className="user-avatar-topbar">
                                                    {user?.avatar ? (
                                                        <img src={user.avatar} alt={user?.username} />
                                                    ) : (
                                                        <FiUser />
                                                    )}
                                                </div>
                                                <span className="user-name-topbar">{user?.username || user?.email}</span>
                                                <FiChevronDown className={`chevron ${userMenuOpen ? 'open' : ''}`} />
                                            </button>

                                            {userMenuOpen && (
                                                <div className="user-dropdown-topbar">
                                                    <div className="user-dropdown-header">
                                                        <div className="user-info">
                                                            <div className="user-avatar-large">
                                                                {user?.avatar ? (
                                                                    <img src={user.avatar} alt={user?.username} />
                                                                ) : (
                                                                    <FiUser />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="user-name-large">{user?.username || user?.email}</div>
                                                                <div className="user-email">{user?.email}</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="user-dropdown-divider"></div>

                                                    <div className="user-dropdown-menu">
                                                        {/* Panel - Rol bazlı */}
                                                        {isAdmin ? (
                                                            <Link
                                                                to="/admin/dashboard"
                                                                className="dropdown-item"
                                                                onClick={() => setUserMenuOpen(false)}
                                                            >
                                                                <FiTrendingUp /> <span>{t('topbar.admin_panel')}</span>
                                                            </Link>
                                                        ) : isSeller ? (
                                                            <Link
                                                                to="/seller/dashboard"
                                                                className="dropdown-item"
                                                                onClick={() => setUserMenuOpen(false)}
                                                            >
                                                                <FiSettings /> <span>{t('topbar.seller_panel')}</span>
                                                            </Link>
                                                        ) : (
                                                            <Link
                                                                to="/user/dashboard"
                                                                className="dropdown-item"
                                                                onClick={() => setUserMenuOpen(false)}
                                                            >
                                                                <FiUser /> <span>{t('topbar.user_panel')}</span>
                                                            </Link>
                                                        )}

                                                        {/* Profil */}
                                                        <Link
                                                            to="/profile"
                                                            className="dropdown-item"
                                                            onClick={() => setUserMenuOpen(false)}
                                                        >
                                                            <FiUser /> <span>{t('topbar.profile')}</span>
                                                        </Link>

                                                        <div className="dropdown-divider"></div>

                                                        {/* Abonelikler */}
                                                        <Link
                                                            to="/subscriptions"
                                                            className="dropdown-item"
                                                            onClick={() => setUserMenuOpen(false)}
                                                        >
                                                            <FiCreditCard /> <span>{t('topbar.subscriptions')}</span>
                                                        </Link>

                                                        {/* Destek */}
                                                        <Link
                                                            to="/tickets"
                                                            className="dropdown-item"
                                                            onClick={() => setUserMenuOpen(false)}
                                                        >
                                                            <FiHeadphones /> <span>{t('topbar.support')}</span>
                                                        </Link>

                                                        {/* Admin ise ekstra paneller */}
                                                        {isAdmin && (
                                                            <>
                                                                <div className="dropdown-divider"></div>
                                                                {isSeller && (
                                                                    <Link
                                                                        to="/seller/dashboard"
                                                                        className="dropdown-item"
                                                                        onClick={() => setUserMenuOpen(false)}
                                                                    >
                                                                        <FiSettings /> <span>{t('topbar.seller_panel')}</span>
                                                                    </Link>
                                                                )}
                                                                <Link
                                                                    to="/admin/users"
                                                                    className="dropdown-item"
                                                                    onClick={() => setUserMenuOpen(false)}
                                                                >
                                                                    <FiUsers /> <span>{t('topbar.users')}</span>
                                                                </Link>
                                                                <Link
                                                                    to="/admin/projects"
                                                                    className="dropdown-item"
                                                                    onClick={() => setUserMenuOpen(false)}
                                                                >
                                                                    <FiPackage /> <span>{t('topbar.projects')}</span>
                                                                </Link>
                                                                <Link
                                                                    to="/admin/sections"
                                                                    className="dropdown-item"
                                                                    onClick={() => setUserMenuOpen(false)}
                                                                >
                                                                    <FiFileText /> <span>{t('topbar.sections')}</span>
                                                                </Link>
                                                            </>
                                                        )}

                                                        <div className="dropdown-divider"></div>
                                                        <button
                                                            onClick={handleLogout}
                                                            className="dropdown-item dropdown-item-danger"
                                                        >
                                                            <FiLogOut /> <span>{t('topbar.logout')}</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </li>
                                    </>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Topbar;

