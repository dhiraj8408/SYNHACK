import apiClient from './apiClient';

export const materialService = {
  uploadMaterial: async (formData: FormData) => {
    const response = await apiClient.post('/api/materials', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getCourseMaterials: async (courseId: string) => {
    const response = await apiClient.get(`/api/materials/${courseId}`);
    return response.data;
  },
};
