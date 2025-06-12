import api from './api';

export const getMine = () => api.get('/api/referrals/mine');
export const getAll = () => api.get('/api/referrals/admin');
export const getById = (id) => api.get(`/api/referrals/admin/${id}`);
