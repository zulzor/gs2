import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useCrud } from '../hooks/useCrud.js';
import { useAuth } from '../context/AuthContext.js';

const ChildDashboard = () => {
  const { user } = useAuth();
  const { items: progressRecords, loading: loadingProgress } = useCrud('progress');

  if (loadingProgress) {
    return <Text>Загрузка данных...</Text>;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Привет, {user?.firstName}!</Text>
      <Text style={styles.subtitle}>Твой прогресс</Text>

      {progressRecords.length === 0 ? (
        <Text style={styles.emptyText}>Пока нет записей о твоем прогрессе.</Text>
      ) : (
        progressRecords.map(p => (
          <View key={p.id} style={styles.progressItemCard}>
            <Text style={styles.disciplineName}>{p.discipline_name}</Text>
            <Text style={styles.progressDetail}>Дата: {p.date}</Text>
            <Text style={styles.progressDetail}>Значение: <Text style={styles.progressValue}>{p.value}</Text> ({p.measurement_type})</Text>
            {p.notes ? <Text style={styles.progressDetail}>Заметки: {p.notes}</Text> : null}
          </View>
        ))
      )}
    </ScrollView>
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
  progressItemCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disciplineName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#063672',
  },
  progressDetail: {
    fontSize: 15,
    color: '#555',
    marginBottom: 3,
  },
  progressValue: {
    fontWeight: 'bold',
    color: '#28a745',
  },
});

export default ChildDashboard;
