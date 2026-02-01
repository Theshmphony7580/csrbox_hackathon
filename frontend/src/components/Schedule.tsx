import { useState, useEffect } from 'react';
import { generatePlan, getPlanHistory } from '../api';
import { useStore } from '../store';

interface StudySlot {
    time: string;
    subject: string;
    topic: string;
    method: string;
    intensity: string;
    rationale: string;
}

interface StudyPlan {
    cognitive_profile: {
        type: string;
        confidence: number;
    };
    energy_score: number;
    energy_level: string;
    study_plan: StudySlot[];
    metadata: {
        generated_at: string;
        model_version: string;
        total_study_time: number;
        estimated_learning_gain: number;
    };
}

interface PlanHistoryItem {
    id: number;
    date: string;
    cognitive_profile: string;
    energy_score: number;
    created_at: string;
}

const TIME_SLOTS = [
    '06:00-08:00', '08:00-10:00', '10:00-12:00',
    '12:00-14:00', '14:00-16:00', '16:00-18:00',
    '18:00-20:00', '20:00-22:00'
];

export default function Schedule() {
    const { user, setCurrentPlan } = useStore();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [customSlots, setCustomSlots] = useState<string[]>([]);
    const [useCustomSlots, setUseCustomSlots] = useState(false);
    const [maxSessionDuration, setMaxSessionDuration] = useState(90);
    const [minBreak, setMinBreak] = useState(15);
    const [loading, setLoading] = useState(false);
    const [generatedPlan, setGeneratedPlan] = useState<StudyPlan | null>(null);
    const [planHistory, setPlanHistory] = useState<PlanHistoryItem[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        loadPlanHistory();
    }, []);

    const loadPlanHistory = async () => {
        try {
            const history = await getPlanHistory();
            setPlanHistory(history);
        } catch (err) {
            console.log('No plan history yet');
        }
    };

    const toggleTimeSlot = (slot: string) => {
        setCustomSlots(prev =>
            prev.includes(slot)
                ? prev.filter(s => s !== slot)
                : [...prev, slot]
        );
    };

    const handleGeneratePlan = async () => {
        setLoading(true);
        try {
            const plan = await generatePlan({
                date,
                override_slots: useCustomSlots ? customSlots : undefined,
                preferences: {
                    max_session_duration: maxSessionDuration,
                    min_break: minBreak
                }
            });

            setGeneratedPlan(plan);
            setCurrentPlan(plan.study_plan);
            await loadPlanHistory();
        } catch (err: any) {
            console.error('Failed to generate plan:', err);
            alert(err.response?.data?.detail || 'Failed to generate plan. Please ensure you have cognitive and energy data.');
        } finally {
            setLoading(false);
        }
    };

    const getIntensityColor = (intensity: string) => {
        switch (intensity.toLowerCase()) {
            case 'high': return 'bg-red-500/20 border-red-400/50 text-red-200';
            case 'medium': return 'bg-yellow-500/20 border-yellow-400/50 text-yellow-200';
            case 'low': return 'bg-green-500/20 border-green-400/50 text-green-200';
            default: return 'bg-gray-500/20 border-gray-400/50 text-gray-200';
        }
    };

    const getEnergyClass = (level: string) => {
        switch (level?.toLowerCase()) {
            case 'high': return 'energy-high';
            case 'medium': return 'energy-medium';
            case 'low': return 'energy-low';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8 animate-slide-up">
                <h1 className="text-4xl font-bold gradient-text mb-2">
                    Study Scheduler
                </h1>
                <p className="text-gray-400">
                    Generate AI-powered study plans based on your cognitive profile and energy levels
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Configuration Panel */}
                <div className="lg:col-span-1">
                    <div className="glass rounded-xl p-6 animate-slide-up sticky top-20">
                        <h2 className="text-xl font-semibold text-white mb-6">Configuration</h2>

                        {/* Date Picker */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Plan Date
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full"
                            />
                        </div>

                        {/* Custom Time Slots */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium text-gray-300">
                                    Custom Time Slots
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setUseCustomSlots(!useCustomSlots)}
                                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${useCustomSlots
                                            ? 'bg-sky-500/30 text-sky-200'
                                            : 'bg-white/10 text-gray-400'
                                        }`}
                                >
                                    {useCustomSlots ? 'Enabled' : 'Use Default'}
                                </button>
                            </div>

                            {useCustomSlots && (
                                <div className="grid grid-cols-2 gap-2">
                                    {TIME_SLOTS.map(slot => (
                                        <button
                                            key={slot}
                                            type="button"
                                            onClick={() => toggleTimeSlot(slot)}
                                            className={`p-2 rounded text-xs font-medium transition-all ${customSlots.includes(slot)
                                                    ? 'bg-purple-500/30 border border-purple-400 text-purple-200'
                                                    : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                                                }`}
                                        >
                                            {slot}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {!useCustomSlots && user?.daily_free_slots && (
                                <div className="text-sm text-gray-400">
                                    Using your default slots:
                                    <div className="mt-2 space-y-1">
                                        {user.daily_free_slots.map((slot, idx) => (
                                            <div key={idx} className="bg-white/5 rounded px-2 py-1 text-xs">
                                                {slot}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Preferences */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Max Session: {maxSessionDuration} min
                            </label>
                            <input
                                type="range"
                                min="30"
                                max="180"
                                step="15"
                                value={maxSessionDuration}
                                onChange={(e) => setMaxSessionDuration(Number(e.target.value))}
                                className="w-full h-2 bg-white/10 rounded-lg"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Min Break: {minBreak} min
                            </label>
                            <input
                                type="range"
                                min="5"
                                max="30"
                                step="5"
                                value={minBreak}
                                onChange={(e) => setMinBreak(Number(e.target.value))}
                                className="w-full h-2 bg-white/10 rounded-lg"
                            />
                        </div>

                        {/* Generate Button */}
                        <button
                            onClick={handleGeneratePlan}
                            disabled={loading}
                            className="btn btn-primary w-full mb-4"
                        >
                            {loading ? 'Generating...' : '✨ Generate Plan'}
                        </button>

                        {/* History Toggle */}
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className="btn btn-secondary w-full text-sm"
                        >
                            {showHistory ? 'Hide' : 'Show'} History
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-2">
                    {/* Generated Plan */}
                    {generatedPlan ? (
                        <div className="space-y-6">
                            {/* Plan Header */}
                            <div className="glass rounded-xl p-6 animate-slide-up">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <p className="text-sm text-gray-400 mb-1">Cognitive Profile</p>
                                        <p className="text-lg font-bold text-sky-400">
                                            {generatedPlan.cognitive_profile.type}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {(generatedPlan.cognitive_profile.confidence * 100).toFixed(0)}% confidence
                                        </p>
                                    </div>

                                    <div className="text-center">
                                        <p className="text-sm text-gray-400 mb-1">Energy Level</p>
                                        <div className={`inline-block px-4 py-1 rounded-lg text-white font-bold ${getEnergyClass(generatedPlan.energy_level)}`}>
                                            {generatedPlan.energy_level?.toUpperCase()}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Score: {generatedPlan.energy_score}
                                        </p>
                                    </div>

                                    <div className="text-center">
                                        <p className="text-sm text-gray-400 mb-1">Total Study Time</p>
                                        <p className="text-lg font-bold text-purple-400">
                                            {generatedPlan.metadata.total_study_time} min
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Learning Gain: {(generatedPlan.metadata.estimated_learning_gain * 100).toFixed(0)}%
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Study Slots */}
                            <div className="space-y-4">
                                {generatedPlan.study_plan.map((slot, idx) => (
                                    <div
                                        key={idx}
                                        className="glass rounded-xl p-6 animate-slide-up hover:scale-[1.02] transition-transform"
                                        style={{ animationDelay: `${idx * 0.05}s` }}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <span className="text-2xl font-bold text-sky-400">
                                                        {slot.time}
                                                    </span>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getIntensityColor(slot.intensity)}`}>
                                                        {slot.intensity} Intensity
                                                    </span>
                                                </div>
                                                <h3 className="text-xl font-semibold text-white mb-1">
                                                    {slot.subject}
                                                </h3>
                                                <p className="text-gray-400">{slot.topic}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div className="bg-white/5 rounded-lg p-3">
                                                <p className="text-xs text-gray-400 mb-1">Study Method</p>
                                                <p className="text-sm text-white font-medium">{slot.method}</p>
                                            </div>
                                            <div className="bg-white/5 rounded-lg p-3">
                                                <p className="text-xs text-gray-400 mb-1">Intensity</p>
                                                <p className="text-sm text-white font-medium">{slot.intensity}</p>
                                            </div>
                                        </div>

                                        <div className="bg-purple-500/10 border border-purple-400/30 rounded-lg p-3">
                                            <p className="text-xs text-purple-300 mb-1">💡 Rationale</p>
                                            <p className="text-sm text-gray-300">{slot.rationale}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="glass rounded-xl p-12 text-center animate-slide-up">
                            <div className="text-6xl mb-4">📅</div>
                            <h3 className="text-2xl font-semibold text-white mb-2">
                                No Plan Generated Yet
                            </h3>
                            <p className="text-gray-400 mb-6">
                                Configure your preferences and click "Generate Plan" to create your personalized study schedule
                            </p>
                            <div className="text-sm text-gray-500">
                                <p>✓ Make sure you have completed cognitive assessment</p>
                                <p>✓ Make sure you have logged your energy levels</p>
                            </div>
                        </div>
                    )}

                    {/* Plan History */}
                    {showHistory && planHistory.length > 0 && (
                        <div className="glass rounded-xl p-6 mt-6 animate-slide-up">
                            <h3 className="text-xl font-semibold text-white mb-4">Plan History</h3>
                            <div className="space-y-3">
                                {planHistory.map(plan => (
                                    <div key={plan.id} className="bg-white/5 rounded-lg p-4 flex items-center justify-between hover:bg-white/10 transition-colors">
                                        <div>
                                            <p className="text-white font-medium">{plan.date}</p>
                                            <p className="text-sm text-gray-400">
                                                {plan.cognitive_profile} • Energy: {plan.energy_score}
                                            </p>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {new Date(plan.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
