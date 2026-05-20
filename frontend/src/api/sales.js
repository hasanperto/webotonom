import axios from './axios';

const SALES_API = '/sales';

export const getProducts = async (params = {}) => {
    try {
        const { data } = await axios.get(`${SALES_API}/products`, { params });
        return data;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
};

export const getProduct = async (id) => {
    try {
        const { data } = await axios.get(`${SALES_API}/products/${id}`);
        return data;
    } catch (error) {
        console.error('Error fetching product:', error);
        throw error;
    }
};

export const submitQuoteRequest = async (quoteData) => {
    try {
        const { data } = await axios.post(`${SALES_API}/quote-request`, quoteData);
        return data;
    } catch (error) {
        console.error('Error submitting quote request:', error);
        throw error;
    }
};

export const submitDemoRequest = async (demoData) => {
    try {
        const { data } = await axios.post(`${SALES_API}/demo-request`, demoData);
        return data;
    } catch (error) {
        console.error('Error submitting demo request:', error);
        throw error;
    }
};

export const getOrders = async () => {
    try {
        const { data } = await axios.get(`${SALES_API}/orders`);
        return data;
    } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
    }
};

export const getOrder = async (id) => {
    try {
        const { data } = await axios.get(`${SALES_API}/orders/${id}`);
        return data;
    } catch (error) {
        console.error('Error fetching order:', error);
        throw error;
    }
};

export const getSalesStats = async () => {
    try {
        const { data } = await axios.get(`${SALES_API}/stats`);
        return data;
    } catch (error) {
        console.error('Error fetching sales stats:', error);
        throw error;
    }
};

export const getRecommendedProducts = async () => {
    try {
        const { data } = await axios.get(`${SALES_API}/recommended`);
        return data;
    } catch (error) {
        console.error('Error fetching recommended products:', error);
        throw error;
    }
};

