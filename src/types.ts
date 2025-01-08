export interface DriverProfile {
    id: string;
    user_id?: string;
    first_name: string;
    last_name: string;
    has_cdl: boolean;
    cdl_number?: string;
    cdl_expiration_date?: string;
    is_active: boolean;
    email?: string;
}

export interface NewDriverForm {
    email: string;
    first_name: string;
    last_name: string;
    has_cdl: boolean;
    cdl_number: string;
    cdl_expiration_date: string;
}
