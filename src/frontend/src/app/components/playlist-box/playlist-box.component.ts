import {Component, Input} from '@angular/core';
import {AsyncPipe, CommonModule, NgForOf, NgIf} from "@angular/common";
import {TrackListComponent} from "../track-list/track-list.component";
import {Playlist, PlaylistService, PlaylistUi} from "../../services/playlist.service";
import {Observable} from "rxjs";

@Component({
  selector: 'app-playlist-box',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    NgForOf,
    NgIf,
    TrackListComponent
  ],
  templateUrl: './playlist-box.component.html',
  styleUrl: './playlist-box.component.scss'
})
export class PlaylistBoxComponent {

  @Input() set playlist(val: Playlist & PlaylistUi) {
    this._playlist = val;
    this.trackCount$ = this.playlistService.getTrackCount(val.id);
    this.trackCompletedCount$ = this.playlistService.getCompletedTrackCount(val.id);
  }
  get playlist(): Playlist & PlaylistUi {
    return this._playlist;
  }
  _playlist!: Playlist & PlaylistUi;
  trackCount$!: Observable<number>;
  trackCompletedCount$!: Observable<number>;

  constructor(private readonly playlistService: PlaylistService) { }


  toggleCollapse(playlistId: number): void {
    this.playlistService.toggleCollapsed(playlistId);
  }
}
