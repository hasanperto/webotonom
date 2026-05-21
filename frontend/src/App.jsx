import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useModules } from './context/ModulesContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { CartProvider } from './context/CartContext';
import { AdminLayoutProvider } from './context/AdminLayoutContext';
import { ModulesProvider } from './context/ModulesContext';
import Header from './components/Header';
import Topbar from './components/Topbar';
import Footer from './components/Footer';
import LanguageSelectorPopup from './components/LanguageSelectorPopup';
import { useState, useEffect, useLayoutEffect, Suspense } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import UserDashboard from './pages/UserDashboard';
import UserOrders from './pages/UserOrders';
import OrderDetail from './pages/OrderDetail';
import UserFavorites from './pages/UserFavorites';
import UserMessages from './pages/UserMessages';
import UserDonations from './pages/UserDonations';
import UserShares from './pages/UserShares';
import UserTransactions from './pages/UserTransactions';
import UserWallet from './pages/UserWallet';
import UserProfile from './pages/UserProfile';
import UserSettings from './pages/UserSettings';
import UserDownloads from './pages/UserDownloads';
import {
    AdminDashboard,
    SellerDashboard,
    SellerProjects,
    SellerAddProject,
    SellerEditProject,
    SellerEarnings,
    SellerSales,
    SellerSalesDetail,
    SellerOrders,
    SellerMessages,
    SellerProfile,
    SellerSettings,
    SellerFavorites,
    SellerAnalytics,
    SellerCustomers,
    SellerCoupons,
    SellerReports,
    SellerMedia,
} from './routes/lazyPages';
import Cart from './pages/Cart';
import Subscriptions from './pages/Subscriptions';
import Tickets from './pages/Tickets';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Contact from './pages/Contact';
import Profile from './pages/Profile';
import Maintenance from './pages/Maintenance';
import MaintenanceGuard from './components/MaintenanceGuard';
import PageTransitionLayout from './components/PageTransitionLayout';
import ScrollToTop from './components/ScrollToTop';
import {
    AdminUsers,
    AdminProjects,
    AdminSections,
    AdminSettingsGeneral,
    AdminSettingsAPI,
    AdminSettingsContact,
    AdminSettingsSocial,
    AdminSettingsModules,
    AdminSettingsLimits,
    AdminSettingsMaintenance,
    AdminSettingsEmail,
    AdminSettingsSMS,
    AdminSettingsPayment,
    AdminSettingsBackgrounds,
    AdminBankAccounts,
    AdminBankTransferNotifications,
    AdminLanguages,
    AdminOrders,
    AdminOrderDetail,
    AdminCoupons,
    AdminTransactions,
    AdminPaymentRequests,
    AdminWithdrawals,
    AdminDonations,
    AdminSubscriptions,
    AdminBlog,
    AdminBlogAdd,
    AdminBlogEdit,
    AdminBlogBot,
    AdminCategories,
    AdminHeroSlides,
    AdminHeroSlidesAdd,
    AdminProjectsSection,
    AdminFeaturesSection,
    AdminFeaturesAdd,
    AdminStatsSection,
    AdminStatsAdd,
    AdminFAQSection,
    AdminFAQAdd,
    AdminAboutSection,
    AdminAboutAdd,
    AdminTestimonialsSection,
    AdminTestimonialsAdd,
    AdminMenus,
    AdminPages,
    AdminPagesAdd,
    AdminPagesEdit,
    AdminReferences,
    AdminSponsors,
    AdminUsersBanned,
    AdminUsersContacts,
    AdminUsersBulkEmail,
    AdminUsersBulkSMS,
    AdminUsersNotificationTemplates,
    AdminAccountingPendingInvoices,
    AdminAccountingApprovedInvoices,
    AdminInvoiceDetail,
    AdminSupport,
    AdminLoyaltyRewards,
    Checkout,
    CheckoutWizard,
} from './routes/lazyPages';
import Sales from './pages/Sales';
import TranslationTest from './pages/TranslationTest';
import DynamicPage from './pages/DynamicPage';
import NotFound from './pages/NotFound';
import './App.css';

