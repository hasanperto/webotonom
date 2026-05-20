import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const ModulesContext = createContext();

export const useModules = () => {
    const context = useContext(ModulesContext);
    if (!context) {
        throw new Error('useModules must be used within ModulesProvider');
    }
    return context;
};

export const ModulesProvider = ({ children }) => {
    const [modules, setModules] = useState({
        blogEnabled: true,
        ticketsEnabled: true,
        donationsEnabled: true,
        subscriptionsEnabled: true,
        commentsEnabled: true,
        ratingsEnabled: true
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadModules();
    }, []);

    const loadModules = async () => {
        try {
            const response = await api.get('/public/settings/modules');
            if (response.data) {
                setModules({
                    blogEnabled: response.data.blog_enabled !== undefined 
                        ? (response.data.blog_enabled === true || response.data.blog_enabled === '1' || response.data.blog_enabled === 1)
                        : response.data.blogEnabled !== undefined ? response.data.blogEnabled : true,
                    ticketsEnabled: response.data.tickets_enabled !== undefined
                        ? (response.data.tickets_enabled === true || response.data.tickets_enabled === '1' || response.data.tickets_enabled === 1)
                        : response.data.ticketsEnabled !== undefined ? response.data.ticketsEnabled : true,
                    donationsEnabled: response.data.donations_enabled !== undefined
                        ? (response.data.donations_enabled === true || response.data.donations_enabled === '1' || response.data.donations_enabled === 1)
                        : response.data.donationsEnabled !== undefined ? response.data.donationsEnabled : true,
                    subscriptionsEnabled: response.data.subscriptions_enabled !== undefined
                        ? (response.data.subscriptions_enabled === true || response.data.subscriptions_enabled === '1' || response.data.subscriptions_enabled === 1)
                        : response.data.subscriptionsEnabled !== undefined ? response.data.subscriptionsEnabled : true,
                    commentsEnabled: response.data.comments_enabled !== undefined
                        ? (response.data.comments_enabled === true || response.data.comments_enabled === '1' || response.data.comments_enabled === 1)
                        : response.data.commentsEnabled !== undefined ? response.data.commentsEnabled : true,
                    ratingsEnabled: response.data.ratings_enabled !== undefined
                        ? (response.data.ratings_enabled === true || response.data.ratings_enabled === '1' || response.data.ratings_enabled === 1)
                        : response.data.ratingsEnabled !== undefined ? response.data.ratingsEnabled : true
                });
            }
        } catch (error) {
            console.error('Modules load error:', error);
            // Hata durumunda varsayılan olarak tüm modüller aktif
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModulesContext.Provider value={{ modules, loading, reloadModules: loadModules }}>
            {children}
        </ModulesContext.Provider>
    );
};
