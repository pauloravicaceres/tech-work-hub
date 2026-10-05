import { NgModule } from '@angular/core';
import {PanelModule} from 'primeng/panel';
import {CardModule} from 'primeng/card';
import {InputTextModule} from 'primeng/inputtext';
import {CalendarModule} from 'primeng/calendar';
import {DropdownModule} from 'primeng/dropdown';
import {CheckboxModule} from 'primeng/checkbox';
import {InputNumberModule} from 'primeng/inputnumber';
import {RadioButtonModule} from 'primeng/radiobutton';
import {SpeedDialModule} from 'primeng/speeddial';
import {TableModule} from 'primeng/table';
import {ToastModule} from 'primeng/toast';
import {MenubarModule} from 'primeng/menubar';
import {TooltipModule} from 'primeng/tooltip';
import {MessagesModule} from 'primeng/messages';
import {MessageModule} from 'primeng/message';
import {ConfirmPopupModule} from 'primeng/confirmpopup';
import {DialogModule} from 'primeng/dialog';
import {TimelineModule} from 'primeng/timeline';
import {DividerModule} from 'primeng/divider';
import {SkeletonModule} from 'primeng/skeleton';
import {OverlayPanelModule} from 'primeng/overlaypanel';
import {BlockUIModule} from 'primeng/blockui';
import {ProgressBarModule} from 'primeng/progressbar';
import {FileUploadModule} from 'primeng/fileupload';
import {InputMaskModule} from 'primeng/inputmask';
import {TreeSelectModule} from 'primeng/treeselect';
import {TabViewModule} from 'primeng/tabview';
import {ImageModule} from 'primeng/image';
import {ScrollPanelModule} from 'primeng/scrollpanel';
import {KeyFilterModule} from 'primeng/keyfilter';
import {FieldsetModule} from 'primeng/fieldset';
import { SidebarModule } from 'primeng/sidebar';
import {BreadcrumbModule} from 'primeng/breadcrumb';
import {AvatarModule} from 'primeng/avatar';
import {ListboxModule} from 'primeng/listbox';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import {PasswordModule} from 'primeng/password';
import {StepsModule} from 'primeng/steps';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import {AutoCompleteModule} from 'primeng/autocomplete';
import { TagModule } from 'primeng/tag';
import { InputSwitchModule } from 'primeng/inputswitch';

const PrimeNgComponents = [
  PanelModule,
  CardModule,
  InputTextModule,
  CalendarModule,
  DropdownModule,
  CheckboxModule,
  InputNumberModule,
  RadioButtonModule,
  SpeedDialModule,
  TableModule,
  ToastModule,
  MenubarModule,
  TooltipModule,
  MessagesModule,
  MessageModule,
  ConfirmPopupModule,
  DialogModule,
  TimelineModule,
  DividerModule,
  SkeletonModule,
  OverlayPanelModule,
  BlockUIModule,
  ProgressBarModule,
  FileUploadModule,
  InputMaskModule,
  TreeSelectModule,
  TabViewModule,
  ImageModule,
  ScrollPanelModule,
  KeyFilterModule,
  FieldsetModule,
  SidebarModule,
  BreadcrumbModule,
  AvatarModule,
  ListboxModule,
  ButtonModule,
  SelectButtonModule,
  PasswordModule,
  StepsModule,
  ConfirmDialogModule,
  AutoCompleteModule,
  TagModule,
  InputSwitchModule
];

@NgModule({
  imports: [ PrimeNgComponents ],
  exports: [ PrimeNgComponents ]
})
export class PrimeNgModule { }
