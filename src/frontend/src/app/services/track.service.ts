import { Injectable } from '@angular/core';
import {createStore} from "@ngneat/elf";
import {deleteEntities, selectManyByPredicate, upsertEntities, withEntities} from "@ngneat/elf-entities";
import {Socket} from "ngx-socket-io";
import {map, Observable, tap} from "rxjs";
import {trackRequestResult} from "@ngneat/elf-requests";
import {HttpClient} from "@angular/common/http";

const STORE_NAME = 'track';
const ENDPOINT = '/api/track';

export interface Track {
  id: number;
  artist: string;
  song: string;
  spotifyUrl: string;
  youtubeUrl: string;
  status: TrackStatusEnum;
  playlistId?: number;
  error?: string;
}

export enum TrackStatusEnum {
  New,
  Searching,
  Queued,
  Downloading,
  Completed,
  Error,
}

@Injectable({
  providedIn: 'root'
})
export class TrackService {

  private store = createStore(
    { name: STORE_NAME },
    withEntities<Track>(),
  );

  getAllByPlaylist(id: number, status?: TrackStatusEnum): Observable<Track[]> {
    return this.store.pipe(
      selectManyByPredicate((track) => track?.playlistId === id),
      map(data => data.filter(item => status === undefined || item.status === status)),
    );
  }

  getCompletedByPlaylist(id: number): Observable<Track[]> {
    return this.getAllByPlaylist(id, TrackStatusEnum.Completed);
  }

  getErrorByPlaylist(id: number): Observable<Track[]> {
    return this.getAllByPlaylist(id, TrackStatusEnum.Error);
  }

  constructor(
    private readonly http: HttpClient,
    private readonly socket: Socket,
  ) {
    this.socket.on('trackUpdate', (track: Track) => this.store.update(upsertEntities(track)));
    this.socket.on('trackDelete', ({id}: {id: number}) => this.store.update(deleteEntities(id)));
    this.socket.on('trackNew', ({track, playlistId}: {track: Track, playlistId: number}) =>
      this.store.update(upsertEntities([{...track, playlistId}]))
    );
  }

  fetch(playlistId: number): void {
    this.http.get<Track[]>(`${ENDPOINT}/playlist/${playlistId}`).pipe(
      tap((data: Track[]) => this.store.update(upsertEntities(data.map(track => ({...track, playlistId}))))),
      trackRequestResult([STORE_NAME], { skipCache: true }),
    ).subscribe();
  }

  delete(id: number): void {
    this.http.delete(`${ENDPOINT}/${id}`).subscribe();
  }
}
