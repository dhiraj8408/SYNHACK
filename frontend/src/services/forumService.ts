import apiClient from './apiClient';

export const forumService = {
  createThread: async (courseId: string, title: string, message: string) => {
    const response = await apiClient.post('/api/forum/thread', { courseId, title, message });
    return response.data;
  },

  replyToThread: async (threadId: string, message: string) => {
    const response = await apiClient.post('/api/forum/reply', { threadId, message });
    return response.data;
  },

  resolveThread: async (threadId: string) => {
    const response = await apiClient.patch(`/api/forum/thread/${threadId}/resolve`);
    return response.data;
  },

  deleteThread: async (threadId: string) => {
    const response = await apiClient.delete(`/api/forum/thread/${threadId}`);
    return response.data;
  },

  getThreads: async (courseId: string) => {
    const response = await apiClient.get(`/api/forum/threads/${courseId}`);
    return response.data;
  },

  getThreadById: async (threadId: string) => {
    const response = await apiClient.get(`/api/forum/thread/${threadId}`);
    return response.data;
  },
};
