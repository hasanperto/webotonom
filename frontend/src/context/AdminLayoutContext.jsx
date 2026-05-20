import { createContext, useContext, useState } from 'react';

const AdminLayoutContext = createContext();

export const AdminLayoutProvider = ({ children }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [sellerMenuOpen, setSellerMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    return (
        <AdminLayoutContext.Provider value={{
            mobileMenuOpen,
            setMobileMenuOpen,
            sidebarOpen,
            setSidebarOpen,
            sellerMenuOpen,
            setSellerMenuOpen,
            userMenuOpen,
            setUserMenuOpen
        }}>
            {children}
        </AdminLayoutContext.Provider>
    );
};

export const useAdminLayout = () => {
    const context = useContext(AdminLayoutContext);
    if (!context) {
        return {
            mobileMenuOpen: false,
            setMobileMenuOpen: () => { },
            sidebarOpen: true,
            setSidebarOpen: () => { },
            sellerMenuOpen: false,
            setSellerMenuOpen: () => { },
            userMenuOpen: false,
            setUserMenuOpen: () => { }
        };
    }
    return context;
};

