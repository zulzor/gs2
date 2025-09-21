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

const Trainers = () => {
  const { items: trainers, loading, createItem, updateItem, deleteItem } = useCrud('trainers');
  const { items: branches } = useCrud('branches');

  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState({
    id: null,
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    branch_ids: [],
  });

  const handleAddNew = () => {
    setCurrentItem({
      id: null,
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      branch_ids: [],
    });
    setIsEditing(true);
  };

  const handleEdit = (item) => {
    setCurrentItem({
        ...item,
        branch_ids: item.branch_ids || [],
    });
    setIsEditing(true);
  };

  const handleDelete = async (item) => {
    if (window.confirm(`Вы уверены, что хотите удалить тренера ${item.first_name} ${item.last_name}?`)) {
      await deleteItem(item.id);
    }
  };

  const handleSave = async () => {
    const { id, first_name, last_name, email, password, phone_number, branch_ids } = currentItem;
    if (!first_name || !last_name || !email) {
      window.alert('Имя, фамилия и email обязательны.');
      return;
    }

    const dataToSave = {
        first_name,
        last_name,
        email,
        phone_number,
        branch_ids: branch_ids.map(id => parseInt(id)),
    };

    try {
      if (id) {
        await updateItem(id, dataToSave);
      } else {
        if (!password) {
          window.alert('Пароль обязателен для нового тренера.');
          return;
        }
        await createItem({ ...dataToSave, password });
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Save operation failed:', error);
    }
  };

  const renderTrainerItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemName}>{item.first_name} {item.last_name}</Text>
        <Text style={styles.itemDetails}>Email: {item.email}</Text>
        <Text style={styles.itemDetails}>Телефон: {item.phone_number}</Text>
        <Text style={styles.itemDetails}>Филиалы: {item.branch_names ? item.branch_names.join(', ') : 'Не указаны'}</Text>
      </View>
      <View style={styles.buttonsContainer}>
        <Button title="Редактировать" onPress={() => handleEdit(item)} />
        <Button title="Удалить" onPress={() => handleDelete(item)} color="#D40026" />
      </View>
    </View>
  );

  if (loading) {
    return <Text>Загрузка тренеров...</Text>;
  }

  if (isEditing) {
    return (
      <ScrollView style={styles.formContainer}>
        <Text style={styles.title}>{currentItem.id ? 'Редактировать данные тренера' : 'Добавить нового тренера'}</Text>
        <TextInput style={styles.input} placeholder="Имя" value={currentItem.first_name} onChangeText={(text) => setCurrentItem({ ...currentItem, first_name: text })} />
        <TextInput style={styles.input} placeholder="Фамилия" value={currentItem.last_name} onChangeText={(text) => setCurrentItem({ ...currentItem, last_name: text })} />
        <TextInput style={styles.input} placeholder="Email" value={currentItem.email} onChangeText={(text) => setCurrentItem({ ...currentItem, email: text })} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Номер телефона" value={currentItem.phone_number} onChangeText={(text) => setCurrentItem({ ...currentItem, phone_number: text })} keyboardType="phone-pad" />

        <MultiSelectCheckboxes 
            title="Филиалы"
            options={branches}
            selectedIds={currentItem.branch_ids}
            onSelectionChange={(ids) => setCurrentItem({ ...currentItem, branch_ids: ids })}
        />

        {!currentItem.id && (
          <TextInput style={styles.input} placeholder="Пароль" onChangeText={(text) => setCurrentItem({ ...currentItem, password: text })} secureTextEntry />
        )}
        <View style={styles.formButtons}>
          <Button title="Сохранить" onPress={handleSave} />
          <Button title="Отмена" onPress={() => setIsEditing(false)} color="gray" />
        </View>
      </ScrollView>
    );
  }

  return (
    <View>
      <Text style={styles.title}>Управление тренерами</Text>
      <Button title="Добавить нового тренера" onPress={handleAddNew} />
      <FlatList data={trainers} renderItem={renderTrainerItem} keyExtractor={(item) => item.id.toString()} style={styles.list} />
    </View>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  list: { marginTop: 16 },
  itemContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 12, marginBottom: 8, borderRadius: 5, borderLeftWidth: 5, borderLeftColor: '#9C824A' },
  itemTextContainer: { flex: 1 },
  itemName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  itemDetails: { fontSize: 14, color: '#666', marginTop: 4 },
  buttonsContainer: { flexDirection: 'row', gap: 8 },
  formContainer: { padding: 16, backgroundColor: '#f8f8f8', borderRadius: 8 },
  input: { height: 40, borderColor: '#ccc', borderWidth: 1, marginBottom: 12, paddingHorizontal: 8, borderRadius: 4, backgroundColor: '#fff' },
  formButtons: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, marginBottom: 32 },
  checkboxContainer: { marginBottom: 12 },
  checkboxTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  checkboxOptionsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  checkboxOption: { flexDirection: 'row', alignItems: 'center', marginRight: 16, marginBottom: 8 },
  checkbox: { height: 20, width: 20, borderRadius: 3, borderWidth: 2, borderColor: '#ccc', backgroundColor: '#fff' },
  checkboxSelected: { backgroundColor: '#063672', borderColor: '#063672' },
});

export default Trainers;