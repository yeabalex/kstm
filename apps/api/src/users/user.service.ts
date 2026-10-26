import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { RegisterUserDto } from './dto/register-user.dto';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: username },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async registerUser(data: RegisterUserDto): Promise<Omit<User, 'password'>> {
    const existingUser = await this.findByUsername(data.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const userId = uuidv4();

    const [user] = await this.prisma.$transaction([
      this.prisma.user.create({
        data: {
          id: userId,
          firstname: data.firstname,
          lastname: data.lastname,
          email: data.email,
          password: hashedPassword,
        },
      }),
      this.prisma.freeTier.create({
        data: {
          userId: userId,
          freeChatCredit: 15,
          freeUrlCredit: 3,
        },
      }),
    ]);

    this.logger.log(`User registered successfully: ${user.id} (${user.email})`);

    const { password: _, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}
