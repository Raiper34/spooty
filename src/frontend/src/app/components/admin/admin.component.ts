import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, UserDto, CreateUserDto, UpdateUserDto } from '../../services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  users: UserDto[] = [];
  loading = false;
  error: string | null = null;

  // Create user form
  showCreateForm = false;
  newUser: CreateUserDto = {
    username: '',
    password: ''
  };

  // Edit user
  editingUserId: number | null = null;
  editUser: UpdateUserDto = {};

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;

    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load users';
        this.loading = false;
        console.error('Error loading users:', err);
      }
    });
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (this.showCreateForm) {
      this.newUser = { username: '', password: '' };
    }
  }

  createUser(): void {
    if (!this.newUser.username || !this.newUser.password) {
      this.error = 'Username and password are required';
      return;
    }

    if (this.newUser.password.length < 6) {
      this.error = 'Password must be at least 6 characters';
      return;
    }

    this.loading = true;
    this.error = null;

    this.userService.createUser(this.newUser).subscribe({
      next: (user) => {
        this.users.push(user);
        this.toggleCreateForm();
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to create user';
        this.loading = false;
      }
    });
  }

  startEdit(user: UserDto): void {
    this.editingUserId = user.id;
    this.editUser = {
      username: user.username,
      password: ''
    };
  }

  cancelEdit(): void {
    this.editingUserId = null;
    this.editUser = {};
  }

  saveUser(userId: number): void {
    if (!this.editUser.username) {
      this.error = 'Username is required';
      return;
    }

    if (this.editUser.password && this.editUser.password.length < 6) {
      this.error = 'Password must be at least 6 characters';
      return;
    }

    this.loading = true;
    this.error = null;

    const updateData: UpdateUserDto = {
      username: this.editUser.username
    };

    if (this.editUser.password) {
      updateData.password = this.editUser.password;
    }

    this.userService.updateUser(userId, updateData).subscribe({
      next: (updatedUser) => {
        const index = this.users.findIndex(u => u.id === userId);
        if (index !== -1) {
          this.users[index] = updatedUser;
        }
        this.cancelEdit();
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to update user';
        this.loading = false;
      }
    });
  }

  deleteUser(userId: number, username: string): void {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
      return;
    }

    this.loading = true;
    this.error = null;

    this.userService.deleteUser(userId).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== userId);
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to delete user';
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString();
  }
}

