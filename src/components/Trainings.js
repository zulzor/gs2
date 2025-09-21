import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Button,
  TextInput,
  ScrollView,
} from 'react-native';
import { useCrud } from '../hooks/useCrud.js';

// Reusable Select component
const Select = ({ options, value, onValueChange, placeholder }) => (
  <select value={value || ''} onChange={(e) => onValueChange(e.target.value)} style={styles.selectInput}>
    {placeholder ? <option value="">{placeholder}</option> : null}
    {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
  </select>
);

const Trainings = () => {
  const { items: trainings, loading, createItem, updateItem, deleteItem } = useCrud('trainings');
  const { items: branches } = useCrud('branches');
  const { items: trainers } = useCrud('trainers');

  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState({
    id: null,
    title: 'Тренировка по футболу',
    branch_id: '',
    trainer_user_id: '',
    start_time: '',
    end_time: '',
    max_attendees: '',
  });

  const handleAddNew = () => {
    setCurrentItem({ id: null, title: 'Тренировка по футболу', branch_id: '', trainer_user_id: '', start_time: '', end_time: '', max_attendees: '30' });
    setIsEditing(true);
  };

  const handleEdit = (item) => {
    const sanitizedItem = {
      ...currentItem, // Start with default structure
      ...item,       // Override with fetched item data
    };
    // Ensure no null values are passed to inputs
    for (const key in sanitizedItem) {
      if (sanitizedItem[key] === null || sanitizedItem[key] === undefined) {
        sanitizedItem[key] = '';
      }
    }
    setCurrentItem(sanitizedItem);
    setIsEditing(true);
  };

  const handleDelete = async (item) => {
    if (window.confirm(`Вы уверены, что хотите удалить тренировку "${item.title}"?`)) {
      await deleteItem(item.id);
    }
  };

  const handleSave = async () => {
    const { id, title, branch_id, trainer_user_id, start_time, end_time, max_attendees } = currentItem;
    if (!title || !branch_id || !trainer_user_id || !start_time || !end_time) {
      window.alert('Название, филиал, тренер и время начала/окончания обязательны.');
      return;
    }

    try {
      if (id) {
        await updateItem(id, currentItem);
      } else {
        await createItem(currentItem);
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Save operation failed:', error);
    }
  };

  const renderTrainingItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemName}>{item.title}</Text>
        <Text style={styles.itemDetails}>Филиал: {item.branch_name}</Text>
        <Text style={styles.itemDetails}>Тренер: {item.trainer_name}</Text>
        <Text style={styles.itemDetails}>Время: {new Date(item.start_time).toLocaleString()} - {new Date(item.end_time).toLocaleTimeString()}</Text>
      </View>
      <View style={styles.buttonsContainer}>
        <Button title="Редактировать" onPress={() => handleEdit(item)} />
        <Button title="Удалить" onPress={() => handleDelete(item)} color="#D40026" />
      </View>
    </View>
  );

  if (loading) {
    return <Text>Загрузка тренировок...</Text>;
  }

  if (isEditing) {
    return (
      <ScrollView style={styles.formContainer}>
        <Text style={styles.title}>{currentItem.id ? 'Редактировать тренировку' : 'Добавить новую тренировку'}</Text>
        <TextInput style={styles.input} placeholder="Название тренировки" value={currentItem.title} onChangeText={(text) => setCurrentItem({ ...currentItem, title: text })} />
        <Select placeholder="Выберите филиал..." value={currentItem.branch_id} onValueChange={(value) => setCurrentItem({ ...currentItem, branch_id: value })} options={branches.map((b) => ({ label: b.name, value: b.id }))} />
        <Select placeholder="Выберите тренера..." value={currentItem.trainer_user_id} onValueChange={(value) => setCurrentItem({ ...currentItem, trainer_user_id: value })} options={trainers.map((t) => ({ label: `${t.first_name} ${t.last_name}`, value: t.id }))} />
        <TextInput style={styles.input} placeholder="Время начала (ГГГГ-ММ-ДД ЧЧ:ММ:СС)" value={currentItem.start_time} onChangeText={(text) => setCurrentItem({ ...currentItem, start_time: text })} />
        <TextInput style={styles.input} placeholder="Время окончания (ГГГГ-ММ-ДД ЧЧ:ММ:СС)" value={currentItem.end_time} onChangeText={(text) => setCurrentItem({ ...currentItem, end_time: text })} />
        <TextInput style={styles.input} placeholder="Макс. участников" value={currentItem.max_attendees} onChangeText={(text) => setCurrentItem({ ...currentItem, max_attendees: text })} keyboardType="numeric" />
        
        <View style={styles.formButtons}>
          <Button title="Сохранить" onPress={handleSave} />
          <Button title="Отмена" onPress={() => setIsEditing(false)} color="gray" />
        </View>
      </ScrollView>
    );
  }

  return (
    <View>
      <Text style={styles.title}>Управление тренировками</Text>
      <Button title="Добавить новую тренировку" onPress={handleAddNew} />
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
  selectInput: { height: 40, borderColor: '#ccc', borderWidth: 1, marginBottom: 12, paddingHorizontal: 8, borderRadius: 4, backgroundColor: '#fff', width: '100%' },
  formButtons: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, marginBottom: 32 },
});

export default Trainings;
