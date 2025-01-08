import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface DriverProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  has_cdl: boolean;
  cdl_number?: string;
  cdl_expiration_date?: string;
  created_at: string;
}

interface NewDriverForm {
  email: string;
  first_name: string;
  last_name: string;
  has_cdl: boolean;
  cdl_number: string;
  cdl_expiration_date: string;
}

export default function DriverManagement() {
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingDriver, setIsAddingDriver] = useState(false);
  const [newDriver, setNewDriver] = useState<NewDriverForm>({
    email: '',
    first_name: '',
    last_name: '',
    has_cdl: false,
    cdl_number: '',
    cdl_expiration_date: '',
  });

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('drivers_with_emails')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDrivers(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newDriver.has_cdl && !newDriver.cdl_number?.trim()) {
      alert('Please enter a CDL number');
      return;
    }
    try {
      setLoading(true);

      // Create auth user first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newDriver.email.trim().toLowerCase(),
        password: 'TempPass123!', // They'll reset this
        options: {
          data: {
            first_name: newDriver.first_name.trim(),
            last_name: newDriver.last_name.trim(),
            role: 'driver'
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Then create driver record with user_id
      const { error: profileError } = await supabase
        .from('drivers')
        .insert([
          {
            user_id: authData.user.id,  // Use user_id instead of id
            first_name: newDriver.first_name.trim(),
            last_name: newDriver.last_name.trim(),
            has_cdl: newDriver.has_cdl,
            cdl_number: newDriver.has_cdl ? newDriver.cdl_number.trim() : null,
            cdl_expiration_date: newDriver.has_cdl ? newDriver.cdl_expiration_date : null
          },
        ]);

      if (profileError) throw profileError;

      setIsAddingDriver(false);
      setNewDriver({
        email: '',
        first_name: '',
        last_name: '',
        has_cdl: false,
        cdl_number: '',
        cdl_expiration_date: '',
      });
      fetchDrivers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteDriver = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchDrivers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !isAddingDriver) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading drivers...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold">Driver Management</h2>
          <button
            onClick={() => setIsAddingDriver(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Add Driver
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 m-4 rounded">
            Error: {error}
          </div>
        )}

        {isAddingDriver && (
          <div className="p-6 border-b">
            <form onSubmit={addDriver} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    required
                    value={newDriver.email}
                    onChange={(e) => setNewDriver({ ...newDriver, email: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    required
                    value={newDriver.first_name}
                    onChange={(e) => setNewDriver({ ...newDriver, first_name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    required
                    value={newDriver.last_name}
                    onChange={(e) => setNewDriver({ ...newDriver, last_name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newDriver.has_cdl}
                      onChange={(e) => setNewDriver({ ...newDriver, has_cdl: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Has CDL</span>
                  </label>
                </div>
                {newDriver.has_cdl && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">CDL Number</label>
                      <input
                        type="text"
                        required
                        value={newDriver.cdl_number}
                        onChange={(e) => setNewDriver({ ...newDriver, cdl_number: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">CDL Expiration Date</label>
                      <input
                        type="date"
                        required
                        value={newDriver.cdl_expiration_date}
                        onChange={(e) => setNewDriver({ ...newDriver, cdl_expiration_date: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddingDriver(false)}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {loading ? 'Adding...' : 'Add Driver'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CDL Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {drivers.map((driver) => (
                <tr key={driver.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {driver.first_name} {driver.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{driver.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {driver.has_cdl ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        CDL
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        No CDL
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => deleteDriver(driver.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
