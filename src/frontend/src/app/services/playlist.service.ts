import { Injectable } from '@angular/core';
import {createStore} from "@ngneat/elf";
import {HttpClient} from "@angular/common/http";
import {
  deleteEntities,
  getEntityByPredicate,
  selectAllEntities, selectEntities, selectEntity,
  selectEntityByPredicate,
  setEntities,
  UIEntitiesRef,
  unionEntities, updateEntities, upsertEntities,
  withEntities,
  withUIEntities
} from "@ngneat/elf-entities";
import {joinRequestResult, trackRequestResult} from "@ngneat/elf-requests";
import {combineLatest, map, Observable, tap} from "rxjs";
import {Track, TrackService} from "./track.service";
import {Socket} from "ngx-socket-io";

const STORE_NAME = 'playlist';
const ENDPOINT = '/api/playlist';
const CREATE_LOADING = 'CREATE_LOADING';

export interface Playlist {
  id: number;
  name?: string;
  spotifyUrl: string;
  error?: string;
  createdAt: number;
}

export interface PlaylistUi {
  id: number,
  collapsed: boolean;
}

export enum PLaylistStatusEnum {
  InProgress,
  Completed,
  Warning,
  Error,
  Subscribed,
}

@Injectable({
  providedIn: 'root'
})
export class PlaylistService {

  private store = createStore(
    { name: STORE_NAME },
    withEntities<Playlist>(),
    withUIEntities<PlaylistUi>()
  );
  all$ = this.store.combine({
    entities: this.store.pipe(selectAllEntities()),
    UIEntities: this.store.pipe(selectEntities({ ref: UIEntitiesRef })),
  }).pipe(unionEntities(), map(data => data.sort((a, b) => b.createdAt - a.createdAt)));

  loading$ = this.store.pipe(joinRequestResult([STORE_NAME]));
  createLoading$ = this.store.pipe(joinRequestResult([CREATE_LOADING], { initialStatus: 'idle' }));

  constructor(private readonly http: HttpClient,
              private readonly socket: Socket,
              private readonly trackService: TrackService,
  ) {
    this.socket.on('playlistUpdate', (playlist: Playlist) => this.store.update(upsertEntities(playlist)));
    this.socket.on('playlistDelete', ({id}: {id: number}) => this.store.update(deleteEntities(Number(id))));
    this.socket.on('playlistNew', (playlist: Playlist) =>
      this.store.update(
        upsertEntities(playlist),
        upsertEntities({id: playlist.id, collapsed: false}, {ref: UIEntitiesRef})
      )
    );
  }

  getById(id: number): Observable<Playlist | undefined> {
    return this.store.pipe(selectEntity(id));
  }

  getTrackCount(id: number): Observable<number> {
    return this.trackService.getAllByPlaylist(id).pipe(map(data => data.length));
  }

  getCompletedTrackCount(id: number): Observable<number> {
    return this.trackService.getCompletedByPlaylist(id).pipe(map(data => data.length));
  }

  getErrorTrackCount(id: number): Observable<number> {
    return this.trackService.getErrorByPlaylist(id).pipe(map(data => data.length));
  }

  getStatus$(id: number): Observable<PLaylistStatusEnum> {
    return combineLatest([
      this.getById(id),
      this.getTrackCount(id),
      this.getCompletedTrackCount(id),
      this.getErrorTrackCount(id),
    ]).pipe(map(([playlist, trackCount, completedCount, errorCount]) => {
      if (playlist?.error || errorCount === trackCount) {
        return PLaylistStatusEnum.Error;
      } else if (trackCount === completedCount) {
        return PLaylistStatusEnum.Completed;
      } else if (errorCount > 1) {
        return PLaylistStatusEnum.Warning;
      }
      return PLaylistStatusEnum.InProgress;
    }));
  }

  fetch(): void {
    this.http.get<Playlist[]>(ENDPOINT).pipe(
      tap((data: Playlist[]) => this.store.update(
        setEntities(data),
        setEntities(data.map(item => ({id: item.id, collapsed: false})), {ref: UIEntitiesRef})
      )),
      tap((data: Playlist[]) => data.forEach(playlist => this.trackService.fetch(playlist.id))),
      trackRequestResult([STORE_NAME], { skipCache: true }),
    ).subscribe();
  }

  create(spotifyUrl: string): void {
    this.http.post(ENDPOINT, {spotifyUrl}).pipe(
      trackRequestResult([CREATE_LOADING], { skipCache: true })
    ).subscribe();
  }

  toggleCollapsed(id: number): void {
    this.store.update(updateEntities(id, old => ({...old, collapsed: !old.collapsed}), { ref: UIEntitiesRef }))
  }

  delete(id: number): void {
    this.http.delete(`${ENDPOINT}/${id}`).subscribe();
  }
}
