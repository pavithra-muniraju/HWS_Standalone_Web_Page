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
    let presentURL = this.router.url;
    if(presentURL !== '/' ) {
      this.router.navigate(['']);
    } else {
      window.location.href = 'https://hws.heromotocorp.com/jspui'
    }
  }
}
