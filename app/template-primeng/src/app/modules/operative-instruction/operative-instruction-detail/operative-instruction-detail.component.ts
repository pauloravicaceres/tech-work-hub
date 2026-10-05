import { Component, ElementRef, ViewChild } from '@angular/core';
import { PRODUCT_PLAN_COBERTURA_PAGE } from '@data/constants/pages/operative-instruction/operative-instruction-detail';
import { ENUM_ACTIONS_OPTIONS } from '@data/enum';
import { IConfirmDialog, IOperativeInstruction, IOperativeInstructionListFilter } from '@data/interfaces';
import { OperativeInstructionService } from '@data/services/operative-instruction.service';
import { TranslateService } from '@ngx-translate/core';
import { ActionsService } from '@shared/services/actions.service';
import { AppConfirmationService } from '@shared/services/app-confirmation.service';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-operative-instruction-detail',
  templateUrl: './operative-instruction-detail.component.html',
  styleUrls: ['./operative-instruction-detail.component.scss']
})
export class OperativeInstructionDetailComponent {
  public id: string = '';
  public form = PRODUCT_PLAN_COBERTURA_PAGE.FORM;
  public loading: boolean = false;
  public send: boolean = false;
  public disabled: boolean = false;
  public action: string = ENUM_ACTIONS_OPTIONS.ADD;
  public maxDate: Date = new Date();
  public formListFilter: IOperativeInstructionListFilter;
  confirmDialog: IConfirmDialog = { header: '', message: '', icon: 'pi pi-exclamation-triangle', style: { with: '500px' } }

  constructor(public translate: TranslateService,
    private actionService: ActionsService,
    private appConfirmationService: AppConfirmationService,
    private operativeInstructionService: OperativeInstructionService) {
      this.formListFilter = new IOperativeInstructionListFilter(
        { list: [], load: false },
        { list: [], load: false },
        { list: [], load: false },
        { list: [], load: false },
        { list: [], load: false }
      )
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  save() {
    this.send = true;

    if (this.isValidForm) {
      this.loading = true;

      this.confirmDialog.header = this.translate.instant('components.confirmation.header');
      this.confirmDialog.message = this.id == '' ? this.translate.instant('components.confirmation.message.add') : this.translate.instant('components.confirmation.message.update')
      this.confirmDialog.register = this.translate.instant('generic.credit_number') + ': ' + this.form.credit_number.val;
      this.confirmDialog.onAccept = () => {
        setTimeout(() => {
          this.loading = false;
          this.send = false;    
          this.actionService.sendClickEvent( {
            type: 'OPERATION',
            summary: this.id == '' ? this.translate.instant('message.add-success') : this.translate.instant('message.update-success'),
            detail: this.translate.instant('generic.credit_number') + ': ' + this.form.credit_number.val
          });
        }, 1000);
      }
      this.confirmDialog.onReject = () => { 
        this.loading = false;
      }
      this.appConfirmationService.openConfirmation(this.confirmDialog);
    }
  }

  get isValidForm() {
    return (
      this.form.credit_number.isValid() &&
      this.form.client.isValid() &&
      this.form.category.isValid() &&
      this.form.product.isValid() &&
      this.form.subproduct.isValid() &&
      this.form.value_date.isValid() &&
      this.form.register_date.isValid()
    )
  }

  get isReadOnly() {
    return this.action == ENUM_ACTIONS_OPTIONS.SHOW
  }

  loadCategories() {
    this.operativeInstructionService.getCategories()
    .subscribe( r => {
      this.formListFilter.category!.list = r;
    })
  }

  loadProducts(category_id: string | null, id: string = '') {
    this.clearProducts()
    this.clearSubproducts()

    if (category_id !== null) {
      this.formListFilter.product!.load = true;
      setTimeout(() => {
        this.operativeInstructionService.getProducts(category_id)
        .subscribe( r => {
          this.formListFilter.product!.list = r;
          this.formListFilter.product!.load = false;
          this.form.product.val = id;
        })
      }, 300);
    }
  }

  clearProducts() {
    this.formListFilter.product = { list: [], load: false };
    this.form.product.val = '';
  }

  loadSubproducts(product_id: string | null, id: string = '') {
    this.clearSubproducts()
    if (product_id !== null && product_id !== '') {
      this.formListFilter.subproduct!.load = true;
      setTimeout(() => {
        this.operativeInstructionService.getSubproducts(product_id)
        .subscribe( r => {
          this.formListFilter.subproduct!.list = r;
          this.formListFilter.subproduct!.load = false;
          this.form.subproduct.val = id;
        })
      }, 300);
    }
  }

  clearSubproducts() {
    this.formListFilter.subproduct = { list: [], load: false };
    this.form.subproduct.val = '';
  }

  get() {
    if (this.id !== ''){
      this.operativeInstructionService.getOperativeInstructionsById(this.id)
      .subscribe( r => this.load(r.data[0]) )
    }
    else{
      this.load(null)
    }
  }

  load(obj: any) {
    this.form.credit_number.val = obj == null ? '' : obj.credit_number;
    this.form.client.val = obj == null ? '' : obj.client_name;
    this.form.category.val = obj == null ? '' : obj.category_id;
    const product = obj == null ? '' : obj.product_id;
    const subproduct = obj == null ? '' : obj.subproduct_id;
    this.loadProducts(this.form.category.val, product);
    this.loadSubproducts(product, subproduct);
    this.form.value_date.val = obj == null ? undefined : new Date(obj.value_date);
    this.form.register_date.val = obj == null ? undefined : new Date(obj.register_date);
  }
}


