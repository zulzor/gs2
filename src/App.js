import React from 'react';
import { Text } from 'react-native';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { useAuth } from './context/AuthContext.js';
import Login from './components/Login.js';
import Dashboard from './components/Dashboard.js';
import Branches from './components/Branches.js';
import Children from './components/Children.js';
import Trainers from './components/Trainers.js';
import Trainings from './components/Trainings.js';
import Parents from './components/Parents.js';
import Disciplines from './components/Disciplines.js';
import Progress from './components/Progress.js';
import Subscriptions from './components/Subscriptions.js';

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
                  <Route
                    index
                    element={
                      <Text>
                        Welcome to your dashboard! Select a section to start.
                      </Text>
                    }
                  />
                  <Route path="branches" element={<Branches />} />
                  <Route path="children" element={<Children />} />
                  <Route path="trainers" element={<Trainers />} />
                  <Route path="trainings" element={<Trainings />} />
                  <Route path="parents" element={<Parents />} />
                  <Route path="disciplines" element={<Disciplines />} />
                  <Route path="progress" element={<Progress />} />
                  <Route path="subscriptions" element={<Subscriptions />} />
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
