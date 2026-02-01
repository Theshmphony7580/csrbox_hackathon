import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register, login, getMe } from '../api';
import { useStore } from '../store';

const AVAILABLE_SUBJECTS = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology',
    'Computer Science', 'English', 'History', 'Geography'
];

const TIME_SLOTS = [
    '06:00-08:00', '08:00-10:00', '10:00-12:00',
    '12:00-14:00', '14:00-16:00', '16:00-18:00',
    '18:00-20:00', '20:00-22:00'
];

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [subjects, setSubjects] = useState<string[]>([]);
    const [examDate, setExamDate] = useState('');
    const [freeSlots, setFreeSlots] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { setToken, setUser } = useStore();

    const toggleSubject = (subject: string) => {
        setSubjects(prev =>
            prev.includes(subject)
                ? prev.filter(s => s !== subject)
                : [...prev, subject]
        );
    };

    const toggleTimeSlot = (slot: string) => {
        setFreeSlots(prev =>
            prev.includes(slot)
                ? prev.filter(s => s !== slot)
                : [...prev, slot]
        );
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (subjects.length === 0) {
            setError('Please select at least one subject');
            return;
        }

        if (freeSlots.length === 0) {
            setError('Please select at least one time slot');
            return;
        }

        setLoading(true);

        try {
            await register({
                name,
                email,
                password,
                subjects,
                exam_date: examDate || undefined,
                daily_free_slots: freeSlots
            });

            // Auto-login after registration
            const loginResponse = await login(email, password);
            setToken(loginResponse.access_token);

            const userData = await getMe();
            setUser(userData);

            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 py-12">
            <div className="w-full max-w-2xl">
                {/* Logo/Title */}
                <div className="text-center mb-8 animate-slide-up">
                    <h1 className="text-4xl font-bold gradient-text mb-2">
                        NeuroAdaptive
                    </h1>
                    <p className="text-gray-400">Create Your Account</p>
                </div>

                {/* Register Card */}
                <div className="glass rounded-2xl p-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    {error && (
                        <div className="mb-4 p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                                    Full Name
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full"
                                    placeholder="john@example.com"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div>
                                <label htmlFor="examDate" className="block text-sm font-medium text-gray-300 mb-2">
                                    Exam Date (Optional)
                                </label>
                                <input
                                    id="examDate"
                                    type="date"
                                    value={examDate}
                                    onChange={(e) => setExamDate(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Subjects */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-3">
                                Subjects ({subjects.length} selected)
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {AVAILABLE_SUBJECTS.map(subject => (
                                    <button
                                        key={subject}
                                        type="button"
                                        onClick={() => toggleSubject(subject)}
                                        className={`p-3 rounded-lg text-sm font-medium transition-all ${subjects.includes(subject)
                                                ? 'bg-sky-500/30 border-2 border-sky-400 text-sky-200'
                                                : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                                            }`}
                                    >
                                        {subject}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Time Slots */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-3">
                                Daily Free Slots ({freeSlots.length} selected)
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {TIME_SLOTS.map(slot => (
                                    <button
                                        key={slot}
                                        type="button"
                                        onClick={() => toggleTimeSlot(slot)}
                                        className={`p-3 rounded-lg text-sm font-medium transition-all ${freeSlots.includes(slot)
                                                ? 'bg-purple-500/30 border-2 border-purple-400 text-purple-200'
                                                : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                                            }`}
                                    >
                                        {slot}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full mt-6"
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-400">
                            Already have an account?{' '}
                            <Link to="/login" className="text-sky-400 hover:text-sky-300 transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
