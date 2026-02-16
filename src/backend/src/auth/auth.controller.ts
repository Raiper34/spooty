import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  Put,
  Delete,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AdminGuard } from './admin.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.username, loginDto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return {
      username: req.user.username,
      isAdmin: req.user.isAdmin,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('validate')
  validate() {
    return { valid: true };
  }

  // Admin User Management Endpoints
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('users')
  async getAllUsers() {
    return this.authService.getAllUsers();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('users')
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.authService.createUser(createUserDto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put('users/:id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.authService.updateUser(id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('users/:id')
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    await this.authService.deleteUser(id);
    return { message: 'User deleted successfully' };
  }
}
