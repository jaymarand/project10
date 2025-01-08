export type RunStatus = 'Upcoming' | 'Preloaded' | 'Complete' | 'Cancelled';
export type RunType = 'Morning' | 'Afternoon' | 'ADC';
export type TruckType = 'Box Truck' | 'Tractor Trailer';

export interface Store {
    id: string;
    name: string;
    department_number: string;
}

export interface DeliveryRun {
    id: string;
    store_id: string;
    run_type: RunType;
    status: RunStatus;
    truck_type: TruckType;
    driver: string | null;
    position: number;
    start_time: string | null;
    preload_time: string | null;
    complete_time: string | null;
    depart_time: string | null;
    trailer_number: string | null;
    tractor_number: string | null;
    dock: string | null;
    return_trailer: string | null;
    store_name?: string;
    department_number?: string;
    created_at: string;
    updated_at: string;
}

export interface SupplyNeed {
    run_id: string;
    store_id: string;
    store_name: string;
    department_number: string;
    run_type: RunType;
    truck_type: TruckType;
    status: RunStatus;
    par_sleeves: number;
    par_caps: number;
    par_canvases: number;
    par_totes: number;
    par_hardlines: number;
    par_softlines: number;
    current_sleeves: number;
    current_caps: number;
    current_canvases: number;
    current_totes: number;
    current_hardlines: number;
    current_softlines: number;
    sleeves_needed: number;
    caps_needed: number;
    canvases_needed: number;
    totes_needed: number;
    hardlines_needed: number;
    softlines_needed: number;
    last_count_time: string;
}
