export interface PlaylistModel {
    id: number;
    name?: string;
    spotifyUrl: string;
    tracks?: any[]; //todo fix it
    error?: string;
    createdAt?: number;
}