import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './users/user.module';
import { AuthModule } from './auth/auth.module';
import { QueryModule } from './query/query.module';
import { StripeModule } from './stripe/stripe.module';
import { BotModule } from './bot/bot.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    UserModule,
    AuthModule,
    QueryModule,
    StripeModule,
    BotModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
