import apiClient from "./apiClient";

export const listAssignments = async (token, courseId) => {
  const r = await apiClient.get(`/assignments?courseId=${courseId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.data;
};

export const createAssignment = async (token, payload) => {
  const r = await apiClient.post("/assignments", payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.data;
};

export const submitAssignment = async (token, payload) => {
  const r = await apiClient.post("/assignments/submit", payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.data;
};

export const listSubmissions = async (token, assignmentId) => {
  const r = await apiClient.get(`/assignments/submissions?assignmentId=${assignmentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.data;
};

export const gradeSubmission = async (token, submissionId, score) => {
  const r = await apiClient.post("/assignments/grade", { submissionId, score }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.data;
};
