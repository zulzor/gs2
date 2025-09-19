import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useCrud } from '../hooks/useCrud.js';
import { useAuth } from '../context/AuthContext.js';

const ParentDashboard = () => {
  const { user } = useAuth();
  const { items: children, loading: loadingChildren } = useCrud('children');
  const { items: subscriptions, loading: loadingSubscriptions } = useCrud('subscriptions');
  const { items: progressRecords, loading: loadingProgress } = useCrud('progress');

  console.log('ParentDashboard user:', user);

  const loading = loadingChildren || loadingSubscriptions || loadingProgress;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Здравствуйте, {user?.firstName}!</Text>
      <Text style={styles.subtitle}>Обзор по вашим детям</Text>

      {loading && <Text>Загрузка данных...</Text>}

      {!loading && children.length === 0 && (
        <Text style={styles.emptyText}>У вас пока нет добавленных детей. Обратитесь к менеджеру.</Text>
      )}

      {!loading && children.map((child) => {
        const childSubscription = subscriptions.find(sub => sub.child_id === child.id);
        const childProgress = progressRecords.filter(p => p.child_id === child.id);

        return (
          <View key={child.id} style={styles.childCard}>
            <Text style={styles.childName}>{child.first_name} {child.last_name}</Text>
            <View style={styles.detailsContainer}>
                <Text style={styles.detailText}>Дата рождения: {child.date_of_birth}</Text>
                <Text style={styles.detailText}>Филиал: {child.branch_name || 'Не указан'}</Text>
            </View>
            
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Абонемент</Text>
                {childSubscription ? (
                    <View>
                        <Text style={styles.sectionText}>
                            Осталось тренировок: <Text style={styles.trainingsRemaining}>{childSubscription.trainings_remaining}</Text> / {childSubscription.trainings_total}
                        </Text>
                        <Text style={styles.sectionDetails}>Куплен: {childSubscription.purchase_date}</Text>
                        {childSubscription.expiry_date && <Text style={styles.sectionDetails}>Истекает: {childSubscription.expiry_date}</Text>}
                    </View>
                ) : (
                    <Text style={styles.sectionDetails}>Нет активного абонемента.</Text>
                )}
            </View>

            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Последний прогресс</Text>
                {childProgress.length > 0 ? (
                    childProgress.slice(0, 5).map(p => ( // Show latest 5 records
                        <View key={p.id} style={styles.progressItem}>
                            <Text style={styles.sectionText}>{p.discipline_name}: <Text style={styles.progressValue}>{p.value}</Text> ({p.measurement_type})</Text>
                            <Text style={styles.sectionDetails}>Дата: {p.date}</Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.sectionDetails}>Пока нет записей о прогрессе.</Text>
                )}
            </View>

          </View>
        );
      })}
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
  childCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  childName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#063672',
  },
  detailsContainer: {
      marginBottom: 16,
  },
  detailText: {
      fontSize: 16,
      color: '#555',
      marginBottom: 4,
  },
  sectionContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  sectionText: {
      fontSize: 16,
      color: '#555',
  },
  trainingsRemaining: {
      fontWeight: 'bold',
      fontSize: 18,
      color: '#28a745',
  },
  sectionDetails: {
      fontSize: 14,
      color: '#777',
      marginTop: 4,
  },
  progressItem: {
      marginBottom: 10,
  },
  progressValue: {
      fontWeight: 'bold',
  }
});

export default ParentDashboard;
