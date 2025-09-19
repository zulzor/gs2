import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../api.js';

const TrainerDashboard = () => {
  const { user } = useAuth();
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      api.get(`/trainings?trainer_id=${user.id}`)
        .then(data => {
          if (data.success) {
            setTrainings(data.trainings);
          } else {
            console.error("Failed to fetch trainings:", data.message);
          }
        })
        .catch(error => console.error("Error fetching trainings:", error))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const renderTrainingItem = ({ item }) => {
    const now = new Date();
    const startTime = new Date(item.start_time);
    const isUpcoming = startTime > now;

    return (
      <View style={[styles.itemContainer, isUpcoming ? styles.upcomingItem : styles.pastItem]}>
        <View style={styles.itemTextContainer}>
          <Text style={styles.itemName}>{item.title}</Text>
          <Text style={styles.itemDetails}>Филиал: {item.branch_name}</Text>
          <Text style={styles.itemDetails}>
            Время: {startTime.toLocaleString('ru-RU')} - {new Date(item.end_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        {isUpcoming && <Text style={styles.statusPill}>Предстоящая</Text>}
      </View>
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#063672" style={{ marginTop: 20 }} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Здравствуйте, {user?.firstName}!</Text>
      <Text style={styles.subtitle}>Ваши тренировки</Text>
      <FlatList
        data={trainings}
        renderItem={renderTrainingItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text style={styles.emptyText}>У вас нет назначенных тренировок.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 24,
    color: '#555',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
    color: '#666',
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 5,
  },
  upcomingItem: {
    borderLeftColor: '#28a745', // Green for upcoming
  },
  pastItem: {
    borderLeftColor: '#6c757d', // Gray for past
    opacity: 0.7,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusPill: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#28a745',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
});

export default TrainerDashboard;