import {
  Injectable,
  UnauthorizedException,
  Logger,
  OnModuleInit,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from './user.entity';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
const apacheMd5 = require('apache-md5');

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    // Create default admin user if it doesn't exist
    await this.createDefaultAdmin();
  }

  private async createDefaultAdmin(): Promise<void> {
    const adminUsername = this.configService.get<string>('ADMIN_USERNAME');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');

    if (!adminUsername || !adminPassword) {
      this.logger.warn(
        'ADMIN_USERNAME or ADMIN_PASSWORD not set in environment variables',
      );
      return;
    }

    const existingAdmin = await this.userRepository.findOne({
      where: { username: adminUsername },
    });

    if (!existingAdmin) {
      // Create new admin user
      const user = this.userRepository.create({
        username: adminUsername,
        password: adminPassword, // Already in Apache MD5 format
        isAdmin: true,
      });
      await this.userRepository.save(user);
      this.logger.log(`Default admin user created: ${adminUsername}`);
    } else {
      // Update password if it changed in .env
      if (existingAdmin.password !== adminPassword) {
        existingAdmin.password = adminPassword;
        await this.userRepository.save(existingAdmin);
        this.logger.log(`Admin password updated for user: ${adminUsername}`);
      } else {
        this.logger.log(`Admin user already exists: ${adminUsername}`);
      }
    }
  }

  async validateUser(username: string, password: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ where: { username } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify Apache MD5 password
    const isValid = apacheMd5(password, user.password) === user.password;

    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(username: string, password: string) {
    const user = await this.validateUser(username, password);

    const payload = {
      username: user.username,
      sub: user.id,
      isAdmin: user.isAdmin,
    };

    return {
      access_token: this.jwtService.sign(payload),
      username: user.username,
      isAdmin: user.isAdmin,
    };
  }

  async validateToken(userId: number): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  // User Management Methods
  async getAllUsers(): Promise<Partial<UserEntity>[]> {
    const adminUsername = this.configService.get<string>('ADMIN_USERNAME');

    // Get all users except the default admin
    const users = await this.userRepository.find({
      where: adminUsername ? { username: Not(adminUsername) } : {},
      order: { createdAt: 'DESC' },
    });

    // Return users without password
    return users.map((user) => ({
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
    }));
  }

  async createUser(createUserDto: CreateUserDto): Promise<Partial<UserEntity>> {
    const { username, password } = createUserDto;

    // Check if username already exists
    const existingUser = await this.userRepository.findOne({
      where: { username },
    });

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // Hash password with Apache MD5
    const hashedPassword = apacheMd5(password);

    const user = this.userRepository.create({
      username,
      password: hashedPassword,
      isAdmin: false, // New users are never admin
    });

    const savedUser = await this.userRepository.save(user);

    // Return user without password
    return {
      id: savedUser.id,
      username: savedUser.username,
      isAdmin: savedUser.isAdmin,
      createdAt: savedUser.createdAt,
    };
  }

  async updateUser(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<Partial<UserEntity>> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const adminUsername = this.configService.get<string>('ADMIN_USERNAME');

    // Prevent updating the default admin user
    if (user.username === adminUsername) {
      throw new BadRequestException('Cannot update default admin user');
    }

    // Check if username is being changed and if it already exists
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username: updateUserDto.username },
      });

      if (existingUser) {
        throw new ConflictException('Username already exists');
      }

      user.username = updateUserDto.username;
    }

    // Update password if provided
    if (updateUserDto.password) {
      user.password = apacheMd5(updateUserDto.password);
    }

    const updatedUser = await this.userRepository.save(user);

    // Return user without password
    return {
      id: updatedUser.id,
      username: updatedUser.username,
      isAdmin: updatedUser.isAdmin,
      createdAt: updatedUser.createdAt,
    };
  }

  async deleteUser(id: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const adminUsername = this.configService.get<string>('ADMIN_USERNAME');

    // Prevent deleting the default admin user
    if (user.username === adminUsername) {
      throw new BadRequestException('Cannot delete default admin user');
    }

    await this.userRepository.remove(user);
  }
}
