import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { LayoutService } from '../services/layout.service';
import { MenuItem } from 'primeng/api';
import { MenuService } from '../services/menu.service';
import { INFO_APP } from 'src/app/data/constants';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-container',
  templateUrl: './container.component.html',
  styleUrls: ['./container.component.scss']
})
export class ContainerComponent {
  homepage: string = INFO_APP.HOMEPAGE;
  pageActive: string = INFO_APP.HOMEPAGE;
  items!: MenuItem[];
  home!: MenuItem;
  menuSourceSubscription: Subscription;

  constructor( private menuService: MenuService,
  public layoutService: LayoutService,
  public translate: TranslateService ) {
    
    this.menuSourceSubscription = this.menuService.breadcrumbSource$.subscribe(value => {
      Promise.resolve(null).then(() => {
        this.items = value;
        this.home = {icon: 'pi pi-home', routerLink: '/'};
        this.pageActive = this.items.length == 0 ? 'Inicio' : this.items[this.items.length - 1].label!;
      });

    });
  }
  
  ngOnInit(): void {
    this.translate.onLangChange.subscribe((event) => {
      this.homepage = event.lang == 'es'? INFO_APP.HOMEPAGE : INFO_APP.HOMEPAGE_EN;
    });
  }

}
