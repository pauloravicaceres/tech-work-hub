import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent {

  public items: MenuItem[] = [];
  loadPage: boolean = true;

  constructor( public translate: TranslateService ) {
  }

  ngOnInit(): void {
    this.loadParameters();
    this.setOptions();
  }

  loadParameters() {
    setTimeout(() => {
      this.loadPage = false;
    }, 2000);
  }

  setOptions() {
    this.items = [
      {
          tooltipOptions: {
              tooltipLabel: "Consultar",
              tooltipPosition: "top",
          },
          icon: 'pi pi-search',
          label: 'Consultar',
          command: () => {
          }
      },
      {
          tooltipOptions: {
              tooltipLabel: "Limpiar",
              tooltipPosition: "top",
          },
          icon: 'pi pi-eraser',
          label: 'Limpiar',
          command: () => {
          }
      },
      {
          tooltipOptions: {
              tooltipLabel: "Crear",
              tooltipPosition: "top",
          },
          icon: 'pi pi-plus',
          label: 'Crear',
          command: () => {
          }
      },
      {
          tooltipOptions: {
              tooltipLabel: "Exportar",
              tooltipPosition: "top",
          },
          icon: 'pi pi-file-excel',
          label: 'Exportar',
          command: () => {
          }
      },
    ];
  }

}
