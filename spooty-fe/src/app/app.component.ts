import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {FormsModule} from "@angular/forms";
import {CommonModule, NgFor, NgSwitch, NgSwitchCase} from "@angular/common";
import {PlaylistService} from "./services/playlist.service";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FormsModule, NgFor, NgSwitch, NgSwitchCase],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  url = ''
  playlists$ = this.playlistService.all$;
  loading$ = this.playlistService.loading$;
  createLoading$ = this.playlistService.createLoading$;

  constructor(private readonly playlistService: PlaylistService) {
    this.fetchPlaylists();
  }

  fetchPlaylists(): void {
    this.playlistService.fetch();
  }

  download(): void {
    this.playlistService.create(this.url);
  }

  toggleCollapse(playlistId: number): void {
    this.playlistService.toggleCollapsed(playlistId);
  }
}
