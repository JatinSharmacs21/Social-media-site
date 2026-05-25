// import axios from "axios";

// const API = axios.create({
//       baseURL: "http://localhost:5000",
//       baseURL: process.env.REACT_APP_API_URL,
// });

// API.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");

//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }

//   return config;
// });

// export default API;


import axios from "axios";
import { API_BASE_URL } from "../config/env";

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("user");
      localStorage.removeItem("username");
    }

    return Promise.reject(error);
  }
);

export default API;