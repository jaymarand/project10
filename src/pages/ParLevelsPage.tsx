import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface StoreSupply {
  id: string;
  store_id: string;
  stores?: {
    id: string;
    name: string;
    department_number: string;
  } | null;
  sleeves: number;
  caps: number;
  canvases: number;
  totes: number;
  hardlines_raw: number;
  softlines_raw: number;
  par_level: number;
}

interface StoreDisplay {
  stores?: {
    id: string;
    name: string;
    department_number: string;
  } | null;
}

const SUPPLY_TYPES = {
  'Sleeves': 'sleeves',
  'Caps': 'caps',
  'Canvases': 'canvases',
  'Totes': 'totes',
  'Hardlines Raw': 'hardlines_raw',
  'Softlines Raw': 'softlines_raw'
} as const;

const StoreInfo: React.FC<StoreDisplay> = ({ stores }) => {
  const deptNumber = stores?.department_number || '';
  const storeName = stores?.name || '';
  
  return (
    <>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {deptNumber}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {storeName}
      </td>
    </>
  );
};

export default function ParLevelsPage() {
  const [supplies, setSupplies] = useState<StoreSupply[]>([]);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSupplies();
  }, []);

  const fetchSupplies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('store_supplies')
        .select(`
          *,
          stores:store_id (
            department_number,
            name
          )
        `)
        .order('store_id');

      if (error) throw error;
      setSupplies(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateParLevel = async (supply: StoreSupply, type: string) => {
    if (!editingCell) return;
    
    try {
      const { error } = await supabase
        .from('store_supplies')
        .update({ [type]: editValue })
        .eq('id', supply.id);

      if (error) throw error;
      
      setEditingCell(null);
      fetchSupplies(); // Refresh data
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (supply: StoreSupply, type: string) => {
    setEditingCell(`${supply.id}-${type}`);
    setEditValue(supply[type as keyof StoreSupply] as number);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading par levels...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">Par Levels</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Store
                </th>
                {Object.keys(SUPPLY_TYPES).map((type) => (
                  <th key={type} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {type}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {supplies.map((supply) => (
                <tr key={supply.id}>
                  <StoreInfo stores={supply.stores} />
                  {Object.entries(SUPPLY_TYPES).map(([_, type]) => (
                    <td key={`${supply.id}-${type}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {editingCell === `${supply.id}-${type}` ? (
                        <input
                          type="number"
                          className="w-20 px-2 py-1 border rounded"
                          value={editValue}
                          onChange={(e) => setEditValue(Number(e.target.value))}
                          onBlur={() => updateParLevel(supply, type)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              updateParLevel(supply, type);
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={() => handleEdit(supply, type)}
                          className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                        >
                          {String(supply[type as keyof StoreSupply] || '')}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
