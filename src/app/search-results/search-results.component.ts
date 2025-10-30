import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SharedDataService } from '../services/shared-data.service';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { apiUrl } from './../config/apiUrl';
import { DynamicFilter } from '../config/dynamic-filter.constant';

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
}
interface ApiItem {
  issue_title: string;
  issue_description: string;
  filepath?: string;
  filename?: string;
  metadatas: { [key: string]: string };
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


  constructor(private route: ActivatedRoute, private router: Router,
    private sharedDataService: SharedDataService, private http: HttpClient,
    private messageService: MessageService, private cdr: ChangeDetectorRef) { }
  ngOnInit(): void {
    const group = this.route.snapshot.queryParamMap.get('knowledge_areas') || localStorage.getItem('knowledge_areas');
    this.getDynamicFilter(group || undefined);
    this.cdr.detectChanges();
    const searchedResult = this.sharedDataService.getData();
    const searchQuery = this.sharedDataService.getQuery();
    if (searchedResult.length > 0) {
      this.getDynamicFilter(group || undefined);
      this.allResults = searchedResult.filter(item => item.metadatas.knowledge_areas === group);
      this.initFilterGroups();
      this.restoreFiltersFromQueryParams();
      this.applyFilters();
    } else {
      if (searchQuery) {
        this.getSearchResult(searchQuery, group);
      }
    }

  }

  initFilterGroups(): void {
    this.filterGroups = this.filterKeys.map(keyObj => {
      if (keyObj.isRange) {
        return {
          display: keyObj.display,
          key: keyObj.keyValue,
          isRange: true,
          min: 1950,
          max: this.currentYear,
          range: [1950, this.currentYear],
          values: [],
          count: this.allResults.length
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
        }))
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
      this.items.push({ value: null, key: group.key });
    });
  }

  applyFilters(): void {
    this.filteredResults = this.allResults.filter(item => {
      return this.filterGroups.every(group => {
        if (group.isRange && group.range) {
          const year = this.extractYear(item.metadatas?.[group.key]);
          return !isNaN(year) && year >= group.range[0] && year <= group.range[1];
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
        const year = this.extractYear(item.metadatas?.[publishDateGroup.key]);
        return !isNaN(year) && year >= publishDateGroup.range![0] && year <= publishDateGroup.range![1];
      }).length
    }
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
    this.getDynamicFilter(group || undefined);
    this.loading = true;
    this.searchResult = [];
    if (this.apiSubscription) {
      this.apiSubscription.unsubscribe();
    }
    this.apiSubscription = this.http.post(apiUrl.searchUrl, {
      query: searchQuery,
      max_results: 100
    }).subscribe((data: any) => {
      this.loading = false;
      this.sharedDataService.setQuery(searchQuery);
      this.sharedDataService.setData(data);
      this.allResults = data.filter((item: any) => item.metadatas.knowledge_areas === group);
      if (this.allResults.length > 0) {
        this.getDynamicFilter(group || undefined);
      }
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
  getDynamicFilter(group?: string) {
    // if (!group) return;
    // this.http.get(apiUrl.dynamicFilterUrl(group)).subscribe({
    //   next: (res) => {
    //   console.log(res, 'res');
    //   this.dynamicFilter = res;
    //   if (this.dynamicFilter) {
    //     const filtersForSelectedGroup = Object.values(this.dynamicFilter)[0]||'';
    //     this.filterKeys = Object.entries(filtersForSelectedGroup).map(([key, displayValue]) => ({
    //       display: displayValue,
    //       keyValue: key,
    //       ...(key.toLowerCase().includes('date') ? { isRange: true } : {})

    //     }));
    //     console.log(this.filterKeys, 'filterKeys');
    //     this.cdr.detectChanges();
    //   }
    // },
    //   error: (err) => {
    //     this.messageService.add({
    //       severity: 'error',
    //       summary: 'Error',
    //       detail: 'Unable to fetch the Dynamic Filter data. Please try after some time.',
    //       life: 2000
    //     });
    //   }
    // });
    this.dynamicFilter = DynamicFilter;
    if (this.dynamicFilter) {
      if(group != undefined) {              
      
      const filtersForSelectedGroup = this.dynamicFilter[group] || '';
      this.filterKeys = Object.entries(filtersForSelectedGroup).map(([key, displayValue]) => ({
        display: displayValue,
        keyValue: key,
        ...(key.toLowerCase().includes('date') ? { isRange: true } : {})

      }));
      console.log(this.filterKeys, 'filterKeys');
      this.cdr.detectChanges();
    } }
  }
}