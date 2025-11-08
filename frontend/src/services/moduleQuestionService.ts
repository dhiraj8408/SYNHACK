import apiClient from './apiClient';

export const moduleQuestionService = {
  addQuestion: async (questionData: any) => {
    const response = await apiClient.post('/api/module-questions', questionData);
    return response.data;
  },

  getModuleQuestions: async (courseId: string, module: string) => {
    const response = await apiClient.get('/api/module-questions', {
      params: { courseId, module },
    });
    return response.data;
  },

  submitAnswer: async (questionId: string, answer: string | string[]) => {
    const response = await apiClient.post('/api/module-questions/answer', {
      questionId,
      answer,
    });
    return response.data;
  },

  deleteQuestion: async (questionId: string) => {
    const response = await apiClient.delete(`/api/module-questions/${questionId}`);
    return response.data;
  },
};

