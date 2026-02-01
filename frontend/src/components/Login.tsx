import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, getMe } from '../api';
import { useStore } from '../store';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { setToken, setUser } = useStore();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await login(email, password);
            setToken(response.access_token);

            // Fetch user data
            const userData = await getMe();
            setUser(userData);

            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Title */}
                <div className="text-center mb-8 animate-slide-up">
                    <h1 className="text-4xl font-bold gradient-text mb-2">
                        NeuroAdaptive
                    </h1>
                    <p className="text-gray-400">Study Engine</p>
                </div>

                {/* Login Card */}
                <div className="glass rounded-2xl p-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <h2 className="text-2xl font-semibold mb-6 text-white">Welcome Back</h2>

                    {error && (
                        <div className="mb-4 p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
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
                                placeholder="demo@example.com"
                            />
                        </div>

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
                                className="w-full"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full mt-6"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-400">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-sky-400 hover:text-sky-300 transition-colors">
                                Sign up
                            </Link>
                        </p>
                    </div>

                    {/* Demo credentials hint */}
                    <div className="mt-6 p-4 rounded-lg bg-sky-500/10 border border-sky-500/30">
                        <p className="text-sm text-sky-200">
                            <strong>Demo:</strong> demo@example.com / demo123
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
