import { createContext, useContext, useState, useEffect } from 'react';
import { cartAPI } from '../api/cart';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [cartCount, setCartCount] = useState(0);
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            loadCart();
        } else {
            setCartCount(0);
            setCartItems([]);
        }
    }, [isAuthenticated]);

    const loadCart = async () => {
        try {
            setLoading(true);
            const response = await cartAPI.getCart();
            const items = response.data?.items || [];
            
            // Eğer items boş değilse ve geçerli bir array ise
            if (Array.isArray(items) && items.length > 0) {
                setCartItems(items);
                const totalCount = items.reduce((sum, item) => {
                    const quantity = item.quantity || 1;
                    return sum + quantity;
                }, 0);
                setCartCount(totalCount);
            } else {
                // Sepet boş
                setCartItems([]);
                setCartCount(0);
            }
        } catch (error) {
            console.error('Cart load error:', error);
            setCartCount(0);
            setCartItems([]);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = async (projectId, quantity = 1) => {
        try {
            await cartAPI.addToCart({ project_id: projectId, quantity });
            await loadCart();
            return { success: true };
        } catch (error) {
            console.error('Add to cart error:', error);
            return { 
                success: false, 
                error: error.response?.data?.error || 'Sepete eklenemedi' 
            };
        }
    };

    const removeFromCart = async (id) => {
        try {
            await cartAPI.removeFromCart(id);
            await loadCart();
            return { success: true };
        } catch (error) {
            console.error('Remove from cart error:', error);
            return { 
                success: false, 
                error: error.response?.data?.error || 'Sepetten çıkarılamadı' 
            };
        }
    };

    const clearCart = async () => {
        try {
            await cartAPI.clearCart();
            setCartCount(0);
            setCartItems([]);
            return { success: true };
        } catch (error) {
            console.error('Clear cart error:', error);
            return { 
                success: false, 
                error: error.response?.data?.error || 'Sepet temizlenemedi' 
            };
        }
    };

    const value = {
        cartCount,
        cartItems,
        loading,
        addToCart,
        removeFromCart,
        clearCart,
        loadCart
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};



