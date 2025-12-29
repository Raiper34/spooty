export interface Playlist {
  id: number;
  name?: string;
  spotifyUrl: string;
  error?: string;
  active: boolean;
  isTrack?: boolean;
  createdAt: number;
}
