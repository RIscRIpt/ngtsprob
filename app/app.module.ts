import { NgModule }             from '@angular/core';
import { BrowserModule }        from '@angular/platform-browser';
import { FormsModule }          from '@angular/forms';
import { AppComponent }         from './app.component';
import { MatrixComponent }      from './matrix.component';

@NgModule({
  imports      : [ BrowserModule, FormsModule ],
  declarations : [ AppComponent, MatrixComponent ],
  bootstrap    : [ AppComponent ]
})
export class AppModule { }

