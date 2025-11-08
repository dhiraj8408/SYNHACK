import apiClient from "./apiClient";

export const listUsersService = async (token) => {
  const r = await apiClient.get("/admin/users", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.data;
};

export const createUserService = async (payload, token) => {
  const r = await apiClient.post("/admin/users", payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.data;
};

export const bulkCreateUsersService = async (csv, token) => {
  const r = await apiClient.post("/admin/users/bulk", { csv }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.data;
};

export const createCourseService = async (payload, token) => {
  const r = await apiClient.post("/admin/course", payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.data;
};
