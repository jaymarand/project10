import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { DeliveryRun, RunType, Store, SupplyNeed, TruckType } from '../types/dispatch';
import { format } from 'date-fns';
import { PlusIcon } from '@heroicons/react/24/outline';

const RunTypes: RunType[] = ['Morning', 'Afternoon', 'ADC'];

export default function DispatchDashboard() {
    const [runs, setRuns] = useState<DeliveryRun[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [supplyNeeds, setSupplyNeeds] = useState<SupplyNeed[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'box' | 'tractor'>('all');
    const [isAddingRun, setIsAddingRun] = useState<Record<RunType, boolean>>({
        Morning: false,
        Afternoon: false,
        ADC: false
    });
    const [newRun, setNewRun] = useState<{
        store_id: string;
        run_type: RunType;
        truck_type: TruckType;
    }>({
        store_id: '',
        run_type: 'Morning',
        truck_type: 'Box Truck'
    });

    const statusColors = {
        'Upcoming': 'text-gray-500',
        'Preloaded': 'text-yellow-500',
        'Complete': 'text-green-500',
        'Cancelled': 'text-red-500'
    };

    const rowColors = {
        'Upcoming': 'bg-white',
        'Preloaded': 'bg-yellow-50',
        'Complete': 'bg-green-50',
        'Cancelled': 'bg-red-50'
    };

    const statusOrder = ['Upcoming', 'Preloaded', 'Complete', 'Cancelled'] as const;

    const cycleStatus = async (run: DeliveryRun) => {
        const currentIndex = statusOrder.indexOf(run.status as typeof statusOrder[number]);
        const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
        
        try {
            const updates: Partial<DeliveryRun> = {
                status: nextStatus
            };

            // Clear times if going back to Upcoming
            if (nextStatus === 'Upcoming') {
                updates.start_time = null;
                updates.preload_time = null;
                updates.complete_time = null;
                updates.depart_time = null;
            }

            const { error } = await supabase
                .from('active_delivery_runs')
                .update(updates)
                .eq('id', run.id);

            if (error) throw error;
            await fetchRuns();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    const handleTimeClick = async (run: DeliveryRun, field: 'start_time' | 'preload_time' | 'complete_time' | 'depart_time') => {
        try {
            const updates: Partial<DeliveryRun> = {
                [field]: new Date().toISOString()
            };

            // Update status based on which cell was clicked
            if (field === 'preload_time') {
                updates.status = 'Preloaded';
            } else if (field === 'complete_time') {
                updates.status = 'Complete';
            }

            const { error } = await supabase
                .from('active_delivery_runs')
                .update(updates)
                .eq('id', run.id);

            if (error) throw error;
            await fetchRuns();
        } catch (error) {
            console.error('Error updating time:', error);
            alert('Failed to update time');
        }
    };

    // Fetch all active runs
    const fetchRuns = async () => {
        try {
            const { data: runsData, error: runsError } = await supabase
                .from('active_delivery_runs')
                .select('*')
                .order('position');

            if (runsError) throw runsError;
            setRuns(runsData || []);

            // Fetch supply needs for all runs
            const { data: needsData, error: needsError } = await supabase
                .from('run_supply_needs')
                .select('*');

            if (needsError) throw needsError;
            setSupplyNeeds(needsData || []);

        } catch (error) {
            console.error('Error fetching runs:', error);
            alert('Failed to fetch delivery runs');
        }
    };

    // Fetch all stores
    const fetchStores = async () => {
        try {
            const { data, error } = await supabase
                .from('stores')
                .select('*')
                .eq('is_active', true)
                .order('department_number');

            if (error) throw error;
            setStores(data || []);
        } catch (error) {
            console.error('Error fetching stores:', error);
            alert('Failed to fetch stores');
        }
    };

    // Initialize data
    useEffect(() => {
        Promise.all([fetchRuns(), fetchStores()])
            .finally(() => setLoading(false));

        // Set up real-time subscription
        const subscription = supabase
            .channel('dispatch_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'active_delivery_runs'
                },
                () => {
                    fetchRuns();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Update run field
    const updateRunField = async (runId: string, field: string, value: any) => {
        try {
            const { error } = await supabase
                .from('active_delivery_runs')
                .update({ [field]: value })
                .eq('id', runId);

            if (error) throw error;
            fetchRuns();
        } catch (error) {
            console.error(`Error updating ${field}:`, error);
            alert(`Failed to update ${field}`);
        }
    };

    const handleAddRunClick = (runType: RunType) => {
        setIsAddingRun(prev => ({
            ...prev,
            [runType]: true
        }));
        setNewRun(prev => ({ ...prev, run_type: runType }));
    };

    const handleStoreSelect = async (storeId: string, runType: RunType) => {
        try {
            const selectedStore = stores.find(s => s.id === storeId);
            if (!selectedStore) return;

            const position = runs.filter(r => r.run_type === runType).length + 1;
            
            const { error } = await supabase
                .from('active_delivery_runs')
                .insert({
                    store_id: storeId,
                    store_name: selectedStore.name,
                    department_number: selectedStore.department_number,
                    run_type: runType,
                    truck_type: newRun.truck_type,
                    position: position,
                    status: 'Upcoming'
                });

            if (error) throw error;

            // Reset state and refresh runs
            setIsAddingRun(prev => ({
                ...prev,
                [runType]: false
            }));
            setNewRun({
                store_id: '',
                run_type: 'Morning',
                truck_type: 'Box Truck'
            });
            await fetchRuns();

        } catch (error) {
            console.error('Error adding run:', error);
            alert('Failed to add run');
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    const filteredRuns = runs.filter(run => {
        if (selectedFilter === 'all') return true;
        if (selectedFilter === 'box') return run.truck_type === 'Box Truck';
        if (selectedFilter === 'tractor') return run.truck_type === 'Tractor Trailer';
        return true;
    });

    return (
        <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Dispatch Dashboard</h1>
                    <div className="flex gap-4">
                        <div className="flex gap-2">
                            <button 
                                className={`px-4 py-2 rounded-md ${selectedFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                                onClick={() => setSelectedFilter('all')}
                            >
                                All Runs
                            </button>
                            <button 
                                className={`px-4 py-2 rounded-md ${selectedFilter === 'box' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                                onClick={() => setSelectedFilter('box')}
                            >
                                Box Truck Runs
                            </button>
                            <button 
                                className={`px-4 py-2 rounded-md ${selectedFilter === 'tractor' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                                onClick={() => setSelectedFilter('tractor')}
                            >
                                Tractor Trailer Runs
                            </button>
                        </div>
                    </div>
                </div>

                {RunTypes.map(runType => (
                    <div key={runType} className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">{runType} Runs</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white shadow-sm rounded-lg">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retail Store</th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sleeves</th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Caps</th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Canvases</th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Totes</th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hardlines Raw</th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Softlines Raw</th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FL Driver</th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start</th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preload</th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Complete</th>
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Depart</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredRuns
                                        .filter(run => run.run_type === runType)
                                        .map(run => {
                                            const supplies = supplyNeeds.find(need => need.store_id === run.store_id);
                                            return (
                                                <tr key={run.id} className={`${rowColors[run.status]} transition-colors`}>
                                                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                                                        {run.store_name}
                                                    </td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                                                        <select
                                                            value={run.truck_type}
                                                            onChange={(e) => updateRunField(run.id, 'truck_type', e.target.value)}
                                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                                        >
                                                            <option value="Box Truck">Box Truck</option>
                                                            <option value="Tractor Trailer">Tractor Trailer</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-sm">
                                                        <button
                                                            onClick={() => cycleStatus(run)}
                                                            className={`${statusColors[run.status]} hover:opacity-75 transition-opacity`}
                                                        >
                                                            {run.status}
                                                        </button>
                                                    </td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">{supplies?.sleeves_needed || 0}</td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">{supplies?.caps_needed || 0}</td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">{supplies?.canvases_needed || 0}</td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">{supplies?.totes_needed || 0}</td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">{supplies?.hardlines_needed || 0}</td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">{supplies?.softlines_needed || 0}</td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                                                        <input
                                                            type="text"
                                                            value={run.driver || ''}
                                                            onChange={(e) => updateRunField(run.id, 'driver', e.target.value)}
                                                            className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                                                        <button 
                                                            onClick={() => handleTimeClick(run, 'start_time')}
                                                            className="hover:text-blue-500 transition-colors"
                                                        >
                                                            {run.start_time ? format(new Date(run.start_time), 'HH:mm') : '-'}
                                                        </button>
                                                    </td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                                                        <button 
                                                            onClick={() => handleTimeClick(run, 'preload_time')}
                                                            className="hover:text-blue-500 transition-colors"
                                                        >
                                                            {run.preload_time ? format(new Date(run.preload_time), 'HH:mm') : '-'}
                                                        </button>
                                                    </td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                                                        <button 
                                                            onClick={() => handleTimeClick(run, 'complete_time')}
                                                            className="hover:text-blue-500 transition-colors"
                                                        >
                                                            {run.complete_time ? format(new Date(run.complete_time), 'HH:mm') : '-'}
                                                        </button>
                                                    </td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                                                        <button 
                                                            onClick={() => handleTimeClick(run, 'depart_time')}
                                                            className="hover:text-blue-500 transition-colors"
                                                        >
                                                            {run.depart_time ? format(new Date(run.depart_time), 'HH:mm') : '-'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })} 
                                        <tr>
                                            <td className="px-2 py-2" colSpan={2}>
                                                {isAddingRun[runType] ? (
                                                    <div className="flex gap-2">
                                                        <select
                                                            value={newRun.store_id}
                                                            onChange={(e) => handleStoreSelect(e.target.value, runType)}
                                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                                        >
                                                            <option value="">Select a store</option>
                                                            {stores
                                                                .filter(store => !runs.some(run => 
                                                                    run.store_id === store.id && 
                                                                    run.run_type === runType &&
                                                                    run.status !== 'Complete' &&
                                                                    run.status !== 'Cancelled'
                                                                ))
                                                                .map(store => (
                                                                    <option key={store.id} value={store.id}>
                                                                        {store.name}
                                                                    </option>
                                                                ))
                                                            }
                                                        </select>
                                                        <select
                                                            value={newRun.truck_type}
                                                            onChange={(e) => setNewRun(prev => ({ ...prev, truck_type: e.target.value as TruckType }))}
                                                            className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                                        >
                                                            <option value="Box Truck">Box Truck</option>
                                                            <option value="Tractor Trailer">Tractor Trailer</option>
                                                        </select>
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleAddRunClick(runType)}
                                                        className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                                    >
                                                        <PlusIcon className="h-4 w-4 mr-1" />
                                                        Add Run
                                                    </button>
                                                )}
                                            </td>
                                            <td colSpan={12}></td>
                                        </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
