import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  IsNotEmpty,
} from 'class-validator';

export class CreateBotDto {
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
  @IsNotEmpty({ message: 'bot_name is required' })
  bot_name: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  csv?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pdf?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  txt?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  json?: string[];

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true, message: 'Each web_url must be a valid URL' })
  web_url?: string[];

  @IsOptional()
  @IsString()
  prompt_template?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  temperature?: number;

  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsUrl({}, { message: 'profile_image must be a valid URL' })
  profile_image?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
