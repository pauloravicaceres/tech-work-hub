export interface IConfirmDialog {
    header: string;
    message: string;
    icon: string;
    style?: {
        [key:string]: any
    };
    register?: string;
    onAccept?: () => void;
    onReject?: () => void;
}

export interface IDialog {
    isOpen: boolean;
    title: string;
    styleContainer?: {};
    position?: "center" | "left" | "right" | "top" | "bottom" | "topleft" | "topright" | "bottomleft" | "bottomright";
    message?: string;
    type: 'delete' | 'save';
}

//   export interface IDialog {
//     isOpen: boolean;
//     title: string;
//     styleContainer?: {};
//     message?: string;
//     type: 'delete' | 'save';
//     icon?: string;
//     style?: string
// }
