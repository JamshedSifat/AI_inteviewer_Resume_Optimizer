import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  timeout: 120000, // ২ মিনিট টাইমআউট
  headers: {
    'Content-Type': 'application/json',
  },
});

// Resume Audit API
export const auditResumeAPI = async (formData) => {
  const response = await api.post('/resume-audit/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// যাতে auditResume দিয়ে কল করলেও কাজ করে (Alias)
export const auditResume = auditResumeAPI;

// Questions API
export const getQuestionsAPI = async (role) => {
  const response = await api.post('/interview/questions/', { role });
  return response.data;
};
export const getQuestions = getQuestionsAPI;

// Evaluation API
export const evaluateInterviewAPI = async (qaList) => {
  const response = await api.post('/interview/evaluate/', { qa_list: qaList });
  return response.data;
};
export const evaluateInterview = evaluateInterviewAPI;

export const generateHREmailAPI = async (payload) => {
  const response = await api.post('/generate-email/', payload);
  return response.data;
};
export default api;