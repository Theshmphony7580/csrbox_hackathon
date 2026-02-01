import { create } from 'zustand';

interface User {
    id: number;
    name: string;
    email: string;
    subjects: string[];
    exam_date: string | null;
    daily_free_slots: string[];
}

interface CognitiveProfile {
    type: string;
    confidence: number;
    features: {
        avg_response_time: number;
        accuracy_rate: number;
        retry_pattern: number;
        confidence_gap: number;
        speed_consistency: number;
    };
}

interface EnergyState {
    energy_score: number;
    energy_level: string;
    fatigue_index: number;
    recommended_activities: string[];
    avoid_activities: string[];
}

interface StudySlot {
    time: string;
    subject: string;
    topic: string;
    method: string;
    intensity: string;
    rationale: string;
}

interface AppState {
    // Auth
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;

    // Data
    cognitiveProfile: CognitiveProfile | null;
    energyState: EnergyState | null;
    currentPlan: StudySlot[] | null;

    // Actions
    setToken: (token: string) => void;
    setUser: (user: User) => void;
    logout: () => void;
    setCognitiveProfile: (profile: CognitiveProfile) => void;
    setEnergyState: (energy: EnergyState) => void;
    setCurrentPlan: (plan: StudySlot[]) => void;
}

export const useStore = create<AppState>((set) => ({
    // Initial state
    token: localStorage.getItem('token'),
    user: null,
    isAuthenticated: !!localStorage.getItem('token'),
    cognitiveProfile: null,
    energyState: null,
    currentPlan: null,

    // Actions
    setToken: (token) => {
        localStorage.setItem('token', token);
        set({ token, isAuthenticated: true });
    },

    setUser: (user) => set({ user }),

    logout: () => {
        localStorage.removeItem('token');
        set({ token: null, user: null, isAuthenticated: false });
    },

    setCognitiveProfile: (profile) => set({ cognitiveProfile: profile }),
    setEnergyState: (energy) => set({ energyState: energy }),
    setCurrentPlan: (plan) => set({ currentPlan: plan }),
}));
