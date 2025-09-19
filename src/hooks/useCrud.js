import { useState, useEffect, useCallback } from 'react';
import { api } from '../api.js';

export const useCrud = (endpoint) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get(`/${endpoint}`);
      const key = endpoint;
      if (data.success && Array.isArray(data[key])) {
        setItems(data[key]);
      } else {
        // Log the actual data received for debugging
        console.error(`Failed to fetch ${endpoint}. Unexpected data structure received:`, data);
        window.alert(`Error: Failed to fetch ${endpoint}. The data format was incorrect.`);
      }
    } catch (error) {
      window.alert(
        `Error: ${error.message || `An unexpected error occurred while fetching ${endpoint}.`}`
      );
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const createItem = async (itemData) => {
    try {
      await api.post(`/${endpoint}`, itemData);
      fetchItems(); // Refresh list
    } catch (error) {
      window.alert(`Error: ${error.message || `Failed to create item.`}`);
      throw error; // Re-throw to allow components to handle it
    }
  };

  const updateItem = async (id, itemData) => {
    try {
      await api.put(`/${endpoint}/${id}`, itemData);
      fetchItems(); // Refresh list
    } catch (error) {
      window.alert(`Error: ${error.message || `Failed to update item.`}`);
      throw error;
    }
  };

  const deleteItem = async (id) => {
    try {
      await api.delete(`/${endpoint}/${id}`);
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
