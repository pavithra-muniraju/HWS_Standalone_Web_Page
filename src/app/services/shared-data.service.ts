import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedDataService {
  private dataSubject = new BehaviorSubject<any[]>([]);
  data$ = this.dataSubject.asObservable();

  setData(data: any[]) {
    this.dataSubject.next(data);
  }

  getData(): any[] {
    return this.dataSubject.getValue();
  }
  // For search query
  private querySubject = new BehaviorSubject<string>(localStorage.getItem('searchQuery') || '');
  query$ = this.querySubject.asObservable();

  setQuery(query: string) {
    this.querySubject.next(query);
    localStorage.setItem('searchQuery', query);
  }

  getQuery(): string {
    return this.querySubject.getValue() || localStorage.getItem('searchQuery') || '';
  }
}
