import { Component, OnInit, ViewChild } from '@angular/core';
import { HEADER_DATA, HEADER_DATA_EN, OPERATIVE_INSTRUCTION_HEADER_EXPORT, OPERATIVE_INSTRUCTION_HEADER_EXPORT_EN, OPERATIVE_INSTRUCTION_LIST } from '@data/constants/pages/operative-instruction/operative-instruction-list';
import { IApiResponse, IConfirmDialog, IDialog, IOperativeInstruction, IOperativeInstructionList, IOperativeInstructionListFilter, IOperativeInstructionValueFilter, STATUS_DATA } from '@data/interfaces';
import { ICategory, IClient } from '@data/interfaces/api/parameter.interface';
import { IFieldsExport, IFilter, IHeader } from '@data/interfaces/ui/table.interface';
import { ExportService } from '@data/services/export.service';
import { OperativeInstructionService } from '@data/services/operative-instruction.service';
import { LayoutService } from '@layout/services/layout.service';
import { TranslateService } from '@ngx-translate/core';
import { BasicTableComponent, InputTextComponent } from '@shared/components';
import { ConfirmEventType, ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { OperativeInstructionDetailComponent } from '../operative-instruction-detail/operative-instruction-detail.component';
import { ENUM_ACTIONS_OPTIONS } from '@data/enum';
import { ActionsService } from '@shared/services/actions.service';
import { Subscription } from 'rxjs';
import { AppConfirmationService } from '@shared/services/app-confirmation.service';

interface AutoCompleteCompleteEvent {
  originalEvent: Event;
  query: string;
}

@Component({
  selector: 'app-operative-instruction-list',
  templateUrl: './operative-instruction-list.component.html',
  styleUrls: ['./operative-instruction-list.component.scss'],
  providers: [MessageService]
})
export class OperativeInstructionListComponent implements OnInit {
  public form: IOperativeInstructionList = OPERATIVE_INSTRUCTION_LIST.FORM;
  public formValueFilter: IOperativeInstructionValueFilter = new IOperativeInstructionValueFilter();
  public formListFilter: IOperativeInstructionListFilter;
  public operativesSelected: IOperativeInstruction[] = [];
  private headerExport: IFieldsExport[] = OPERATIVE_INSTRUCTION_HEADER_EXPORT;
  public headerList: IHeader[] = HEADER_DATA;
  public lazyEvent: IFilter = {};
  @ViewChild('tableOperative') tableOperative!: BasicTableComponent;
  public itemsMenu: MenuItem[] = [];
  loadPage: boolean = true;
  confirmDialog: IConfirmDialog = { header: '', message: '', icon: 'pi pi-exclamation-triangle', style: { with: '500px' } }

  public expression: boolean = true;
  detailDialog: IDialog = { isOpen: false, title: '', styleContainer: {width: '40vw'}, type: 'save' }
  @ViewChild(OperativeInstructionDetailComponent) _operativeInstructionDetailComponent!: OperativeInstructionDetailComponent;
  public automatic_search = this.layoutService.config.automaticSearch;
  filteredClients: any[] | undefined;
  maxDateRegisterStart: Date | null | undefined;
  minDateRegisterEnd: Date | null | undefined;
  maxDate: Date;
  clickEventSubs: Subscription;
  configUpdateSubs: Subscription;
  menuStatic: boolean = false;
  floatLabel: boolean = false;
  iconShowHide: string = 'pi pi-minus';
  textShowHide: string = this.translate.instant('generic.hide');

  constructor( public translate: TranslateService,
    private appConfirmationService: AppConfirmationService,
    public operativeInstructionService: OperativeInstructionService,
    public exportService: ExportService,
    public layoutService: LayoutService,
    private messageService: MessageService,
    private actionService: ActionsService ) {
    this.formListFilter = new IOperativeInstructionListFilter(
      { list: [], load: false },
      { list: [], load: false },
      { list: [], load: false },
      { list: [], load: false },
      { list: [], load: false }
    )
    this.maxDate = new Date();
    this.maxDateRegisterStart = new Date();
    this.form.grid.header = HEADER_DATA;
    this.setOptions();

    this.configUpdateSubs = this.layoutService.configUpdate$.subscribe( r => {
      this.menuStatic = r.menuStatic;
      this.floatLabel = r.floatLabel;
      this.setShowHide(true);
    })
    this.clickEventSubs = this.actionService.getClickEvent().subscribe( r => {
      if (r.type == 'OPERATION'){
        this.detailDialog.isOpen = false;
        this.search(true);
        this.messageService.add({ 
          severity: 'success', 
          summary: r.summary,
          detail: r.detail
        });
      }
    });
  }

  ngOnInit(): void {
    this.loadClients();
    this.loadCategories();
    this.loadStatus();
    this.translate.onLangChange.subscribe((event) => {
      this.form.grid.header = event.lang == 'es'? HEADER_DATA : HEADER_DATA_EN;
      this.headerExport = event.lang == 'es'? OPERATIVE_INSTRUCTION_HEADER_EXPORT : OPERATIVE_INSTRUCTION_HEADER_EXPORT_EN;
      this.headerList = this.form.grid.header;
      this.setOptions();
    });
  }

  setShowHide(show: boolean) {
    this.expression = show;

    if (this.expression) {
      this.iconShowHide = 'pi pi-minus';
      this.textShowHide = this.translate.instant('generic.hide');
    }
    else {
      this.iconShowHide = 'pi pi-plus';
      this.textShowHide = this.translate.instant('generic.show');
    }
  }

  filterClients(event: AutoCompleteCompleteEvent) {
      let filtered: any[] = [];
      let query = event.query;
      for (let i = 0; i < (this.formListFilter.client!.list as IClient[]).length; i++) {
          let item = (this.formListFilter.client!.list as IClient[])[i];
          if (item.client_name.toLowerCase().indexOf(query.toLowerCase()) == 0)
              filtered.push(item);
      }
      this.filteredClients = filtered;
      console.log(this.filteredClients)
  }
  // xxx(event: IClient) {
  //   // this.formFilter.client!.value = event.client_code
  //   console.log('xxx:', event)
  // }
  validClientSelected() {
    // this.formValueFilter.client = {client_id: '', client_code: '', client_name: ''}
    if(this.filteredClients?.length == 0)
      this.formValueFilter.client = null
  }


  loadClients() {
    setTimeout(() => {
      this.operativeInstructionService.getClients()
      .subscribe( r => {
        this.formListFilter.client!.list = r;
      })
      this.loadPage = false;
    }, 1000);
  }

  loadCategories() {
    setTimeout(() => {
      this.operativeInstructionService.getCategories()
      .subscribe( r => {
        this.formListFilter.category!.list = r;
      })
      this.loadPage = false;
    }, 1000);
  }

  loadStatus() {
    this.formListFilter.status!.list = STATUS_DATA;
  }
  
  loadProducts(category_id: string | null) {
    this.clearProducts()
    this.clearSubproducts()

    if (category_id !== null) {
      this.formListFilter.product!.load = true;
      setTimeout(() => {
        this.operativeInstructionService.getProducts(category_id)
        .subscribe( r => {
          this.formListFilter.product!.list = r;
          this.formListFilter.product!.load = false;
        })
      }, 300);
    }
    this.search();

  }

  clearProducts() {
    this.formListFilter.product = { list: [], load: false };
    this.formValueFilter.product = null;
  }

  loadSubproducts(product_id: string | null) {
    this.clearSubproducts()
    if (product_id !== null) {
      this.formListFilter.subproduct!.load = true;
      setTimeout(() => {
        this.operativeInstructionService.getSubproducts(product_id)
        .subscribe( r => {
          this.formListFilter.subproduct!.list = r;
          this.formListFilter.subproduct!.load = false;
        })
      }, 300);
    }
  }
  clearSubproducts() {
    this.formListFilter.subproduct = { list: [], load: false };
    this.formValueFilter.subproduct = null;
  }
  
  setOptions() {
    this.itemsMenu = [
      {
          tooltipOptions: {
              tooltipLabel: this.translate.instant('generic.search'),
              tooltipPosition: "top",
          },
          icon: 'pi pi-search',
          label: this.translate.instant('generic.search'),
          command: () => {
            this.search(true);
          }
      },
      {
          tooltipOptions: {
              tooltipLabel: this.translate.instant('generic.clear'),
              tooltipPosition: "top",
          },
          icon: 'pi pi-eraser',
          label: this.translate.instant('generic.clear'),
          command: async () => {
            this.clear();
            setTimeout(() => {
              this.search(true);
            }, 50);
          }
      },
      {
          tooltipOptions: {
              tooltipLabel: this.translate.instant('generic.add'),
              tooltipPosition: "top",
          },
          icon: 'pi pi-plus',
          label: this.translate.instant('generic.add'),
          command: () => {
            this.openDetailDialog(ENUM_ACTIONS_OPTIONS.ADD)
          }
      },
      {
          tooltipOptions: {
              tooltipLabel: this.translate.instant('generic.export'),
              tooltipPosition: "top",
          },
          icon: 'pi pi-file-excel',
          label: this.translate.instant('generic.export'),
          command: () => {
            this.export()
          }
      },
      {
        icon: 'pi pi-arrows-v',
        command: () => {
          this.setShowHide(!this.expression)
        }
      }
    ];
  }

  openDetailDialog(action: string, id: string = ''){
    switch (action) {
      case ENUM_ACTIONS_OPTIONS.ADD:
        this.detailDialog.title = this.translate.instant('modules.operative-instruction.form-detail.title-add');
        break;
      case ENUM_ACTIONS_OPTIONS.UPDATE:
        this.detailDialog.title = this.translate.instant('modules.operative-instruction.form-detail.title-update');
        break;
      case ENUM_ACTIONS_OPTIONS.SHOW:
        this.detailDialog.title = this.translate.instant('modules.operative-instruction.form-detail.title-show');
        break;
    }
    this._operativeInstructionDetailComponent.id = id;
    this._operativeInstructionDetailComponent.action = action;
    this._operativeInstructionDetailComponent.get();
    this.detailDialog.isOpen = true;
  }

  get isReadOnly() {
    return this._operativeInstructionDetailComponent.action !== ENUM_ACTIONS_OPTIONS.SHOW
  }

  detailDialogActions(event: string) {
    this._operativeInstructionDetailComponent.send = false;
    if(event == 'accept')
      this._operativeInstructionDetailComponent.save();
    else
      this.detailDialog.isOpen = false;
      // this._operativeInstructionDetailComponent.clear();
  }

  clear() {
    this.formValueFilter.credit_number = null
    this.formValueFilter.client = null
    // this.formValueFilter.client!.value = { client_id: '', client_code: '', client_name: '' }
    this.formValueFilter.category = null
    this.formValueFilter.product = null
    this.formValueFilter.subproduct = null
    this.formValueFilter.value_date = null
    this.formValueFilter.register_date_start = null
    this.formValueFilter.register_date_end = null
    this.formValueFilter.status = null
    this.formListFilter.product = { list: [], load: false };
    this.formListFilter.subproduct = { list: [], load: false };
  }

  export(){
    this.operativeInstructionService.getOperativeInstructionsAll(this.formValueFilter)
    .subscribe( (r: IApiResponse<IOperativeInstruction[]>) => {
      this.exportService.exportAsExcelFile(this.headerExport,
        this.translate.instant('modules.operative-instruction.form-list.export-document-name'),
        this.translate.instant('modules.operative-instruction.form-list.export-document-sheet-1'),
        r.data);
    });
  }

  table_actions(event: any) {
    switch (event.type) {
      case 'load':
        setTimeout(() => {
          this.operativeInstructionService.getOperativeInstructions({ filter: event.lazyEvent })
          .subscribe((res: IApiResponse<IOperativeInstruction[]>) => {
            this.tableOperative.load_finished(res);
          });
        }, 500);
        break;
    
      case 'delete':
        this.confirmDialog.header = this.translate.instant('components.confirmation.header');
        this.confirmDialog.message = this.translate.instant('components.confirmation.message.delete');
        this.confirmDialog.register = this.translate.instant('generic.credit_number') + ': ' + event.row.credit_number;

        this.confirmDialog.onAccept = () => {
          this.messageService.add({ 
            severity: 'success', 
            summary: this.translate.instant('message.delete-success'),
            detail: this.translate.instant('generic.credit_number') + ': ' + event.row.credit_number
          });
        }
        this.appConfirmationService.openConfirmation(this.confirmDialog);
        break
        
      case 'select':
        this.operativesSelected = event.dataSelected;
        break

        
    case 'edit':
      this.openDetailDialog(ENUM_ACTIONS_OPTIONS.UPDATE, event.row.credit_number)
      break
      
    case 'show':
      this.openDetailDialog(ENUM_ACTIONS_OPTIONS.SHOW, event.row.credit_number)
      break
    
    }
  }

  search(search: boolean = this.layoutService.config.automaticSearch) {
    if (search)
      this.tableOperative.search(0);
  }

  setRegisterDateStart() {
    this.minDateRegisterEnd = this.formValueFilter.register_date_start;
  }

  setRegisterDateEnd() {
    this.maxDateRegisterStart = this.formValueFilter.register_date_end;
  }
  
  ngOnDestroy() {
    this.configUpdateSubs.unsubscribe();
    this.clickEventSubs.unsubscribe();
  }
}

