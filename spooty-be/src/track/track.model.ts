import {PlaylistModel} from "../playlist/playlist.model";

export interface TrackModel {
    id?: number;
    artist: string;
    song: string;
    spotifyUrl: string;
    youtubeUrl?: string;
    status?: TrackStatusEnum,
    playlist?: PlaylistModel;
}

export enum TrackStatusEnum {
    New,
    Queued,
    Completed,
}