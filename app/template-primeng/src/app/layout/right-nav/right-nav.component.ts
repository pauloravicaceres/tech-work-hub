import { Component } from '@angular/core';
import { LayoutService } from '../services/layout.service';
import { MenuService } from '../services/menu.service';
import { IApiAuthResponse, ITheme } from 'src/app/data/interfaces';
import { THEMES } from 'src/app/data/constants';


@Component({
  selector: 'app-right-nav',
  templateUrl: './right-nav.component.html'
})
export class RightNavComponent {

  public user: IApiAuthResponse = { user_id: 0, profile_id: 0};
  themes: any[];
  selectedTheme!: any;

  constructor(public layoutService: LayoutService, public menuService: MenuService
    // , private authService: AuthService
    ) {
    this.themes = THEMES;
  }

  get visible(): boolean {
      return this.layoutService.state.userSidebarVisible;
  }

  set visible(_val: boolean) {
      this.layoutService.state.userSidebarVisible = _val;
  }

  ngOnInit(): void {
    // this.user = this.authService.getUser;
  }

  changeTheme() {
    let theme: string = this.selectedTheme.THEME;
    let colorScheme: string = this.selectedTheme.TYPE;
    const themeLink = <HTMLLinkElement>document.getElementById('theme-css');
    const newHref = themeLink.getAttribute('href')!.replace(this.layoutService.config.theme, theme);
    this.layoutService.config.colorScheme
    this.replaceThemeLink(newHref, () => {
        this.layoutService.config.theme = theme;
        this.layoutService.config.colorScheme = colorScheme;
        this.layoutService.onConfigUpdate();
    });
  }

  replaceThemeLink(href: string, onComplete: Function) {
    const id = 'theme-css';
    const themeLink = <HTMLLinkElement>document.getElementById('theme-css');
    const cloneLinkElement = <HTMLLinkElement>themeLink.cloneNode(true);

    cloneLinkElement.setAttribute('href', href);
    cloneLinkElement.setAttribute('id', id + '-clone');

    themeLink.parentNode!.insertBefore(cloneLinkElement, themeLink.nextSibling);

    cloneLinkElement.addEventListener('load', () => {
        themeLink.remove();
        cloneLinkElement.setAttribute('id', id);
        onComplete();
    });
  }


}
