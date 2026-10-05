export interface IField {
    val: string;
    error: string;
    isValid: () => boolean;
}

export interface INumberField {
    val: number;
    error: string;
    isValid: () => boolean;
}

export interface IMultiSelec {
    val: any[];
    error: string;
    isValid: () => boolean;
}

export interface IDateField {
    val?: Date;
    error: string;
    isValid: () => boolean;
}

export interface IBooleanField {
    val: Boolean;
    error: string;
    isValid: () => boolean;
}

export interface IMultiDateField {
    val?: Date[];
    error: string;
    isValid: () => boolean;
}
