import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})

export class HeaderComponent {
  constructor(private router: Router) {}
 
  backToHome(): void {
    let redirectUrl = this.router.url;
    console.log(redirectUrl);
    
    this.router.navigate(['']);
  }
}
