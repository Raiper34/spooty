import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {FormsModule} from "@angular/forms";
import {CommonModule, NgFor} from "@angular/common";
import {PlaylistService, PlaylistStatusEnum} from "./services/playlist.service";
import {PlaylistBoxComponent} from "./components/playlist-box/playlist-box.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FormsModule, NgFor, PlaylistBoxComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  url = ''
  createLoading$ = this.playlistService.createLoading$;
  playlists$ = this.playlistService.all$;

  constructor(private readonly playlistService: PlaylistService) {
    this.fetchPlaylists();
  }

  fetchPlaylists(): void {
    this.playlistService.fetch();
  }

  download(): void {
    this.url && this.playlistService.create(this.url);
    this.url = '';
  }

  deleteCompleted(): void {
    this.playlistService.deleteAllByStatus(PlaylistStatusEnum.Completed);
  }

  deleteFailed(): void {
    this.playlistService.deleteAllByStatus(PlaylistStatusEnum.Error);
  }
}
