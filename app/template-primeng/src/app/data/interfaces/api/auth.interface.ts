export interface IApiAuthResponse
{
    user_id: number;
    user_name?: string;
    profile_id: number;
    profile_name?: string;
    person_first_name?: string;
    person_last_name?: string;
    person_name?: string;
    address?: string;
    email?: string;
    cell_phone?: string;
    document_type?: string;
    document_number?: string;
    creation_date?: string;
    image_type?: string;
    avatar?: string;
    token?: string;
}

export interface IApiAuthRequest
{
    user?: string;
    pass?: string;
}