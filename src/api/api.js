import axios from 'axios';

// TODO: Change this to your server's IP address and port
// Example: 'http://192.168.1.100:8000/api'
// Find your IP with: ipconfig (Windows) or ifconfig (Mac/Linux)
const BASE_URL = 'http://192.168.1.9:8000/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'Network error. Please check your connection.';
    console.error('[API Error]', message);
    return Promise.reject(new Error(message));
  }
);

// ─── Categories ───────────────────────────────────────────────────────────────

export const getCategories = () => apiClient.get('/categories/');

// ─── Menu Items ───────────────────────────────────────────────────────────────

export const getMenuItems = (categoryId) => {
  const params = categoryId ? { category: categoryId } : {};
  return apiClient.get('/menu-items/', { params });
};

export const getMenuItemsGrouped = () => apiClient.get('/menu-items/grouped/');

export const createMenuItem = (data) => apiClient.post('/menu-items/', data);

export const updateMenuItem = (id, data) => apiClient.put(`/menu-items/${id}/`, data);

export const deleteMenuItem = (id) => apiClient.delete(`/menu-items/${id}/`);

// ─── Tables ───────────────────────────────────────────────────────────────────

export const getTables = () => apiClient.get('/tables/');

export const createTable = (data) => apiClient.post('/tables/', data);

export const updateTable = (id, data) => apiClient.put(`/tables/${id}/`, data);

// ─── Customers ────────────────────────────────────────────────────────────────

export const getCustomers = () => apiClient.get('/customers/');

export const createCustomer = (data) => apiClient.post('/customers/', data);

export const searchCustomers = (query) =>
  apiClient.get('/customers/', { params: { search: query } });

// ─── Orders ───────────────────────────────────────────────────────────────────

export const getOrders = (params = {}) => apiClient.get('/orders/', { params });

export const getActiveOrders = () =>
  apiClient.get('/orders/', { params: { status: 'active' } });

export const getOrder = (id) => apiClient.get(`/orders/${id}/`);

export const createOrder = (data) => apiClient.post('/orders/', data);

export const updateOrder = (id, data) => apiClient.put(`/orders/${id}/`, data);

// ─── KOT ──────────────────────────────────────────────────────────────────────

export const generateKOT = (orderId) =>
  apiClient.post(`/orders/${orderId}/generate_kot/`);

// ─── Hold ─────────────────────────────────────────────────────────────────────

export const holdOrder = (orderId) =>
  apiClient.post(`/orders/${orderId}/hold/`);

// ─── Bills ────────────────────────────────────────────────────────────────────

export const generateBill = (orderId, data = {}) =>
  apiClient.post(`/orders/${orderId}/generate_bill/`, data);

export const getBills = () => apiClient.get('/bills/');
export const getBill  = (id) => apiClient.get(`/bills/${id}/`);
export const updateBill = (id, data) => apiClient.put(`/bills/${id}/`, data);
export const getTodayReport = () => apiClient.get('/bills/today_report/');

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const getDashboard = () => apiClient.get('/dashboard/');

// ─── Settings / Management ────────────────────────────────────────────────────

export const deleteCategory = (id) => apiClient.delete(`/categories/${id}/`);
export const createCategory = (data) => apiClient.post('/categories/', data);
export const patchMenuItem = (id, data) => apiClient.patch(`/menu-items/${id}/`, data);
export const deleteTable = (id) => apiClient.delete(`/tables/${id}/`);
export const clearAllData = () => apiClient.post('/clear-data/');

export default apiClient;







