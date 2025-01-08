import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { format } from 'date-fns';
import { CSVLink } from 'react-csv';

interface Store {
  id: string;
  name: string;
  department_number: string;
}

interface ContainerCount {
  id: string;
  store_id: string;
  submitted_at: string;
  opener_name: string;
  arrival_time: string;
  donation_count: number;
  trailer_fullness: number;
  hardlines_raw: number;
  softlines_raw: number;
  canvases: number;
  sleeves: number;
  caps: number;
  totes: number;
  store: Store;
}

export default function ContainerLogsPage() {
  const [containerCounts, setContainerCounts] = useState<ContainerCount[]>([]);
  const [missingStores, setMissingStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Function to fetch container counts
  const fetchContainerCounts = async () => {
    try {
      // First get all active stores
      const { data: allStores, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .eq('is_active', true);

      if (storesError) throw storesError;

      // Get today's container counts
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const { data: counts, error } = await supabase
        .from('daily_container_counts')
        .select(`
          *,
          store:stores(id, name, department_number)
        `)
        .gte('submitted_at', startOfDay.toISOString())
        .lte('submitted_at', endOfDay.toISOString());

      if (error) throw error;

      // A store that submitted today should only appear in the submitted list
      const submittedStoreIds = new Set(counts?.map(count => count.store_id) || []);
      const missing = allStores?.filter(store => !submittedStoreIds.has(store.id)) || [];
      
      setContainerCounts(counts as ContainerCount[]);
      setMissingStores(missing);

    } catch (err) {
      console.error('Error fetching container counts:', err);
      alert('Failed to fetch container counts');
    } finally {
      setLoading(false);
    }
  };

  // Function to clear all submissions for today
  const clearSubmissions = async () => {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const { error } = await supabase
        .from('daily_container_counts')
        .delete()
        .gte('submitted_at', startOfDay.toISOString())
        .lte('submitted_at', endOfDay.toISOString());

      if (error) throw error;

      alert('All submissions for today have been cleared');

      // Refresh the data
      fetchContainerCounts();
    } catch (err) {
      console.error('Error clearing submissions:', err);
      alert('Failed to clear submissions');
    } finally {
      setShowConfirmDialog(false);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    fetchContainerCounts();

    const subscription = supabase
      .channel('container_counts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_container_counts'
        },
        () => {
          fetchContainerCounts();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Prepare CSV data including both submitted and missing stores
  const csvData = [
    // Submitted stores
    ...containerCounts.map(count => ({
      'Status': 'Submitted',
      'Store Number': count.store?.department_number,
      'Store Name': count.store?.name,
      'Opener Name': count.opener_name,
      'Arrival Time': count.arrival_time,
      'Donation Count': count.donation_count,
      'Trailer Fullness': count.trailer_fullness,
      'Hardlines Raw': count.hardlines_raw,
      'Softlines Raw': count.softlines_raw,
      'Canvases': count.canvases,
      'Sleeves': count.sleeves,
      'Caps': count.caps,
      'Totes': count.totes,
      'Submitted At': format(new Date(count.submitted_at), 'MM/dd/yyyy HH:mm:ss')
    })),
    // Missing stores
    ...missingStores.map(store => ({
      'Status': 'Missing',
      'Store Number': store.department_number,
      'Store Name': store.name,
      'Opener Name': '',
      'Arrival Time': '',
      'Donation Count': '',
      'Trailer Fullness': '',
      'Hardlines Raw': '',
      'Softlines Raw': '',
      'Canvases': '',
      'Sleeves': '',
      'Caps': '',
      'Totes': '',
      'Submitted At': ''
    }))
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Container Count Log</h1>
          <div className="flex space-x-4">
            <CSVLink
              data={csvData}
              filename={`container-counts-${format(new Date(), 'yyyy-MM-dd')}.csv`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
            >
              Export to CSV
            </CSVLink>
            <button
              onClick={() => setShowConfirmDialog(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-medium text-gray-900">Clear All Submissions</h3>
              <p className="mt-2 text-sm text-gray-500">
                Are you sure you want to clear all container count submissions for today? This action cannot be undone.
              </p>
              <div className="mt-4 flex space-x-4">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={clearSubmissions}
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Container Counts Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opener</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TOA</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hardlines</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Softlines</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Canvases</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sleeves</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Caps</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Totes</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trailer %</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Donations</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Submitted</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {containerCounts.map((count) => (
                  <tr key={count.id}>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {count.store?.department_number}
                      </div>
                      <div className="text-sm text-gray-500">
                        {count.store?.name}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {count.opener_name}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {count.arrival_time}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {count.hardlines_raw}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {count.softlines_raw}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {count.canvases}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {count.sleeves}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {count.caps}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {count.totes}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {count.trailer_fullness}%</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {count.donation_count}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(count.submitted_at), 'MM/dd HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Missing Submissions Section */}
        {missingStores.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Missing Submissions ({missingStores.length} stores)
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc pl-5 space-y-1">
                    {missingStores.map(store => (
                      <li key={store.id}>
                        {store.department_number} - {store.name}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
