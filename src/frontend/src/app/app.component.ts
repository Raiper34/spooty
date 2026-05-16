import {Component, OnInit} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {CommonModule, NgFor} from "@angular/common";
import {PlaylistService, PlaylistStatusEnum} from "./services/playlist.service";
import {PlaylistBoxComponent} from "./components/playlist-box/playlist-box.component";
import {VersionService} from "./services/version.service";
import {map} from "rxjs";
import {HttpClient} from "@angular/common/http";

@Component({
    selector: 'app-root',
    imports: [CommonModule, FormsModule, NgFor, PlaylistBoxComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
    standalone: true,
})
export class AppComponent implements OnInit {

  url = ''
  spotifyLinked: boolean | null = null;
  spotifyBanner: string | null = null;
  private readonly spotifyUrlPattern = /^https:\/\/open\.spotify\.com\/(track|playlist|album|artist)\/[a-zA-Z0-9]+/;

  get isValidSpotifyUrl(): boolean {
    return this.spotifyUrlPattern.test(this.url);
  }
  createLoading$ = this.playlistService.createLoading$;
  playlists$ = this.playlistService.all$.pipe(map(items => items.filter(item => !item.isTrack)));
  songs$ = this.playlistService.all$.pipe(map(items => items.filter(item => item.isTrack)));
  version = this.versionService.getVersion();

  constructor(
    private readonly playlistService: PlaylistService,
    private readonly versionService: VersionService,
    private readonly http: HttpClient,
  ) {
    this.fetchPlaylists();
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('spotify_connected') === '1') {
        this.spotifyBanner = 'Spotify account connected. Full playlist Web API access is enabled.';
        window.history.replaceState({}, '', window.location.pathname);
      }
      const err = params.get('spotify_error');
      if (err) {
        this.spotifyBanner = `Spotify login error: ${err}`;
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
    this.http.get<{ linked: boolean }>('/api/auth/spotify/status').subscribe({
      next: (s) => (this.spotifyLinked = s.linked),
      error: () => (this.spotifyLinked = null),
    });
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
