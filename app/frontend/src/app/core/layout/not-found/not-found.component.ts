import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Message } from 'primeng/message';
import { LAYOUT_TEXTS } from '../layout.texts';

/** Contenido de las rutas inexistentes: el shell se mantiene y el centro solo informa. */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [Message],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './not-found.component.html',
})
export class NotFoundComponent {
  protected readonly texts = LAYOUT_TEXTS.notFound;
}
