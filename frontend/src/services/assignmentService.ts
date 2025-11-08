import apiClient from './apiClient';

export const assignmentService = {
  getAssignments: async (courseId?: string) => {
    const response = await apiClient.get('/api/assignments', {
      params: courseId ? { courseId } : {},
    });
    return response.data;
  },

  getAssignment: async (assignmentId: string) => {
    const response = await apiClient.get(`/api/assignments/${assignmentId}`);
    return response.data;
  },

  createAssignment: async (formData: FormData) => {
    const response = await apiClient.post('/api/assignments', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  submitAssignment: async (formData: FormData) => {
    // Check if it's a Drive link (fileUrl) or file upload
    const fileUrl = formData.get('fileUrl');
    if (fileUrl) {
      // Send as JSON for Drive links
      const data: any = {
        assignmentId: formData.get('assignmentId'),
        fileUrl: fileUrl,
      };
      const fileName = formData.get('fileName');
      if (fileName) {
        data.fileName = fileName;
      }
      const response = await apiClient.post('/api/assignments/submit', data);
      return response.data;
    } else {
      // Send as FormData for file uploads
      const response = await apiClient.post('/api/assignments/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    }
  },

  getMySubmission: async (assignmentId: string) => {
    const response = await apiClient.get('/api/assignments/submissions/my', {
      params: { assignmentId },
    });
    return response.data;
  },

  gradeSubmission: async (submissionId: string, score: number, feedback?: string) => {
    const response = await apiClient.post('/api/assignments/grade', {
      submissionId,
      score,
      feedback,
    });
    return response.data;
  },

  getSubmissions: async (assignmentId: string) => {
    const response = await apiClient.get('/api/assignments/submissions/list', {
      params: { assignmentId },
    });
    return response.data;
  },
};
