import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Link, Outlet } from 'react-router-dom';

const ManagerDashboard = () => {
  return (
    <View>
      {/* Navigation for the manager dashboard */}
      <View style={styles.nav}>
        <Link to="/branches" style={styles.navLink}>
          Филиалы
        </Link>
        <Link to="/children" style={styles.navLink}>
          Дети
        </Link>
        <Link to="/parents" style={styles.navLink}>
          Родители
        </Link>
        <Link to="/trainers" style={styles.navLink}>
          Тренеры
        </Link>
        <Link to="/trainings" style={styles.navLink}>
          Тренировки
        </Link>
        <Link to="/disciplines" style={styles.navLink}>
          Дисциплины
        </Link>
        <Link to="/progress" style={styles.navLink}>
          Прогресс
        </Link>
        <Link to="/subscriptions" style={styles.navLink}>
          Абонементы
        </Link>
      </View>

      <View style={styles.content}>
        {/* Nested routes will be rendered here */}
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
    gap: 16, // Use gap for spacing
  },
  navLink: {
    fontSize: 16,
    color: '#063672',
    textDecorationLine: 'none',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    // padding: 16, // Padding is handled by the parent Dashboard
  },
});

export default ManagerDashboard;
