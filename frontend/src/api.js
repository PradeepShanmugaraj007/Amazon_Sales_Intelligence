import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const apiInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization and Cache-Busting automatically
apiInstance.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('siq_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Cache Buster for reliability
  config.params = { ...config.params, _t: Date.now() };
  return config;
}, (error) => {
  return Promise.reject(error);
});

/**
 * Standard upload function using Axios
 * maps to the /api/analyze endpoint
 */
export const uploadFile = async (files, onProgress) => {
  const formData = new FormData();
  
  if (Array.isArray(files)) {
    files.forEach(file => {
      formData.append('files', file);
    });
  } else {
    formData.append('files', files);
  }
  
  const response = await apiInstance.post('/analyze/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    }
  });
  return response.data;
};

/**
 * Placeholders for specific data slices
 * These assume future backend expansions for targeted data retrieval
 */
export const getSummary = async () => {
    // For now, these use specific sub-routes if they exist
    const response = await apiInstance.get('/summary');
    return response.data;
};

export const getTrends = async () => {
    const response = await apiInstance.get('/trends');
    return response.data;
};

export const getFraudData = async () => {
    const response = await apiInstance.get('/fraud');
    return response.data;
};

export const getForecast = async () => {
    const response = await apiInstance.get('/forecast');
    return response.data;
};

// ── Backward Compatibility ──────────────────────────────────────────────────
// Keeps the dashboard running without break
export const analyzeReport = uploadFile;

export const checkHealth = async () => {
  const response = await apiInstance.get('/health');
  return response.data;
};

export default apiInstance;
