import { IsEmail, IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsEmail({}, { message: 'A valid customer email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'priceId is required' })
  priceId: string;

  @IsInt({ message: 'planId must be an integer' })
  planId: number;
}
