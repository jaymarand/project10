export interface ParLevel {
    id: string;
    location: string;
    min_quantity: number;
    current_quantity: number;
    last_updated: Date;
}

export interface ParLevelForm {
    location: string;
    min_quantity: number;
    current_quantity: number;
}
