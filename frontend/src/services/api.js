import axios from 'axios';

// Connect to Flask backend locally
const API_URL = 'http://127.0.0.1:5001/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const checkEligibility = async (data) => {
    try {
        const response = await api.post('/predict-eligibility', data);
        return response.data;
    } catch (error) {
        console.error('Error fetching eligibility result:', error);
        throw error;
    }
};

export default api;
