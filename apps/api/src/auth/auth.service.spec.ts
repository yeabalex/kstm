import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserService } from '../users/user.service';

describe('AuthService', () => {
  let authService: AuthService;
  let jwtService: JwtService;
  let userService: UserService;

  const mockUser = {
    id: 'user-uuid-123',
    email: 'test@example.com',
    firstname: 'John',
    lastname: 'Doe',
    password: 'hashedpassword',
    stripeCustomerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserService = {
    findByUsername: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
    expect(jwtService).toBeDefined();
    expect(userService).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password if credentials match', async () => {
      mockUserService.findByUsername.mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));

      const result = await authService.validateUser(
        'test@example.com',
        'correctpass',
      );

      expect(result).toBeDefined();
      expect(result?.email).toBe(mockUser.email);
      expect((result as any).password).toBeUndefined();
    });

    it('should return null if password does not match', async () => {
      mockUserService.findByUsername.mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));

      const result = await authService.validateUser(
        'test@example.com',
        'wrongpass',
      );
      expect(result).toBeNull();
    });

    it('should return null if user does not exist', async () => {
      mockUserService.findByUsername.mockResolvedValue(null);

      const result = await authService.validateUser(
        'nonexistent@example.com',
        'pass',
      );
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return signed JWT access token', async () => {
      const sanitizedUser = {
        id: 'user-uuid-123',
        email: 'test@example.com',
        firstname: 'John',
        lastname: 'Doe',
        stripeCustomerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await authService.login(sanitizedUser);

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: sanitizedUser.email,
        sub: sanitizedUser.id,
        firstname: sanitizedUser.firstname,
        lastName: sanitizedUser.lastname,
      });
      expect(result).toEqual({ access_token: 'mock-jwt-token' });
    });
  });

  describe('validateToken', () => {
    it('should return valid true if token is valid', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user-uuid-123' });

      const result = await authService.validateToken('valid-token');
      expect(result).toEqual({ valid: true });
    });

    it('should throw UnauthorizedException if token verification fails', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      await expect(authService.validateToken('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
