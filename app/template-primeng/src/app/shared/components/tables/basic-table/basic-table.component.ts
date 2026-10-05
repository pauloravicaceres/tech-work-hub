import { Component, EventEmitter, HostListener, Input, Output, Renderer2, ViewChild } from '@angular/core';
import { IApiResponse } from '@data/interfaces';
import { IFilter, ITable, ITableResponse } from '@data/interfaces/ui/table.interface';
import { TranslateService } from '@ngx-translate/core';
// import { LazyLoadEvent } from 'primeng/api';
import { TableLazyLoadEvent } from 'primeng/table';

@Component({
  selector: 'app-basic-table',
  templateUrl: './basic-table.component.html',
  styleUrls: ['./basic-table.component.scss']
})
export class BasicTableComponent {
  @Input() headers: any[] = [];
  @Input() columns: any;
  @Input() filters: any = {};
  @Output() action = new EventEmitter();
  public dataSelected: any[] = [];
  public tableProperties: ITable;
  public lazyEvent: IFilter;
  public records: ITableResponse;
  public delete_label: string = this.translate.instant('generic.delete');
  public edit_label: string = this.translate.instant('generic.edit');
  public show_label: string = this.translate.instant('generic.show');
  screenWidth: number | null = null;

  @ViewChild('basicTable', { static: false }) basicTable: any;
  accion: string = '';
  id_selected: number = 0;

  constructor(public translate: TranslateService,
    private renderer: Renderer2) {
    this.tableProperties = {
      selectAll: false,
      totalRecords: 0,
      loading: false,
      first: 0,
      sortField: 'nombre',
      sortOrder: 1,
      rows: 5,
      rowsPerPageOptions: [5, 10, 15],
    }
    this.lazyEvent = {
      first: this.tableProperties.first,
      rows: this.tableProperties.rows,
      sortField: this.tableProperties.sortField,
      sortOrder: this.tableProperties.sortOrder
    }
    this.records = {
      total_records: 0,
      list_records: []
    }
    this.translate.onLangChange.subscribe((event) => {
      this.delete_label = this.translate.instant('generic.delete')
      this.edit_label = this.translate.instant('generic.edit')
      this.show_label = this.translate.instant('generic.show')
    });
  }

  ngOnInit() {
    this.getScreenSize();
    this.lazyEvent.first = 0;
    this.lazyEvent.rows = 1;
    this.lazyEvent.sortField = null;
    this.lazyEvent.sortOrder = undefined;
    this.lazyEvent.filters = { ...this.filters };

    this.tableProperties.sortField = this.lazyEvent.sortField!;
    this.tableProperties.loading = true;
    this.tableProperties.selectAll = false;

    this.action.emit({ type: 'load', lazyEvent: this.lazyEvent })
  }

  @HostListener('window:resize', ['$event'])
  getScreenSize(event?: any) {
    this.screenWidth = window.innerWidth;
  }

  loadData(event: TableLazyLoadEvent) {
    this.lazyEvent.first = event.first;
    this.lazyEvent.rows = event.rows!;
    this.lazyEvent.sortField = event.sortField;
    this.lazyEvent.sortOrder = event.sortOrder!;
    this.lazyEvent.filters = { ...this.filters };

    this.tableProperties.sortField = this.lazyEvent.sortField!;
    this.tableProperties.loading = true;
    this.tableProperties.selectAll = false;

    this.action.emit({ type: 'load', lazyEvent: this.lazyEvent })
  }

  load_finished(records: any) {
    this.records = {
                      list_records: records.data,
                      total_records: records.totalRecords
                    };
    this.tableProperties.totalRecords = this.records.total_records;
    this.tableProperties.loading = false;
  }

  filter(columns: any){
    return columns.filter( (s:any) => s.type_control != 'actions');
  }

  search(first: number = 0, rows: number = 5) {
    this.basicTable._first = 0;
    let event: TableLazyLoadEvent = {
      first: first,
      rows: rows,
      sortField: this.tableProperties.sortField,
      sortOrder: 1,
    };
    this.loadData(event);
  }

  onSelectionChange(value = []) {
    debugger
    this.tableProperties.selectAll = value.length === this.records.list_records.length;
    this.dataSelected = value;
    this.action.emit({ type: 'select', dataSelected: this.dataSelected });
  }

  onSelectAllChange(event: any) {
    this.tableProperties.selectAll = event.checked;
    this.dataSelected = event.checked ? this.records.list_records : [];
    this.action.emit({ type: 'select', dataSelected: this.dataSelected });
  }

  paginate(event: any) {
    let page = event.first / event.rows + 1;
    //event.first = Index of the first record
    //event.rows = Number of rows to display in new page
    //event.page = Index of the new page
    //event.pageCount = Total number of pages
  }

  getSeverity(status: string) {
    switch (status) {
        case 'ELIMINADO':
            return 'danger';

        case 'APROBADO':
            return 'success';

        case 'new':
            return 'info';

        case 'PENDIENTE':
            return 'warning';

        default:
            return null;
    }
  }

}
