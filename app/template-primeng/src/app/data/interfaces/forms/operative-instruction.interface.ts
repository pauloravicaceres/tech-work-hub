import { ICategory, IClient, IParameter, IProduct, ISubproduct } from "../api/parameter.interface";
import { IHeader } from "../ui/table.interface";
import { IField, IMultiSelec, INumberField, IDateField, IBooleanField, IMultiDateField } from "./field-generic.interface";
import { MenuItem } from 'primeng/api';

export const STATUS_DATA: IParameter[] = [
    { parameter_id: 1, parameter_code: 'A', parameter_name: 'APROBADO' },
    { parameter_id: 2, parameter_code: 'E', parameter_name: 'ELIMINADO' },
    { parameter_id: 3, parameter_code: 'P', parameter_name: 'PENDIENTE' }
];

export interface IOperativeInstruction {
    row: number;
    client: string;
    credit_number: string;
    category: string;
    product: string;
    subproduct: string;
    value_date: string;
    register_date: string;
    status: string;
}


export class IOperativeInstructionValueFilter {

    static fromValueFilter( { credit_number, client, category }: any ) {
        return new IOperativeInstructionValueFilter(credit_number, client, category);
    }

    constructor(
        public credit_number?: string | null,
        public client?: IClient | null,
        public category?: string | null,
        public product?: string | null,
        public subproduct?: string | null,
        public value_date?: Date[] | null,
        public register_date_start?: Date | null,
        public register_date_end?: Date | null,
        public status?: string | null
    ) {}
    
}

export class IOperativeInstructionListFilter {

    constructor(
        public client: {
            list: IClient[];
            load: boolean;
        },
        public category: {
            list: ICategory[];
            load: boolean;
        },
        public product: {
            list: IProduct[];
            load: boolean;
        },
        public subproduct: {
            list: ISubproduct[];
            load: boolean;
        },
        public status: {
            list: IParameter[];
            load: boolean;
        }
    ) {}
    
}

export interface IOperativeInstructionDetail {
    id: number;
    credit_number: IField;
    client: IField;
    category: IField;
    product: IField;
    subproduct: IField;
    value_date: IDateField;
    register_date: IDateField;
}


export interface IOperativeInstructionList {
    grid: {
        header: IHeader[]
    }
}
