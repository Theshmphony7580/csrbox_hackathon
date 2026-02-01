import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { getCognitiveProfile, getCurrentEnergy, getPerformanceAnalytics, getPlanHistory } from '../api';

interface AnalyticsData {
    date: string;
    accuracy: number;
    avg_time: number;
    questions: number;
}

interface PlanHistoryItem {
    id: number;
    date: string;
    cognitive_profile: {
        type: string;
        confidence: number;
        features: any;
    };
    energy_score: number;
    created_at: string;
}


export default function Dashboard() {
    const { user, cognitiveProfile, energyState, setCognitiveProfile, setEnergyState } = useStore();
    const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
    const [planHistory, setPlanHistory] = useState<PlanHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            // Load cognitive profile
            try {
                const profile = await getCognitiveProfile();
                setCognitiveProfile(profile);
            } catch (err) {
                console.log('No cognitive profile yet');
            }

            // Load energy state
            try {
                const energy = await getCurrentEnergy();
                setEnergyState(energy);
            } catch (err) {
                console.log('No energy data yet');
            }

            // Load analytics
            try {
                const analyticsData = await getPerformanceAnalytics();
                setAnalytics(analyticsData.data || []);
            } catch (err) {
                console.log('No analytics data yet');
            }

            // Load plan history
            try {
                const history = await getPlanHistory();
                setPlanHistory(history);
            } catch (err) {
                console.log('No plan history yet');
            }
        } finally {
            setLoading(false);
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Welcome Section */}
            <div className="mb-8 animate-slide-up">
                <h1 className="text-4xl font-bold text-white mb-2">
                    Welcome back, <span className="gradient-text">{user?.name}</span>!
                </h1>
                <p className="text-gray-400">Here's your learning overview</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Cognitive Profile Card */}
                <div className="glass rounded-xl p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">🧠 Cognitive Profile</h3>
                    </div>
                    {cognitiveProfile ? (
                        <div>
                            <p className="text-2xl font-bold text-sky-400 mb-2">
                                {cognitiveProfile.type}
                            </p>
                            <p className="text-sm text-gray-400 mb-3">
                                Confidence: {(cognitiveProfile.confidence * 100).toFixed(0)}%
                            </p>
                            <div className="space-y-1 text-xs text-gray-300">
                                <p>Accuracy: {(cognitiveProfile.features.accuracy_rate * 100).toFixed(0)}%</p>
                                <p>Avg Response: {cognitiveProfile.features.avg_response_time.toFixed(1)}s</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-400">
                            <p className="mb-3">No data yet</p>
                            <Link to="/cognitive" className="text-sky-400 hover:text-sky-300 text-sm">
                                Take Assessment →
                            </Link>
                        </div>
                    )}
                </div>

                {/* Energy State Card */}
                <div className="glass rounded-xl p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">⚡ Energy Level</h3>
                    </div>
                    {energyState ? (
                        <div>
                            <div className={`inline-block px-4 py-2 rounded-lg text-white font-bold mb-3 ${getEnergyClass(energyState.energy_level)}`}>
                                {energyState.energy_level?.toUpperCase()}
                            </div>
                            <p className="text-2xl font-bold text-white mb-2">
                                {energyState.energy_score}/100
                            </p>
                            <p className="text-xs text-gray-400">
                                Fatigue Index: {energyState.fatigue_index != null
                                    ? energyState.fatigue_index.toFixed(1)
                                    : '—'}
                            </p>
                        </div>
                    ) : (
                        <div className="text-gray-400">
                            <p className="mb-3">No data yet</p>
                            <Link to="/energy" className="text-sky-400 hover:text-sky-300 text-sm">
                                Log Energy →
                            </Link>
                        </div>
                    )}
                </div>

                {/* Subjects Card */}
                <div className="glass rounded-xl p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                    <h3 className="text-lg font-semibold text-white mb-4">📚 Your Subjects</h3>
                    <div className="flex flex-wrap gap-2">
                        {user?.subjects.map(subject => (
                            <span
                                key={subject}
                                className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-sm"
                            >
                                {subject}
                            </span>
                        ))}
                    </div>
                    {user?.exam_date && (
                        <p className="mt-4 text-sm text-gray-400">
                            Exam: {new Date(user.exam_date).toLocaleDateString()}
                        </p>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link
                        to="/cognitive"
                        className="glass glass-hover rounded-xl p-6 transition-all hover:scale-105"
                    >
                        <div className="text-4xl mb-3">🧠</div>
                        <h3 className="text-lg font-semibold text-white mb-2">Cognitive Test</h3>
                        <p className="text-sm text-gray-400">Assess your learning style</p>
                    </Link>

                    <Link
                        to="/energy"
                        className="glass glass-hover rounded-xl p-6 transition-all hover:scale-105"
                    >
                        <div className="text-4xl mb-3">⚡</div>
                        <h3 className="text-lg font-semibold text-white mb-2">Log Energy</h3>
                        <p className="text-sm text-gray-400">Track your energy levels</p>
                    </Link>

                    <Link
                        to="/schedule"
                        className="glass glass-hover rounded-xl p-6 transition-all hover:scale-105"
                    >
                        <div className="text-4xl mb-3">📅</div>
                        <h3 className="text-lg font-semibold text-white mb-2">Generate Plan</h3>
                        <p className="text-sm text-gray-400">Create study schedule</p>
                    </Link>

                    <button
                        onClick={loadDashboardData}
                        className="glass glass-hover rounded-xl p-6 transition-all hover:scale-105"
                    >
                        <div className="text-4xl mb-3">🔄</div>
                        <h3 className="text-lg font-semibold text-white mb-2">Refresh Data</h3>
                        <p className="text-sm text-gray-400">Update dashboard</p>
                    </button>
                </div>
            </div>

            {/* Performance Analytics */}
            {analytics.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-4">Performance Trends</h2>
                    <div className="glass rounded-xl p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {analytics.slice(-7).map((day, idx) => (
                                <div key={idx} className="bg-white/5 rounded-lg p-4">
                                    <p className="text-sm text-gray-400 mb-2">{day.date}</p>
                                    <p className="text-lg font-bold text-white">
                                        {day.accuracy}% Accuracy
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {day.questions} questions • {day.avg_time}s avg
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Plans */}
            {planHistory.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Recent Study Plans</h2>
                    <div className="glass rounded-xl p-6">
                        <div className="space-y-3">
                            {planHistory.slice(0, 5).map(plan => (
                                <div key={plan.id} className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-white font-medium">{plan.date}</p>
                                        <p className="text-sm text-gray-400">
                                            {plan.cognitive_profile.type} • Energy: {plan.energy_score}
                                        </p>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        {new Date(plan.created_at).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Energy Recommendations */}
            {energyState?.recommended_activities && energyState.recommended_activities.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-2xl font-bold text-white mb-4">💡 Recommendations</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="glass rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-green-400 mb-3">✓ Recommended</h3>
                            <ul className="space-y-2">
                                {energyState.recommended_activities.map((activity, idx) => (
                                    <li key={idx} className="text-gray-300 text-sm">• {activity}</li>
                                ))}
                            </ul>
                        </div>
                        {energyState.avoid_activities && energyState.avoid_activities.length > 0 && (
                            <div className="glass rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-red-400 mb-3">✗ Avoid</h3>
                                <ul className="space-y-2">
                                    {energyState.avoid_activities.map((activity, idx) => (
                                        <li key={idx} className="text-gray-300 text-sm">• {activity}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
