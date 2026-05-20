import axios from './axios';

const SECTIONS_API = '/sections';

export const getSections = async (lang = 'tr') => {
  try {
    const { data } = await axios.get(SECTIONS_API, { params: { lang } });
    return data;
  } catch (error) {
    console.error('Error fetching sections:', error);
    throw error;
  }
};

export const updateSectionOrder = async (sections) => {
  try {
    const { data } = await axios.put(`${SECTIONS_API}/order`, { sections });
    return data;
  } catch (error) {
    console.error('Error updating section order:', error);
    throw error;
  }
};

export const toggleSection = async (sectionId, isActive) => {
  try {
    const { data } = await axios.patch(`${SECTIONS_API}/${sectionId}`, { 
      isActive 
    });
    return data;
  } catch (error) {
    console.error('Error toggling section:', error);
    throw error;
  }
};

export const updateSection = async (sectionId, updates) => {
  try {
    const { data } = await axios.put(`${SECTIONS_API}/${sectionId}`, updates);
    return data;
  } catch (error) {
    console.error('Error updating section:', error);
    throw error;
  }
};

// Hero Slides API
export const getHeroSlides = async (lang = 'tr') => {
  try {
    const { data } = await axios.get(`${SECTIONS_API}/hero/slides`, { params: { lang } });
    return data.slides || [];
  } catch (error) {
    console.error('Error fetching hero slides:', error);
    throw error;
  }
};

