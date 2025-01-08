import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface Store {
  id: string;
  name: string;
  department_number: string;
}

interface ContainerCount {
  store_id: string;
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
}

export default function StorePage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [formData, setFormData] = useState<Partial<ContainerCount>>({
    opener_name: '',
    arrival_time: '',
    donation_count: 0,
    trailer_fullness: 0,
    hardlines_raw: 0,
    softlines_raw: 0,
    canvases: 0,
    sleeves: 0,
    caps: 0,
    totes: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .eq('is_active', true);

        if (error) throw error;
        setStores(data || []);
      } catch (err) {
        console.error('Error fetching stores:', err);
        setError('Failed to fetch stores');
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'arrival_time' || name === 'opener_name' 
        ? value 
        : (parseInt(value) || 0)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) {
      alert('Please select a store');
      return;
    }

    if (!formData.opener_name || !formData.arrival_time) {
      alert('Please fill in opener name and arrival time');
      return;
    }

    if (formData.trailer_fullness === undefined) {
      alert('Please enter trailer fullness');
      return;
    }

    if (formData.trailer_fullness < 0 || formData.trailer_fullness > 100) {
      alert('Trailer fullness must be between 0 and 100');
      return;
    }

    setSubmitting(true);

    try {
      const submitData = {
        store_id: selectedStore,
        opener_name: formData.opener_name,
        arrival_time: formData.arrival_time,
        donation_count: formData.donation_count || 0,
        trailer_fullness: formData.trailer_fullness || 0,
        hardlines_raw: formData.hardlines_raw || 0,
        softlines_raw: formData.softlines_raw || 0,
        canvases: formData.canvases || 0,
        sleeves: formData.sleeves || 0,
        caps: formData.caps || 0,
        totes: formData.totes || 0
      };

      console.log('Submitting data:', submitData);

      const { error: upsertError } = await supabase
        .from('daily_container_counts')
        .insert(submitData);

      if (upsertError) throw upsertError;

      alert('Container counts submitted successfully');

      // Reset form
      setSelectedStore('');
      setFormData({
        opener_name: '',
        arrival_time: '',
        donation_count: 0,
        trailer_fullness: 0,
        hardlines_raw: 0,
        softlines_raw: 0,
        canvases: 0,
        sleeves: 0,
        caps: 0,
        totes: 0
      });
    } catch (err) {
      console.error('Error details:', err);
      alert('Error submitting counts');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading stores...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Container Count Entry</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="store" className="block text-sm font-medium text-gray-700">
              Store *
            </label>
            <select
              id="store"
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Select a store</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.department_number} - {store.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="opener_name" className="block text-sm font-medium text-gray-700">
              Opener Name *
            </label>
            <input
              type="text"
              id="opener_name"
              name="opener_name"
              value={formData.opener_name}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="arrival_time" className="block text-sm font-medium text-gray-700">
              Arrival Time *
            </label>
            <input
              type="time"
              id="arrival_time"
              name="arrival_time"
              value={formData.arrival_time}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="donation_count" className="block text-sm font-medium text-gray-700">
              Donation Count
            </label>
            <input
              type="number"
              id="donation_count"
              name="donation_count"
              min="0"
              value={formData.donation_count}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="trailer_fullness" className="block text-sm font-medium text-gray-700">
              Trailer Fullness (%)
            </label>
            <input
              type="number"
              id="trailer_fullness"
              name="trailer_fullness"
              min="0"
              max="100"
              value={formData.trailer_fullness}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="hardlines_raw" className="block text-sm font-medium text-gray-700">
              Hardlines Raw
            </label>
            <input
              type="number"
              id="hardlines_raw"
              name="hardlines_raw"
              min="0"
              value={formData.hardlines_raw}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="softlines_raw" className="block text-sm font-medium text-gray-700">
              Softlines Raw
            </label>
            <input
              type="number"
              id="softlines_raw"
              name="softlines_raw"
              min="0"
              value={formData.softlines_raw}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="canvases" className="block text-sm font-medium text-gray-700">
              Canvases
            </label>
            <input
              type="number"
              id="canvases"
              name="canvases"
              min="0"
              value={formData.canvases}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="sleeves" className="block text-sm font-medium text-gray-700">
              Sleeves
            </label>
            <input
              type="number"
              id="sleeves"
              name="sleeves"
              min="0"
              value={formData.sleeves}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="caps" className="block text-sm font-medium text-gray-700">
              Caps
            </label>
            <input
              type="number"
              id="caps"
              name="caps"
              min="0"
              value={formData.caps}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="totes" className="block text-sm font-medium text-gray-700">
              Totes
            </label>
            <input
              type="number"
              id="totes"
              name="totes"
              min="0"
              value={formData.totes}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !selectedStore}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            submitting || !selectedStore
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          }`}
        >
          {submitting ? 'Submitting...' : 'Submit Counts'}
        </button>
      </form>
    </div>
  );
}
