import apiClient from './apiClient';

export const adminService = {
  createUser: async (userData: {
    name: string;
    email: string;
    role: string;
    password: string;
    department?: string;
  }) => {
    const response = await apiClient.post('/api/admin/users', userData);
    return response.data;
  },

  bulkCreateUsers: async (formData: FormData) => {
    const response = await apiClient.post('/api/admin/users/bulk', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  createCourse: async (courseData: {
    courseCode: string;
    courseName: string;
    semester: string;
    department: string;
    professorId: string;
  }) => {
    const response = await apiClient.post('/api/admin/course', courseData);
    return response.data;
  },

  enrollStudent: async (courseId: string, studentId: string) => {
    const response = await apiClient.post('/api/admin/course/enroll', { courseId, studentId });
    return response.data;
  },

  dropStudent: async (courseId: string, studentId: string) => {
    const response = await apiClient.post('/api/admin/course/drop', { courseId, studentId });
    return response.data;
  },
};
