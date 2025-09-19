import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Link, Outlet } from 'react-router-dom';

const TrainerDashboard = () => {
  return (
    <View>
      <View style={styles.nav}>
        <Link to="/progress" style={styles.navLink}>
          Прогресс
        </Link>
        {/* Add other trainer-specific links here */}
      </View>
      <View style={styles.content}>
        <Outlet />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    gap: 16,
  },
  navLink: {
    fontSize: 16,
    color: '#063672',
    textDecorationLine: 'none',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
});

export default TrainerDashboard;
