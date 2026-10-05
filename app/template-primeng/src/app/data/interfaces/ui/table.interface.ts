
export interface ITable {
    selectAll: boolean;
    totalRecords: number;
    loading: boolean;
    first: number;
    sortField: string | string[] | null | undefined;
    rows: number;
    sortOrder: number;
    rowsPerPageOptions: number[]
}
export interface IFilter {
    first?: number;
    rows?: number;
    sortField?: string | string[] | null | undefined;
    sortOrder?: number;
    filters?: {
        [s: string]: {
            value?: any;
        };
    };
    token?: string;
}

export interface IMovFilter {
    first?: number;
    rows?: number;
    sortField?: string;
    sortOrder?: number;
    id_documento?: number;
}

export interface IHeader {
    codigo: string;
    description: string;
    sort?: boolean;
    style?: string;
    action?: string;
    type_control?: 'check' | 'span' | 'button' | 'tag' | 'actions' | 'link';
    isFrozenColumn?: boolean;
    alignFrozenColumn?: 'left' | 'right'
}
export interface ITableResponse {
    total_records: number;
    list_records: [];
}

export interface IFieldsExport {
    codigo: string;
    description: string;
    ancho: number;
    horizontal: "distributed" | "justify" | "center" | "left" | "right" | "fill" | "centerContinuous";
}

export interface IFieldsImportExcel {
    nombre_hoja: string;
    nombre_columnas: string[]
}