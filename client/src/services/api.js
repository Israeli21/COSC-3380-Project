import axios from 'axios';

<<<<<<< HEAD
const API_BASE_URL = 'http://localhost:5001/api';
=======
const API_BASE_URL = process.env.REACT_APP_API_URL + '/api'; // <- dynamically from .env
>>>>>>> 4cbf8c7 (Save current progress)

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const testConnection = async () => {
  try {
    const response = await api.get('/test');
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const testDatabase = async () => {
  try {
    const response = await api.get('/db-test');
    return response.data;
  } catch (error) {
    console.error('Database Error:', error);
    throw error;
  }
};

export default api;