import axios from 'axios';

const API_BASE = 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth
export const register = async (data: {
    name: string;
    email: string;
    password: string;
    subjects: string[];
    exam_date?: string;
    daily_free_slots: string[];
}) => {
    const response = await api.post('/auth/register', data);
    return response.data;
};

export const login = async (email: string, password: string) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    const response = await api.post('/auth/login', formData);
    return response.data;
};

export const getMe = async () => {
    const response = await api.get('/auth/me');
    return response.data;
};

// Cognitive Events
export const submitCognitiveEvent = async (data: {
    question_id: string;
    subject: string;
    time_taken: number;
    correct: boolean;
    confidence: number;
}) => {
    const response = await api.post('/cognitive/submit', data);
    return response.data;
};

export const getCognitiveProfile = async () => {
    const response = await api.get('/cognitive/profile');
    return response.data;
};

// Energy
export const submitEnergyLog = async (data: {
    sleep_hours: number;
    tiredness: number;
}) => {
    const response = await api.post('/energy/submit', data);
    return response.data;
};

export const getCurrentEnergy = async () => {
    const response = await api.get('/energy/current');
    return response.data;
};

// Study Plans
export const generatePlan = async (data: {
    date: string;
    override_slots?: string[];
    preferences?: {
        max_session_duration: number;
        min_break: number;
    };
}) => {
    const response = await api.post('/plan/generate', data);
    return response.data;
};

export const getPlanHistory = async () => {
    const response = await api.get('/plan/history');
    return response.data;
};

// Analytics
export const getPerformanceAnalytics = async () => {
    const response = await api.get('/analytics/performance');
    return response.data;
};

// Chat
export async function sendChatMessage(message: string) {
    const res = await fetch(`${API_BASE}/chat/message`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ message })
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Chat failed');
    }

    return res.json();
}


// Feedback
export const submitFeedback = async (data: {
    plan_id: number;
    slot_index: number;
    completion_rate: number;
    difficulty: number;
    actual_time?: number;
    quiz_score?: number;
}) => {
    const response = await api.post('/feedback/submit', data);
    return response.data;
};

export default api;
