import { deleteSignedInAgentAuthToken, getSignedInAgentAuthToken, setSignedInAgentAuthToken } from '../agent/utils';
import axios from 'axios'
// Axios that uses interceptors to handle authentication - should be used on all auth endpoints
export const authorizedAxios = axios.create();

// Include auth token in requests
authorizedAxios.interceptors.request.use(config => {
  const authToken = getSignedInAgentAuthToken();
  if (authToken) {
    config.headers = { ...config.headers, 'Authorization': authToken }
  }
  return config;
}, err => {
  Promise.reject(err)
});

// Set auth token if found in request
authorizedAxios.interceptors.response.use(res => {
  const authToken = res.headers["authorization"];
  if (authToken) {
    setSignedInAgentAuthToken(authToken)
  }
  return res
}, err => {
  // Handle case where auth/refresh token is invalid (delete from local storage)
  if (err.response.status === 401) {
    deleteSignedInAgentAuthToken()
  }
  return Promise.reject(err);
});