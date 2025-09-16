import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

export const useCrud = (endpoint) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get(`/${endpoint}.php`);
      // The API returns { success: true, items: [...] } where 'items' is the entity name
      // e.g., { success: true, branches: [...] }
      const key = endpoint;
      if (data.success && data[key]) {
        setItems(data[key]);
      } else {
        window.alert(`Error: Failed to fetch ${endpoint}.`);
      }
    } catch (error) {
      window.alert(`Error: ${error.message || `An unexpected error occurred while fetching ${endpoint}.`}`);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const createItem = async (itemData) => {
    try {
      await api.post(`/${endpoint}.php`, itemData);
      fetchItems(); // Refresh list
    } catch (error) {
      window.alert(`Error: ${error.message || `Failed to create item.`}`);
      throw error; // Re-throw to allow components to handle it
    }
  };

  const updateItem = async (id, itemData) => {
    try {
      await api.put(`/${endpoint}.php?id=${id}`, itemData);
      fetchItems(); // Refresh list
    } catch (error) {
      window.alert(`Error: ${error.message || `Failed to update item.`}`);
      throw error;
    }
  };

  const deleteItem = async (id) => {
    try {
      await api.delete(`/${endpoint}.php?id=${id}`);
      fetchItems(); // Refresh list
    } catch (error) {
      window.alert(`Error: ${error.message || `Failed to delete item.`}`);
      throw error;
    }
  };

  return {
    items,
    loading,
    createItem,
    updateItem,
    deleteItem,
  };
};
