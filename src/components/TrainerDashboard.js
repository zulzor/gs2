import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Button, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../api.js';
import Progress from './Progress.js'; // Import Progress component

const TrainerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('schedule'); // 'schedule', 'progress'
  const [preselectedChildId, setPreselectedChildId] = useState(null);

  const handleViewProgress = (childId) => {
    setPreselectedChildId(childId);
    setActiveTab('progress');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'progress':
        return <Progress preselectedChildId={preselectedChildId} onClearFilter={() => setPreselectedChildId(null)} />;
      case 'schedule':
      default:
        return <ScheduleView onNavigateToProgress={handleViewProgress} />;
    }
  };

  return (
    <View style={styles.container}>
        <Text style={styles.title}>Здравствуйте, {user?.firstName}!</Text>
        <View style={styles.navContainer}>
            <TouchableOpacity onPress={() => { setActiveTab('schedule'); setPreselectedChildId(null); }} style={[styles.navButton, activeTab === 'schedule' && styles.navButtonActive]}>
                <Text style={[styles.navButtonText, activeTab === 'schedule' && styles.navButtonTextActive]}>Расписание</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setActiveTab('progress'); setPreselectedChildId(null); }} style={[styles.navButton, activeTab === 'progress' && styles.navButtonActive]}>
                <Text style={[styles.navButtonText, activeTab === 'progress' && styles.navButtonTextActive]}>Прогресс</Text>
            </TouchableOpacity>
        </View>
        <ScrollView style={styles.contentContainer}>
            {renderContent()}
        </ScrollView>
    </View>
  );
};

// This new component will hold the schedule view
const ScheduleView = ({ onNavigateToProgress }) => {
    const { user } = useAuth();
    const [trainings, setTrainings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTrainingId, setSelectedTrainingId] = useState(null);
    const [attendees, setAttendees] = useState([]);
    const [loadingAttendees, setLoadingAttendees] = useState(false);

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

    const toggleAttendees = (trainingId) => {
        if (selectedTrainingId === trainingId) {
            setSelectedTrainingId(null);
            setAttendees([]);
        } else {
            setLoadingAttendees(true);
            setSelectedTrainingId(trainingId);
            api.get(`/attendance?training_id=${trainingId}`)
                .then(data => {
                if (data.success) {
                    const initialAttendees = data.attendees.map(att => ({...att, status: att.status || 'absent'}));
                    setAttendees(initialAttendees);
                } else {
                    alert('Не удалось загрузить список участников.');
                }
                })
                .catch(error => alert('Произошла ошибка при загрузке участников.'))
                .finally(() => setLoadingAttendees(false));
        }
    };

    const handleAttendanceChange = (childId, newStatus) => {
        setAttendees(currentAttendees => 
            currentAttendees.map(attendee => 
                attendee.child_id === childId ? { ...attendee, status: newStatus } : attendee
            )
        );
    };

    const handleSaveAttendance = () => {
        const attendanceData = attendees.map(a => ({ child_id: a.child_id, status: a.status }));
        api.post(`/attendance?training_id=${selectedTrainingId}`, { attendees: attendanceData })
            .then(data => {
                if(data.success) {
                    alert('Посещаемость успешно сохранена!');
                    setSelectedTrainingId(null);
                } else {
                    alert(`Ошибка: ${data.message}`);
                }
            })
            .catch(err => alert('Не удалось сохранить посещаемость.'));
    };

    const renderTrainingItem = ({ item }) => {
        const now = new Date();
        const startTime = new Date(item.start_time);
        const isUpcoming = startTime > now;
        const isSelected = selectedTrainingId === item.id;

        return (
        <View style={[styles.itemContainer, isUpcoming ? styles.upcomingItem : styles.pastItem]}>
            <View style={styles.itemTextContainer}>
            <Text style={styles.itemName}>{item.title}</Text>
            <Text style={styles.itemDetails}>Филиал: {item.branch_name}</Text>
            <Text style={styles.itemDetails}>
                Время: {startTime.toLocaleString('ru-RU')} - {new Date(item.end_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </Text>
            </View>
            <View style={styles.buttonsContainer}>
                {isUpcoming ? <Text style={styles.statusPill}>Предстоящая</Text> : null}
                <Button title={isSelected ? "Скрыть" : "Участники"} onPress={() => toggleAttendees(item.id)} />
            </View>
            {isSelected && (
                <View style={styles.attendeesContainer}>
                    {loadingAttendees ? (
                        <ActivityIndicator color="#063672" />
                    ) : attendees.length > 0 ? (
                        <>
                            {attendees.map(attendee => (
                                <View key={attendee.child_id} style={styles.attendeeItem}>
                                    <Text style={styles.attendeeName}>{attendee.child_name}</Text>
                                    <View style={styles.actionsContainer}>
                                        <TouchableOpacity onPress={() => onNavigateToProgress(attendee.child_id)} style={styles.progressButton}>
                                            <Text style={styles.progressButtonText}>Прогресс</Text>
                                        </TouchableOpacity>
                                        <View style={styles.switchContainer}>
                                            <Text>Присутствовал</Text>
                                            <Switch 
                                                value={attendee.status === 'present'}
                                                onValueChange={(value) => handleAttendanceChange(attendee.child_id, value ? 'present' : 'absent')}
                                            />
                                        </View>
                                    </View>
                                </View>
                            ))}
                            <Button title="Сохранить посещаемость" onPress={handleSaveAttendance} />
                        </>
                    ) : (
                        <Text style={styles.attendeeName}>Нет записанных участников.</Text>
                    )}
                </View>
            )}
        </View>
        );
    };

    if (loading) {
        return <ActivityIndicator size="large" color="#063672" style={{ marginTop: 20 }} />;
    }

    return (
        <FlatList
            data={trainings}
            renderItem={renderTrainingItem}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={<Text style={styles.emptyText}>У вас нет назначенных тренировок.</Text>}
        />
    );
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
  itemContainer: {
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
    marginBottom: 10,
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
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
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
  attendeesContainer: {
      marginTop: 15,
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor: '#eee',
  },
  attendeeItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
  },
  attendeeName: {
      fontSize: 16,
  },
  actionsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
  },
  progressButton: {
      backgroundColor: '#063672',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 5,
  },
  progressButtonText: {
      color: '#fff',
      fontWeight: '500',
  },
  switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
  }
});

export default TrainerDashboard;