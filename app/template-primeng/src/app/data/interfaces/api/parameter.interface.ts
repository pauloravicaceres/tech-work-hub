export interface IParameter {
    parameter_id: number;
    parameter_code: string;
    parameter_name: string;
}

export interface IClient {
    client_id: string;
    client_code: string;
    client_name: string;
}

export interface ICategory {
    category_id: number;
    category_code: string;
    category_name: string;
}

export interface IProduct {
    product_id: number;
    product_code: string;
    product_name: string;
    category_id: number;
}

export interface ISubproduct {
    subproduct_id: number;
    subproduct_code: string;
    subproduct_name: string;
    product_id: number;
}
