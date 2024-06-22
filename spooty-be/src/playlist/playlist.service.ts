import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {PlaylistEntity} from "./playlist.entity";

@Injectable()
export class PlaylistService {
    constructor(
        @InjectRepository(PlaylistEntity)
        private repository: Repository<PlaylistEntity>,
    ) {}

    findAll(): Promise<PlaylistEntity[]> {
        return this.repository.find({relations: {tracks: true}});
    }

    findOne(id: number): Promise<PlaylistEntity | null> {
        return this.repository.findOneBy({ id });
    }

    async remove(id: number): Promise<void> {
        await this.repository.delete(id);
    }

    async create(track: PlaylistEntity): Promise<PlaylistEntity> {
        return this.repository.save(track);
    }

    async update(id: number, track: PlaylistEntity): Promise<void> {
        await this.repository.update(id, track);
    }
}