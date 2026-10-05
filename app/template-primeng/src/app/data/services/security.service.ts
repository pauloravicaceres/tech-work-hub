import { Injectable } from '@angular/core';
import { IApiMenu } from '../interfaces';
import { HttpClient } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class SecurityService {
    public model: IApiMenu[] = [];

    constructor( private http: HttpClient ) { }

    get getMenu(): IApiMenu[] {
        this.model = [
        {
            label: 'Inicio',
            items: [
                { label: 'Inicio', icon: 'pi pi-fw pi-home', routerLink: ['/panel/home'] }
            ]
        },
        {
            label: 'Compras',
            items: [
                { label: 'Proveedores', icon: 'pi pi-fw pi-id-card', routerLink: ['/uikit/formlayout'] },
                { label: 'Almacen', icon: 'pi pi-fw pi-check-square', routerLink: ['/uikit/input'] },
                { label: 'Productos', icon: 'pi pi-fw pi-bookmark', routerLink: ['/panel/product'] }
            ]
        },
        {
            label: 'LPC',
            items: [
                { label: 'Instrucción Operativa', icon: 'pi pi-fw pi-bookmark', routerLink: ['/panel/operative-instruction'] }
            ]
        },
        {
            label: 'Ventas',
            items: [
                {
                    label: 'Ventas',
                    icon: 'pi pi-fw pi-user',
                    items: [
                        {
                            label: 'Facturas',
                            icon: 'pi pi-fw pi-sign-in',
                            routerLink: ['/auth/login']
                        },
                        {
                            label: 'Boletas',
                            icon: 'pi pi-fw pi-times-circle',
                            routerLink: ['/auth/error']
                        },
                        {
                            label: 'Notas de Crédito',
                            icon: 'pi pi-fw pi-lock',
                            routerLink: ['/auth/access']
                        }
                    ]
                },
                {
                    label: 'Contabilidad',
                    icon: 'pi pi-fw pi-pencil',
                    routerLink: ['/pages/crud']
                }
            ]
        },
        {
            label: 'Submenu',
            items: [
                {
                    label: 'Submenu 1', icon: 'pi pi-fw pi-bookmark',
                    items: [
                        {
                            label: 'Submenu 1.1', icon: 'pi pi-fw pi-bookmark',
                            items: [
                                { label: 'Submenu 1.1.1', icon: 'pi pi-fw pi-bookmark' },
                                { label: 'Submenu 1.1.2', icon: 'pi pi-fw pi-bookmark' },
                                { label: 'Submenu 1.1.3', icon: 'pi pi-fw pi-bookmark' },
                            ]
                        }
                    ]
                }
            ]
        } ];

        return this.model;
    }
    
    get getMenuEN(): IApiMenu[] {
        this.model = [
        {
            label: 'Home',
            items: [
                { label: 'Home', icon: 'pi pi-fw pi-home', routerLink: ['/panel/home'] }
            ]
        },
        {
            label: 'Shopping',
            items: [
                { label: 'Suppliers', icon: 'pi pi-fw pi-id-card', routerLink: ['/uikit/formlayout'] },
                { label: 'Store', icon: 'pi pi-fw pi-check-square', routerLink: ['/uikit/input'] },
                { label: 'Products', icon: 'pi pi-fw pi-bookmark', routerLink: ['/panel/product'] }
            ]
        },
        {
            label: 'LPC',
            items: [
                { label: 'Operative Instruction', icon: 'pi pi-fw pi-bookmark', routerLink: ['/panel/operative-instruction'] }
            ]
        },
        {
            label: 'Sales',
            items: [
                {
                    label: 'Sales',
                    icon: 'pi pi-fw pi-user',
                    items: [
                        {
                            label: 'Bills',
                            icon: 'pi pi-fw pi-sign-in',
                            routerLink: ['/auth/login']
                        },
                        {
                            label: 'Tickets',
                            icon: 'pi pi-fw pi-times-circle',
                            routerLink: ['/auth/error']
                        },
                        {
                            label: 'Credit Notes',
                            icon: 'pi pi-fw pi-lock',
                            routerLink: ['/auth/access']
                        }
                    ]
                },
                {
                    label: 'Accounting',
                    icon: 'pi pi-fw pi-pencil',
                    routerLink: ['/pages/crud']
                }
            ]
        },
        {
            label: 'Submenu',
            items: [
                {
                    label: 'Submenu 1', icon: 'pi pi-fw pi-bookmark',
                    items: [
                        {
                            label: 'Submenu 1.1', icon: 'pi pi-fw pi-bookmark',
                            items: [
                                { label: 'Submenu 1.1.1', icon: 'pi pi-fw pi-bookmark' },
                                { label: 'Submenu 1.1.2', icon: 'pi pi-fw pi-bookmark' },
                                { label: 'Submenu 1.1.3', icon: 'pi pi-fw pi-bookmark' },
                            ]
                        }
                    ]
                }
            ]
        } ];

        return this.model;
    }
}
