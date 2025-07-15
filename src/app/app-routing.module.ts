import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChatWindowComponent } from './chat-window/chat-window.component';
import { SearchResultsComponent } from './search-results/search-results.component';


const routes: Routes = [
  { path: '', component: ChatWindowComponent },
  { path: 'search-results', component: SearchResultsComponent },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {

}
