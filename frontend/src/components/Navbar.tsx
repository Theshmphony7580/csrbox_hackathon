import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../store';

export default function Navbar() {
    const location = useLocation();
    const { user, logout } = useStore();

    const isActive = (path: string) => location.pathname === path;

    const navLinks = [
        { path: '/', label: 'Dashboard', icon: '📊' },
        { path: '/cognitive', label: 'Cognitive', icon: '🧠' },
        { path: '/energy', label: 'Energy', icon: '⚡' },
        { path: '/schedule', label: 'Schedule', icon: '📅' }
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center space-x-2">
                            <span className="text-2xl font-bold gradient-text">
                                NeuroAdaptive
                            </span>
                        </Link>
                    </div>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center space-x-1">
                        {navLinks.map(link => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive(link.path)
                                        ? 'bg-sky-500/30 text-sky-200 glow-primary'
                                        : 'text-gray-300 hover:bg-white/10'
                                    }`}
                            >
                                <span className="mr-2">{link.icon}</span>
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center space-x-4">
                        <div className="hidden sm:block text-right">
                            <p className="text-sm font-medium text-white">{user?.name}</p>
                            <p className="text-xs text-gray-400">{user?.email}</p>
                        </div>
                        <button
                            onClick={logout}
                            className="btn btn-secondary text-sm"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div className="md:hidden pb-3 flex space-x-1 overflow-x-auto">
                    {navLinks.map(link => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${isActive(link.path)
                                    ? 'bg-sky-500/30 text-sky-200'
                                    : 'text-gray-300 bg-white/5'
                                }`}
                        >
                            <span className="mr-1">{link.icon}</span>
                            {link.label}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
}
