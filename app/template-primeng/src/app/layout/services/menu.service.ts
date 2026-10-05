import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { MenuChangeEvent } from '../interface/menu-change-event.interface';
import { SecurityService } from 'src/app/data/services/security.service';
import { MenuItem } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
    providedIn: 'root'
})
export class MenuService {


    private menuSource = new Subject<MenuChangeEvent>();
    private resetSource = new Subject();
    private breadcrumbSource = new Subject<MenuItem[]>();
  
    breadcrumbSource$ = this.breadcrumbSource.asObservable();
    menuSource$ = this.menuSource.asObservable();
    resetSource$ = this.resetSource.asObservable();
  
    constructor(private securityService: SecurityService,
      private translate: TranslateService) {
    }
  
    onMenuStateChange(event: MenuChangeEvent) {
      this.menuSource.next(event);
  
      if(event.routeEvent){
        let arrActive = event.key.split('-');
  
        let items = [];

        let firstLevel: any;
        if (this.translate.currentLang == 'es')
          firstLevel = this.securityService.getMenu.at(+(arrActive[0] as string));
        else
          firstLevel = this.securityService.getMenuEN.at(+(arrActive[0] as string));
  
        for (let index = 1; index < arrActive.length; index++) {
          let indice: number = +(arrActive[index] as string);
          let secondLevel = firstLevel?.items!.at(indice);
          items.push({label: secondLevel?.label});
          firstLevel = secondLevel;
        }
        let inicio = items[0].label;
        this.breadcrumbSource.next(inicio == 'Inicio' ? [] : items);
      }
    }
  
    reset() {
        this.resetSource.next(true);
    }
  
}
