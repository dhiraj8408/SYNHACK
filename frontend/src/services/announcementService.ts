import apiClient from './apiClient';

export const announcementService = {
  createAnnouncement: async (courseId: string, title: string, message: string) => {
    const response = await apiClient.post('/api/announcements', {
      courseId,
      title,
      message,
    });
    return response.data;
  },

  getAnnouncements: async (courseId: string) => {
    const response = await apiClient.get(`/api/announcements?courseId=${courseId}`);
    return response.data;
  },

  deleteAnnouncement: async (announcementId: string) => {
    const response = await apiClient.delete(`/api/announcements/${announcementId}`);
    return response.data;
  },
};

