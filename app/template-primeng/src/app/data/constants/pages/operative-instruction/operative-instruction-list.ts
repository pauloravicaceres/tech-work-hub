import { IOperativeInstructionList } from "@data/interfaces";
import { IFieldsExport, IHeader } from "@data/interfaces/ui/table.interface";


export const HEADER_DATA: IHeader[] = [
    {
        codigo: '',
        description: '',
        type_control: 'check',
        style: 'min-width: 30px',
        isFrozenColumn: true,
        alignFrozenColumn: 'left'
    },
    {
        codigo: 'credit_number',
        description: 'Nro Crédito',
        type_control: 'span',
        style: 'min-width:100px',
        isFrozenColumn: true,
        alignFrozenColumn: 'left'
    },
    {
        codigo: 'client_name',
        description: 'Cliente',
        type_control: 'span',
        style: 'min-width: 200px',
        isFrozenColumn: true,
        alignFrozenColumn: 'left'
    },
    {
        codigo: 'category_name',
        description: 'Categoría',
        type_control: 'span',
        style: 'min-width: 300px'
    },
    {
        codigo: 'product_name',
        description: 'Producto',
        type_control: 'span',
        style: 'min-width: 300px'
    },
    {
        codigo: 'subproduct_name',
        description: 'Subproducto',
        type_control: 'span',
        style: 'min-width: 200px'
    },
    {
        codigo: 'value_date',
        description: 'Fecha Valor',
        type_control: 'span',
        style: 'min-width:200px'
    },
    {
        codigo: 'register_date',
        description: 'Fecha Registro',
        type_control: 'span',
        style: 'min-width:200px'
    },
    {
        codigo: 'state_name',
        description: 'Estado',
        type_control: 'tag',
        style: 'min-width: 100px'
    },
    // {
    //     codigo: 'Ver',
    //     description: 'Movimiento',
    //     type_control: 'link',
    //     action: 'ver_movimiento'
    // },
    {
        codigo: '',
        description: 'Acciones',
        type_control: 'actions',
        style: 'min-width:70px',
        isFrozenColumn: true,
        alignFrozenColumn: 'right'
    }
];

export const HEADER_DATA_EN: IHeader[] = [
    {
        codigo: '',
        description: '',
        type_control: 'check',
        style: 'min-width: 30px',
        isFrozenColumn: true,
        alignFrozenColumn: 'left'
    },
    {
        codigo: 'credit_number',
        description: 'Credit Num',
        type_control: 'span',
        style: 'min-width:100px',
        isFrozenColumn: true,
        alignFrozenColumn: 'left'
    },
    {
        codigo: 'client_name',
        description: 'Client',
        type_control: 'span',
        style: 'min-width: 200px',
        isFrozenColumn: true,
        alignFrozenColumn: 'left'
    },
    {
        codigo: 'category_name',
        description: 'Category',
        type_control: 'span',
        style: 'min-width: 300px'
    },
    {
        codigo: 'product_name',
        description: 'Product',
        type_control: 'span',
        style: 'min-width: 300px'
    },
    {
        codigo: 'subproduct_name',
        description: 'Subproduct',
        type_control: 'span',
        style: 'min-width: 200px'
    },
    {
        codigo: 'value_date',
        description: 'Value Date',
        type_control: 'span',
        style: 'min-width:200px'
    },
    {
        codigo: 'register_date',
        description: 'Register Date ',
        type_control: 'span',
        style: 'min-width:200px'
    },
    {
        codigo: 'state_name',
        description: 'Status',
        type_control: 'tag',
        style: 'min-width: 100px'
    },
    // {
    //     codigo: 'Ver',
    //     description: 'Movimiento',
    //     type_control: 'link',
    //     action: 'ver_movimiento'
    // },
    {
        codigo: '',
        description: 'Actions',
        type_control: 'actions',
        style: 'min-width:70px',
        isFrozenColumn: true,
        alignFrozenColumn: 'right'
    }
];


export const OPERATIVE_INSTRUCTION_LIST: {
    FORM: IOperativeInstructionList
} = {
    FORM: {
        grid: {
            header: HEADER_DATA
        }
    }
}


export const OPERATIVE_INSTRUCTION_HEADER_EXPORT: IFieldsExport[] = [
    {
        codigo: 'credit_number',
        description: 'Nro Crédito',
        ancho: 13,
        horizontal: 'center'
    },
    {
        codigo: 'client_name',
        description: 'Cliente',
        ancho: 40,
        horizontal: 'left'
    },
    {
        codigo: 'category_name',
        description: 'Categoría',
        ancho: 40,
        horizontal: 'left'
    },
    {
        codigo: 'product_name',
        description: 'Producto',
        ancho: 40,
        horizontal: 'left'
    },
    {
        codigo: 'subproduct_name',
        description: 'Subproducto',
        ancho: 30,
        horizontal: 'left'
    },
    {
        codigo: 'value_date',
        description: 'Fecha Valor',
        ancho: 15,
        horizontal: 'center'
    },
    {
        codigo: 'register_date',
        description: 'Fecha Registro',
        ancho: 15,
        horizontal: 'center'
    },
    {
        codigo: 'state_name',
        description: 'Estado',
        ancho: 13,
        horizontal: 'center'
    }
];

export const OPERATIVE_INSTRUCTION_HEADER_EXPORT_EN: IFieldsExport[] = [
    {
        codigo: 'credit_number',
        description: 'Credit Number',
        ancho: 15,
        horizontal: 'center'
    },
    {
        codigo: 'client_name',
        description: 'Client',
        ancho: 40,
        horizontal: 'left'
    },
    {
        codigo: 'category_name',
        description: 'Category',
        ancho: 40,
        horizontal: 'left'
    },
    {
        codigo: 'product_name',
        description: 'Product',
        ancho: 40,
        horizontal: 'left'
    },
    {
        codigo: 'subproduct_name',
        description: 'Subproduct',
        ancho: 30,
        horizontal: 'left'
    },
    {
        codigo: 'value_date',
        description: 'Value Date',
        ancho: 15,
        horizontal: 'center'
    },
    {
        codigo: 'register_date',
        description: 'Register Date',
        ancho: 15,
        horizontal: 'center'
    },
    {
        codigo: 'state_name',
        description: 'Status',
        ancho: 13,
        horizontal: 'center'
    }
];
