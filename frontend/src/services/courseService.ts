import apiClient from './apiClient';

export const courseService = {

  // ✅ Matches listCourses (GET /api/courses/)
  getAllCourses: async () => {
    const response = await apiClient.get('/api/courses/');
    return response.data;
  },

  // ✅ Matches getCourseById (GET /api/courses/:id)
  getCourseDetails: async (courseId: string) => {
    const response = await apiClient.get(`/api/courses/${courseId}`);
    return response.data;
  },

  // ✅ Matches getCoursesByStudent (GET /api/courses/student/:studentId)
  getCoursesByStudent: async (studentId: string) => {
    const response = await apiClient.get(`/api/courses/student/${studentId}`);
    return response.data;
  },

  // ✅ Matches getCoursesByProfessor (GET /api/courses/professor/:professorId)
  getCoursesByProfessor: async (professorId: string) => {
    const response = await apiClient.get(`/api/courses/professor/${professorId}`);
    return response.data;
  },

};
