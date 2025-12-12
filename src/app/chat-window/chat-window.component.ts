import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from './../config/apiUrl';
import { hintWords } from './../config/constants'; 4
import { Subscription } from 'rxjs';
import { MessageService } from 'primeng/api';
import { emailIDList } from '../config/approvedEmailID';
// import { ActivatedRoute, ParamMap } from '@angular/router';
import { SharedDataService } from '../services/shared-data.service';
import { Data } from '../config/dummyData';

@Component({
  selector: 'app-chat-window',
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.css']
})
export class ChatWindowComponent implements OnInit {
  searchQuery: any;
  enableSearch: boolean = false;
  searchResult: any = [];
  summary: any;
  loading: boolean = false;
  summaryLoading: boolean = false;
  visible: boolean = false;
  docURL: any;
  matchingWords: string[] = [];
  showWordSearch: boolean = false;
  allWords: string[] = hintWords;
  visibleSummary: boolean = false;
  buttonVisibility: boolean = false;
  apiSubscription: Subscription | undefined;
  apiSubscription1: Subscription | undefined;
  baseUrl: any = apiUrl.apiUrl;
  initialLoad = true;
  metaData: any;
  id = 0
  allowedEmailID: any = []
  deptBaseURl = window.location.href;

  loggedInUserDepartment: string | null = '';

  getEmailIDFromHWS: any = '';

  kaList: any = [];

  constructor(private http: HttpClient, private messageService: MessageService, 
    private sharedDataService: SharedDataService, private cdr: ChangeDetectorRef
    // private route: ActivatedRoute 
  ) {
    this.allowedEmailID = emailIDList
  }

  ngOnInit() {

    // sessionStorage.setItem('query','engine');
    // sessionStorage.setItem('loggedInUserEmailId','manish.srivastava@heromotocorp.com')

    this.searchQuery = sessionStorage.getItem('query');
    this.getEmailIDFromHWS = sessionStorage.getItem('loggedInUserEmailId');
    //console.log(this.searchQuery)
    this.sharedDataService.setQuery(this.searchQuery || '');



    if (this.getEmailIDs(this.getEmailIDFromHWS).length > 0) {
      this.loggedInUserDepartment = 'R&D'
      this.getSearchResult();
    } else {
      this.getDepartmentFromEmail()
    }

  }
  // getSearchResult() {
  //   this.searchResult = Data
  // }
  getSearchResult() {
    this.loading = true;
    this.searchResult = [];
    if (this.apiSubscription) {
      this.apiSubscription.unsubscribe();
    }
    sessionStorage.setItem('query', this.searchQuery);
    this.apiSubscription = this.http.post(apiUrl.searchUrl, {
      query: this.searchQuery,
      // max_results: 100
    }).subscribe((data: any) => {
      this.loading = false;
      this.buttonVisibility = true;
      this.initialLoad = false;
      this.cdr.detectChanges();
      console.log(this.loggedInUserDepartment)
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
      else {
        data = data.filter((a: any) => a.flag == 'hws')
        this.searchResult = data.sort((a: any, b: any) => b.similarity_score - a.similarity_score);
      }

      const key = 'filepath';
      this.searchResult = [...new Map(this.searchResult.map((item: any) =>
        [item[key], item])).values()];
      console.log(this.searchResult)
        this.cdr.detectChanges();
    },
      err => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Unable to fetch the data. Please try after some time.', life: 2000 })
        this.loading = false;
      }
    )
  }

  filterWords() {
    this.matchingWords = this.getMatchingWords(this.searchQuery);
  }

  getMatchingWords(searchQuery: string): string[] {
    if (!searchQuery) {
      return [];
    }

    return this.allWords.filter(word =>
      word.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  @HostListener('document:click', ['$event'])
  handleClick(event: MouseEvent): void {
    if (!this.showWordSearch) {
      return;
    }

    const clickedElement = event.target as HTMLElement;
    if (!clickedElement.closest('.word-search') && !clickedElement.closest('.search-field')) {
      this.showWordSearch = false;
    }
  }

  toggleWordSearch(isFocused: boolean): void {
    this.showWordSearch = isFocused;
  }

  replaceSearchWord(word: string) {
    this.showWordSearch = false;
    this.searchQuery = word;
    this.getSearchResult();
  }

  cancelSearch() {
    this.searchQuery = '';
    this.searchResult = '';
    this.initialLoad = true;
    if (this.apiSubscription) {
      this.apiSubscription.unsubscribe();
    }
    this.loading = false;
  }

  hasMetadata(product: any): boolean {
    return product.metadatas && Object.keys(product.metadatas).length > 0;
  }

  showDialog(metadata: any): void {
    this.metaData = metadata;
    this.visibleSummary = true;
  }

  getEmailIDs(emailId: string): string[] {
    if (!emailId) {
      return [];
    }

    return this.allowedEmailID.filter((word: any) =>
      word.toLowerCase().includes(emailId.toLowerCase())
    );
  }

  getDepartmentFromEmail() {
    this.loading = true;
    this.deptBaseURl = this.deptBaseURl.replace('/HWSext', '')
    let apiUrlForDept = this.deptBaseURl + 'queryservice/department';
    this.http.post(apiUrlForDept, {
      email: this.getEmailIDFromHWS
    }).subscribe((res: any) => {
      this.loggedInUserDepartment = res.dept;
      this.getSearchResult();
    },
      err => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Unable to fetch the data. Please try after some time.', life: 2000 })
        this.loading = false;
      }
    )
  }

  navigateToHWS() {
    console.log('window.location.href', window.location.href)
    var location = window.location.href.toString().replace("HWSext", "jspui");
    window.location.href = location;
  }

  receiveKAList(kaList: any) {
    this.kaList = kaList;
  }
}
