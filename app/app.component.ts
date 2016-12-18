import { Component } from '@angular/core';

@Component({
    selector: 'body',
    template: `
    <h1>{{title}}</h1>
    <matrix #matrix></matrix>
    `,
})

export class AppComponent {
    title: string = 'Transportation problem';
}

