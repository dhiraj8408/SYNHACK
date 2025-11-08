import chatClient from './chatClient';

export const chatbotService = {
  askQuestion: async (courseId: string, question: string) => {
    const response = await chatClient.post('/chatbot-api/chat', { courseId, question });
    return response.data;
  },
};
