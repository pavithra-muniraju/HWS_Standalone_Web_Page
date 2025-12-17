import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ChatWindowComponent } from './chat-window/chat-window.component';
import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { DialogModule } from 'primeng/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FooterComponent } from './footer/footer.component';
import { TableModule } from 'primeng/table';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SearchResultsComponent } from './search-results/search-results.component';
import { CardModule } from 'primeng/card';
import { AppRoutingModule } from './app-routing.module';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import {SliderModule} from 'primeng/slider';
import { PtsComponent } from './search-results/pts/pts.component';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { CalendarModule } from "primeng/calendar";
import { DatePipe } from '@angular/common';
@NgModule({
  declarations: [
    AppComponent,
    ChatWindowComponent,
    HeaderComponent,
    FooterComponent,
    DashboardComponent,
    SearchResultsComponent,
    PtsComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    DialogModule,
    BrowserAnimationsModule,
    TooltipModule,
    ToastModule,
    TableModule,
    CardModule,
    CheckboxModule,
    AppRoutingModule,
    ButtonModule,
    SliderModule,
    AutoCompleteModule,
    InputTextareaModule,
    CalendarModule
],
  providers: [MessageService, DatePipe],
  bootstrap: [AppComponent]
})
export class AppModule { }
