const API_BASE = import.meta.env.VITE_API_BASE || '';

export const apiClient = {
  async get(endpoint) {
    const res = await fetch(`${API_BASE}${endpoint}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API Request failed');
    return data;
  },
  
  async post(endpoint, body) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
  }
};

export const api = {
  shorten: (payload) => apiClient.post('/shorten', payload),
  stats: () => apiClient.get('/api/stats'),
  auth: {
    login: (credentials) => apiClient.post('/api/auth/login', credentials),
    signup: (credentials) => apiClient.post('/api/auth/signup', credentials),
  }
};
