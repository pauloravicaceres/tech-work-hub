import { IField } from "./field-generic.interface";

export interface ILogin {
    user: IField;
    password: IField;
}

export interface IRecover {
    email: IField;
}

export interface INewPassword {
    password: IField;
    repeat_password: IField;
}

export interface IRegister {
    name: IField;
    last_name_father: IField;
    last_name_mother: IField;
    user: IField;
    email: IField;
    password: IField;
}

