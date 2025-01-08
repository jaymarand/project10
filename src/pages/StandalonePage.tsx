import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

interface Store {
  id: string;
  name: string;
  department_number: string;
  is_active: boolean;
}

export default function StandalonePage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [newStore, setNewStore] = useState({ name: '', department_number: '' });

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('name');

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
      alert('Failed to fetch stores');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStore.name || !newStore.department_number) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('stores')
        .insert([
          { 
            name: newStore.name, 
            department_number: newStore.department_number,
            is_active: true 
          }
        ]);

      if (error) throw error;

      alert('Store added successfully');
      setNewStore({ name: '', department_number: '' });
      fetchStores();
    } catch (error) {
      console.error('Error adding store:', error);
      alert('Failed to add store');
    } finally {
      setLoading(false);
    }
  };

  const toggleStoreStatus = async (store: Store) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('stores')
        .update({ is_active: !store.is_active })
        .eq('id', store.id);

      if (error) throw error;

      fetchStores();
    } catch (error) {
      console.error('Error updating store:', error);
      alert('Failed to update store status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Store Management (Standalone)</h1>

      {/* Add Store Form */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Add New Store</h2>
        <form onSubmit={handleAddStore} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Store Name</label>
            <Input
              type="text"
              value={newStore.name}
              onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
              className="mt-1"
              placeholder="Enter store name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Department Number</label>
            <Input
              type="text"
              value={newStore.department_number}
              onChange={(e) => setNewStore({ ...newStore, department_number: e.target.value })}
              className="mt-1"
              placeholder="Enter department number"
            />
          </div>
          <Button type="submit" disabled={loading}>
            Add Store
          </Button>
        </form>
      </div>

      {/* Stores List */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Stores List</h2>
        <div className="space-y-4">
          {stores.map((store) => (
            <div
              key={store.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <h3 className="font-medium">{store.name}</h3>
                <p className="text-sm text-gray-500">Dept: {store.department_number}</p>
              </div>
              <Button
                onClick={() => toggleStoreStatus(store)}
                variant={store.is_active ? "destructive" : "default"}
              >
                {store.is_active ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
