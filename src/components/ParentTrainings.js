import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Button, ActivityIndicator, Modal, TouchableOpacity } from 'react-native';
import { useCrud } from '../hooks/useCrud.js';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../api.js';

const ParentTrainings = () => {
  const { user } = useAuth();
  const { items: trainings, loading: loadingTrainings } = useCrud('trainings');
  const { items: children, loading: loadingChildren } = useCrud('children');
  
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [selectedChildId, setSelectedChildId] = useState('');

  useEffect(() => {
    if (user?.id) {
      api.get(`/attendance?parent_user_id=${user.id}`)
        .then(data => {
          if (data.success) {
            setAttendanceHistory(data.history || []);
          }
        })
        .catch(err => console.error("Failed to fetch attendance history", err))
        .finally(() => setLoadingHistory(false));
    }
  }, [user]);

  const handleOpenModal = (training) => {
    setSelectedTraining(training);
    // Set default selection to the first child, if available
    if (children.length > 0) {
        setSelectedChildId(children[0].id.toString());
    }
    setModalVisible(true);
  };

  const handleSignUp = async () => {
    if (!selectedChildId) {
        alert('Пожалуйста, выберите ребенка.');
        return;
    }
    try {
        const response = await api.post(`/attendance?training_id=${selectedTraining.id}`, { child_id: selectedChildId });
        if (response.success) {
            alert(response.message);
            setModalVisible(false);
            // Refresh history after signing up
            setLoadingHistory(true);
            api.get(`/attendance?parent_user_id=${user.id}`).then(data => {
                if (data.success) setAttendanceHistory(data.history || []);
            }).finally(() => setLoadingHistory(false));
        } else {
            alert(`Ошибка: ${response.message || 'Не удалось записаться'}`);
        }
    } catch (error) {
        alert('Не удалось выполнить запись.');
        console.error("Sign up error:", error);
    }
  };

  const getEnrollmentStatus = (trainingId) => {
      const enrollment = attendanceHistory.find(h => h.training_id.toString() === trainingId.toString());
      if (!enrollment) return null;
      const child = children.find(c => c.id.toString() === enrollment.child_id.toString());
      return { status: enrollment.status, childName: child ? `${child.first_name} ${child.last_name}` : '' };
  }

  const renderTrainingItem = ({ item }) => {
    const now = new Date();
    const startTime = new Date(item.start_time);
    const isUpcoming = startTime > now;

    if (!isUpcoming) return null;

    const enrollment = getEnrollmentStatus(item.id);

    return (
      <View style={styles.itemContainer}>
        <View style={styles.itemTextContainer}>
          <Text style={styles.itemName}>{item.title}</Text>
          <Text style={styles.itemDetails}>Филиал: {item.branch_name}</Text>
          <Text style={styles.itemDetails}>Тренер: {item.trainer_name}</Text>
          <Text style={styles.itemDetails}>Время: {startTime.toLocaleString('ru-RU')}</Text>
        </View>
        <View style={styles.buttonsContainer}>
          {enrollment ? (
              <Text style={styles.enrolledText}>Вы записаны ({enrollment.childName})</Text>
          ) : (
            <Button title="Записаться" onPress={() => handleOpenModal(item)} />
          )}
        </View>
      </View>
    );
  };
  
  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyItemContainer}>
        <Text style={styles.itemName}>{item.training_title}</Text>
        <Text style={styles.itemDetails}>Ребенок: {item.child_first_name} {item.child_last_name}</Text>
        <Text style={styles.itemDetails}>Дата: {new Date(item.start_time).toLocaleDateString('ru-RU')}</Text>
        <Text style={[styles.statusPill, styles[item.status]]}>{item.status}</Text>
    </View>
  );

  if (loadingTrainings || loadingChildren || loadingHistory) {
    return <ActivityIndicator size="large" color="#063672" style={{ marginTop: 20 }} />;
  }

  const upcomingTrainings = trainings.filter(t => new Date(t.start_time) > new Date());

  return (
    <View>
      <Text style={styles.title}>Доступные тренировки</Text>
      <FlatList
        data={upcomingTrainings}
        renderItem={renderTrainingItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text style={styles.emptyText}>Нет доступных тренировок.</Text>}
      />

      <Text style={[styles.title, {marginTop: 32}]}>История записей</Text>
      <FlatList
        data={attendanceHistory}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => `${item.training_id}-${item.child_id}`}
        ListEmptyComponent={<Text style={styles.emptyText}>История посещений пуста.</Text>}
      />

      {selectedTraining && (
        <Modal
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
            animationType="fade"
        >
            <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Записать ребенка на тренировку</Text>
                <Text style={styles.modalTrainingInfo}>{selectedTraining.title} ({new Date(selectedTraining.start_time).toLocaleDateString()})</Text>
                <select value={selectedChildId} onChange={(e) => setSelectedChildId(e.target.value)} style={styles.selectInput}>
                    {children.map(child => (
                        <option key={child.id} value={child.id.toString()}>
                            {child.first_name} {child.last_name}
                        </option>
                    ))}
                </select>
                <View style={styles.modalButtons}>
                    <Button title="Подтвердить запись" onPress={handleSignUp} />
                    <Button title="Отмена" onPress={() => setModalVisible(false)} color="gray" />
                </View>
            </View>
            </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  emptyText: { fontSize: 16, textAlign: 'center', marginTop: 20, color: '#666' },
  itemContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, marginBottom: 12, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  itemTextContainer: { flex: 1 },
  itemName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  itemDetails: { fontSize: 14, color: '#666', marginTop: 4 },
  buttonsContainer: { flexDirection: 'row', gap: 8 },
  enrolledText: { fontSize: 16, color: '#28a745', fontWeight: 'bold' },
  // History
  historyItemContainer: { backgroundColor: '#fff', padding: 16, marginBottom: 12, borderRadius: 8, opacity: 0.8 },
  statusPill: { alignSelf: 'flex-start', marginTop: 8, fontSize: 12, fontWeight: 'bold', color: '#fff', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, overflow: 'hidden' },
  present: { backgroundColor: '#28a745' },
  absent: { backgroundColor: '#dc3545' },
  excused: { backgroundColor: '#6c757d' },
  enrolled: { backgroundColor: '#17a2b8' },
  // Modal Styles
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: { backgroundColor: 'white', borderRadius: 8, padding: 20, width: '90%', maxWidth: 400, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  modalTrainingInfo: { fontSize: 16, marginBottom: 20, color: '#555' },
  selectInput: { height: 40, width: '100%', borderColor: '#ccc', borderWidth: 1, marginBottom: 20, paddingHorizontal: 8, borderRadius: 4 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-around' },
});

export default ParentTrainings;