import { Component } from '@angular/core';
import { SharedDataService } from '../../services/shared-data.service';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { MessageService } from 'primeng/api';
import { apiUrl } from '../../config/apiUrl';


interface ApiItem {
  issue_title: string;
  issue_description: string;
  metadatas?: { [key: string]: string };
}

@Component({
  selector: 'app-pts',
  templateUrl: './pts.component.html',
  styleUrls: ['./pts.component.scss']
})

export class PtsComponent {
  filteredResults: ApiItem[] = [];
  visibleSummary = false;
  metaData :any;
  summaryLoading: boolean = false;
  apiSubscription: Subscription | undefined;
  loggedInUserDepartment: string | null = '';
  searchResult: any = [];

  constructor(  private sharedDataService: SharedDataService,private http: HttpClient,private messageService: MessageService) {console.log('PtsComponent constructor called');}
  ngOnInit(){
    console.log('yes')
    const group=localStorage.getItem('searched_results')
    const searchedResult = this.sharedDataService.getData();
    const searchQuery = this.sharedDataService.getQuery();
    if (searchedResult.length>0) {
      this.filteredResults = searchedResult.filter(item => item.flag === group?.toLowerCase());
      console.log(this.filteredResults,'all')
    } else {
        this.getSearchResult(searchQuery,group);
      } 
  }

openSummary(item: any) {
  console.log(item,'item')
  this.metaData = item; 
  this.visibleSummary = true;
}

getSearchResult(searchQuery:string,group:string| null) {
  this.searchResult = [];
  if (this.apiSubscription) {
    this.apiSubscription.unsubscribe();
  }
  this.apiSubscription = this.http.post(apiUrl.searchUrl, {
    query: searchQuery,
    max_results: 100
  }).subscribe((data: any) => {
    this.sharedDataService.setQuery(searchQuery);
    this.sharedDataService.setData(data);
    this.filteredResults = data.filter((item:any) => item.flag === group?.toLowerCase());
    // filtering the data based on the dept
    if (this.loggedInUserDepartment == 'R&D' 
    || this.loggedInUserDepartment == 'Dgt.Eng&Tst.Dev'
    || this.loggedInUserDepartment == 'R&D Engine Dev'
    || this.loggedInUserDepartment == 'R&D Elect&Eltro'
    || this.loggedInUserDepartment == 'Proto Factory'
    || this.loggedInUserDepartment == 'Veh. Engg. Dev.'
    || this.loggedInUserDepartment == 'Vehicle Validt.'
    || this.loggedInUserDepartment == 'Model Line Head'
    || this.loggedInUserDepartment == 'R&D Facilty Mgt'
    || this.loggedInUserDepartment == 'R&D Styling&Des'
    || this.loggedInUserDepartment == 'R&D OP. EX.'
    || this.loggedInUserDepartment == 'Inov&Upcm.Mobi.') {
      this.searchResult = data.sort((a: any, b: any) => b.similarity_score - a.similarity_score);
    }
    else{
      data = data.filter((a: any) => a.flag == 'hws')
      this.searchResult = data.sort((a: any, b: any) => b.similarity_score - a.similarity_score);
    }
  },
    err => {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Unable to fetch the data. Please try after some time.', life: 2000 })
    }
  )
}
}
