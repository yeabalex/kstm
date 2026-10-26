import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
    login: jest.fn(),
    validateToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(authService).toBeDefined();
  });

  describe('login', () => {
    it('should return access token on valid credentials', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        firstname: 'John',
        lastname: 'Doe',
      };
      mockAuthService.validateUser.mockResolvedValue(user);
      mockAuthService.login.mockResolvedValue({
        access_token: 'jwt-token-xyz',
      });

      const result = await controller.login({
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(result).toEqual({ access_token: 'jwt-token-xyz' });
    });

    it('should throw UnauthorizedException on invalid credentials', async () => {
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(
        controller.login({
          email: 'test@example.com',
          password: 'WrongPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validate-token', () => {
    it('should return invalid status if header is missing or malformed', async () => {
      const result = await controller.validate('');
      expect(result).toEqual({
        valid: false,
        message: 'No token or wrong format',
      });
    });

    it('should return result from service if header is valid', async () => {
      mockAuthService.validateToken.mockResolvedValue({ valid: true });
      const result = await controller.validate('Bearer sample-token');
      expect(result).toEqual({ valid: true });
    });
  });
});
