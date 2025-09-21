import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useCrud } from '../hooks/useCrud.js';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../api.js';

const Select = ({ options, value, onValueChange, placeholder, disabled = false }) => (
  <select value={value || ''} onChange={(e) => onValueChange(e.target.value)} style={styles.selectInput} disabled={disabled}>
    {placeholder ? <option value="">{placeholder}</option> : null}
    {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
  </select>
);

const Progress = ({ preselectedChildId, onClearFilter }) => { // Accept preselectedChildId and a clear function as props
  const { user } = useAuth();

  const { items: progressRecords, loading: loadingProgress, createItem, updateItem, deleteItem } = useCrud('progress');
  const { items: children, loading: loadingChildren } = useCrud('children');
  const { items: allDisciplines, loading: loadingDisciplines } = useCrud('disciplines');
  
  const [availableTrainings, setAvailableTrainings] = useState([]);
  const [isLoadingTrainings, setIsLoadingTrainings] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [currentProgress, setCurrentProgress] = useState({
    id: null, child_id: '', discipline_id: '', training_id: '', value: '', notes: '',
  });

  const isManagerOrTrainer = user?.role === 'manager' || user?.role === 'trainer';

  useEffect(() => {
    if (isEditing && currentProgress.child_id) {
      setIsLoadingTrainings(true);
      api.get(`/trainings?child_id=${currentProgress.child_id}`)
        .then(data => {
          if (data.success) setAvailableTrainings(data.trainings || []);
        })
        .catch(err => window.alert(`Error fetching trainings: ${err.message}`))
        .finally(() => setIsLoadingTrainings(false));
    } else {
      setAvailableTrainings([]);
    }
  }, [isEditing, currentProgress.child_id]);

  const measurementType = allDisciplines.find(d => d.id == currentProgress.discipline_id)?.measurement_type || '';

  const handleAddNew = () => {
    setCurrentProgress({ 
        id: null, 
        child_id: preselectedChildId ? preselectedChildId.toString() : '', 
        discipline_id: '', 
        training_id: '', 
        value: '', 
        notes: '' 
    });
    setIsEditing(true);
  };

  const handleEdit = (record) => {
    setCurrentProgress({
      ...record,
      child_id: record.child_id.toString(),
      discipline_id: record.discipline_id.toString(),
      training_id: record.training_id ? record.training_id.toString() : '',
      value: record.value.toString(),
    });
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить эту запись о прогрессе?')) {
      await deleteItem(id);
    }
  };

  const handleSave = async () => {
    const { id, child_id, discipline_id, training_id, value, notes } = currentProgress;
    const parsedValue = parseFloat(value);

    if (!child_id || !discipline_id || !training_id || isNaN(parsedValue)) {
      window.alert('Валидация: Ребенок, тренировка, дисциплина и значение обязательны.');
      return;
    }

    const selectedTraining = availableTrainings.find(t => t.id == training_id);
    if (!selectedTraining) {
      window.alert('Ошибка: Выбранная тренировка не найдена в списке доступных.');
      return;
    }
    const date = selectedTraining.start_time.split(' ')[0];

    try {
      const dataToSave = { child_id: parseInt(child_id), discipline_id: parseInt(discipline_id), training_id: parseInt(training_id), date, value: parsedValue, notes };
      if (id) {
        await updateItem(id, dataToSave);
      } else {
        await createItem(dataToSave);
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Save operation failed:', error);
    }
  };

  const childOptions = children.map((child) => ({ label: `${child.first_name} ${child.last_name}`, value: child.id.toString() }));
  const trainingOptions = availableTrainings.map((training) => ({ label: `${training.title} - ${training.start_time}`, value: training.id.toString() }));
  const disciplineOptions = allDisciplines.map((discipline) => ({ label: discipline.name, value: discipline.id.toString() }));

  const filteredProgressRecords = preselectedChildId 
    ? progressRecords.filter(p => p.child_id.toString() === preselectedChildId.toString())
    : progressRecords;
    
  const selectedChild = preselectedChildId 
    ? children.find(c => c.id.toString() === preselectedChildId.toString()) 
    : null;

  const EmptyListComponent = () => (
    <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
            {preselectedChildId 
                ? 'Для этого ребенка пока нет записей о прогрессе.' 
                : 'Записей о прогрессе пока нет.'}
        </Text>
    </View>
  );

  if (loadingProgress || loadingChildren || loadingDisciplines) {
    return <Text>Загрузка данных...</Text>;
  }

  if (isEditing) {
    return (
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>{currentProgress.id ? 'Редактировать запись о прогрессе' : 'Создать запись о прогрессе'}</Text>
        <Select placeholder="1. Выберите ребенка..." options={childOptions} value={currentProgress.child_id} onValueChange={(value) => setCurrentProgress({ ...currentProgress, child_id: value, training_id: '', discipline_id: '' })} disabled={!!preselectedChildId} />
        <Select placeholder={isLoadingTrainings ? "Загрузка тренировок..." : "2. Выберите тренировку (для даты)..."} options={trainingOptions} value={currentProgress.training_id} onValueChange={(value) => setCurrentProgress({ ...currentProgress, training_id: value })} disabled={!currentProgress.child_id || isLoadingTrainings} />
        <Select placeholder="3. Выберите упражнение..." options={disciplineOptions} value={currentProgress.discipline_id} onValueChange={(value) => setCurrentProgress({ ...currentProgress, discipline_id: value })} disabled={!currentProgress.child_id} />
        <View style={styles.valueContainer}>
          <TextInput style={styles.input} placeholder="4. Введите значение..." keyboardType="numeric" value={currentProgress.value} onChangeText={(text) => setCurrentProgress({ ...currentProgress, value: text.replace(/[^0-9.]/g, '') })} />
          {measurementType ? <Text style={styles.unitText}>({measurementType})</Text> : null}
        </View>
        <TextInput style={styles.input} placeholder="Заметки (необязательно)" value={currentProgress.notes} onChangeText={(text) => setCurrentProgress({ ...currentProgress, notes: text })} multiline />
        <View style={styles.formButtons}>
          <Button title="Сохранить" onPress={handleSave} />
          <Button title="Отмена" onPress={() => setIsEditing(false)} color="gray" />
        </View>
      </View>
    );
  }

  const renderProgressItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemName}>{item.child_first_name} {item.child_last_name}</Text>
        <Text style={styles.itemDetails}>Дисциплина: {item.discipline_name}</Text>
        <Text style={styles.itemDetails}>Дата: {item.date}</Text>
        <Text style={styles.itemDetails}>Значение: {item.value} ({item.measurement_type})</Text>
        {item.notes ? <Text style={styles.itemDetails}>Заметки: {item.notes}</Text> : null}
      </View>
      {isManagerOrTrainer ? (
        <View style={styles.buttonsContainer}>
            <Button title="Редактировать" onPress={() => handleEdit(item)} />
            <Button title="Удалить" onPress={() => handleDelete(item.id)} color="#D40026" />
        </View>
      ) : null}
    </View>
  );

  return (
    <View>
      <Text style={styles.title}>
        {user?.role === 'parent' ? 'Отслеживание прогресса' : 'Управление прогрессом'}
      </Text>
      
      {selectedChild ? (
        <View style={styles.filterHeader}>
          <Text style={styles.filterTitle}>Прогресс для: {selectedChild.first_name} {selectedChild.last_name}</Text>
          {onClearFilter ? <Button title="Показать всех" onPress={onClearFilter} /> : null}
        </View>
      ) : null}

      {isManagerOrTrainer ? <Button title="Добавить новую запись о прогрессе" onPress={handleAddNew} /> : null}
      <FlatList 
        data={filteredProgressRecords} 
        renderItem={renderProgressItem} 
        keyExtractor={(item) => item.id.toString()} 
        style={styles.list}
        ListEmptyComponent={EmptyListComponent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  list: { marginTop: 16 },
  itemContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 12, marginBottom: 8, borderRadius: 5, borderLeftWidth: 5, borderLeftColor: '#063672' },
  itemTextContainer: { flex: 1 },
  itemName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  itemDetails: { fontSize: 14, color: '#666' },
  buttonsContainer: { flexDirection: 'row', gap: 8 },
  formContainer: { padding: 16, backgroundColor: '#f8f8f8', borderRadius: 8 },
  input: { flex: 1, height: 40, borderColor: '#ccc', borderWidth: 1, paddingHorizontal: 8, borderRadius: 4, backgroundColor: '#fff' },
  selectInput: { height: 40, borderColor: '#ccc', borderWidth: 1, marginBottom: 12, paddingHorizontal: 8, borderRadius: 4, backgroundColor: '#fff', width: '100%' },
  formButtons: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
  formTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  valueContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  unitText: { marginLeft: 8, fontSize: 16, color: '#666' },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#e7f3ff',
    borderRadius: 5,
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#063672',
  },
  emptyContainer: {
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default Progress;