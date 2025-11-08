import apiClient from "./apiClient";

export const loginService = async (email, password) => {
  const response = await apiClient.post("/auth/login", { email, password });
  return response.data;
};

export const signupService = async (form) => {
  const response = await apiClient.post("/auth/signup", form);
  return response.data;
};

export const fetchMeService = async (token) => {
  const response = await apiClient.get("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
