import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useStore } from './store';
import { getMe } from './api';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import CognitiveForm from './components/CognitiveForm';
import EnergyForm from './components/EnergyForm';
import Schedule from './components/Schedule';
import Navbar from './components/Navbar';
import type { ReactNode } from 'react';
import Chatbot from './components/Chatbot';

function PrivateRoute({ children }: { children: ReactNode }) {
    const isAuthenticated = useStore((state) => state.isAuthenticated);
    return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
    const { isAuthenticated, user, setUser, logout } = useStore();
    const [loading, setLoading] = useState(true);

    // Load user data on app initialization if token exists
    useEffect(() => {
        const loadUser = async () => {
            if (isAuthenticated && !user) {
                try {
                    const userData = await getMe();
                    setUser(userData);
                } catch (err) {
                    console.error('Failed to load user data:', err);
                    // Token might be invalid, logout
                    logout();
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };
        loadUser();
    }, [isAuthenticated, user, setUser, logout]);

    // Show loading spinner while fetching user data
    if (loading && isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-sky-400 mx-auto mb-4"></div>
                    <p className="text-gray-400 text-lg">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <BrowserRouter>
            <div className="min-h-screen">
                {isAuthenticated && <Navbar />}
                <main className={isAuthenticated ? 'pt-16' : ''}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route
                            path="/"
                            element={
                                <PrivateRoute>
                                    <Dashboard />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/cognitive"
                            element={
                                <PrivateRoute>
                                    <CognitiveForm />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/energy"
                            element={
                                <PrivateRoute>
                                    <EnergyForm />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/schedule"
                            element={
                                <PrivateRoute>
                                    <Schedule />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/chatbot"
                            element={
                                <PrivateRoute>
                                    <Chatbot />
                                </PrivateRoute>
                            }
                        />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}

export default App;
