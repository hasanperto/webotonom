import axios from './axios';

const I18N_API = '/i18n';

export const getLanguages = async () => {
    try {
        const { data } = await axios.get(`${I18N_API}/languages`);
        return data;
    } catch (error) {
        console.error('Error fetching languages:', error);
        throw error;
    }
};

export const getTranslations = async (lang = 'tr', group = null) => {
    try {
        const params = { lang };
        if (group) params.group = group;
        const { data } = await axios.get(`${I18N_API}/translations`, { params });
        return data;
    } catch (error) {
        console.error('Error fetching translations:', error);
        throw error;
    }
};

export const saveTranslation = async (language_code, key, value, group = 'general') => {
    try {
        const { data } = await axios.post(`${I18N_API}/translations`, {
            language_code,
            key,
            value,
            group
        });
        return data;
    } catch (error) {
        console.error('Error saving translation:', error);
        throw error;
    }
};

export const getContentTranslation = async (contentId, contentType = 'project', lang = 'tr') => {
    try {
        const { data } = await axios.get(`${I18N_API}/content/${contentId}`, {
            params: { lang, type: contentType }
        });
        return data;
    } catch (error) {
        console.error('Error fetching content translation:', error);
        throw error;
    }
};

export const translateText = async (text, sourceLang = 'tr', targetLang = 'en') => {
    try {
        const { data } = await axios.post(`${I18N_API}/translate`, {
            text,
            sourceLang,
            targetLang
        });
        return data;
    } catch (error) {
        console.error('Error translating text:', error);
        throw error;
    }
};

export const updateUserLanguage = async (language_code) => {
    try {
        const { data } = await axios.put(`${I18N_API}/users/language`, { language_code });
        return data;
    } catch (error) {
        console.error('Error updating user language:', error);
        throw error;
    }
};

export const getUserLanguage = async () => {
    try {
        const { data } = await axios.get(`${I18N_API}/users/language`);
        return data;
    } catch (error) {
        console.error('Error fetching user language:', error);
        return { language_code: 'tr' };
    }
};