const PrivateRoute = ({ children, requireAdmin = false, requireSeller = false }) => {
    const { isAuthenticated, isAdmin, isSeller, loading } = useAuth();
    const token = localStorage.getItem('token');

    if (loading) {
        return <div className="loading">Yükleniyor...</div>;
    }

    // Token yoksa oturum yok kabul et (admin sayfalarında Token bulunamadı hatasını engeller)
    if (!token || !isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (requireAdmin && !isAdmin) {
        return <Navigate to="/" />;
    }

    if (requireSeller && !isSeller) {
        return <Navigate to="/" />;
    }

    return children;
};

const ModuleRoute = ({ children, moduleKey }) => {
    const { modules, loading } = useModules();
    
    if (loading) {
        return <div className="loading">Yükleniyor...</div>;
    }
    
    if (!modules || !modules[moduleKey]) {
        return <Navigate to="/" />;
    }
    
    return children;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={
                <MaintenanceGuard>
                    <Routes>
                        <Route element={<PageTransitionLayout />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/register" element={<Register />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route
                path="/checkout-wizard"
                element={
                    <PrivateRoute>
                        <CheckoutWizard />
                    </PrivateRoute>
                }
            />
            <Route path="/checkout" element={<CheckoutWizard />} />
            <Route path="/checkout-old" element={<Checkout />} />
            <Route 
                path="/subscriptions" 
                element={
                    <ModuleRoute moduleKey="subscriptionsEnabled">
                        <Subscriptions />
                    </ModuleRoute>
                } 
            />
            <Route 
                path="/tickets" 
                element={
                    <ModuleRoute moduleKey="ticketsEnabled">
                        <Tickets />
                    </ModuleRoute>
                } 
            />
            <Route 
                path="/blog" 
                element={
                    <ModuleRoute moduleKey="blogEnabled">
                        <Blog />
                    </ModuleRoute>
                } 
            />
            <Route 
                path="/blog/:slug" 
                element={
                    <ModuleRoute moduleKey="blogEnabled">
                        <BlogPost />
                    </ModuleRoute>
                } 
            />
            <Route path="/contact" element={<Contact />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/page/:slug" element={<DynamicPage />} />
            <Route path="/:slug" element={<DynamicPage />} />
            <Route
                path="/test/translation"
                element={
                    <PrivateRoute>
                        <TranslationTest />
                    </PrivateRoute>
                }
            />

            <Route
                path="/profile"
                element={
                    <PrivateRoute>
                        <Profile />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/users"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminUsers />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/projects"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminProjects />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/sections"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminSections />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/settings/general"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminSettingsGeneral />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/settings/api"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminSettingsAPI />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/settings/contact"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminSettingsContact />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/settings/social"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminSettingsSocial />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/settings/modules"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminSettingsModules />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/settings/limits"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminSettingsLimits />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/settings/maintenance"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminSettingsMaintenance />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/settings/email"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminSettingsEmail />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/settings/sms"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminSettingsSMS />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/settings/payment"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminSettingsPayment />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/bank-accounts"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminBankAccounts />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/bank-transfer-notifications"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminBankTransferNotifications />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/settings/backgrounds"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminSettingsBackgrounds />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/languages"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminLanguages />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/languages/add"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminLanguages />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/orders"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminOrders />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/orders/:id"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminOrderDetail />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/coupons"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminCoupons />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/transactions"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminTransactions />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/payment-requests"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminPaymentRequests />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/withdrawals"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminWithdrawals />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/donations"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminDonations />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/subscriptions/:tab?"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminSubscriptions />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/subscriptions/plans"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminSubscriptions />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/subscriptions/active"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminSubscriptions />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/subscriptions/stats"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminSubscriptions />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/blog/add"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminBlogAdd />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/blog/haber-botu"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminBlogBot />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/blog/:id/edit"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminBlogEdit />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/blog"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminBlog />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/sections/hero/slides"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminHeroSlides />
                    </PrivateRoute>
                }
            />
            <Route
                path="/admin/sections/hero/slides/add"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminHeroSlidesAdd />
                    </PrivateRoute>
                }
            />
            <Route
                path="/admin/sections/hero/slides/edit/:id"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminHeroSlidesAdd />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/sections/projects/settings"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminProjectsSection />
                    </PrivateRoute>
                }
            />
            <Route
                path="/admin/sections/features/items"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminFeaturesSection />
                    </PrivateRoute>
                }
            />
            <Route
                path="/admin/sections/features/items/add"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminFeaturesAdd />
                    </PrivateRoute>
                }
            />
            <Route
                path="/admin/sections/features/items/edit/:id"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminFeaturesAdd />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/sections/stats/items"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminStatsSection />
                    </PrivateRoute>
                }
            />
            <Route
                path="/admin/sections/stats/items/add"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminStatsAdd />
                    </PrivateRoute>
                }
            />
            <Route
                path="/admin/sections/stats/items/edit/:id"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminStatsAdd />
                    </PrivateRoute>
                }
            />
            <Route
                path="/admin/sections/faq/items"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminFAQSection />
                    </PrivateRoute>
                }
            />
            <Route
                path="/admin/sections/faq/items/add"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminFAQAdd />
                    </PrivateRoute>
                }
            />
            <Route
                path="/admin/sections/faq/items/edit/:id"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminFAQAdd />
                    </PrivateRoute>
                }
            />
            <Route
                path="/admin/sections/about/items"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminAboutSection />
                    </PrivateRoute>
                }
            />
            <Route
                path="/admin/sections/about/items/add"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminAboutAdd />
                    </PrivateRoute>
                }
            />
            <Route
                path="/admin/sections/about/items/edit/:id"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminAboutAdd />
                    </PrivateRoute>
                }
            />
            <Route
                path="/admin/sections/testimonials/items"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminTestimonialsSection />
                    </PrivateRoute>
                }
            />
            <Route
                path="/admin/sections/testimonials/items/add"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminTestimonialsAdd />
                    </PrivateRoute>
                }
            />
            <Route
                path="/admin/sections/testimonials/items/edit/:id"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminTestimonialsAdd />
                    </PrivateRoute>
                }
            />
            <Route
                element={
                    <PrivateRoute requireAdmin>
                        <AdminProjectsSection />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/categories"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminCategories />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/menus/:type"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminMenus />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/pages"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminPages />
                    </PrivateRoute>
                }
            />
            <Route
                path="/admin/pages/add"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminPagesAdd />
                    </PrivateRoute>
                }
            />
            <Route
                path="/admin/pages/:id/edit"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminPagesEdit />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/references"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminReferences />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/sponsors"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminSponsors />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/menus/header"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminMenus />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/menus/footer"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminMenus />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/users/banned"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminUsersBanned />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/users/contacts"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminUsersContacts />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/users/bulk-email"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminUsersBulkEmail />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/users/bulk-sms"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminUsersBulkSMS />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/users/notification-templates"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminUsersNotificationTemplates />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/accounting/pending-invoices"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminAccountingPendingInvoices />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/accounting/approved-invoices"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminAccountingApprovedInvoices />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/accounting/invoices/:id"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminInvoiceDetail />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/support"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminSupport />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/loyalty-rewards"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminLoyaltyRewards />
                    </PrivateRoute>
                }
            />

            <Route
                path="/user/dashboard"
                element={
                    <PrivateRoute>
                        <UserDashboard />
                    </PrivateRoute>
                }
            />

            <Route
                path="/user/orders"
                element={
                    <PrivateRoute>
                        <UserOrders />
                    </PrivateRoute>
                }
            />

            <Route
                path="/orders/:id"
                element={
                    <PrivateRoute>
                        <OrderDetail />
                    </PrivateRoute>
                }
            />

            <Route
                path="/user/orders/:id"
                element={
                    <PrivateRoute>
                        <OrderDetail />
                    </PrivateRoute>
                }
            />

            <Route
                path="/user/favorites"
                element={
                    <PrivateRoute>
                        <UserFavorites />
                    </PrivateRoute>
                }
            />

            <Route
                path="/user/messages"
                element={
                    <PrivateRoute>
                        <UserMessages />
                    </PrivateRoute>
                }
            />

            <Route
                path="/user/donations"
                element={
                    <PrivateRoute>
                        <UserDonations />
                    </PrivateRoute>
                }
            />

            <Route
                path="/user/shares"
                element={
                    <PrivateRoute>
                        <UserShares />
                    </PrivateRoute>
                }
            />

            <Route
                path="/user/transactions"
                element={
                    <PrivateRoute>
                        <UserTransactions />
                    </PrivateRoute>
                }
            />

            <Route
                path="/user/wallet"
                element={
                    <PrivateRoute>
                        <UserWallet />
                    </PrivateRoute>
                }
            />

            <Route
                path="/user/profile"
                element={
                    <PrivateRoute>
                        <UserProfile />
                    </PrivateRoute>
                }
            />

            <Route
                path="/user/settings"
                element={
                    <PrivateRoute>
                        <UserSettings />
                    </PrivateRoute>
                }
            />

            <Route
                path="/user/downloads"
                element={
                    <PrivateRoute>
                        <UserDownloads />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/dashboard"
                element={
                    <PrivateRoute requireAdmin>
                        <AdminDashboard />
                    </PrivateRoute>
                }
            />

            <Route
                path="/seller/dashboard"
                element={
                    <PrivateRoute requireSeller>
                        <SellerDashboard />
                    </PrivateRoute>
                }
            />

            <Route
                path="/seller/projects"
                element={
                    <PrivateRoute requireSeller>
                        <SellerProjects />
                    </PrivateRoute>
                }
            />

            <Route
                path="/seller/add-project"
                element={
                    <PrivateRoute requireSeller>
                        <SellerAddProject />
                    </PrivateRoute>
                }
            />

            <Route
                path="/seller/edit-project/:id"
                element={
                    <PrivateRoute requireSeller>
                        <SellerEditProject />
                    </PrivateRoute>
                }
            />

            <Route
                path="/seller/projects/:id/edit"
                element={
                    <PrivateRoute requireSeller>
                        <SellerEditProject />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/projects/new"
                element={
                    <PrivateRoute requireAdmin>
                        <SellerAddProject />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/projects/:id/edit"
                element={
                    <PrivateRoute requireAdmin>
                        <SellerEditProject />
                    </PrivateRoute>
                }
            />

            <Route
                path="/seller/earnings"
                element={
                    <PrivateRoute requireSeller>
                        <SellerEarnings />
                    </PrivateRoute>
                }
            />

            <Route
                path="/seller/orders"
                element={
                    <PrivateRoute requireSeller>
                        <SellerOrders />
                    </PrivateRoute>
                }
            />
            <Route
                path="/seller/sales"
                element={
                    <PrivateRoute requireSeller>
                        <SellerSales />
                    </PrivateRoute>
                }
            />

            <Route
                path="/seller/sales/:id"
                element={
                    <PrivateRoute requireSeller>
                        <SellerSalesDetail />
                    </PrivateRoute>
                }
            />

            <Route
                path="/seller/messages"
                element={
                    <PrivateRoute requireSeller>
                        <SellerMessages />
                    </PrivateRoute>
                }
            />

            <Route
                path="/seller/profile"
                element={
                    <PrivateRoute requireSeller>
                        <SellerProfile />
                    </PrivateRoute>
                }
            />

            <Route
                path="/seller/settings"
                element={
                    <PrivateRoute requireSeller>
                        <SellerSettings />
                    </PrivateRoute>
                }
            />

            <Route
                path="/seller/favorites"
                element={
                    <PrivateRoute requireSeller>
                        <SellerFavorites />
                    </PrivateRoute>
                }
            />

            <Route
                path="/seller/analytics"
                element={
                    <PrivateRoute requireSeller>
                        <SellerAnalytics />
                    </PrivateRoute>
                }
            />

            <Route
                path="/seller/customers"
                element={
                    <PrivateRoute requireSeller>
                        <SellerCustomers />
                    </PrivateRoute>
                }
            />

            <Route
                path="/seller/coupons"
                element={
                    <PrivateRoute requireSeller>
                        <SellerCoupons />
                    </PrivateRoute>
                }
            />

            <Route
                path="/seller/reports"
                element={
                    <PrivateRoute requireSeller>
                        <SellerReports />
                    </PrivateRoute>
                }
            />

            <Route
                path="/seller/media"
                element={
                    <PrivateRoute requireSeller>
                        <SellerMedia />
                    </PrivateRoute>
                }
            />

                        <Route path="*" element={<NotFound />} />
                        </Route>
                    </Routes>
                </MaintenanceGuard>
            } />
        </Routes>
    );
};

