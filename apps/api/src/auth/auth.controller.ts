import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('/api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<{ access_token: string }> {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.authService.login(user);
  }

  @Get('validate-token')
  async validate(
    @Headers('authorization') authHeader?: string,
  ): Promise<{ valid: boolean; message?: string }> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { valid: false, message: 'No token or wrong format' };
    }

    const token = authHeader.split(' ')[1];
    return this.authService.validateToken(token);
  }
}
