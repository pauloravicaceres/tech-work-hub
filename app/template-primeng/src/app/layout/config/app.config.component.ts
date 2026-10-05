import { Component, Input } from '@angular/core';
import { LayoutService } from '@layout/services/layout.service';
import { MenuService } from '@layout/services/menu.service';
import { TranslateService } from '@ngx-translate/core';
import { PrimeNGConfig } from 'primeng/api';

interface ILocale {
    label: string;
    value: string;
}
@Component({
    selector: 'app-config',
    templateUrl: './app.config.component.html',
    styleUrls: ['./app.config.component.scss']
})
export class AppConfigComponent {

    @Input() minimal: boolean = false;
    locales: ILocale[] | undefined;
    locale: string;
    scales: number[] = [12, 13, 14, 15, 16];

    constructor(public layoutService: LayoutService,
    public menuService: MenuService,
    private primengConfig: PrimeNGConfig,
    public translateService: TranslateService)
    { 
        translateService.addLangs(['es', 'en']);
        this.locales = [
            { label: 'es Spanish (PE)', value: 'es-PE' },
            { label: '🇺🇸 English (US)', value: 'en-US' },
        ];
        this.locale = 'es-PE';
    }

    ngOnInit(): void {
        this.translateService.setDefaultLang('es');
        this.updateLocale('es');
    }   

    updateLocale(locale: any) {
        const lang = locale.substring(0, 2);
        this.translateService.setDefaultLang(lang);
        this.translateService.use(lang);
        this.translateService.get('primeng').subscribe(res => this.primengConfig.setTranslation(res));
    }

    get visible(): boolean {
        return this.layoutService.state.configSidebarVisible;
    }

    set visible(_val: boolean) {
        this.layoutService.state.configSidebarVisible = _val;
    }

    get scale(): number {
        return this.layoutService.config.scale;
    }

    set scale(_val: number) {
        this.layoutService.config.scale = _val;
    }

    get menuMode(): string {
        return this.layoutService.config.menuMode;
    }

    set menuMode(_val: string) {
        this.layoutService.config.menuMode = _val;
    }

    get inputStyle(): string {
        return this.layoutService.config.inputStyle;
    }

    set inputStyle(_val: string) {
        this.layoutService.config.inputStyle = _val;
    }

    get ripple(): boolean {
        return this.layoutService.config.ripple;
    }

    set ripple(_val: boolean) {
        this.layoutService.config.ripple = _val;
    }

    get automaticSearch(): boolean {
        return this.layoutService.config.automaticSearch;
    }

    set automaticSearch(_val: boolean) {
        this.layoutService.config.automaticSearch = _val;
    }

    get menuStatic(): boolean {
        return this.layoutService.config.menuStatic;
    }

    set menuStatic(_val: boolean) {
        this.layoutService.config.menuStatic = _val;
        this.layoutService.onConfigUpdate();
    }

    get floatLabel(): boolean {
        return this.layoutService.config.floatLabel;
    }

    set floatLabel(_val: boolean) {
        this.layoutService.config.floatLabel = _val;
        this.layoutService.onConfigUpdate();
    }
    
    onConfigButtonClick() {
        this.layoutService.showConfigSidebar();
    }

    changeTheme(theme: string, colorScheme: string) {
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

    decrementScale() {
        this.scale--;
        this.applyScale();
    }

    incrementScale() {
        this.scale++;
        this.applyScale();
    }

    applyScale() {
        document.documentElement.style.fontSize = this.scale + 'px';
    }
}