const TopbarWithHeader = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <>
            <Topbar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
            <Header mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
        </>
    );
};

const AppContent = () => {
    const location = useLocation();
    const isMaintenancePage = location.pathname === '/maintenance';

    return (
        <>
            <ScrollToTop />
            <AppContentInner isMaintenancePage={isMaintenancePage} location={location} />
        </>
    );
};

const AppContentInner = ({ isMaintenancePage, location }) => {
    const [headerScrolled, setHeaderScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setHeaderScrolled(window.scrollY > 14);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useLayoutEffect(() => {
        const id = requestAnimationFrame(() => {
            setHeaderScrolled(window.scrollY > 14);
        });
        return () => cancelAnimationFrame(id);
    }, [location.pathname]);

    // Maintenance sayfası için Header/Footer gösterme - tamamen bağımsız sayfa
    if (isMaintenancePage) {
        return (
            <div className="App">
                <AppRoutes />
            </div>
        );
    }

    // Normal sayfalar için Header/Footer göster
    return (
        <div className="App">
            <LanguageSelectorPopup />
            <div className={`header-wrapper${headerScrolled ? ' header-wrapper--scrolled' : ''}`}>
                <TopbarWithHeader />
            </div>
            <main>
                <AppRoutes />
            </main>
            <Footer />
        </div>
    );
};

function App() {
    return (
        <LanguageProvider>
            <ThemeProvider>
                <CurrencyProvider>
                    <AuthProvider>
                        <CartProvider>
                            <ModulesProvider>
                                <AdminLayoutProvider>
                                    <Router>
                                        <Suspense fallback={<div className="loading">Yükleniyor...</div>}>
                                            <AppContent />
                                        </Suspense>
                                    </Router>
                                </AdminLayoutProvider>
                            </ModulesProvider>
                        </CartProvider>
                    </AuthProvider>
                </CurrencyProvider>
            </ThemeProvider>
        </LanguageProvider>
    );
}

export default App;

