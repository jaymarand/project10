import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface DriverProfile {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  has_cdl: boolean;
  cdl_number?: string;
  cdl_expiration_date?: string;
  is_active: boolean;
  created_at: string;
}

export default function DriverManagement() {
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverProfile | null>(null);

  useEffect(() => {
    fetchDrivers();
  }, [showInactive]);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('active_drivers_view')
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

  const toggleDriverStatus = async (driverId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ is_active: !currentStatus })
        .eq('id', driverId);

      if (error) throw error;
      await fetchDrivers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateDriverCDL = async (driverId: string, hasCDL: boolean, cdlNumber?: string, expirationDate?: string) => {
    try {
      const updateData: any = {
        has_cdl: hasCDL,
      };
      
      if (hasCDL && cdlNumber && expirationDate) {
        updateData.cdl_number = cdlNumber;
        updateData.cdl_expiration_date = expirationDate;
      } else {
        updateData.cdl_number = null;
        updateData.cdl_expiration_date = null;
      }

      const { error } = await supabase
        .from('drivers')
        .update(updateData)
        .eq('id', driverId);

      if (error) throw error;
      setEditingDriver(null);
      await fetchDrivers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const CDLEditModal = ({ driver }: { driver: DriverProfile }) => {
    const [hasCDL, setHasCDL] = useState(driver.has_cdl);
    const [cdlNumber, setCDLNumber] = useState(driver.cdl_number || '');
    const [expirationDate, setExpirationDate] = useState(driver.cdl_expiration_date || '');

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h3 className="text-lg font-medium mb-4">Update CDL Information</h3>
          <div className="space-y-4">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={hasCDL}
                  onChange={(e) => setHasCDL(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="ml-2">Has CDL</span>
              </label>
            </div>
            
            {hasCDL && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">CDL Number</label>
                  <input
                    type="text"
                    value={cdlNumber}
                    onChange={(e) => setCDLNumber(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expiration Date</label>
                  <input
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </>
            )}
            
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setEditingDriver(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => updateDriverCDL(driver.id, hasCDL, cdlNumber, expirationDate)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading drivers...</div>
      </div>
    );
  }

  const filteredDrivers = showInactive ? drivers : drivers.filter(d => d.is_active);

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Driver Management</h2>
              <div className="mt-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={!showInactive}
                    onChange={(e) => setShowInactive(!e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Hide Inactive Drivers</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 m-4 rounded">
            Error: {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CDL Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDrivers.map((driver) => (
                <tr key={driver.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {driver.first_name} {driver.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{driver.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <button
                        onClick={() => setEditingDriver(driver)}
                        className="text-left"
                      >
                        {driver.has_cdl ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            CDL
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            No CDL
                          </span>
                        )}
                        {driver.has_cdl && driver.cdl_expiration_date && (
                          <span className="ml-2 text-sm text-gray-500">
                            Expires: {new Date(driver.cdl_expiration_date).toLocaleDateString()}
                          </span>
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        driver.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {driver.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleDriverStatus(driver.id, driver.is_active)}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                          driver.is_active
                            ? 'text-red-600 hover:text-red-900'
                            : 'text-green-600 hover:text-green-900'
                        }`}
                      >
                        {driver.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => setEditingDriver(driver)}
                        className="px-3 py-1 rounded-md text-sm font-medium text-blue-600 hover:text-blue-900"
                      >
                        Edit CDL
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {editingDriver && <CDLEditModal driver={editingDriver} />}
    </div>
  );
}
