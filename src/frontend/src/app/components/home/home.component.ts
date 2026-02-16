import {Component} from '@angular/core';
import {FormsModule} from "@angular/forms";
import { CommonModule } from "@angular/common";
import { Router } from '@angular/router';
import {PlaylistService, PlaylistStatusEnum} from "../../services/playlist.service";
import {PlaylistBoxComponent} from "../playlist-box/playlist-box.component";
import {VersionService} from "../../services/version.service";
import {AuthService} from "../../services/auth.service";
import {map} from "rxjs";
import {User} from "../../models/user";

@Component({
    selector: 'app-home',
    imports: [CommonModule, FormsModule, PlaylistBoxComponent],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss',
    standalone: true,
})
export class HomeComponent {

  url = ''
  createLoading$ = this.playlistService.createLoading$;
  playlists$ = this.playlistService.all$.pipe(map(items => items.filter(item => !item.isTrack)));
  songs$ = this.playlistService.all$.pipe(map(items => items.filter(item => item.isTrack)));
  version = this.versionService.getVersion();
  currentUser: User | null = null;
  usePlaylistStructure = true;

  constructor(
    private readonly playlistService: PlaylistService,
    private readonly versionService: VersionService,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {
    this.fetchPlaylists();
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
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

  logout(): void {
    this.authService.logout();
  }

  goToAdmin(): void {
    this.router.navigate(['/admin']);
  }
}

