// src/app/features/homepage/components/auth-panel/auth-panel.ts
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UpperCasePipe } from '@angular/common';

@Component({
  selector: 'app-auth-panel',
  standalone: true,
  imports: [FormsModule, UpperCasePipe],
  templateUrl: './auth-panel.html',
  styleUrls: ['./auth-panel.css']
})
export class AuthPanelComponent {
  tab:'login'|'register' = 'login';
  username = '';
  password = '';
  @Output() login = new EventEmitter<{username:string; password:string}>();
  @Output() register = new EventEmitter<{username:string; password:string}>();

  submit(){
    const p = { username:this.username.trim(), password:this.password };
    this.tab === 'login' ? this.login.emit(p) : this.register.emit(p);
  }
}
