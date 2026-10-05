import { InputDropdownComponent } from './inputs/input-dropdown/input-dropdown.component';
// Import components
import { CarouselComponent } from "./carousel/carousel.component";
import { SkeletonComponent } from './loaders/skeleton/skeleton.component';
import { BasicTableComponent } from './tables/basic-table/basic-table.component';
import { ConfirmationComponent } from "./dialogs/confirmation/confirmation.component";
import { BasicMessageComponent } from "./dialogs/basic-message/basic-message.component";
import { InputTextComponent } from "./inputs/input-text/input-text.component";
import { InputAutoCompleteComponent } from "./inputs/input-auto-complete/input-auto-complete.component";
import { InputCalendarComponent } from './inputs/input-calendar/input-calendar.component';

export const components: any[] = [
    // Components
    CarouselComponent,
    BasicMessageComponent,
    ConfirmationComponent,
    SkeletonComponent,
    BasicTableComponent,
    InputTextComponent,
    InputAutoCompleteComponent,
    InputDropdownComponent,
    InputCalendarComponent
];

// Export components

export * from "./carousel/carousel.component";
export * from "./dialogs/basic-message/basic-message.component";
export * from "./dialogs/confirmation/confirmation.component";
export * from "./loaders/skeleton/skeleton.component";
export * from "./tables/basic-table/basic-table.component";
export * from "./inputs/input-text/input-text.component";
export * from "./inputs/input-auto-complete/input-auto-complete.component";
export * from "./inputs/input-auto-complete/input-auto-complete.component";
export * from './inputs/input-calendar/input-calendar.component';
