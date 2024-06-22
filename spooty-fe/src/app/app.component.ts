import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {HttpClient} from "@angular/common/http";
import {FormsModule} from "@angular/forms";
import {NgFor, NgSwitch, NgSwitchCase} from "@angular/common";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FormsModule, NgFor, NgSwitch, NgSwitchCase],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  url = ''
  playlists: any[] = [];
  tracks = [
    {code: 'CC', name: 'Aaaa'},
    {code: 'CrC', name: 'Aaaadfdfd'},
  ]

  constructor(private readonly http: HttpClient) {
    this.get();
  }

  download(): void {
    this.http.post('/api/playlist', {spotifyUrl: this.url}).subscribe(() => this.get());
  }

  get(): void {
    this.http.get('/api/playlist').subscribe(data => this.playlists = data as any);
  }
}
