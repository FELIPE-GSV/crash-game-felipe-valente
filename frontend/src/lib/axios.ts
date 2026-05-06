import axios from 'axios';
import keycloak from './keycloak';

export const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use(async (config) => {
  if (keycloak.token) {
    await keycloak.updateToken(30).catch(() => keycloak.login());
    config.headers.Authorization = `Bearer ${keycloak.token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) keycloak.login();
    return Promise.reject(err);
  },
);
