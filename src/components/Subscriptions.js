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

// A simple Select component for web
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

const Subscriptions = () => {
  const { items: subscriptions, loading, createItem, updateItem, deleteItem } =
    useCrud('subscriptions');
  const { items: children } = useCrud('children');

  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState({
    id: null,
    child_id: '',
    trainings_total: '',
    trainings_remaining: '',
    purchase_date: '',
    expiry_date: '',
  });

  const handleAddNew = () => {
    const today = new Date().toISOString().split('T')[0];
    setCurrentItem({
      id: null,
      child_id: '',
      trainings_total: '',
      trainings_remaining: '',
      purchase_date: today,
      expiry_date: '',
    });
    setIsEditing(true);
  };

  const handleEdit = (item) => {
    setCurrentItem({
        ...item,
        child_id: item.child_id.toString(),
        purchase_date: item.purchase_date || '',
        expiry_date: item.expiry_date || '',
    });
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this subscription?')) {
      await deleteItem(id);
    }
  };

  const handleSave = async () => {
    const { id, child_id, trainings_total, trainings_remaining, purchase_date, expiry_date } = currentItem;
    if (!child_id || !trainings_total || !purchase_date) {
      window.alert('Child, Total Trainings, and Purchase Date are required.');
      return;
    }

    const dataToSave = {
        ...currentItem,
        trainings_total: parseInt(trainings_total),
        trainings_remaining: isNaN(parseInt(trainings_remaining)) ? parseInt(trainings_total) : parseInt(trainings_remaining),
        child_id: parseInt(child_id),
    };

    try {
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

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemName}>{item.child_name}</Text>
        <Text style={styles.itemDetails}>
          Trainings: {item.trainings_remaining} / {item.trainings_total}
        </Text>
        <Text style={styles.itemDetails}>Purchase Date: {item.purchase_date}</Text>
        {item.expiry_date && <Text style={styles.itemDetails}>Expiry Date: {item.expiry_date}</Text>}
      </View>
      <View style={styles.buttonsContainer}>
        <Button title="Edit" onPress={() => handleEdit(item)} />
        <Button title="Delete" onPress={() => handleDelete(item.id)} color="#D40026" />
      </View>
    </View>
  );

  if (loading) {
    return <Text>Loading subscriptions...</Text>;
  }

  if (isEditing) {
    return (
      <View style={styles.formContainer}>
        <Text style={styles.title}>{currentItem.id ? 'Edit Subscription' : 'Add New Subscription'}</Text>
        
        <Select
          placeholder="Select Child..."
          value={currentItem.child_id}
          onValueChange={(value) => setCurrentItem({ ...currentItem, child_id: value })}
          options={children.map(c => ({ label: `${c.first_name} ${c.last_name}`, value: c.id }))}
          disabled={!!currentItem.id} // Disable child selection when editing
        />

        <TextInput
          style={styles.input}
          placeholder="Total Trainings"
          value={String(currentItem.trainings_total)}
          onChangeText={(text) => setCurrentItem({ ...currentItem, trainings_total: text.replace(/[^0-9]/g, '') })}
          keyboardType="numeric"
        />

        {currentItem.id && (
            <TextInput
                style={styles.input}
                placeholder="Remaining Trainings"
                value={String(currentItem.trainings_remaining)}
                onChangeText={(text) => setCurrentItem({ ...currentItem, trainings_remaining: text.replace(/[^0-9]/g, '') })}
                keyboardType="numeric"
            />
        )}

        <TextInput
          style={styles.input}
          placeholder="Purchase Date (YYYY-MM-DD)"
          value={currentItem.purchase_date}
          onChangeText={(text) => setCurrentItem({ ...currentItem, purchase_date: text })}
        />

        <TextInput
          style={styles.input}
          placeholder="Expiry Date (YYYY-MM-DD, optional)"
          value={currentItem.expiry_date}
          onChangeText={(text) => setCurrentItem({ ...currentItem, expiry_date: text })}
        />

        <View style={styles.formButtons}>
          <Button title="Save" onPress={handleSave} />
          <Button title="Cancel" onPress={() => setIsEditing(false)} color="gray" />
        </View>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.title}>Manage Subscriptions</Text>
      <Button title="Add New Subscription" onPress={handleAddNew} />
      <FlatList
        data={subscriptions}
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
    borderLeftColor: '#f0ad4e', // A gold/yellow color
  },
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

export default Subscriptions;
