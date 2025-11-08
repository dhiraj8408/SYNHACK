import apiClient from "./apiClient";

export const askBotService = async (token, payload) => {
  const r = await apiClient.post(`/chatbot/ask`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.data;
};
