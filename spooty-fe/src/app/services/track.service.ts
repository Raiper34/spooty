import { Injectable } from '@angular/core';
import {createStore} from "@ngneat/elf";
import {selectManyByPredicate, upsertEntities, withEntities} from "@ngneat/elf-entities";
import {Socket} from "ngx-socket-io";
import {tap} from "rxjs";
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

  getAllByPlaylist(id: number) {
    return this.store.pipe(selectManyByPredicate(({playlistId}) => playlistId === id))
  }

  constructor(
    private readonly http: HttpClient,
    private readonly socket: Socket,
  ) {
    this.socket.on('trackUpdate', (track: Track) => this.store.update(upsertEntities(track)));
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
}
