import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Outlet, Link } from 'react-router-dom';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login'); // Redirect after logout
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Welcome, {user?.firstName || user?.role}!</Text>
                <Button title="Logout" onPress={handleLogout} color="#D40026" />
            </View>
            
            {/* Basic Navigation for the dashboard */}
            <View style={styles.nav}>
                <Link to="/branches" style={styles.navLink}>Branches</Link>
                <Link to="/children" style={styles.navLink}>Children</Link>
                <Link to="/trainers" style={styles.navLink}>Trainers</Link>
                <Link to="/trainings" style={styles.navLink}>Trainings</Link>
                <Link to="/parents" style={styles.navLink}>Parents</Link>
            </View>

            <View style={styles.content}>
                {/* Nested routes will be rendered here */}
                <Outlet />
            </View>
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
    },
    nav: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    navLink: {
        marginRight: 16,
        fontSize: 16,
        color: '#063672',
        textDecorationLine: 'none', // Correct property for React Native Web
    },
    content: {
        flex: 1,
        padding: 16,
    },
});

export default Dashboard;