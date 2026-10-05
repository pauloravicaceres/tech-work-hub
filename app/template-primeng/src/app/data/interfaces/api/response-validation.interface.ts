export interface IApiResponse<T> {
    data: T;
    totalRecords: number;
    error: boolean;
    msg: string;
}

export interface IApiResponseValidation {
    msg: string;
    isValid: boolean;
}
