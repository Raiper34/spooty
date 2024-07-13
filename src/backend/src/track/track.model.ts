import {PlaylistModel} from "../playlist/playlist.model";

export interface TrackModel {
    id?: number;
    artist: string;
    song: string;
    spotifyUrl: string;
    youtubeUrl?: string;
    status?: TrackStatusEnum,
    playlist?: PlaylistModel;
    createdAt?: number;
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