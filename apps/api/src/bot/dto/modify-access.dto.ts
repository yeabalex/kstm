import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class ModifyAccessDto {
  @IsString()
  @IsNotEmpty({ message: 'bot_id is required' })
  bot_id: string;

  @IsBoolean({ message: 'private must be a boolean value' })
  private: boolean;
}
