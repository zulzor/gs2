import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Button,
  TextInput,
} from 'react-native';
import { useCrud } from '../hooks/useCrud.js';

const Parents = () => {
  const {
    items: parents,
    loading,
    createItem,
    updateItem,
    deleteItem,
  } = useCrud('parents');

  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState({
    id: null,
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
  });

  const handleAddNew = () => {
    setCurrentItem({
      id: null,
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
    });
    setIsEditing(true);
  };

  const handleEdit = (item) => {
    setCurrentItem(item);
    setIsEditing(true);
  };

  const handleDelete = async (item) => {
    if (
      window.confirm(
        `Are you sure you want to delete parent ${item.first_name} ${item.last_name}?`
      )
    ) {
      await deleteItem(item.id);
    }
  };

  const handleSave = async () => {
    const { id, first_name, last_name, email, password, phone_number } =
      currentItem;
    if (!first_name || !last_name || !email) {
      window.alert(
        'Validation Error: First name, last name, and email are required.'
      );
      return;
    }

    try {
      if (id) {
        await updateItem(id, { first_name, last_name, email, phone_number });
      } else {
        if (!password) {
          window.alert(
            'Validation Error: Password is required for a new parent.'
          );
          return;
        }
        await createItem({
          first_name,
          last_name,
          email,
          password,
          phone_number,
        });
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Save operation failed:', error);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemName}>
          {item.first_name} {item.last_name}
        </Text>
        <Text style={styles.itemDetails}>Email: {item.email}</Text>
        <Text style={styles.itemDetails}>Phone: {item.phone_number}</Text>
      </View>
      <View style={styles.buttonsContainer}>
        <Button title="Edit" onPress={() => handleEdit(item)} />
        <Button
          title="Delete"
          onPress={() => handleDelete(item)}
          color="#D40026"
        />
      </View>
    </View>
  );

  if (loading) {
    return <Text>Loading parents...</Text>;
  }

  if (isEditing) {
    return (
      <View style={styles.formContainer}>
        <Text style={styles.title}>
          {currentItem.id ? 'Edit Parent' : 'Add New Parent'}
        </Text>
        <TextInput
          style={styles.input}
          placeholder="First Name"
          value={currentItem.first_name}
          onChangeText={(text) =>
            setCurrentItem({ ...currentItem, first_name: text })
          }
        />
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          value={currentItem.last_name}
          onChangeText={(text) =>
            setCurrentItem({ ...currentItem, last_name: text })
          }
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={currentItem.email}
          onChangeText={(text) =>
            setCurrentItem({ ...currentItem, email: text })
          }
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={currentItem.phone_number}
          onChangeText={(text) =>
            setCurrentItem({ ...currentItem, phone_number: text })
          }
          keyboardType="phone-pad"
        />
        {!currentItem.id && (
          <TextInput
            style={styles.input}
            placeholder="Password"
            onChangeText={(text) =>
              setCurrentItem({ ...currentItem, password: text })
            }
            secureTextEntry
          />
        )}
        <View style={styles.formButtons}>
          <Button title="Save" onPress={handleSave} />
          <Button
            title="Cancel"
            onPress={() => setIsEditing(false)}
            color="gray"
          />
        </View>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.title}>Manage Parents</Text>
      <Button title="Add New Parent" onPress={handleAddNew} />
      <FlatList
        data={parents}
        renderItem={renderItem}
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
    borderLeftColor: '#4B9CD3',
  }, // A different color
  itemTextContainer: { flex: 1 },
  itemName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  itemDetails: { fontSize: 14, color: '#666', marginTop: 4 },
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

export default Parents;
