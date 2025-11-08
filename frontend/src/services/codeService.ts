import apiClient from './apiClient';

export const codeService = {
  executeCode: async (language: string, code: string) => {
    const response = await apiClient.post('/api/code/execute', {
      language,
      code,
    });
    return response.data;
  },
};

