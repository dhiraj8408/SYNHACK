import apiClient from './apiClient';

export const progressService = {
  getProgress: async (courseId: string) => {
    const response = await apiClient.get(`/api/progress/course/${courseId}`);
    return response.data;
  },

  markModuleComplete: async (courseId: string, module: string) => {
    const response = await apiClient.post('/api/progress/complete', {
      courseId,
      module,
    });
    return response.data;
  },

  markModuleIncomplete: async (courseId: string, module: string) => {
    const response = await apiClient.post('/api/progress/incomplete', {
      courseId,
      module,
    });
    return response.data;
  },
};

