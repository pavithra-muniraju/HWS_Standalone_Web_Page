import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SharedDataService } from '../services/shared-data.service';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { apiUrl } from './../config/apiUrl';
import { DynamicFilter } from '../config/dynamic-filter.constant';
import { Data } from '../config/dummyData';
import { DatePipe } from '@angular/common';

interface FilterItem {
  display: string;
  key: string;
  values: { label: string; count: number; selected: boolean }[],
  isRange?: boolean;
  min?: number;
  max?: number;
  range?: number[];
  count?: number;
  searchedkey?: string;
  showMore?: boolean;
  showAll?: boolean;
}
interface ApiItem {
  issue_title: string;
  issue_description: string;
  filepath?: string;
  filename?: string;
  metadatas: { [key: string]: string };
  liked: boolean;
  disliked: boolean;
  comment: string;
  likesCount: number;
  dislikesCount: number;
  commentsCount: number
}
@Component({
  selector: 'app-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss']
})

export class SearchResultsComponent {

  searchQuery = '';
  items: any[] = [{ value: null }]; // Represents dynamic textboxes
  filteredSuggestions: any[] = [[]];
  allResults: ApiItem[] = [];
  filteredResults: ApiItem[] = [];
  // filterKeys = [{ display: 'Knowledge Areas', keyValue: 'knowledge_areas' },
  // { display: 'Department', keyValue: 'department' },
  // { display: 'Publish Date', keyValue: 'publish_date', isRange: true },
  // { display: 'Project Code', keyValue: 'project_code' },
  // { display: 'MLH', keyValue: 'mlh_category' },
  // { display: 'Author', keyValue: 'author' }]
  filterKeys: any[] = [];
  filterGroups: FilterItem[] = [];
  searchResult: any = [];
  apiSubscription: Subscription | undefined;
  loggedInUserDepartment: string | null = '';
  currentYear = new Date().getFullYear();
  dynamicFilter: any = {};
  loading: boolean = false;

  isLoggedInAdmin = false;
  addOrShowCommentsUser = false;
  addOrShowCommentsAdmin = false;

  commentsList: any[] = []
  selectedItem: any = {
    comment: ''
  };

  datePopup = false;
  fromDate: any = '';
  toDate: any = ''

  fromDateFilter: any = '';
  toDateFilter: any = '';

  selectedKnowledgeArea = '';
  selectedQuery = '';
  constructor(private route: ActivatedRoute, private router: Router,
    private sharedDataService: SharedDataService, private http: HttpClient,
    private messageService: MessageService, private cdr: ChangeDetectorRef, private datePipe: DatePipe,){
  }
  ngOnInit(): void {
    const group = this.route.snapshot.queryParamMap.get('knowledge_areas') || localStorage.getItem('knowledge_areas');
    this.selectedKnowledgeArea = group || '';
    this.getDynamicFilter(group);
    this.cdr.detectChanges();
    const searchedResult = this.sharedDataService.getData();
    const searchQuery = this.sharedDataService.getQuery();
    this.selectedQuery = searchQuery;
    this.checkAdminLogin();
    if (searchedResult.length > 0) {
      // this.getDynamicFilter(group);
      this.allResults = searchedResult.filter(item => item.metadatas.knowledge_areas === group);
      this.getAllReactions();
      this.cdr.detectChanges();
    } else {
      if (searchQuery) {
        this.getSearchResult(searchQuery, group);
      }
    }

  }

  initFilterGroups(): void {

    this.filterGroups = this.filterKeys.map(keyObj => {
      if (keyObj.isRange) {
        const validDateCount = this.allResults.filter(item =>
          item.metadatas?.[(keyObj.keyValue).toLowerCase()] !== 'nan'
        ).length;

        return {
          display: keyObj.display,
          key: keyObj.keyValue,
          isRange: true,
          min: 1950,
          max: this.currentYear,
          range: [1950, this.currentYear],
          values: [],
          count: validDateCount
        };
      }
      const counts: { [label: string]: number } = {};
      this.allResults.forEach(item => {
        const value = item.metadatas?.[keyObj.keyValue];
        if (value !== undefined && value !== null) {
          counts[value] = (counts[value] || 0) + 1;
        }
      });
      return {
        display: keyObj.display,
        key: keyObj.keyValue,
        values: Object.entries(counts).map(([label, count]) => ({
          label,
          count,
          selected: false
        })),
        showMore: false,
        showAll: false
      };
    })
  }

