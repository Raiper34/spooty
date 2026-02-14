import {Component} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {CommonModule, NgFor} from "@angular/common";
import {PlaylistService, PlaylistStatusEnum} from "./services/playlist.service";
import {PlaylistBoxComponent} from "./components/playlist-box/playlist-box.component";
import {VersionService} from "./services/version.service";
import {map} from "rxjs";

@Component({
    selector: 'app-root',
    imports: [CommonModule, FormsModule, NgFor, PlaylistBoxComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
    standalone: true,
})
export class AppComponent {

  url = ''
  usePlaylistStructure = true;
  createLoading$ = this.playlistService.createLoading$;
  playlists$ = this.playlistService.all$.pipe(map(items => items.filter(item => !item.isTrack)));
  songs$ = this.playlistService.all$.pipe(map(items => items.filter(item => item.isTrack)));
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
    this.url && this.playlistService.create(this.url, this.usePlaylistStructure);
    this.url = '';
  }

  deleteCompleted(): void {
    this.playlistService.deleteAllByStatus(PlaylistStatusEnum.Completed);
  }

  deleteFailed(): void {
    this.playlistService.deleteAllByStatus(PlaylistStatusEnum.Error);
  }
}
