import {Body, Controller, Get, Post} from '@nestjs/common';
const fetch = require('isomorphic-unfetch');
const { getData, getPreview, getTracks, getDetails } = require('spotify-url-info')(fetch);
import {PlaylistService} from "./playlist.service";
import {PlaylistModel} from "./playlist.model";
import {TrackService} from "../track/track.service";

@Controller('playlist')
export class PlaylistController {

    constructor(
        private readonly service: PlaylistService,
        private readonly trackService: TrackService,
    ) {
    }

    @Get()
    getAll(): Promise<PlaylistModel[]> {
        return this.service.findAll();
    }

    @Post()
    create(@Body() playlist: PlaylistModel): any {
        getDetails(playlist.spotifyUrl).then(async details => {
            const savedPlaylist = await this.service.create({...playlist, name: details.preview.title});
            console.log(savedPlaylist);
            details.tracks.forEach(track => {
                this.trackService.create({
                    artist: track.artist,
                    song: track.name,
                    spotifyUrl: track.previewUrl,
                }, savedPlaylist);
            });
        });
        //return {url: url.url};
    }
}