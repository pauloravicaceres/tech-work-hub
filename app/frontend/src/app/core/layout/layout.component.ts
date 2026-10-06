import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, linkedSignal, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { Button, ButtonDirective } from 'primeng/button';
import { Drawer } from 'primeng/drawer';
import { Menu } from 'primeng/menu';
import { Menubar } from 'primeng/menubar';
import { Message } from 'primeng/message';
import { filter, map } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ThemeService } from '../theme/theme.service';
import { ACTIVE_NAV_CLASS, NAV_ITEMS, resolveActiveModule } from './layout-nav';
import { LAYOUT_TEXTS } from './layout.texts';
import { ViewportService } from './viewport.service';

/** Esqueleto común: barra superior, navegación lateral (acoplada o en capa), contenido y pie. */
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, Menubar, Menu, Drawer, Button, ButtonDirective, Message],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly viewport = inject(ViewportService);

  protected readonly texts = LAYOUT_TEXTS;
  protected readonly userName = this.auth.userName;

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  protected readonly activeModule = computed(() => resolveActiveModule(this.currentUrl()));

  /** Entradas del menú con la del módulo activo resaltada. */
  protected readonly navItems = computed<MenuItem[]>(() =>
    NAV_ITEMS.map((item) => ({ ...item, styleClass: item.id === this.activeModule() ? ACTIVE_NAV_CLASS : undefined })),
  );

  protected readonly theme = inject(ThemeService);
  /** Anuncio para lectores de pantalla; vacío hasta que el usuario activa el conmutador. */
  protected readonly themeAnnouncement = signal('');

  /** Se reinicia a `isWide` al cruzar el umbral de ancho; sin persistencia (ADR-005). */
  protected readonly navOpen = linkedSignal(() => this.viewport.isWide());

  protected readonly profileItems: MenuItem[] = [
    { label: LAYOUT_TEXTS.logout, icon: 'pi pi-sign-out', command: () => this.logout() },
  ];

  protected readonly logoutFailed = signal(false);

  private readonly toggleButton = viewChild<ElementRef<HTMLElement>>('toggleButton');
  private readonly drawerNav = viewChild<ElementRef<HTMLElement>>('drawerNav');

  private async logout(): Promise<void> {
    this.logoutFailed.set(false);
    try {
      await this.auth.logout();
    } catch {
      this.logoutFailed.set(true);
    }
  }

  protected onThemeToggle(): void {
    this.theme.toggle();
    this.themeAnnouncement.set(this.theme.mode() === 'dark' ? LAYOUT_TEXTS.theme.announcedDark : LAYOUT_TEXTS.theme.announcedLight);
  }

  protected toggleNav(): void {
    this.navOpen.update((open) => !open);
  }

  protected closeNav(): void {
    this.navOpen.set(false);
  }

  /** Al abrir la capa el foco va a la primera entrada. */
  protected onDrawerShow(): void {
    this.drawerNav()?.nativeElement.querySelector<HTMLElement>('a')?.focus();
  }

  /** Al cerrar la capa el foco vuelve al control `≡`. */
  protected onDrawerHide(): void {
    this.toggleButton()?.nativeElement.focus();
  }
}
