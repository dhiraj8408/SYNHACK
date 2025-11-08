import apiClient from "./apiClient";

export const getCoursesService = async (token) => {
  const r = await apiClient.get("/courses", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.data;
};

export const getCourseByIdService = async (token, id) => {
  const r = await apiClient.get(`/courses/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.data;
};
