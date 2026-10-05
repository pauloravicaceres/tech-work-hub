import {
    animation, trigger, animateChild, group,
    transition, animate, style, query, keyframes
} from '@angular/animations';

  // export const transAnimation = animation([
  //   style({
  //     height: '{{ height }}',
  //     opacity: '{{ opacity }}',
  //     backgroundColor: '{{ backgroundColor }}'
  //   }),
  //   animate('{{ time }}')
  // ]);

  // Routable animations
export const slideInAnimation =
trigger('routeAnimations', [
    transition('* <=> *', [
    // style({ position: 'relative' }),
    query(':enter, :leave', [
        style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        opacity: 0,
        transform: 'scale(0) traslateY(100%)'
        })
    ]),
    query(':enter', [
        animate('600ms ease', style({ opacity: 1, transform: 'scale(1) traslateY(0)'}))
    ])
])
]);
