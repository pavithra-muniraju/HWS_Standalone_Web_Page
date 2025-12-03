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
  liked: boolean;
  disliked: boolean;
  comment: string;
  likesCount: number;
  dislikesCount: number;
}

@Component({
  selector: 'app-pts',
  templateUrl: './pts.component.html',
  styleUrls: ['./pts.component.scss']
})

export class PtsComponent {
  filteredResults: ApiItem[] = [];
  visibleSummary = false;
  metaData: any;
  summaryLoading: boolean = false;
  apiSubscription: Subscription | undefined;
  loggedInUserDepartment: string | null = '';
  searchResult: any = [];
  searchQuery: any = '';

  allResults: ApiItem[] = [];
   loading: boolean = false;

  isLoggedInAdmin = false;
  addOrShowCommentsUser = false;
  addOrShowCommentsAdmin = false;

  commentsList: any[] = []
  selectedItem: any = {
    comment: ''
  };



  constructor(private sharedDataService: SharedDataService, private http: HttpClient, private messageService: MessageService) { console.log('PtsComponent constructor called'); }
  ngOnInit() {
    console.log('yes')
    const group = localStorage.getItem('searched_results')
    const searchedResult = this.sharedDataService.getData();
    const searchQuery = this.sharedDataService.getQuery();
    if (searchedResult.length > 0) {
      this.filteredResults = searchedResult.filter(item => item.flag === group?.toLowerCase());
      console.log(this.filteredResults, 'all')
      this.allResults = this.filteredResults;
      this.getAllReactions();
    } else {
      this.getSearchResult(searchQuery, group);
    }
  }

  openSummary(item: any) {
    console.log(item, 'item')
    this.metaData = item;
    this.visibleSummary = true;
  }

  getSearchResult(searchQuery: string, group: string | null) {
    this.searchResult = [];
    if (this.apiSubscription) {
      this.apiSubscription.unsubscribe();
    }
    this.apiSubscription = this.http.post(apiUrl.searchUrl, {
      query: searchQuery,
      // max_results: 100
    }).subscribe((data: any) => {
      this.sharedDataService.setQuery(searchQuery);
      this.sharedDataService.setData(data);
      this.filteredResults = data.filter((item: any) => item.flag === group?.toLowerCase());
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
      this.allResults = this.filteredResults;
      this.getAllReactions();
    },
      err => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Unable to fetch the data. Please try after some time.', life: 2000 })
      }
    )
  }


  cancelSearch() {
    this.searchQuery = '';
    this.filteredResults = this.allResults;
  }

  getSearchedResult() {
    let results = this.allResults.filter(item => {
      return Object.values(item).some((val: any) => {
        if (val != null) {
          return val.toString().toLowerCase().includes(this.searchQuery)
        }
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
      uniqueIds: this.allResults.map((item: any) => item.metadatas?.object)
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
          res.data.forEach((reactionItem: any) => {           
            if (item.metadatas?.['object'] === reactionItem.uniqueId) {
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

        if (this.isLoggedInAdmin) {
      this.http.post(apiUrl.getAdminSummary, postBody).subscribe((res: any) => {
        console.log(res, 'admin summary');
        if (res) {
          this.allResults.forEach(item => {
            res.data.forEach((reactionItem: any) => {

              if (item.metadatas?.['object'] === reactionItem.uniqueId) {
                item.likesCount = reactionItem.likes;
                item.dislikesCount = reactionItem.dislikes;


              }
            })
          })
        }
      })
    }
      }
    }, err => {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Unable to fetch Reactions', life: 2000 });
    });
    

    console.log(this.allResults);
  }
  showDialog(item?: any) {
    let postBody = {
      emailId: sessionStorage.getItem('loggedInUserEmailId') || '',
      uniqueId: item.metadatas?.object
    }
    this.http.post(apiUrl.getAllComments, postBody).subscribe((res: any) => {
      console.log(res, 'res comments');
      if(res) {
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
      uniqueId: this.selectedItem.metadatas?.['object'],
      email: sessionStorage.getItem('loggedInUserEmailId') || '',
      comment: this.selectedItem.comment
    }
    this.loading = true;
    this.http.post(apiUrl.addComments, postBody).subscribe(res => {
      console.log(res);
      this.loading = false;
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Comment Added succesfully', life: 2000 });

    }, err => {
      console.log(err.error);
      this.loading = false;
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Unable to add Comments', life: 2000 });

    })
    this.addOrShowCommentsAdmin = !this.addOrShowCommentsAdmin;
  }

  likeOrDislikeItem(item: any, action: string) {
    if (action == 'like') {
      item.disliked = false;
    } else {
      item.liked = false
    }
    let postBody = {
      uniqueId: item.metadatas?.['object'],
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
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Reaction Added Successfully', life: 2000 });
      this.getAllReactions();
    }, err => {
      console.log(err.error);
      this.loading = false;
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Unable to add Reaction', life: 2000 });
      this.getAllReactions();
    })
  }

    downloadReport() {
    let postBody = {
      email: sessionStorage.getItem('loggedInUserEmailId') || '',
    }

     this.http.post(apiUrl.reactionReport,postBody, { responseType: 'text' })
      .toPromise()
      .then((res:any) => {
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
          err.error.text().then((text:any) => {
            console.error('Decoded error as text:', text);
          });
        } else {
          console.error('Error details:', err);
        }
  
        alert('Failed to download the Reactions list. Please try again.');
      });

  }
}
