import axios from 'axios';


export const api = axios.create({
  baseURL: 'https://a2zkwt.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  console.log(
    'AXIOS REQUEST →',
    config.method?.toUpperCase(),
    config.baseURL ? config.baseURL + config.url : config.url
  );
  return config;
});