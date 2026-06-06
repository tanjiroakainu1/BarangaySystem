import { Injectable } from '@angular/core';

export interface User {
  id: number;
  role: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // ✅ Simulated users
  private users: User[] = [
    {
      id: 1,
      role: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      firstName: 'Luvly',
      lastName: 'Espiritu'
    },
    {
      id: 2,
      role: 'admin',
      email: 'col.2023010508@lsb.edu.ph',
      password: 'admin123',
      firstName: 'Cristian ',
      lastName: 'Cayanan'
    }
  ];

  // ✅ Temporary OTP store
  otpStore: { [email: string]: string } = {};

  // ✅ Simulated OTP generator
  generateOtpForEmail(email: string) {
    const userExists = this.users.some(u => u.email === email);
    if (!userExists) {
      return { success: false, message: 'Email not registered' };
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    this.otpStore[email] = otp;
    console.log(`OTP for ${email}: ${otp}`); // Simulated send
    return { success: true, message: 'OTP sent to email' };
  }

  // ✅ Login using password + OTP
  loginWithOtp(email: string, password: string, otp: string) {
    const user = this.users.find(u => u.email === email && u.password === password);
    if (!user) {
      return { success: false, message: 'Invalid email or password' };
    }

    if (this.otpStore[email] !== otp) {
      return { success: false, message: 'Invalid OTP' };
    }

    delete this.otpStore[email];
    return { success: true, user };
  }

  // ✅ (Optional) Registration
  register(newUser: Omit<User, 'id' | 'role'>) {
    const existingUser = this.users.find(u => u.email === newUser.email);
    if (existingUser) {
      return { success: false, message: 'Email already registered' };
    }

    const id = this.users.length + 1;
    const user = { ...newUser, id, role: 'user' };
    this.users.push(user);

    return { success: true, message: 'Registration successful', user };
  }
}
