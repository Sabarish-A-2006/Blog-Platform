import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';
export const api = axios.create({ baseURL, withCredentials: true, headers: { 'Content-Type': 'application/json' } });

let csrfToken = '';
let csrfRequest;

api.interceptors.request.use(async config => {
  const mutating = ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase());
  if (mutating && !config.url?.endsWith('/auth/csrf')) {
    if (!csrfToken) {
      csrfRequest ||= axios.get(`${baseURL}/auth/csrf`, { withCredentials: true }).then(response => {
        csrfToken = response.data.csrfToken;
        return csrfToken;
      }).finally(() => { csrfRequest = undefined; });
      await csrfRequest;
    }
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

export const errorMessage = error => {
  const serverMessage = error?.response?.data?.message;
  if (serverMessage) return serverMessage;
  if (!error?.response || typeof error.response.data === 'string') return 'BlogSphere could not reach the API. Check that the server and MongoDB are running, then try again.';
  return 'Something went wrong. Please try again.';
};
