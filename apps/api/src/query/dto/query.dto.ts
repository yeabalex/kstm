import { IsNotEmpty, IsString } from 'class-validator';

export class QueryDto {
  @IsString()
  @IsNotEmpty({ message: 'user_id is required' })
  user_id: string;

  @IsString()
  @IsNotEmpty({ message: 'bot_id is required' })
  bot_id: string;

  @IsString()
  @IsNotEmpty({ message: 'kb_id is required' })
  kb_id: string;

  @IsString()
  @IsNotEmpty({ message: 'session_id is required' })
  session_id: string;

  @IsString()
  @IsNotEmpty({ message: 'input_text cannot be empty' })
  input_text: string;
}
