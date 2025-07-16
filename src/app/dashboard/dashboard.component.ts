import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { Router } from '@angular/router';
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  @Input() list:any = [];
  query:any = '';

  uniqueKnowledgeAreasWithCount:any = [];
  constructor(private cdr: ChangeDetectorRef,private router: Router,) {}
  
  ngOnInit() {
    this.query = sessionStorage.getItem('query');
    this.cdr.detectChanges();
    this.getUniqueKnowledgeArea();
  }

  getAllUniqueKnowledgeAreaItems(ka:any) {
    console.log(ka)
    this.router.navigateByUrl('search-results');
  }

  getUniqueKnowledgeArea(){
    let uniqueKnowledgeAreasKeys = [...new Set(this.list.map((item:any) => item.design_group))];
    uniqueKnowledgeAreasKeys.forEach((element:any) => {
      let count  = this.list.filter((obj:any) => obj.design_group == element).length;
      this.uniqueKnowledgeAreasWithCount.push({ key: element, value: count })
    });
  }
}
