import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { DeliveryRun } from '../types/dispatch';
import { format } from 'date-fns';

interface LoadingFormData {
    sleeves: number;
    caps: number;
    canvases: number;
    totes: number;
    hardlines_raw: number;
    softlines_raw: number;
}

export default function DriverDashboard() {
    const { user } = useAuth();
    const [runs, setRuns] = useState<DeliveryRun[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeRun, setActiveRun] = useState<DeliveryRun | null>(null);
    const [showLoadingForm, setShowLoadingForm] = useState(false);
    const [loadingData, setLoadingData] = useState<LoadingFormData>({
        sleeves: 0,
        caps: 0,
        canvases: 0,
        totes: 0,
        hardlines_raw: 0,
        softlines_raw: 0
    });
    const [requiredQuantities, setRequiredQuantities] = useState<LoadingFormData>({
        sleeves: 0,
        caps: 0,
        canvases: 0,
        totes: 0,
        hardlines_raw: 0,
        softlines_raw: 0
    });

    // Fetch driver's runs
    const fetchRuns = async () => {
        try {
            // First get the driver ID from the drivers table using the user's ID
            const { data: driverData, error: driverError } = await supabase
                .from('drivers')
                .select('id')
                .eq('user_id', user?.id)
                .single();

            if (driverError) throw driverError;

            // Then get all runs assigned to this driver
            const { data: runsData, error: runsError } = await supabase
                .from('active_delivery_runs')
                .select(`
                    *,
                    store:stores(*)
                `)
                .eq('driver_id', driverData.id)
                .order('created_at');

            if (runsError) throw runsError;
            setRuns(runsData || []);
        } catch (error) {
            console.error('Error fetching runs:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch required quantities for a store
    const fetchRequiredQuantities = async (storeId: string) => {
        try {
            const { data, error } = await supabase
                .from('store_supplies')
                .select('*')
                .eq('store_id', storeId)
                .single();

            if (error) throw error;
            if (data) {
                setRequiredQuantities({
                    sleeves: data.sleeves || 0,
                    caps: data.caps || 0,
                    canvases: data.canvases || 0,
                    totes: data.totes || 0,
                    hardlines_raw: data.hardlines_raw || 0,
                    softlines_raw: data.softlines_raw || 0
                });
            }
        } catch (error) {
            console.error('Error fetching required quantities:', error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchRuns();
        }
    }, [user]);

    const handleStartLoading = async (run: DeliveryRun) => {
        setActiveRun(run);
        await fetchRequiredQuantities(run.store_id);
        setShowLoadingForm(true);
    };

    const handleQuantityChange = (field: keyof LoadingFormData, value: number) => {
        setLoadingData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const calculateDiscrepancy = (field: keyof LoadingFormData) => {
        return loadingData[field] - requiredQuantities[field];
    };

    const getDiscrepancyColor = (discrepancy: number) => {
        if (discrepancy === 0) return 'text-green-600';
        if (discrepancy < 0) return 'text-red-600';
        return 'text-yellow-600';
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 py-6 px-4">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">My Runs</h1>
                
                {showLoadingForm && activeRun ? (
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">
                            Loading Form - {activeRun.store_name}
                        </h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-medium mb-4">Required Quantities</h3>
                                {Object.entries(requiredQuantities).map(([key, value]) => (
                                    <div key={key} className="mb-2">
                                        <span className="capitalize">{key.replace('_', ' ')}: </span>
                                        <span className="font-medium">{value}</span>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <h3 className="text-lg font-medium mb-4">Loaded Quantities</h3>
                                {Object.entries(loadingData).map(([key, value]) => (
                                    <div key={key} className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 capitalize">
                                            {key.replace('_', ' ')}
                                        </label>
                                        <input
                                            type="number"
                                            value={value}
                                            onChange={(e) => handleQuantityChange(key as keyof LoadingFormData, parseInt(e.target.value) || 0)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        />
                                        <div className={`text-sm mt-1 ${getDiscrepancyColor(calculateDiscrepancy(key as keyof LoadingFormData))}`}>
                                            Difference: {calculateDiscrepancy(key as keyof LoadingFormData)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={() => setShowLoadingForm(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    // TODO: Save loading data
                                    setShowLoadingForm(false);
                                }}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                            >
                                Complete Loading
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {runs.map(run => (
                            <div key={run.id} className="bg-white rounded-lg shadow p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h2 className="text-xl font-semibold">
                                            {run.store_name} - {run.run_type}
                                        </h2>
                                        <p className="text-gray-600">Status: {run.status}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <button
                                        onClick={() => handleStartLoading(run)}
                                        disabled={run.status !== 'Upcoming'}
                                        className={`p-4 text-center rounded-lg font-medium ${
                                            run.status === 'Upcoming'
                                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        Start Loading
                                    </button>
                                    <button
                                        disabled={run.status !== 'Preloaded'}
                                        className={`p-4 text-center rounded-lg font-medium ${
                                            run.status === 'Preloaded'
                                                ? 'bg-green-600 text-white hover:bg-green-700'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        Depart
                                    </button>
                                    <button
                                        disabled={run.status !== 'in_transit'}
                                        className={`p-4 text-center rounded-lg font-medium ${
                                            run.status === 'in_transit'
                                                ? 'bg-purple-600 text-white hover:bg-purple-700'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        Complete
                                    </button>
                                </div>
                                {run.start_time && (
                                    <div className="mt-4 text-sm text-gray-600">
                                        Started: {format(new Date(run.start_time), 'HH:mm')}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
