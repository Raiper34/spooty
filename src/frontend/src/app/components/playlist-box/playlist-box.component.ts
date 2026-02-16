import {Component, Input} from '@angular/core';
import { AsyncPipe, CommonModule } from "@angular/common";
import {TrackListComponent} from "../track-list/track-list.component";
import {PlaylistService, PlaylistStatusEnum, PlaylistUi} from "../../services/playlist.service";
import {Observable, map} from "rxjs";
import {Playlist} from "../../models/playlist";

const STATUS2CLASS = {
  [PlaylistStatusEnum.Completed]: 'is-success',
  [PlaylistStatusEnum.InProgress]: 'is-info',
  [PlaylistStatusEnum.Warning]: 'is-warning',
  [PlaylistStatusEnum.Error]: 'is-danger',
  [PlaylistStatusEnum.Subscribed]: 'is-primary',
}

@Component({
    selector: 'app-playlist-box',
    imports: [
    CommonModule,
    AsyncPipe,
    TrackListComponent
],
    templateUrl: './playlist-box.component.html',
    styleUrl: './playlist-box.component.scss',
  standalone: true
})
export class PlaylistBoxComponent {

  @Input() set playlist(val: Playlist & PlaylistUi) {
    this._playlist = val;
    this.trackCount$ = this.service.getTrackCount(val.id);
    this.trackCompletedCount$ = this.service.getCompletedTrackCount(val.id);
    this.statusClass$ = this.service.getStatus$(val.id).pipe(
      map(status => STATUS2CLASS[status])
    );
  }
  get playlist(): Playlist & PlaylistUi {
    return this._playlist;
  }
  _playlist!: Playlist & PlaylistUi;
  trackCount$!: Observable<number>;
  trackCompletedCount$!: Observable<number>;
  statusClass$!: Observable<string>;

  constructor(private readonly service: PlaylistService) { }

  toggleCollapse(playlistId: number): void {
    this.service.toggleCollapsed(playlistId);
  }

  delete(id: number): void {
    this.service.delete(id);
  }

  retryFailed(id: number): void {
    this.service.retryFailed(id);
  }

  toggleActive(id: number, currentActive: boolean): void {
    this.service.setActive(id, !currentActive)
  }
}
