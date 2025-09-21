const API_BASE_URL = '/api'; // URL для прокси в webpack

async function request(endpoint, method = 'GET', data = null) {
  const config = {
    method,
    credentials: 'include', // Добавляем эту строку для отправки cookies
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: response.statusText }));
      throw errorData; // Pass the full error object
    }

    if (response.status === 204) {
      return null; // No content to parse
    }

    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

export const api = {
  get: (endpoint) => request(endpoint, 'GET'),
  post: (endpoint, data) => request(endpoint, 'POST', data),
  put: (endpoint, data) => request(endpoint, 'PUT', data),
  delete: (endpoint) => request(endpoint, 'DELETE'),
};
