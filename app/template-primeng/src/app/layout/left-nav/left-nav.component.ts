import { Component, ElementRef } from '@angular/core';
import { LayoutService } from '../services/layout.service';
import { IApiMenu } from 'src/app/data/interfaces';
import { SecurityService } from 'src/app/data/services/security.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-left-nav',
  templateUrl: './left-nav.component.html'
})
export class LeftNavComponent {
  public model: IApiMenu[] = this.securityService.getMenu;

  constructor(private securityService: SecurityService,
    public el: ElementRef,
    public layoutService: LayoutService,
    public translate: TranslateService) {
      this.translate.onLangChange.subscribe((event) => {
        this.model = event.lang == 'es'? this.securityService.getMenu : this.securityService.getMenuEN;
      });
      
  }

  ngOnInit() {
  // this.securityService.getMenu.forEach( (element: IApiMenu) => {
  //   if(element.items![0].items!.length == 0){
  //     let item: IApiMenu = {
  //       label: element.items![0].label,
  //       items: [
  //         { label: element.items![0].label, icon: element.items![0].icon, routerLink: element.items![0].routerLink }
  //       ]
  //     }
  //     this.model.push(item);
  //   }
  //   else{
  //     this.model.push(element);
  //   }
  // });
  }

}