  restoreFiltersFromQueryParams(): void {
    const queryParams = this.route.snapshot.queryParamMap;
    this.filterGroups.forEach(group => {
      if (group.isRange) {
        const min = queryParams.get(`${this.toQueryParam(group.key)}_min`);
        const max = queryParams.get(`${this.toQueryParam(group.key)}_max`);
        if (min && max) {
          group.range = [parseInt(min, 10), parseInt(max, 10)];
        }
      } else {
        const selected = queryParams.getAll(this.toQueryParam(group.key));
        group.values.forEach(v => (v.selected = selected.includes(v.label)));
      }
      console.log(group.key, 'group key');
      this.items.push({ value: null, key: group.key });
    });
    console.log(this.items, 'items');
  }

  applyFilters(): void {
    this.filteredResults = this.allResults.filter(item => {
      return this.filterGroups.every(group => {
        if (group.isRange && group.range) {
          if (item.metadatas?.[group.key] != "nan") {
            const year = this.extractYear(item.metadatas?.[group.key]);
            if (group.range[0] === 1950 && group.range[1] === this.currentYear) {

              return true;

            }
            return !isNaN(year) && year >= group.range[0] && year <= group.range[1];
          }

        }
        const selected = group.values.filter(v => v.selected).map(v => v.label);
        if (selected.length === 0) return true;
        const itemValue = item.metadatas?.[group.key];
        return selected.includes(itemValue);
      })
    });

    const publishDateGroup = this.filterGroups.find(g => g.isRange);
    if (publishDateGroup) {
      publishDateGroup.count = this.filteredResults.filter(item => {
        // if(item.metadatas?.[publishDateGroup.key] != "nan") {
        const year = this.extractYear(item.metadatas?.[publishDateGroup.key]);
        return !isNaN(year) && year >= publishDateGroup.range![0] && year <= publishDateGroup.range![1];

      }).length
    }
    this.filterDataByDateRange();
    console.log(this.filteredResults)
  }
  onFilterChange(): void {
    this.items = [];
    const queryParams: { [key: string]: any } = {};
    this.filterGroups.forEach(group => {
      if (group.isRange) {
        if (group.range![0] !== 1950 || group.range![1] !== this.currentYear) {
          queryParams[`${this.toQueryParam(group.key)}_min`] = group.range![0];
          queryParams[`${this.toQueryParam(group.key)}_max`] = group.range![1];
        }
      } else {
        const selected = group.values.filter(v => v.selected).map(v => v.label);
        if (selected.length > 0) {
          queryParams[this.toQueryParam(group.key)] = selected;
        }
      }
      this.items.push({ value: null, key: group.key });
    });

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: ''
    });

    this.applyFilters();
  }

  resetFilters(): void {
    this.filterGroups.forEach(group => {
      if (group.isRange) {
        group.range = [1950, this.currentYear];
      } else {
        group.values.forEach(v => (v.selected = false));
      }
    });
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {}
    });
    this.fromDateFilter = '';
    this.toDateFilter = ''
    this.applyFilters();
  }

  // clearDateFilter(group: FilterItem): void {
  //   group.range = [group.min!, group.max!];
  //   this.onFilterChange();
  // }

  private extractYear(dateStr: string | undefined): number {
    if (!dateStr) return NaN;
    // gets last 4-digit year
    const match = dateStr.match(/(\d{4})(?!.*\d{4})/);
    return match ? parseInt(match[0], 10) : NaN;
  }

  toQueryParam(key: string): string {
    return key.toLowerCase().replace(/\s+/g, '_');
  }
  getSearchResult(searchQuery: string, group: string | null) {
    this.getDynamicFilter(group);
    this.loading = true;
    this.searchResult = [];
    if (this.apiSubscription) {
      this.apiSubscription.unsubscribe();
    }
    // let data: any = Data
    this.apiSubscription = this.http.post(apiUrl.searchUrl, {
      query: searchQuery,
      // max_results: 100
    }).subscribe((data: any) => {
      this.loading = false;
      this.sharedDataService.setQuery(searchQuery);
      this.sharedDataService.setData(data);
      this.allResults = data.filter((item: any) => item.metadatas.knowledge_areas === group);
      const key = 'filepath';
      this.allResults = [...new Map(this.allResults.map((item: any) =>
        [item[key], item])).values()];
      this.getAllReactions();
      console.log(this.allResults)

      this.filterAction();
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
    },
      err => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Unable to fetch the data. Please try after some time.', life: 2000 });
        this.loading = false;
      }
    )
  }
  filterAction() {
    this.initFilterGroups();
    this.restoreFiltersFromQueryParams();
    this.applyFilters();

  }
  navigateToFile(filepath: any) {
    console.log(filepath, 'path');
    var location = window.location.href.toString().split("HWSext");
    // window.location.href = location
    // const url1 = `https://hws.heromotocorp.com/jspui/handle/123456789/${filepath}`;
    const url = location[0] + "jspui/handle/123456789/" + filepath;
    window.open(url, '_blank');
  }

  search(key: any, event: any, index: number) {
    let filterKey = this.filterGroups.filter(item => item.key == key);
    this.filteredSuggestions[index] = filterKey[0].values.filter(suggestion =>
      suggestion.label.toLowerCase().includes(event.query.toLowerCase())
    );

    console.log(this.filterGroups);
    console.log(this.items)
    console.log(this.filteredSuggestions);
    console.log(this.filteredResults)
  }

  handleSelect(event: any, key: any) {
    console.log(event);
    const queryParams: { [key: string]: any } = {};
    this.filterGroups.forEach(ele => {
      if (ele.key == key) {
        ele.values.forEach(data => {
          if (data.label == event.value.label) {
            data.selected = true;
          }
        })
      }
      this.onFilterChange();
    });
  }

  addItem() {
    this.items.push({ value: null });
    this.filteredSuggestions.push([]);
  }

  cancelSearch() {
    this.searchQuery = '';
    this.filteredResults = this.allResults;
  }

  getSearchedResult() {
    let results = this.allResults.filter(item => {
      return Object.values(item.metadatas).some((val: string) => {
        return val.toString().toLowerCase().includes(this.searchQuery.toLowerCase())
      }
      );
    });

    if (results.length < 1) {
      this.messageService.add({
        severity: 'error', summary: 'Error',
        detail: 'No Results found for the Searched Data', life: 2000
      });
    } else {
      this.filteredResults = results;
    }
  }
  getDynamicFilter(group?: any) {
    if (!group) return;
    this.http.get(apiUrl.dynamicFilterUrl(group)).subscribe({
      next: (res) => {
  //       let res = {  "lessonslearned": {
  //       "lessonslearned_issuesource": "Issue Source",
  //       "lessonslearned_mlhcategory": "MLH Category",
  //       "lessonslearned_projectcode": "Project Code",
  //       "lessonslearned_reportedstage": "Reported Stage"
  //   }
  // }
        console.log(res, 'res');
        this.dynamicFilter = res;
        if (this.dynamicFilter) {
          if (group != undefined) {

            const filtersForSelectedGroup = this.dynamicFilter[group] || '';
            this.filterKeys = Object.entries(filtersForSelectedGroup).map(([key, displayValue]) => ({
              display: displayValue,
              keyValue: key.toLowerCase(),
              ...(key.toLowerCase().includes('date') ? { isRange: true } : {})

            }));
            this.filterKeys.push({ display: 'Author', keyValue: 'author' });
            this.filterKeys.push({ display: 'Publish Date', keyValue: 'publish_date', isRange: true },  );
            console.log(this.filterKeys, 'filterKeys');

            this.filterAction();
            console.log(this.items, 'items before');
            this.cdr.detectChanges();
          }
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Unable to fetch the Dynamic Filter data. Please try after some time.',
          life: 2000
        });
      }
    });
    console.log(this.filteredResults)
    // this.dynamicFilter = DynamicFilter;
    // if (this.dynamicFilter) {
    //   if(group != undefined) {              

    //   const filtersForSelectedGroup = this.dynamicFilter[group] || '';
    //   this.filterKeys = Object.entries(filtersForSelectedGroup).map(([key, displayValue]) => ({
    //     display: displayValue,
    //     keyValue: key.toLowerCase(),
    //     ...(key.toLowerCase().includes('date') ? { isRange: true } : {})

    //   }));
    //   console.log(this.filterKeys, 'filterKeys');
    //   this.initFilterGroups();
    //   this.cdr.detectChanges();
    // } }
  }
  checkAdminLogin() {
    let postBody = {
      email: sessionStorage.getItem('loggedInUserEmailId') || '',
    }
    this.http.post(apiUrl.isAdmin, postBody).subscribe((res: any) => {
      if (res) {
        this.isLoggedInAdmin = res?.data.admin;

      }
    }, err => {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Unable to verify Admin login', life: 2000 });
      console.log(err.error);
    })
  }

  getAllReactions() {
    let postBody = {
      email: sessionStorage.getItem('loggedInUserEmailId') || '',
      uniqueIds: this.allResults.map((item: any) => item.metadatas?.item_handle)
    }
    this.http.post(apiUrl.getAllReaction, postBody).subscribe((res: any) => {
      console.log(res, 'res reactions');
      if (res) {

        this.allResults.forEach(item => {
          item.liked = false;
          item.disliked = false;
          item.comment = '';
          item.likesCount = 0;
          item.dislikesCount = 0;
          item.commentsCount = 0;
          res.data.forEach((reactionItem: any) => {
            if (item.metadatas?.['item_handle'] === reactionItem.uniqueId) {
              if (reactionItem.reactionType == 'LIKE') {
                item.liked = true;
              }
              if (reactionItem.reactionType == 'DISLIKE') {
                item.disliked = true;
              }

            }
          })
        });
        this.checkAdminLogin();

        // if (this.isLoggedInAdmin) {
        this.http.post(apiUrl.getAdminSummary, postBody).subscribe((res: any) => {
          console.log(res, 'admin summary');
          if (res) {
            this.allResults.forEach(item => {
              res.data.forEach((reactionItem: any) => {

                if (item.metadatas?.['item_handle'] === reactionItem.uniqueId) {
                  item.likesCount = reactionItem.likes;
                  item.dislikesCount = reactionItem.dislikes;
                  item.commentsCount = reactionItem?.comments || 0;
                }
              })
            })
          }
        })
        // }
        this.applyFilters();
      }
    }, err => {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Unable to fetch Reactions', life: 2000 });
    });


    console.log(this.allResults);
  }
  showDialog(item?: any) {
    let postBody = {
      emailId: sessionStorage.getItem('loggedInUserEmailId') || '',
      uniqueId: item.metadatas?.item_handle
    }
    this.http.post(apiUrl.getAllComments, postBody).subscribe((res: any) => {
      console.log(res, 'res comments');
      if (res) {
        this.commentsList = res.data;
      }
    }, err => {
      console.log(err.error);
      this.loading = false;
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Unable to fetch Comments', life: 2000 });

    });
    if (item) {
      this.selectedItem = item;
      this.selectedItem.comment = ''
    }
    this.addOrShowCommentsAdmin = !this.addOrShowCommentsAdmin;


  }
  cancelComment() {
    this.selectedItem.comment = '';
    // if (this.isLoggedInAdmin) {
    //   this.addOrShowCommentsAdmin = !this.addOrShowCommentsAdmin;
    // } else {
    //   this.addOrShowCommentsUser = !this.addOrShowCommentsUser;
    // }
    this.addOrShowCommentsAdmin = !this.addOrShowCommentsAdmin;
  }
  submitComment() {
    if (!this.selectedItem.comment.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Comments cannot be empty',
        life: 2000
      });
      return;
    }

    console.log("Comment submitted:", this.selectedItem.comment);
    let postBody = {
      uniqueId: this.selectedItem.metadatas?.['item_handle'],
      email: sessionStorage.getItem('loggedInUserEmailId') || '',
      comment: this.selectedItem.comment
    }
    this.loading = true;
    this.http.post(apiUrl.addComments, postBody).subscribe(res => {
      console.log(res);
      this.loading = false;
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Comment Added succesfully', life: 2000 });
      this.getAllReactions();
    }, err => {
      console.log(err.error);
      this.loading = false;
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Unable to add Comments', life: 2000 });
      this.getAllReactions();
    });
    this.addOrShowCommentsAdmin = !this.addOrShowCommentsAdmin;

  }

  likeOrDislikeItem(item: any, action: string) {
    if (action == 'like') {
      item.disliked = false;
    } else {
      item.liked = false
    }
    let postBody = {
      uniqueId: item.metadatas?.['item_handle'],
      email: sessionStorage.getItem('loggedInUserEmailId') || '',
      reaction: ''
    }
    if (item.liked) {
      postBody.reaction = 'LIKE';
    } else if (item.disliked) {
      postBody.reaction = 'DISLIKE';
    } else {
      postBody.reaction = 'NONE';
    }
    this.loading = true;
    this.http.post(apiUrl.likeOrDislikeUrl, postBody).subscribe(res => {
      console.log(res);
      this.loading = false;
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Reaction Saved Successfully', life: 2000 });
      this.getAllReactions();
    }, err => {
      console.log(err.error);
      this.loading = false;
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Unable to add Reaction', life: 2000 });
      this.getAllReactions();
    })
  }

  getDateRange() {
    this.datePopup = true;
    this.fromDate = '';
    this.toDate = '';
  }

  downloadReport() {
    let postBody = {
      email: sessionStorage.getItem('loggedInUserEmailId') || '',
      fromDate: this.datePipe.transform(this.fromDate, 'dd-MM-yyyy') || '',
      toDate: this.datePipe.transform(this.toDate, 'dd-MM-yyyy') || '',
    }

    this.http.post(apiUrl.reactionReport, postBody, { responseType: 'text' })
      .toPromise()
      .then((res: any) => {
        console.log('Response received as text:', res);
        const blob = new Blob([res], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'Reactions_resport.csv';
        link.click();
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => {
        console.error('Error occurred while fetching CSV:', err);
        if (err.error instanceof Blob) {
          err.error.text().then((text: any) => {
            console.error('Decoded error as text:', text);
          });
        } else {
          console.error('Error details:', err);
        }
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to download the Reactions Report. Please try again.', life: 2000 });
        // alert('Failed to download the Reactions list. Please try again.');
      });
      this.datePopup = false;
  }

filterDataByDateRange(): void {
  // Ensure both dates are selected before filtering
  if (this.fromDateFilter && this.toDateFilter) {
    const start = new Date(this.fromDateFilter);
    const end = new Date(this.toDateFilter);

    // let data = []
   this.filteredResults = this.allResults.filter(item => {
      const itemDate = new Date(item.metadatas['publish_date']);
      // Compare the item's date with the start and end dates
      return itemDate >= start && itemDate <= end;
    });
    console.log(this.filteredResults);
  } else {
    // If one or both dates are cleared, show the original list
    // this.filteredData = [...this.originalData];
  }
}
}