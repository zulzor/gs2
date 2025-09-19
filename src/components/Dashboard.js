import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useAuth } from '../context/AuthContext.js';
import { useNavigate } from 'react-router-dom';

// Import the role-specific dashboards
import ManagerDashboard from './ManagerDashboard.js';
import ParentDashboard from './ParentDashboard.js';
import TrainerDashboard from './TrainerDashboard.js';
import ChildDashboard from './ChildDashboard.js';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderDashboardByRole = () => {
    switch (user?.role) {
      case 'manager':
        return <ManagerDashboard />;
      case 'parent':
        return <ParentDashboard />;
      case 'trainer':
        return <TrainerDashboard />;
      case 'child':
        return <ChildDashboard />;
      default:
        return <Text>No dashboard available for your role.</Text>;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>GS2 Arsenal / {user?.role}</Text>
        <Button title="Logout" onPress={handleLogout} color="#D40026" />
      </View>

      <View style={styles.content}>{renderDashboardByRole()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#063672',
    borderBottomWidth: 2,
    borderBottomColor: '#9C824A',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  content: {
    flex: 1,
    padding: 16,
  },
});

export default Dashboard;
