import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Button, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../api.js';
import { useNavigate } from 'react-router-dom';

const TrainerSchedule = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
            setAttendees(data.attendees);
          } else {
            console.error("Failed to fetch attendees:", data.message);
            alert('Не удалось загрузить список участников.');
          }
        })
        .catch(error => {
            console.error("Error fetching attendees:", error);
            alert('Произошла ошибка при загрузке участников.');
        })
        .finally(() => setLoadingAttendees(false));
    }
  };

  const handleGoToProgress = (childId) => {
      navigate('/progress', { state: { preselectedChildId: childId } });
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
                    attendees.map(attendee => (
                        <View key={attendee.id} style={styles.attendeeItem}>
                            <Text style={styles.attendeeName}>{attendee.first_name} {attendee.last_name}</Text>
                            <TouchableOpacity onPress={() => handleGoToProgress(attendee.id)} style={styles.progressButton}>
                                <Text style={styles.progressButtonText}>Прогресс</Text>
                            </TouchableOpacity>
                        </View>
                    ))
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
    <View style={styles.container}>
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
  progressButton: {
      backgroundColor: '#063672',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 5,
  },
  progressButtonText: {
      color: '#fff',
      fontWeight: '500',
  }
});

export default TrainerSchedule;
