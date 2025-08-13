import {Component} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {CommonModule, NgFor} from "@angular/common";
import {PlaylistService, PlaylistStatusEnum} from "./services/playlist.service";
import {PlaylistBoxComponent} from "./components/playlist-box/playlist-box.component";
import {VersionService} from "./services/version.service";

@Component({
    selector: 'app-root',
    imports: [CommonModule, FormsModule, NgFor, PlaylistBoxComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
    standalone: true,
})
export class AppComponent {

  url = ''
  createLoading$ = this.playlistService.createLoading$;
  playlists$ = this.playlistService.all$;
  version = this.versionService.getVersion();

  constructor(
    private readonly playlistService: PlaylistService,
    private readonly versionService: VersionService,
  ) {
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
