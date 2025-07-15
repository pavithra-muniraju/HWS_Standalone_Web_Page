import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { Router } from '@angular/router';
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  @Input() list:any = [];

  uniqueKnowledgeAreas:any = [];
  constructor(private cdr: ChangeDetectorRef,private router: Router,) {}
  
  ngOnInit() {
    console.log(this.list);
    this.cdr.detectChanges();

    this.uniqueKnowledgeAreas  = [...new Set(this.list.map((item:any) => item.design_group))];
    console.log(this.uniqueKnowledgeAreas); 
  }

  getAllUniqueKnowledgeAreaItems(ka:any) {
    console.log(ka)
    this.router.navigateByUrl('search-results');
  }
}
