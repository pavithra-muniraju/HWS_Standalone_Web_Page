import { Component, HostListener, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'herowindowsphere';
  showOverlay: boolean = false;
  overlayTimeout: any;

  constructor(private renderer: Renderer2) { }

  @HostListener('document:copy', ['$event'])
  disableCopy(event: ClipboardEvent) {
    event.preventDefault();
  }

  @HostListener('document:paste', ['$event'])
  disablePaste(event: ClipboardEvent) {
    event.preventDefault();
  }

  @HostListener('document:contextmenu', ['$event'])
  onRightClick(event: MouseEvent) {
    event.preventDefault();
  }

  @HostListener('window:keydown', ['$event'])
  disableShortcutKeys(event: KeyboardEvent) {
    const forbiddenKeys = ['Control', 'Shift', 'Alt', 'Meta', 'Fn', 'PrintScreen'];
    let keyPressed = false;
    if (forbiddenKeys.includes(event.key)) {
      event.preventDefault();
      keyPressed = true;
    }
    if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
      event.preventDefault();
      keyPressed = true;
    }
    if (keyPressed) {
      this.whiteOutScreen();
    }
  }

  whiteOutScreen() {
    document.body.style.backgroundColor = 'white';
    setTimeout(() => {
      document.body.style.backgroundColor = '';
    }, 2000);
  }

  @HostListener('window:keyup', ['$event'])
  disablePrintScreen(event: KeyboardEvent) {
    const blockedKeys = ['PrintScreen', 'Meta', 'Alt', 'Shift'];
    if (blockedKeys.includes(event.key)) {
      navigator.clipboard.writeText('');
      this.showOverlay = true;
    }
  }

  @HostListener('window:click')
  @HostListener('window:keydown')
  @HostListener('window:mousemove')
  @HostListener('window:focus')
  resetScreen() {
    if (this.showOverlay) {
      this.showOverlay = false;
    }
  }

  ngOnInit() {
    window.onbeforeprint = () => {
      document.body.style.visibility = 'hidden';
    };

    window.onafterprint = () => {
      document.body.style.visibility = 'visible';
    };

    document.addEventListener('contextmenu',
      event => event.preventDefault());
  }

}
