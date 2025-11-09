import apiClient from './apiClient';

export const quizService = {
  getQuizzes: async (courseId: string) => {
    const response = await apiClient.get('/api/quizzes', {
      params: { courseId },
    });
    return response.data;
  },

  getQuiz: async (quizId: string, includeAnswers?: boolean) => {
    const response = await apiClient.get(`/api/quizzes/${quizId}`, {
      params: includeAnswers ? { includeAnswers: 'true' } : {},
    });
    return response.data;
  },

  createQuiz: async (quizData: {
    courseId: string;
    title: string;
    description?: string;
    instructions?: string;
    questions: any[];
    timeLimit?: number;
    showResults?: boolean;
  }) => {
    const response = await apiClient.post('/api/quizzes', quizData);
    return response.data;
  },

  publishQuiz: async (quizId: string, isPublished: boolean) => {
    const response = await apiClient.patch(`/api/quizzes/${quizId}/publish`, {
      isPublished,
    });
    return response.data;
  },

  submitQuiz: async (quizId: string, answers: any[], timeSpent?: number) => {
    const response = await apiClient.post('/api/quizzes/submit', {
      quizId,
      answers,
      timeSpent,
    });
    return response.data;
  },

  getQuizAttempts: async (quizId: string) => {
    const response = await apiClient.get('/api/quizzes/attempts', {
      params: { quizId },
    });
    return response.data;
  },

  getQuizLeaderboard: async (quizId: string) => {
    const response = await apiClient.get('/api/quizzes/leaderboard', {
      params: { quizId },
    });
    return response.data;
  },
};

