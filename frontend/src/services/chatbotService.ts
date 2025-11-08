import apiClient from './apiClient';

export const chatbotService = {
  askQuestion: async (courseId: string, question: string) => {
    const response = await apiClient.post('/api/chatbot/ask', { courseId, question });
    return response.data;
  },
};
