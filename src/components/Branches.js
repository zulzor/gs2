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

const Branches = () => {
  // All the complex logic is now in the useCrud hook
  const {
    items: branches,
    loading,
    createItem,
    updateItem,
    deleteItem,
  } = useCrud('branches');

  const [isEditing, setIsEditing] = useState(false);
  const [currentBranch, setCurrentBranch] = useState({
    id: null,
    name: '',
    address: '',
  });

  const handleAddNew = () => {
    setCurrentBranch({ id: null, name: '', address: '' });
    setIsEditing(true);
  };

  const handleEdit = (branch) => {
    setCurrentBranch(branch);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этот филиал?')) {
      await deleteItem(id);
    }
  };

  const handleSave = async () => {
    const { id, name, address } = currentBranch;
    if (!name) {
      window.alert('Валидация: Название филиала обязательно.');
      return;
    }

    try {
      if (id) {
        await updateItem(id, { name, address });
      } else {
        await createItem({ name, address });
      }
      setIsEditing(false);
    } catch (error) {
      // The hook handles the alert, but we catch to prevent unhandled promise rejection
      console.error('Save operation failed:', error);
    }
  };

  const renderBranchItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemAddress}>{item.address}</Text>
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
    return <Text>Загрузка филиалов...</Text>;
  }

  if (isEditing) {
    return (
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>
          {currentBranch.id ? 'Редактировать филиал' : 'Создать филиал'}
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Название филиала"
          value={currentBranch.name}
          onChangeText={(text) =>
            setCurrentBranch({ ...currentBranch, name: text })
          }
        />
        <TextInput
          style={styles.input}
          placeholder="Адрес"
          value={currentBranch.address}
          onChangeText={(text) =>
            setCurrentBranch({ ...currentBranch, address: text })
          }
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
      <Text style={styles.title}>Управление филиалами</Text>
      <Button title="Создать новый филиал" onPress={handleAddNew} />
      <FlatList
        data={branches}
        renderItem={renderBranchItem}
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
  itemAddress: { fontSize: 14, color: '#666' },
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

export default Branches;
