import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string; // Apache MD5 hashed password

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ default: () => Date.now() })
  createdAt: number;
}

