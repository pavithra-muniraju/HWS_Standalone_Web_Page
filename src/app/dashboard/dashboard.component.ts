import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { SharedDataService } from '../services/shared-data.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  @Input() list:any = [];
  query:any = '';

  uniqueKnowledgeAreasWithCount:any = [];
  constructor(private cdr: ChangeDetectorRef,private router: Router,private sharedDataService: SharedDataService) {}
 
  ngOnInit() {
    this.query = sessionStorage.getItem('query');
    this.cdr.detectChanges();
    this.getUniqueKnowledgeArea(); 
  }
  getAllUniqueKnowledgeAreaItems(ka:any) {
    console.log(ka)
    this.sharedDataService.setData(this.list);
    if(ka.key === 'PTS' ){
      this.router.navigate(['pts']);
      localStorage.setItem('searched_results',ka.key)
    }
    else{
      localStorage.setItem('knowledge_areas', ka.key);
      this.router.navigate(['/search-results'], {
        queryParams: { 
          knowledge_areas: ka.key }
      });
    }
   
  }

  getUniqueKnowledgeArea(){
    let uniqueKnowledgeAreasKeys = [...new Set(this.list.map((item:any) => {
      if(item.flag == 'hws' && item.metadatas.knowledge_areas != undefined ){
        return item.metadatas.knowledge_areas
      }
    }))];
    uniqueKnowledgeAreasKeys.forEach((element:any) => {
      let count  = this.list.filter((obj:any) => obj.metadatas.knowledge_areas == element).length;
      if(element != undefined) {
        this.uniqueKnowledgeAreasWithCount.push({ key: element, value: count })
      }
      
    });
    let ptsCount  = this.list.filter((obj:any) => obj.flag == 'pts').length;
    this.uniqueKnowledgeAreasWithCount.push({ key: 'PTS', value: ptsCount })
  
  }
}
