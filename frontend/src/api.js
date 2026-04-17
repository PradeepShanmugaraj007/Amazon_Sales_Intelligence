const API_BASE_URL = 'http://192.168.1.5:5000/api';

const api = {
  get: async (url) => {
    const response = await fetch(`${API_BASE_URL}${url}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to GET ${url}`);
    }
    return response.json(); 
  },
  post: async (url, body, isFormData = false) => {
    const options = {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body),
    };
    if (!isFormData) {
      options.headers = { 'Content-Type': 'application/json' };
    }
    const response = await fetch(`${API_BASE_URL}${url}`, options);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to POST ${url}`);
    }
    return response.json();
  }
};

export const analyzeReport = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/analyze', formData, true);
};

export const checkHealth = async () => {
  return api.get('/health');
};

export default api;
