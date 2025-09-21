import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useCrud } from '../hooks/useCrud.js';

// A simple Select component for web (reusing from Children.js/Trainers.js)
const Select = ({ options, value, onValueChange, placeholder }) => (
  <select
    value={value || ''}
    onChange={(e) => onValueChange(e.target.value)}
    style={{
      height: 40,
      borderColor: '#ccc',
      borderWidth: 1,
      marginBottom: 12,
      paddingHorizontal: 8,
      borderRadius: 4,
      backgroundColor: '#fff',
    }}
  >
    {placeholder && (
      <option value="" disabled>
        {placeholder}
      </option>
    )}
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

const Disciplines = () => {
  const {
    items: disciplines,
    loading,
    createItem,
    updateItem,
    deleteItem,
  } = useCrud('disciplines');

  const [isEditing, setIsEditing] = useState(false);
  const [currentDiscipline, setCurrentDiscipline] = useState({
    id: null,
    name: '',
    measurement_type: '',
  });

  const handleAddNew = () => {
    setCurrentDiscipline({ id: null, name: '', measurement_type: '' });
    setIsEditing(true);
  };

  const handleEdit = (discipline) => {
    setCurrentDiscipline(discipline);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить эту дисциплину?')) {
      await deleteItem(id);
    }
  };

  const handleSave = async () => {
    const { id, name, measurement_type } = currentDiscipline;
    if (!name || !measurement_type) {
      window.alert(
        'Валидация: Название дисциплины и тип измерения обязательны.'
      );
      return;
    }

    try {
      if (id) {
        await updateItem(id, { name, measurement_type });
      } else {
        await createItem({ name, measurement_type });
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Save operation failed:', error);
    }
  };

  const renderDisciplineItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDetails}>
          Тип измерения: {item.measurement_type}
        </Text>
      </View>
      <View style={styles.buttonsContainer}>
        <Button title="Редактировать" onPress={() => handleEdit(item)} />
        <Button
          title="Удалить"
          onPress={() => handleDelete(item.id)}
          color="#D40026"
        />
      </View>
    </View>
  );

  if (loading) {
    return <Text>Загрузка дисциплин...</Text>;
  }

  if (isEditing) {
    return (
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>
          {currentDiscipline.id
            ? 'Редактировать дисциплину'
            : 'Создать дисциплину'}
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Название дисциплины"
          value={currentDiscipline.name}
          onChangeText={(text) =>
            setCurrentDiscipline({ ...currentDiscipline, name: text })
          }
        />
        <Select
          placeholder="Выберите тип измерения..."
          value={currentDiscipline.measurement_type}
          onValueChange={(value) =>
            setCurrentDiscipline({
              ...currentDiscipline,
              measurement_type: value,
            })
          }
          options={[
            { label: 'Количество', value: 'count' },
            { label: 'Время', value: 'time' },
            { label: 'Процент', value: 'percentage' },
          ]}
        />
        <View style={styles.formButtons}>
          <Button title="Сохранить" onPress={handleSave} />
          <Button
            title="Отмена"
            onPress={() => setIsEditing(false)}
            color="gray"
          />
        </View>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.title}>Управление дисциплинами</Text>
      <Button title="Добавить новую дисциплину" onPress={handleAddNew} />
      <FlatList
        data={disciplines}
        renderItem={renderDisciplineItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  list: { marginTop: 16 },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    marginBottom: 8,
    borderRadius: 5,
    borderLeftWidth: 5,
    borderLeftColor: '#063672',
  },
  itemTextContainer: { flex: 1 },
  itemName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  itemDetails: { fontSize: 14, color: '#666' },
  buttonsContainer: { flexDirection: 'row', gap: 8 },
  formContainer: { padding: 16, backgroundColor: '#f8f8f8', borderRadius: 8 },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
});

export default Disciplines;
