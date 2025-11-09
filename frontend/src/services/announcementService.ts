import apiClient from './apiClient';

export const announcementService = {
  createAnnouncement: async (title: string, message: string, courseId?: string) => {
    const response = await apiClient.post('/api/announcements', {
      title,
      message,
      ...(courseId && { courseId }), // Only include courseId if provided
    });
    return response.data;
  },

  getAnnouncements: async (courseId?: string) => {
    const url = courseId 
      ? `/api/announcements?courseId=${courseId}`
      : '/api/announcements?global=true';
    const response = await apiClient.get(url);
    return response.data;
  },

  getAllAnnouncements: async () => {
    const response = await apiClient.get('/api/announcements');
    return response.data;
  },

  deleteAnnouncement: async (announcementId: string) => {
    const response = await apiClient.delete(`/api/announcements/${announcementId}`);
    return response.data;
  },
};

