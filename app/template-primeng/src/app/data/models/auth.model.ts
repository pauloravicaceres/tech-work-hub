export class User {

    constructor(
        public user_name: string,
        public user_password: string,
        public user_id?: string,
        public profile_id?: string,
        public profile_name?: string,
        public person_first_name?: string,
        public person_last_name?: string,
        public address?: string,
        public email?: string
    ) {}
}

export class Menu {

    constructor(
        public opcion: string,
    ) {}
}