export const createHeroSlide = async (slideData) => {
  try {
    const formData = new FormData();
    Object.keys(slideData).forEach(key => {
      if (key === 'image' && slideData[key] instanceof File) {
        formData.append('image', slideData[key]);
      } else if (slideData[key] !== null && slideData[key] !== undefined) {
        formData.append(key, slideData[key]);
      }
    });
    const { data } = await axios.post(`${SECTIONS_API}/hero/slides`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  } catch (error) {
    console.error('Error creating hero slide:', error);
    throw error;
  }
};

export const updateHeroSlide = async (slideId, slideData) => {
  try {
    const formData = new FormData();
    Object.keys(slideData).forEach(key => {
      if (key === 'image' && slideData[key] instanceof File) {
        formData.append('image', slideData[key]);
      } else if (slideData[key] !== null && slideData[key] !== undefined) {
        formData.append(key, slideData[key]);
      }
    });
    const { data } = await axios.put(`${SECTIONS_API}/hero/slides/${slideId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  } catch (error) {
    console.error('Error updating hero slide:', error);
    throw error;
  }
};

export const deleteHeroSlide = async (slideId) => {
  try {
    const { data } = await axios.delete(`${SECTIONS_API}/hero/slides/${slideId}`);
    return data;
  } catch (error) {
    console.error('Error deleting hero slide:', error);
    throw error;
  }
};

export const updateHeroSlideOrder = async (slides) => {
  try {
    const { data } = await axios.put(`${SECTIONS_API}/hero/slides/order`, { slides });
    return data;
  } catch (error) {
    console.error('Error updating hero slide order:', error);
    throw error;
  }
};

export const updateHeroSlideStatus = async (slideId, status) => {
  try {
    const { data } = await axios.patch(`${SECTIONS_API}/hero/slides/${slideId}/status`, { status });
    return data;
  } catch (error) {
    console.error('Error updating hero slide status:', error);
    throw error;
  }
};

// Projects Section Settings API
export const getProjectsSectionSettings = async () => {
  try {
    const { data } = await axios.get(`${SECTIONS_API}/projects/settings`);
    return data.settings || null;
  } catch (error) {
    console.error('Error fetching projects section settings:', error);
    throw error;
  }
};

export const updateProjectsSectionSettings = async (settings) => {
  try {
    const { data } = await axios.put(`${SECTIONS_API}/projects/settings`, settings);
    return data;
  } catch (error) {
    console.error('Error updating projects section settings:', error);
    throw error;
  }
};

export const getProjectsCategories = async () => {
  try {
    const { data } = await axios.get(`${SECTIONS_API}/projects/categories`);
    return data.categories || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const getProjectsList = async (params = {}) => {
  try {
    const { data } = await axios.get(`${SECTIONS_API}/projects/list`, { params });
    return data.projects || [];
  } catch (error) {
    console.error('Error fetching projects list:', error);
    throw error;
  }
};

// Features Items API
export const getFeaturesItems = async (lang = 'tr') => {
  try {
    const { data } = await axios.get(`${SECTIONS_API}/features/items`, { params: { lang } });
    return data.items || [];
  } catch (error) {
    console.error('Error fetching features items:', error);
    throw error;
  }
};

export const createFeaturesItem = async (itemData) => {
  try {
    // Eğer zaten FormData ise direkt kullan
    const formData = itemData instanceof FormData ? itemData : new FormData();
    
    if (!(itemData instanceof FormData)) {
      Object.keys(itemData).forEach(key => {
        if (key === 'image' && itemData[key] instanceof File) {
          formData.append('image', itemData[key]);
        } else if (itemData[key] !== null && itemData[key] !== undefined) {
          formData.append(key, itemData[key]);
        }
      });
    }
    
    const { data } = await axios.post(`${SECTIONS_API}/features/items`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  } catch (error) {
    console.error('Error creating feature item:', error);
    throw error;
  }
};

export const updateFeaturesItem = async (itemId, itemData) => {
  try {
    // Eğer zaten FormData ise direkt kullan
    const formData = itemData instanceof FormData ? itemData : new FormData();
    
    if (!(itemData instanceof FormData)) {
      Object.keys(itemData).forEach(key => {
        if (key === 'image' && itemData[key] instanceof File) {
          formData.append('image', itemData[key]);
        } else if (itemData[key] !== null && itemData[key] !== undefined) {
          formData.append(key, itemData[key]);
        }
      });
    }
    
    const { data } = await axios.put(`${SECTIONS_API}/features/items/${itemId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  } catch (error) {
    console.error('Error updating feature item:', error);
    throw error;
  }
};

export const deleteFeaturesItem = async (itemId) => {
  try {
    const { data } = await axios.delete(`${SECTIONS_API}/features/items/${itemId}`);
    return data;
  } catch (error) {
    console.error('Error deleting feature item:', error);
    throw error;
  }
};

export const updateFeaturesItemsOrder = async (items) => {
  try {
    const { data } = await axios.put(`${SECTIONS_API}/features/items/order`, { items });
    return data;
  } catch (error) {
    console.error('Error updating features items order:', error);
    throw error;
  }
};

export const updateFeaturesItemStatus = async (itemId, status) => {
  try {
    const { data } = await axios.patch(`${SECTIONS_API}/features/items/${itemId}/status`, { status });
    return data;
  } catch (error) {
    console.error('Error updating feature item status:', error);
    throw error;
  }
};

// Stats Items API
export const getStatsItems = async (lang = 'tr') => {
  try {
    const { data } = await axios.get(`${SECTIONS_API}/stats/items`, { params: { lang } });
    return data.items || [];
  } catch (error) {
    console.error('Error fetching stats items:', error);
    throw error;
  }
};

export const createStatsItem = async (itemData) => {
  try {
    const { data } = await axios.post(`${SECTIONS_API}/stats/items`, itemData);
    return data;
  } catch (error) {
    console.error('Error creating stat item:', error);
    throw error;
  }
};

export const updateStatsItem = async (itemId, itemData) => {
  try {
    const { data } = await axios.put(`${SECTIONS_API}/stats/items/${itemId}`, itemData);
    return data;
  } catch (error) {
    console.error('Error updating stat item:', error);
    throw error;
  }
};

export const deleteStatsItem = async (itemId) => {
  try {
    const { data } = await axios.delete(`${SECTIONS_API}/stats/items/${itemId}`);
    return data;
  } catch (error) {
    console.error('Error deleting stat item:', error);
    throw error;
  }
};

export const updateStatsItemsOrder = async (items) => {
  try {
    const { data } = await axios.put(`${SECTIONS_API}/stats/items/order`, { items });
    return data;
  } catch (error) {
    console.error('Error updating stats items order:', error);
    throw error;
  }
};

export const updateStatsItemStatus = async (itemId, status) => {
  try {
    const { data } = await axios.patch(`${SECTIONS_API}/stats/items/${itemId}/status`, { status });
    return data;
  } catch (error) {
    console.error('Error updating stat item status:', error);
    throw error;
  }
};

// FAQ Items API
export const getFAQItems = async (lang = 'tr') => {
  try {
    const { data } = await axios.get(`${SECTIONS_API}/faq/items`, { params: { lang } });
    return data.items || [];
  } catch (error) {
    console.error('Error fetching FAQ items:', error);
    throw error;
  }
};

export const createFAQItem = async (itemData) => {
  try {
    const payload = {
      question: itemData.question || '',
      answer: itemData.answer || '',
      category: itemData.category || '',
      status: itemData.status || 'active',
      translations: itemData.translations 
        ? (typeof itemData.translations === 'string' 
            ? itemData.translations 
            : JSON.stringify(itemData.translations))
        : null
    };
    
    const { data } = await axios.post(`${SECTIONS_API}/faq/items`, payload);
    return data;
  } catch (error) {
    console.error('Error creating FAQ item:', error);
    throw error;
  }
};

export const updateFAQItem = async (itemId, itemData) => {
  try {
    const payload = {
      question: itemData.question || '',
      answer: itemData.answer || '',
      category: itemData.category || '',
      status: itemData.status || 'active',
      translations: itemData.translations 
        ? (typeof itemData.translations === 'string' 
            ? itemData.translations 
            : JSON.stringify(itemData.translations))
        : null
    };
    
    const { data } = await axios.put(`${SECTIONS_API}/faq/items/${itemId}`, payload);
    return data;
  } catch (error) {
    console.error('Error updating FAQ item:', error);
    throw error;
  }
};

export const deleteFAQItem = async (itemId) => {
  try {
    const { data } = await axios.delete(`${SECTIONS_API}/faq/items/${itemId}`);
    return data;
  } catch (error) {
    console.error('Error deleting FAQ item:', error);
    throw error;
  }
};

export const updateFAQItemsOrder = async (items) => {
  try {
    const { data } = await axios.put(`${SECTIONS_API}/faq/items/order`, { items });
    return data;
  } catch (error) {
    console.error('Error updating FAQ items order:', error);
    throw error;
  }
};

export const updateFAQItemStatus = async (itemId, status) => {
  try {
    const { data } = await axios.patch(`${SECTIONS_API}/faq/items/${itemId}/status`, { status });
    return data;
  } catch (error) {
    console.error('Error updating FAQ item status:', error);
    throw error;
  }
};

// About Items API
export const getAboutItems = async (lang = 'tr') => {
  try {
    const { data } = await axios.get(`${SECTIONS_API}/about/items`, { params: { lang } });
    return data.items || [];
  } catch (error) {
    console.error('Error fetching about items:', error);
    throw error;
  }
};

export const createAboutItem = async (itemData) => {
  try {
    const payload = {
      text: itemData.text || '',
      icon: itemData.icon || 'FiCheckCircle',
      status: itemData.status || 'active',
      translations: itemData.translations 
        ? (typeof itemData.translations === 'string' 
            ? itemData.translations 
            : JSON.stringify(itemData.translations))
        : null
    };
    
    const { data } = await axios.post(`${SECTIONS_API}/about/items`, payload);
    return data;
  } catch (error) {
    console.error('Error creating about item:', error);
    throw error;
  }
};

export const updateAboutItem = async (itemId, itemData) => {
  try {
    const payload = {
      text: itemData.text || '',
      icon: itemData.icon || 'FiCheckCircle',
      status: itemData.status || 'active',
      translations: itemData.translations 
        ? (typeof itemData.translations === 'string' 
            ? itemData.translations 
            : JSON.stringify(itemData.translations))
        : null
    };
    
    const { data } = await axios.put(`${SECTIONS_API}/about/items/${itemId}`, payload);
    return data;
  } catch (error) {
    console.error('Error updating about item:', error);
    throw error;
  }
};

export const deleteAboutItem = async (itemId) => {
  try {
    const { data } = await axios.delete(`${SECTIONS_API}/about/items/${itemId}`);
    return data;
  } catch (error) {
    console.error('Error deleting about item:', error);
    throw error;
  }
};

export const updateAboutItemsOrder = async (items) => {
  try {
    const { data } = await axios.put(`${SECTIONS_API}/about/items/order`, { items });
    return data;
  } catch (error) {
    console.error('Error updating about items order:', error);
    throw error;
  }
};

export const updateAboutItemStatus = async (itemId, status) => {
  try {
    const { data } = await axios.patch(`${SECTIONS_API}/about/items/${itemId}/status`, { status });
    return data;
  } catch (error) {
    console.error('Error updating about item status:', error);
    throw error;
  }
};

// Testimonials Items API
export const getTestimonialsItems = async (lang = 'tr') => {
  try {
    const { data } = await axios.get(`${SECTIONS_API}/testimonials/items`, { params: { lang } });
    return data.items || [];
  } catch (error) {
    console.error('Error fetching testimonials items:', error);
    throw error;
  }
};

export const createTestimonialItem = async (itemData) => {
  try {
    const payload = {
      name: itemData.name || '',
      role: itemData.role || '',
      comment: itemData.comment || '',
      company: itemData.company || '',
      rating: itemData.rating || 5,
      avatar: itemData.avatar || '',
      status: itemData.status || 'active',
      translations: itemData.translations 
        ? (typeof itemData.translations === 'string' 
            ? itemData.translations 
            : JSON.stringify(itemData.translations))
        : null
    };
    
    const { data } = await axios.post(`${SECTIONS_API}/testimonials/items`, payload);
    return data;
  } catch (error) {
    console.error('Error creating testimonial item:', error);
    throw error;
  }
};

export const updateTestimonialItem = async (itemId, itemData) => {
  try {
    const payload = {
      name: itemData.name || '',
      role: itemData.role || '',
      comment: itemData.comment || '',
      company: itemData.company || '',
      rating: itemData.rating || 5,
      avatar: itemData.avatar || '',
      status: itemData.status || 'active',
      translations: itemData.translations 
        ? (typeof itemData.translations === 'string' 
            ? itemData.translations 
            : JSON.stringify(itemData.translations))
        : null
    };
    
    const { data } = await axios.put(`${SECTIONS_API}/testimonials/items/${itemId}`, payload);
    return data;
  } catch (error) {
    console.error('Error updating testimonial item:', error);
    throw error;
  }
};

export const deleteTestimonialItem = async (itemId) => {
  try {
    const { data } = await axios.delete(`${SECTIONS_API}/testimonials/items/${itemId}`);
    return data;
  } catch (error) {
    console.error('Error deleting testimonial item:', error);
    throw error;
  }
};

export const updateTestimonialsItemsOrder = async (items) => {
  try {
    const { data } = await axios.put(`${SECTIONS_API}/testimonials/items/order`, { items });
    return data;
  } catch (error) {
    console.error('Error updating testimonials items order:', error);
    throw error;
  }
};

export const updateTestimonialItemStatus = async (itemId, status) => {
  try {
    const { data } = await axios.patch(`${SECTIONS_API}/testimonials/items/${itemId}/status`, { status });
    return data;
  } catch (error) {
    console.error('Error updating testimonial item status:', error);
    throw error;
  }
};

// Testimonials Settings API
export const getTestimonialsSettings = async () => {
  try {
    const { data } = await axios.get(`${SECTIONS_API}/testimonials/settings`);
    return data;
  } catch (error) {
    console.error('Error fetching testimonials settings:', error);
    throw error;
  }
};

export const updateTestimonialsSettings = async (settings) => {
  try {
    const { data } = await axios.put(`${SECTIONS_API}/testimonials/settings`, settings);
    return data;
  } catch (error) {
    console.error('Error updating testimonials settings:', error);
    throw error;
  }
};

// Sponsors API
export const getSponsorsList = async () => {
  try {
    const { data } = await axios.get(`${SECTIONS_API}/sponsors/list`);
    return data.sponsors || [];
  } catch (error) {
    console.error('Error fetching sponsors:', error);
    throw error;
  }
};

// References API
export const getReferencesList = async () => {
  try {
    const { data } = await axios.get(`${SECTIONS_API}/references/list`);
    return data.references || [];
  } catch (error) {
    console.error('Error fetching references:', error);
    throw error;
  }
};

