import { Component } from '@angular/core';

@Component({
    selector: 'record',
    template: `
        <input ngIf="editable" type="type" [(ngModel)]="value" />
        <span ngIf="!editable">{{value}}</span>
    `
})

export class RecordComponent {
    editable: boolean;
    type: string;
    value: string;
}

