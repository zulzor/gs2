import React from 'react';
import { Text } from 'react-native';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Branches from './components/Branches';
import Children from './components/Children';
import Trainers from './components/Trainers';
import Trainings from './components/Trainings';
import Parents from './components/Parents';

// Компонент для защиты маршрутов
const ProtectedRoute = ({ children }) => {
    const { isLoggedIn } = useAuth();
    return isLoggedIn ? children : <Navigate to="/login" />;
};

const App = () => {
    const { isLoggedIn } = useAuth();

    return (
        <Router>
            <Routes>
                <Route 
                    path="/login" 
                    element={isLoggedIn ? <Navigate to="/" /> : <Login />} 
                />
                <Route 
                    path="/*" // All other routes are handled by the Dashboard
                    element={
                        <ProtectedRoute>
                            <Routes>
                                <Route path="/" element={<Dashboard />}>
                                    {/* Nested Routes within Dashboard */}
                                    <Route index element={<Text>Welcome to your dashboard! Select a section to start.</Text>} />
                                    <Route path="branches" element={<Branches />} />
                                    <Route path="children" element={<Children />} />
                                    <Route path="trainers" element={<Trainers />} />
                                    <Route path="trainings" element={<Trainings />} />
                                    <Route path="parents" element={<Parents />} />
                                </Route>
                            </Routes>
                        </ProtectedRoute>
                    } 
                />
            </Routes>
        </Router>
    );
};

export default App;