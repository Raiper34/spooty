import { Injectable } from '@angular/core';
import {createStore} from "@ngneat/elf";
import {HttpClient} from "@angular/common/http";
import {
  addEntities,
  selectAllEntities, selectEntities,
  setEntities,
  UIEntitiesRef,
  unionEntities, updateEntities,
  withEntities,
  withUIEntities
} from "@ngneat/elf-entities";
import {joinRequestResult, trackRequestResult} from "@ngneat/elf-requests";
import {tap} from "rxjs";

const STORE_NAME = 'playlist';
const ENDPOINT = '/api/playlist';
const CREATE_LOADING = 'CREATE_LOADING';

export interface Playlist {
  id: number;
  name: string;
  spotifyUrl: string;
  tracks?: any[]; //todo fix it
}

export interface PlaylistUi {
  id: number,
  collapsed: boolean;
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
  }).pipe(unionEntities());

  loading$ = this.store.pipe(joinRequestResult([STORE_NAME]));
  createLoading$ = this.store.pipe(joinRequestResult([CREATE_LOADING], { initialStatus: 'idle' }));

  constructor(private readonly http: HttpClient) {
  }

  fetch(): void {
    this.http.get<Playlist[]>(ENDPOINT).pipe(
      tap((data: Playlist[]) => this.store.update(
        setEntities(data),
        setEntities(data.map(item => ({id: item.id, collapsed: false})), {ref: UIEntitiesRef})
      )),
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
}
