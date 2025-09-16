import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Button, TextInput } from 'react-native';
import { api } from '../api';

// A simple Select component for web
const Select = ({ options, value, onValueChange, placeholder }) => (
  <select 
    value={value || ''} 
    onChange={(e) => onValueChange(e.target.value)} 
    style={{ height: 40, borderColor: '#ccc', borderWidth: 1, marginBottom: 12, paddingHorizontal: 8, borderRadius: 4, backgroundColor: '#fff' }}
  >
    {placeholder && <option value="" disabled>{placeholder}</option>}
    {options.map(option => (
      <option key={option.value} value={option.value}>{option.label}</option>
    ))}
  </select>
);

const Trainings = () => {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [currentTraining, setCurrentTraining] = useState({ id: null, branch_id: null, discipline_id: null, trainer_user_id: null, start_time: '', end_time: '', max_attendees: '' });

  // Data for dropdowns
  const [branches, setBranches] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [disciplines, setDisciplines] = useState([]);

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchFormData = async () => {
    try {
      const [branchesData, trainersData, disciplinesData] = await Promise.all([
        api.get('/branches.php'),
        api.get('/trainers.php'),
        api.get('/disciplines.php'),
      ]);
      setBranches(branchesData.branches || []);
      setTrainers(trainersData.trainers || []);
      setDisciplines(disciplinesData.disciplines || []);
    } catch (error) {
      window.alert("Error fetching form data: " + error.message);
    }
  };

  const fetchTrainings = async () => {
    try {
      setLoading(true);
      const data = await api.get('/trainings.php');
      if (data.success) {
        setTrainings(data.trainings);
      } else {
        window.alert("Error: Failed to fetch trainings.");
      }
    } catch (error) {
      window.alert("Error: " + (error.message || "An unexpected error occurred."));
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    fetchFormData();
    setCurrentTraining({ id: null, branch_id: null, discipline_id: null, trainer_user_id: null, start_time: '', end_time: '', max_attendees: '' });
    setIsEditing(true);
  };

  const handleEdit = (training) => {
    fetchFormData();
    setCurrentTraining(training);
    setIsEditing(true);
  };

  const handleDelete = async (training) => {
    if (window.confirm(`Are you sure you want to delete this training?`)) {
      try {
        await api.delete(`/trainings.php?id=${training.id}`);
        fetchTrainings();
      } catch (error) {
        window.alert("Error: " + (error.message || "Failed to delete training."));
      }
    }
  };

  const handleSave = async () => {
    if (!currentTraining.branch_id || !currentTraining.discipline_id || !currentTraining.trainer_user_id || !currentTraining.start_time || !currentTraining.end_time) {
      window.alert("Please fill out all required fields.");
      return;
    }

    try {
      if (currentTraining.id) {
        await api.put(`/trainings.php?id=${currentTraining.id}`, currentTraining);
      } else {
        await api.post('/trainings.php', currentTraining);
      }
      fetchTrainings();
      setIsEditing(false);
    } catch (error) {
      window.alert("Error: " + (error.message || "Failed to save training."));
    }
  };

  const renderTrainingItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemName}>{item.discipline_name}</Text>
        <Text style={styles.itemDetails}>Branch: {item.branch_name}</Text>
        <Text style={styles.itemDetails}>Trainer: {item.trainer_name}</Text>
        <Text style={styles.itemDetails}>Time: {new Date(item.start_time).toLocaleString()} - {new Date(item.end_time).toLocaleTimeString()}</Text>
        <Text style={styles.itemDetails}>Max Attendees: {item.max_attendees}</Text>
      </View>
      <View style={styles.buttonsContainer}>
        <Button title="Edit" onPress={() => handleEdit(item)} />
        <Button title="Delete" onPress={() => handleDelete(item)} color="#D40026" />
      </View>
    </View>
  );

  if (loading) {
    return <Text>Loading trainings...</Text>;
  }

  if (isEditing) {
    return (
      <View style={styles.formContainer}>
        <Text style={styles.title}>{currentTraining.id ? 'Edit Training' : 'Add New Training'}</Text>
        <Select placeholder="Select Branch..." value={currentTraining.branch_id} onValueChange={(value) => setCurrentTraining({ ...currentTraining, branch_id: value })} options={branches.map(b => ({ label: b.name, value: b.id }))} />
        <Select placeholder="Select Discipline..." value={currentTraining.discipline_id} onValueChange={(value) => setCurrentTraining({ ...currentTraining, discipline_id: value })} options={disciplines.map(d => ({ label: d.name, value: d.id }))} />
        <Select placeholder="Select Trainer..." value={currentTraining.trainer_user_id} onValueChange={(value) => setCurrentTraining({ ...currentTraining, trainer_user_id: value })} options={trainers.map(t => ({ label: `${t.first_name} ${t.last_name}`, value: t.id }))} />
        <TextInput style={styles.input} placeholder="Start Time (YYYY-MM-DD HH:MM:SS)" value={currentTraining.start_time} onChangeText={(text) => setCurrentTraining({ ...currentTraining, start_time: text })} />
        <TextInput style={styles.input} placeholder="End Time (YYYY-MM-DD HH:MM:SS)" value={currentTraining.end_time} onChangeText={(text) => setCurrentTraining({ ...currentTraining, end_time: text })} />
        <TextInput style={styles.input} placeholder="Max Attendees" value={currentTraining.max_attendees} onChangeText={(text) => setCurrentTraining({ ...currentTraining, max_attendees: text })} keyboardType="numeric" />
        <View style={styles.formButtons}>
          <Button title="Save" onPress={handleSave} />
          <Button title="Cancel" onPress={() => setIsEditing(false)} color="gray" />
        </View>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.title}>Manage Trainings</Text>
      <Button title="Add New Training" onPress={handleAddNew} />
      <FlatList data={trainings} renderItem={renderTrainingItem} keyExtractor={(item) => item.id.toString()} style={styles.list} />
    </View>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  list: { marginTop: 16 },
  itemContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 12, marginBottom: 8, borderRadius: 5, borderLeftWidth: 5, borderLeftColor: '#063672' },
  itemTextContainer: { flex: 1 },
  itemName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  itemDetails: { fontSize: 14, color: '#666', marginTop: 4 },
  buttonsContainer: { flexDirection: 'row', gap: 8 },
  formContainer: { padding: 16, backgroundColor: '#f8f8f8', borderRadius: 8 },
  input: { height: 40, borderColor: '#ccc', borderWidth: 1, marginBottom: 12, paddingHorizontal: 8, borderRadius: 4, backgroundColor: '#fff' },
  formButtons: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
});

export default Trainings;