import apiClient from './apiClient';

export const adminService = {
  // User management
  getUsers: async (params?: { role?: string; search?: string }) => {
    const response = await apiClient.get('/api/admin/users', { params });
    return response.data;
  },

  getUserById: async (userId: string) => {
    const response = await apiClient.get(`/api/admin/users/${userId}`);
    return response.data;
  },

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

  updateUser: async (userId: string, userData: {
    name?: string;
    email?: string;
    role?: string;
    department?: string;
  }) => {
    const response = await apiClient.put(`/api/admin/users/${userId}`, userData);
    return response.data;
  },

  resetPassword: async (userId: string, password: string) => {
    const response = await apiClient.post(`/api/admin/users/${userId}/reset-password`, { password });
    return response.data;
  },

  toggleUserStatus: async (userId: string) => {
    const response = await apiClient.patch(`/api/admin/users/${userId}/toggle-status`);
    return response.data;
  },

  // Course management
  createCourse: async (
    courseData: {
      courseCode: string;
      courseName: string;
      semester: string;
      department: string;
      professorEmail: string;
    },
    studentsFile?: File | null
  ) => {
    if (studentsFile) {
      const formData = new FormData();
      formData.append('courseCode', courseData.courseCode);
      formData.append('courseName', courseData.courseName);
      formData.append('semester', courseData.semester);
      formData.append('department', courseData.department);
      formData.append('professorEmail', courseData.professorEmail);
      formData.append('studentsFile', studentsFile);
      const response = await apiClient.post('/api/admin/course', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } else {
      const response = await apiClient.post('/api/admin/course', courseData);
      return response.data;
    }
  },

  getCourses: async () => {
    const response = await apiClient.get('/api/courses');
    return response.data;
  },

  enrollStudentsByEmail: async (courseId: string, studentEmails: string[]) => {
    const response = await apiClient.post('/api/admin/course/enroll-by-email', {
      courseId,
      studentEmails,
    });
    return response.data;
  },

  enrollStudentsFromCSV: async (courseId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('courseId', courseId);
    const response = await apiClient.post('/api/admin/course/enroll-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
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
