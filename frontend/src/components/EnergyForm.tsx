import { useState, useEffect } from 'react';
import { submitEnergyLog, getCurrentEnergy } from '../api';
import { useStore } from '../store';

export default function EnergyForm() {
    const { energyState, setEnergyState } = useStore();
    const [sleepHours, setSleepHours] = useState(7);
    const [tiredness, setTiredness] = useState(5);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        loadCurrentEnergy();
    }, []);

    const loadCurrentEnergy = async () => {
        try {
            const energy = await getCurrentEnergy();
            setEnergyState(energy);
        } catch (err) {
            console.log('No energy data yet');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);

        try {
            await submitEnergyLog({
                sleep_hours: sleepHours,
                tiredness: tiredness
            });

            // Refresh energy state
            const energy = await getCurrentEnergy();
            setEnergyState(energy);
            setSuccess(true);

            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error('Failed to submit energy log:', err);
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

    const getTirednessLabel = (value: number) => {
        if (value <= 2) return 'Very Alert';
        if (value <= 4) return 'Alert';
        if (value <= 6) return 'Moderate';
        if (value <= 8) return 'Tired';
        return 'Exhausted';
    };

    const getSleepQuality = (hours: number) => {
        if (hours >= 7 && hours <= 9) return { label: 'Optimal', color: 'text-green-400' };
        if (hours >= 6 && hours < 7) return { label: 'Good', color: 'text-yellow-400' };
        if (hours >= 5 && hours < 6) return { label: 'Low', color: 'text-orange-400' };
        return { label: 'Poor', color: 'text-red-400' };
    };

    const sleepQuality = getSleepQuality(sleepHours);

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8 animate-slide-up">
                <h1 className="text-4xl font-bold gradient-text mb-2">
                    Energy Tracker
                </h1>
                <p className="text-gray-400">
                    Log your sleep and energy levels for personalized study plans
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Energy Log Form */}
                <div className="glass rounded-xl p-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <h2 className="text-2xl font-semibold text-white mb-6">Log Energy</h2>

                    {success && (
                        <div className="mb-4 p-4 rounded-lg bg-green-500/20 border border-green-500/50 text-green-200">
                            ✓ Energy log submitted successfully!
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Sleep Hours */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium text-gray-300">
                                    Sleep Hours
                                </label>
                                <div className="text-right">
                                    <span className="text-2xl font-bold text-white">{sleepHours}h</span>
                                    <span className={`ml-2 text-sm ${sleepQuality.color}`}>
                                        {sleepQuality.label}
                                    </span>
                                </div>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="12"
                                step="0.5"
                                value={sleepHours}
                                onChange={(e) => setSleepHours(Number(e.target.value))}
                                className="w-full h-3 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                style={{
                                    background: `linear-gradient(to right, #0ea5e9 0%, #0ea5e9 ${(sleepHours / 12) * 100}%, rgba(255,255,255,0.1) ${(sleepHours / 12) * 100}%, rgba(255,255,255,0.1) 100%)`
                                }}
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>0h</span>
                                <span>6h</span>
                                <span>12h</span>
                            </div>
                        </div>

                        {/* Tiredness Level */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium text-gray-300">
                                    Current Tiredness
                                </label>
                                <div className="text-right">
                                    <span className="text-2xl font-bold text-white">{tiredness}/10</span>
                                    <span className="ml-2 text-sm text-gray-400">
                                        {getTirednessLabel(tiredness)}
                                    </span>
                                </div>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={tiredness}
                                onChange={(e) => setTiredness(Number(e.target.value))}
                                className="w-full h-3 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                style={{
                                    background: `linear-gradient(to right, #22c55e 0%, #eab308 50%, #ef4444 100%)`
                                }}
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>Alert</span>
                                <span>Moderate</span>
                                <span>Exhausted</span>
                            </div>
                        </div>

                        {/* Visual Indicators */}
                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <div className="bg-white/5 rounded-lg p-4 text-center">
                                <div className="text-3xl mb-2">😴</div>
                                <p className="text-sm text-gray-400">Sleep Quality</p>
                                <p className={`text-lg font-semibold ${sleepQuality.color}`}>
                                    {sleepQuality.label}
                                </p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-4 text-center">
                                <div className="text-3xl mb-2">
                                    {tiredness <= 3 ? '😊' : tiredness <= 6 ? '😐' : '😫'}
                                </div>
                                <p className="text-sm text-gray-400">Energy Level</p>
                                <p className="text-lg font-semibold text-white">
                                    {getTirednessLabel(tiredness)}
                                </p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full mt-6"
                        >
                            {loading ? 'Submitting...' : 'Submit Energy Log'}
                        </button>
                    </form>
                </div>

                {/* Current Energy State */}
                <div className="space-y-6">
                    <div className="glass rounded-xl p-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <h2 className="text-2xl font-semibold text-white mb-6">Current State</h2>

                        {energyState ? (
                            <div>
                                {/* Energy Score */}
                                <div className="text-center mb-6">
                                    <div className={`inline-block px-6 py-3 rounded-xl text-white font-bold text-lg mb-3 ${getEnergyClass(energyState.energy_level)}`}>
                                        {energyState.energy_level?.toUpperCase()}
                                    </div>
                                    <p className="text-5xl font-bold text-white mb-2">
                                        {energyState.energy_score}
                                    </p>
                                    <p className="text-gray-400">Energy Score</p>
                                </div>

                                {/* Fatigue Index */}
                                <div className="bg-white/5 rounded-lg p-4 mb-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400">Fatigue Index</span>
                                        <span className="text-white font-semibold">
                                            {energyState.fatigue_index?.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                                        <div
                                            className="bg-gradient-to-r from-green-500 to-red-500 h-2 rounded-full"
                                            style={{ width: `${(energyState.fatigue_index || 0) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Recommendations */}
                                {energyState.recommended_activities && energyState.recommended_activities.length > 0 && (
                                    <div className="mb-4">
                                        <h3 className="text-lg font-semibold text-green-400 mb-3">
                                            ✓ Recommended Activities
                                        </h3>
                                        <ul className="space-y-2">
                                            {energyState.recommended_activities.map((activity, idx) => (
                                                <li key={idx} className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-sm text-gray-300">
                                                    • {activity}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Avoid Activities */}
                                {energyState.avoid_activities && energyState.avoid_activities.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-red-400 mb-3">
                                            ✗ Avoid Right Now
                                        </h3>
                                        <ul className="space-y-2">
                                            {energyState.avoid_activities.map((activity, idx) => (
                                                <li key={idx} className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-gray-300">
                                                    • {activity}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center text-gray-400 py-8">
                                <div className="text-6xl mb-4">⚡</div>
                                <p className="mb-4">No energy data yet</p>
                                <p className="text-sm">Submit your first energy log to see your current state</p>
                            </div>
                        )}
                    </div>

                    {/* Tips */}
                    <div className="glass rounded-xl p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                        <h3 className="text-lg font-semibold text-white mb-3">💡 Energy Tips</h3>
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li>• Log energy at the same time daily</li>
                            <li>• Aim for 7-9 hours of sleep</li>
                            <li>• Track patterns over time</li>
                            <li>• Use insights for better planning</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
