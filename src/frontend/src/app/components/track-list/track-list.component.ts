import {Component, Input} from '@angular/core';
import {CommonModule, NgFor, NgSwitch, NgSwitchCase} from "@angular/common";
import {Track, TrackService, TrackStatusEnum} from "../../services/track.service";
import {Observable} from "rxjs";

@Component({
  selector: 'app-track-list',
  standalone: true,
  imports: [CommonModule, NgFor, NgSwitch, NgSwitchCase],
  templateUrl: './track-list.component.html',
  styleUrl: './track-list.component.scss'
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
