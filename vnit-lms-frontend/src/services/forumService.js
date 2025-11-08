import apiClient from "./apiClient";

export const listThreads = async (token, courseId) => {
  const r = await apiClient.get(`/forum?courseId=${courseId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.data;
};

export const createThread = async (token, payload) => {
  const r = await apiClient.post(`/forum`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.data;
};

export const listReplies = async (token, threadId) => {
  const r = await apiClient.get(`/forum/replies?threadId=${threadId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.data;
};

export const sendReply = async (token, payload) => {
  const r = await apiClient.post(`/forum/replies`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.data;
};

export const resolveThread = async (token, threadId) => {
  const r = await apiClient.post(`/forum/${threadId}/resolve`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.data;
};
