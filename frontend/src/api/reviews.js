import api from './axios';

export const reviewsAPI = {
    addReview: (projectId, data) => api.post(`/reviews/projects/${projectId}`, data),
    getProjectReviews: (projectId) => api.get(`/reviews/projects/${projectId}`)
};

