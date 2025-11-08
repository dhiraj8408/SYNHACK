import apiClient from "./apiClient";

export const listMaterials = async (token, courseId) => {
  const r = await apiClient.get(`/materials?courseId=${courseId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.data;
};

export const addMaterial = async (token, payload) => {
  const r = await apiClient.post("/materials", payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.data;
};

export const deleteMaterial = async (token, id) => {
  const r = await apiClient.delete(`/materials/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.data;
};
