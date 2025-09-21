import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Button,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useCrud } from '../hooks/useCrud.js';

// Reusable Select component for single-choice dropdowns
const Select = ({ options, value, onValueChange, placeholder }) => (
  <select
    value={value || ''}
    onChange={(e) => onValueChange(e.target.value)}
    style={styles.selectInput}
  >
    {placeholder ? <option value="">{placeholder}</option> : null}
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

// New component for multi-select checkboxes
const MultiSelectCheckboxes = ({ options, selectedIds, onSelectionChange, title }) => {
  const handleSelect = (id) => {
    const newSelection = selectedIds.includes(id)
      ? selectedIds.filter((selectedId) => selectedId !== id)
      : [...selectedIds, id];
    onSelectionChange(newSelection);
  };

  return (
    <View style={styles.checkboxContainer}>
        <Text style={styles.checkboxTitle}>{title}</Text>
        <View style={styles.checkboxOptionsContainer}>
            {options.map((option) => (
            <TouchableOpacity
                key={option.id}
                style={styles.checkboxOption}
                onPress={() => handleSelect(option.id)}
            >
                <View style={[styles.checkbox, selectedIds.includes(option.id) && styles.checkboxSelected]} />
                <Text>{option.name}</Text>
            </TouchableOpacity>
            ))}
        </View>
    </View>
  );
};

const Children = () => {
  const { items: children, loading, createItem, updateItem, deleteItem } = useCrud('children');
  const { items: parents } = useCrud('parents');
  const { items: branches } = useCrud('branches');

  const [isEditing, setIsEditing] = useState(false);
  const [currentChild, setCurrentChild] = useState({
    id: null,
    first_name: '',
    last_name: '',
    date_of_birth: '',
    parent_user_id: '',
    branch_ids: [], // Changed from branch_id to branch_ids array
  });

  const handleAddNew = () => {
    setCurrentChild({
      id: null,
      first_name: '',
      last_name: '',
      date_of_birth: '',
      parent_user_id: '',
      branch_ids: [],
    });
    setIsEditing(true);
  };

  const handleEdit = (child) => {
    setCurrentChild({
      ...child,
      parent_user_id: child.parent_user_id ? child.parent_user_id.toString() : '',
      branch_ids: child.branch_ids || [], // Ensure branch_ids is an array
    });
    setIsEditing(true);
  };

  const handleDelete = async (child) => {
    if (window.confirm(`Вы уверены, что хотите удалить ${child.first_name} ${child.last_name}?`)) {
      await deleteItem(child.id);
    }
  };

  const handleSave = async () => {
    const { id, first_name, last_name, date_of_birth, parent_user_id, branch_ids } = currentChild;
    if (!first_name || !last_name || !date_of_birth) {
      window.alert('Имя, фамилия и дата рождения обязательны.');
      return;
    }

    try {
      const dataToSave = {
        first_name,
        last_name,
        date_of_birth,
        parent_user_id: parent_user_id ? parseInt(parent_user_id) : null,
        branch_ids: branch_ids.map(id => parseInt(id)), // Ensure IDs are integers
      };

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

  const renderChildItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemName}>{item.first_name} {item.last_name}</Text>
        <Text style={styles.itemDetails}>Филиалы: {item.branch_names ? item.branch_names.join(', ') : 'Не указаны'}</Text>
        <Text style={styles.itemDetails}>Родитель: {item.parent_email || 'Не указан'}</Text>
      </View>
      <View style={styles.buttonsContainer}>
        <Button title="Редактировать" onPress={() => handleEdit(item)} />
        <Button title="Удалить" onPress={() => handleDelete(item)} color="#D40026" />
      </View>
    </View>
  );

  const parentOptions = parents.map((p) => ({ label: `${p.first_name} ${p.last_name} (${p.email})`, value: p.id.toString() }));

  if (loading) {
    return <Text>Загрузка списка детей...</Text>;
  }

  if (isEditing) {
    return (
      <ScrollView style={styles.formContainer}>
        <Text style={styles.title}>{currentChild.id ? 'Редактировать данные ребенка' : 'Добавить нового ребенка'}</Text>
        <TextInput style={styles.input} placeholder="Имя" value={currentChild.first_name} onChangeText={(text) => setCurrentChild({ ...currentChild, first_name: text })} />
        <TextInput style={styles.input} placeholder="Фамилия" value={currentChild.last_name} onChangeText={(text) => setCurrentChild({ ...currentChild, last_name: text })} />
        <TextInput style={styles.input} placeholder="Дата рождения (ГГГГ-ММ-ДД)" value={currentChild.date_of_birth} onChangeText={(text) => setCurrentChild({ ...currentChild, date_of_birth: text })} />
        
        <Select
          placeholder="Выберите родителя (необязательно)..."
          value={currentChild.parent_user_id}
          onValueChange={(value) => setCurrentChild({ ...currentChild, parent_user_id: value })}
          options={parentOptions}
        />

        <MultiSelectCheckboxes 
            title="Филиалы"
            options={branches}
            selectedIds={currentChild.branch_ids}
            onSelectionChange={(ids) => setCurrentChild({ ...currentChild, branch_ids: ids })}
        />

        <View style={styles.formButtons}>
          <Button title="Сохранить" onPress={handleSave} />
          <Button title="Отмена" onPress={() => setIsEditing(false)} color="gray" />
        </View>
      </ScrollView>
    );
  }

  return (
    <View>
      <Text style={styles.title}>Управление детьми</Text>
      <Button title="Добавить нового ребенка" onPress={handleAddNew} />
      <FlatList data={children} renderItem={renderChildItem} keyExtractor={(item) => item.id.toString()} style={styles.list} />
    </View>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  list: { marginTop: 16 },
  itemContainer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 12, marginBottom: 8, borderRadius: 5, borderLeftWidth: 5, borderLeftColor: '#EF0107',
  },
  itemTextContainer: { flex: 1 },
  itemName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  itemDetails: { fontSize: 14, color: '#666', marginTop: 4 },
  buttonsContainer: { flexDirection: 'row', gap: 8 },
  formContainer: { padding: 16, backgroundColor: '#f8f8f8', borderRadius: 8 },
  input: { height: 40, borderColor: '#ccc', borderWidth: 1, marginBottom: 12, paddingHorizontal: 8, borderRadius: 4, backgroundColor: '#fff' },
  selectInput: { height: 40, borderColor: '#ccc', borderWidth: 1, marginBottom: 12, paddingHorizontal: 8, borderRadius: 4, backgroundColor: '#fff', width: '100%' },
  formButtons: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, marginBottom: 32 },
  checkboxContainer: { marginBottom: 12 },
  checkboxTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  checkboxOptionsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  checkboxOption: { flexDirection: 'row', alignItems: 'center', marginRight: 16, marginBottom: 8 },
  checkbox: { height: 20, width: 20, borderRadius: 3, borderWidth: 2, borderColor: '#ccc', backgroundColor: '#fff' },
  checkboxSelected: { backgroundColor: '#063672', borderColor: '#063672' },
});

export default Children;