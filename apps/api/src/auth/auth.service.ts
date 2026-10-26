import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../users/user.service';
import { User } from '@prisma/client';

export type SanitizedUser = Omit<User, 'password'>;

export interface JwtPayload {
  email: string;
  sub: string;
  firstname: string;
  lastName: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async validateUser(
    username: string,
    pass: string,
  ): Promise<SanitizedUser | null> {
    const user = await this.userService.findByUsername(username);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password: _password, ...result } = user;
      return result;
    }
    return null;
  }

  async validateToken(token: string): Promise<{ valid: boolean }> {
    try {
      this.jwtService.verify(token);
      return { valid: true };
    } catch {
      throw new UnauthorizedException({
        valid: false,
        message: 'Invalid or expired token',
      });
    }
  }

  async login(user: SanitizedUser): Promise<{ access_token: string }> {
    const payload: JwtPayload = {
      email: user.email,
      sub: user.id,
      firstname: user.firstname,
      lastName: user.lastname,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
