import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="hero is-fullheight login-hero">
      <div class="hero-body">
        <div class="container">
          <div class="columns is-centered">
            <div class="column is-5-tablet is-4-desktop is-3-widescreen">
              <form class="box login-box" (ngSubmit)="onSubmit()" #loginForm="ngForm">
                <div class="has-text-centered mb-5">
                  <div class="logo-container mb-4">
                    <i class="fas fa-music logo-icon"></i>
                  </div>
                  <h1 class="title is-3 has-text-weight-bold">Spooty</h1>
                  <p class="subtitle is-6 has-text-grey">Login to continue</p>
                </div>

                @if (error) {
                  <div class="notification is-danger is-light">
                    <button class="delete" (click)="error = ''"></button>
                    {{ error }}
                  </div>
                }

                <div class="field">
                  <label class="label">Username</label>
                  <div class="control has-icons-left">
                    <input
                      class="input"
                      type="text"
                      placeholder="Username"
                      name="username"
                      [(ngModel)]="username"
                      required
                      autofocus
                    >
                    <span class="icon is-small is-left">
                      <i class="fas fa-user"></i>
                    </span>
                  </div>
                </div>

                <div class="field">
                  <label class="label">Password</label>
                  <div class="control has-icons-left">
                    <input
                      class="input"
                      type="password"
                      placeholder="Password"
                      name="password"
                      [(ngModel)]="password"
                      required
                    >
                    <span class="icon is-small is-left">
                      <i class="fas fa-lock"></i>
                    </span>
                  </div>
                </div>

                <div class="field mt-5">
                  <button
                    class="button is-primary is-fullwidth login-button"
                    type="submit"
                    [disabled]="!loginForm.form.valid || loading"
                    [class.is-loading]="loading"
                  >
                    <span class="icon">
                      <i class="fas fa-sign-in-alt"></i>
                    </span>
                    <span>Login</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <div class="animated-bg">
        <div class="bubble bubble-1"></div>
        <div class="bubble bubble-2"></div>
        <div class="bubble bubble-3"></div>
        <div class="bubble bubble-4"></div>
        <div class="bubble bubble-5"></div>
      </div>
    </section>
  `,
  styles: [`
    .login-hero {
      background: linear-gradient(135deg, #1DB954 0%, #191414 100%);
      position: relative;
      overflow: hidden;
    }

    .login-hero::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background:
        radial-gradient(circle at 20% 50%, rgba(29, 185, 84, 0.2) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(30, 215, 96, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 40% 20%, rgba(29, 185, 84, 0.1) 0%, transparent 50%);
      animation: pulse 15s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.8; }
    }

    .animated-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      z-index: 0;
    }

    .bubble {
      position: absolute;
      border-radius: 50%;
      background: rgba(29, 185, 84, 0.1);
      animation: float 20s infinite ease-in-out;
    }

    .bubble-1 {
      width: 100px;
      height: 100px;
      left: 10%;
      bottom: -100px;
      animation-delay: 0s;
      animation-duration: 18s;
    }

    .bubble-2 {
      width: 60px;
      height: 60px;
      left: 30%;
      bottom: -60px;
      animation-delay: 2s;
      animation-duration: 22s;
    }

    .bubble-3 {
      width: 80px;
      height: 80px;
      left: 60%;
      bottom: -80px;
      animation-delay: 4s;
      animation-duration: 20s;
    }

    .bubble-4 {
      width: 120px;
      height: 120px;
      left: 80%;
      bottom: -120px;
      animation-delay: 0s;
      animation-duration: 25s;
    }

    .bubble-5 {
      width: 70px;
      height: 70px;
      left: 45%;
      bottom: -70px;
      animation-delay: 3s;
      animation-duration: 19s;
    }

    @keyframes float {
      0% {
        transform: translateY(0) rotate(0deg);
        opacity: 0;
      }
      10% {
        opacity: 1;
      }
      90% {
        opacity: 1;
      }
      100% {
        transform: translateY(-100vh) rotate(360deg);
        opacity: 0;
      }
    }

    .login-box {
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      background: rgba(255, 255, 255, 0.98);
      border: 1px solid rgba(255, 255, 255, 0.2);
      position: relative;
      z-index: 1;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .login-box:hover {
      transform: translateY(-5px);
      box-shadow: 0 25px 70px rgba(0, 0, 0, 0.35);
    }

    .logo-container {
      display: inline-block;
      padding: 20px;
      background: linear-gradient(135deg, #1DB954 0%, #1ed760 100%);
      border-radius: 50%;
      box-shadow: 0 10px 30px rgba(29, 185, 84, 0.3);
    }

    .logo-icon {
      font-size: 3rem;
      color: white;
      display: block;
    }

    .title {
      color: #191414;
      margin-bottom: 0.5rem !important;
    }

    .label {
      color: #4a4a4a;
      font-weight: 600;
    }

    .input {
      border-radius: 8px;
      border: 2px solid #e8e8e8;
      transition: all 0.3s ease;
    }

    .input:focus {
      border-color: #1DB954;
      box-shadow: 0 0 0 0.125em rgba(29, 185, 84, 0.25);
    }

    .login-button {
      border-radius: 8px;
      background: linear-gradient(135deg, #1DB954 0%, #1ed760 100%);
      border: none;
      height: 3rem;
      font-weight: 600;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(29, 185, 84, 0.3);
    }

    .login-button:hover:not([disabled]) {
      background: linear-gradient(135deg, #1ed760 0%, #1DB954 100%);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(29, 185, 84, 0.4);
    }

    .login-button:active:not([disabled]) {
      transform: translateY(0);
    }

    .login-button[disabled] {
      background: #e8e8e8;
      box-shadow: none;
    }

    .notification {
      border-radius: 8px;
      animation: slideIn 0.3s ease;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Mobile responsiveness */
    @media screen and (max-width: 768px) {
      .login-box {
        margin: 1rem;
      }

      .logo-icon {
        font-size: 2.5rem;
      }
    }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Redirect if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }
  }

  onSubmit(): void {
    this.error = '';
    this.loading = true;

    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Invalid username or password';
      }
    });
  }
}

