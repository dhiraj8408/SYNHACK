import apiClient from './apiClient';

export const courseService = {
  getMyCourses: async () => {
    const response = await apiClient.get('/api/courses/:');
    return response.data;
  },

  getCourseDetails: async (courseId: string) => {
    const response = await apiClient.get(`/api/courses/${courseId}`);
    return response.data;
  },
};
