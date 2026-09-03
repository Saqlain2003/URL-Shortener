const API_BASE = import.meta.env.VITE_API_BASE || '';

const getHeaders = (hasBody = true) => {
  const headers = {};
  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const apiClient = {
  async get(endpoint) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: getHeaders(false),
    });
    let data;
    try {
      data = await res.json();
    } catch (e) {
      throw new Error(`Server returned invalid response (Status: ${res.status})`);
    }
    if (!res.ok) throw new Error(data.error || 'API Request failed');
    return data;
  },
  
  async post(endpoint, body) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(body)
    });
    
    let data;
    try {
      data = await res.json();
    } catch (e) {
      throw new Error(`Server returned invalid response (Status: ${res.status})`);
    }
    
    if (!res.ok) throw new Error(data.error || 'API Request failed');
    return data;
  },

  async put(endpoint, body) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(body)
    });

    let data;
    try {
      data = await res.json();
    } catch (e) {
      throw new Error(`Server returned invalid response (Status: ${res.status})`);
    }

    if (!res.ok) throw new Error(data.error || 'API Request failed');
    return data;
  },

  async delete(endpoint) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(false)
    });

    let data;
    try {
      data = await res.json();
    } catch (e) {
      throw new Error(`Server returned invalid response (Status: ${res.status})`);
    }

    if (!res.ok) throw new Error(data.error || 'API Request failed');
    return data;
  }
};

export const api = {
  shorten: (payload) => apiClient.post('/shorten', payload),
  stats: () => apiClient.get('/api/stats'),
  auth: {
    login: (credentials) => apiClient.post('/api/auth/login', credentials),
    signup: (credentials) => apiClient.post('/api/auth/signup', credentials),
  },
  urls: {
    getMyUrls: () => apiClient.get('/api/urls/my'),
    create: (payload) => apiClient.post('/shorten', payload),
    update: (shortCode, payload) => apiClient.put(`/urls/${shortCode}`, payload),
    delete: (shortCode) => apiClient.delete(`/urls/${shortCode}`),
    getQr: (shortCode) => apiClient.get(`/api/qr/${shortCode}`),
    getQrDownloadUrl: (shortCode) => `${API_BASE}/api/qr/${shortCode}/download`,
    getAnalytics: (shortCode) => apiClient.get(`/api/analytics/${shortCode}`),
    getTimeSeries: (shortCode, days = 7) => apiClient.get(`/api/analytics/${shortCode}/timeseries?days=${days}`),
  }
};
