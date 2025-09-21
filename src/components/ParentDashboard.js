import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useCrud } from '../hooks/useCrud.js';
import { useAuth } from '../context/AuthContext.js';
import Progress from './Progress.js'; // Import Progress component

// Helper to generate a color based on a string (for unique avatars)
const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
};

const Avatar = ({ name }) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('');
  const avatarColor = stringToColor(name);

  return (
    <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
};

const ParentDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('children'); // 'children', 'progress', 'news'
  const [preselectedChildId, setPreselectedChildId] = useState(null);

  const handleViewProgress = (childId) => {
    setPreselectedChildId(childId);
    setActiveTab('progress');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'progress':
        // We pass the state down as a prop now
        return <Progress preselectedChildId={preselectedChildId} />;
      case 'news':
        return <Text style={styles.emptyText}>Раздел новостей в разработке.</Text>;
      case 'children':
      default:
        return <ChildrenOverview onNavigateToProgress={handleViewProgress} />;
    }
  };

  return (
    <View style={styles.container}>
        <Text style={styles.title}>Здравствуйте, {user?.firstName}!</Text>
        <View style={styles.navContainer}>
            <TouchableOpacity onPress={() => { setActiveTab('children'); setPreselectedChildId(null); }} style={[styles.navButton, activeTab === 'children' && styles.navButtonActive]}>
                <Text style={[styles.navButtonText, activeTab === 'children' && styles.navButtonTextActive]}>Мои дети</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setActiveTab('progress'); setPreselectedChildId(null); }} style={[styles.navButton, activeTab === 'progress' && styles.navButtonActive]}>
                <Text style={[styles.navButtonText, activeTab === 'progress' && styles.navButtonTextActive]}>Прогресс</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('news')} style={[styles.navButton, activeTab === 'news' && styles.navButtonActive]}>
                <Text style={[styles.navButtonText, activeTab === 'news' && styles.navButtonTextActive]}>Новости</Text>
            </TouchableOpacity>
        </View>
        <ScrollView style={styles.contentContainer}>
            {renderContent()}
        </ScrollView>
    </View>
  );
};

// This new component will hold the main view of children cards
const ChildrenOverview = ({ onNavigateToProgress }) => {
    const { items: children, loading: loadingChildren } = useCrud('children');
    const { items: subscriptions, loading: loadingSubscriptions } = useCrud('subscriptions');
    const { items: progressRecords, loading: loadingProgress } = useCrud('progress');
    const loading = loadingChildren || loadingSubscriptions || loadingProgress;

    if (loading) {
        return <Text>Загрузка данных...</Text>;
    }

    return (
        <>
            {!loading && children.length === 0 && (
                <Text style={styles.emptyText}>У вас пока нет добавленных детей. Обратитесь к менеджеру.</Text>
            )}

            {!loading && children.map((child) => {
                const childSubscription = subscriptions.find(sub => sub.child_id === child.id);
                const childProgress = progressRecords.filter(p => p.child_id === child.id);

                return (
                <View key={child.id} style={styles.childCard}>
                    <View style={styles.cardHeader}>
                        <Avatar name={`${child.first_name} ${child.last_name}`} />
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.childName}>{child.first_name} {child.last_name}</Text>
                            <Text style={styles.detailText}>Дата рождения: {child.date_of_birth}</Text>
                        </View>
                    </View>
                    
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Абонемент</Text>
                        {childSubscription ? (
                            <View>
                                <Text style={styles.sectionText}>
                                    Осталось тренировок: <Text style={styles.trainingsRemaining}>{childSubscription.trainings_remaining}</Text> / {childSubscription.trainings_total}
                                </Text>
                                <Text style={styles.sectionDetails}>Куплен: {childSubscription.purchase_date}</Text>
                                {childSubscription.expiry_date ? <Text style={styles.sectionDetails}>Истекает: {childSubscription.expiry_date}</Text> : null}
                            </View>
                        ) : (
                            <Text style={styles.sectionDetails}>Нет активного абонемента.</Text>
                        )}
                    </View>

                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Последний прогресс</Text>
                        {childProgress.length > 0 ? (
                            <>
                                {childProgress.slice(0, 2).map(p => (
                                    <View key={p.id} style={styles.progressItem}>
                                        <Text style={styles.sectionText}>{p.discipline_name}: <Text style={styles.progressValue}>{p.value}</Text> ({p.measurement_type})</Text>
                                        <Text style={styles.sectionDetails}>Дата: {p.date}</Text>
                                    </View>
                                ))}
                                <TouchableOpacity onPress={() => onNavigateToProgress(child.id)} style={styles.linkButton}>
                                    <Text style={styles.linkButtonText}>Смотреть весь прогресс →</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <Text style={styles.sectionDetails}>Пока нет записей о прогрессе.</Text>
                        )}
                    </View>
                </View>
                );
            })}
        </>
    )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
      padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
    paddingHorizontal: 16,
  },
  navContainer: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#ddd',
      paddingHorizontal: 16,
  },
  navButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 3,
      borderBottomColor: 'transparent',
  },
  navButtonActive: {
      borderBottomColor: '#063672',
  },
  navButtonText: {
      fontSize: 16,
      color: '#555',
  },
  navButtonTextActive: {
      color: '#063672',
      fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
    color: '#666',
  },
  childCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTextContainer: {
      flex: 1,
  },
  childName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#063672',
  },
  detailText: {
      fontSize: 15,
      color: '#555',
  },
  sectionContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
    marginTop: 16,
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
      marginBottom: 12,
  },
  progressValue: {
      fontWeight: 'bold',
  },
  linkButton: {
      marginTop: 12,
      alignSelf: 'flex-start',
  },
  linkButtonText: {
      color: '#063672',
      fontSize: 16,
      fontWeight: 'bold',
  }
});

export default ParentDashboard;