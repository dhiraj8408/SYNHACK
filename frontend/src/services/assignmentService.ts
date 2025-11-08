import apiClient from './apiClient';

export const assignmentService = {
  getAssignments: async (courseId?: string) => {
    const response = await apiClient.get('/api/assignments', {
      params: courseId ? { courseId } : {},
    });
    return response.data;
  },

  createAssignment: async (assignmentData: {
    courseId: string;
    title: string;
    type: 'assignment' | 'quiz';
    dueDate: string;
    fileUrl?: string;
  }) => {
    const response = await apiClient.post('/api/assignments', assignmentData);
    return response.data;
  },

  submitAssignment: async (formData: FormData) => {
    const response = await apiClient.post('/api/assignments/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  gradeSubmission: async (submissionId: string, score: number) => {
    const response = await apiClient.post('/api/assignments/grade', { submissionId, score });
    return response.data;
  },

  getSubmissions: async (assignmentId: string) => {
    const response = await apiClient.get('/api/assignments/submissions', {
      params: { assignmentId },
    });
    return response.data;
  },
};
