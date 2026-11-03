import axios from 'axios';
import { API_URL } from '../config';

// Cliente axios para los módulos SIG (Perfil de Puesto, Áreas, Puestos, Personal y Documentos)
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Agrega el token del login a todas las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
