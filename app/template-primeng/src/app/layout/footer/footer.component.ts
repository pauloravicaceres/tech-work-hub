import { TranslateService } from '@ngx-translate/core';
import { Component } from '@angular/core';
import { INFO_APP } from 'src/app/data/constants';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html'
})
export class FooterComponent {
  public footer = INFO_APP.FOOTER;
}
