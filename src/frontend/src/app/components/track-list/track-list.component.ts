import {Component, Input} from '@angular/core';
import { CommonModule } from "@angular/common";
import {TrackService} from "../../services/track.service";
import {Observable} from "rxjs";
import {Track, TrackStatusEnum} from "../../models/track";

@Component({
    selector: 'app-track-list',
    imports: [CommonModule],
    templateUrl: './track-list.component.html',
    styleUrl: './track-list.component.scss',
  standalone: true,
})
export class TrackListComponent {

  @Input() set playlistId(value: number) {
    this.tracks$ = this.service.getAllByPlaylist(value);
  }
  tracks$!: Observable<Track[]>;
  trackStatuses = TrackStatusEnum;

  constructor(
    private readonly service: TrackService,
  ) { }

  delete(id: number): void {
    this.service.delete(id);
  }

  retry(id: number): void {
    this.service.retry(id);
  }
}
