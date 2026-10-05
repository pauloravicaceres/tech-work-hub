import { Component } from '@angular/core';
import { CAROUSEL_DATA_ITEMS } from '@shared/components/carousel/carousel.const';
import { ICarouselItem } from '@shared/components/carousel/carousel.interface';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  public carouselData: ICarouselItem[];

  constructor() {
    this.carouselData  = CAROUSEL_DATA_ITEMS;
  }
}
