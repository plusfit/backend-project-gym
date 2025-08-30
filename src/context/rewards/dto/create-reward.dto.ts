import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateRewardDto {
  @ApiProperty({ 
    description: 'Reward name', 
    maxLength: 100,
    example: 'Sports Water Bottle'
  })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ 
    description: 'Reward description', 
    maxLength: 500,
    example: 'Reusable 750ml bottle with gym logo'
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ 
    description: 'Points required to redeem the reward', 
    minimum: 1,
    example: 100
  })
  @IsNumber()
  @Min(1)
  pointsRequired!: number;

  @ApiPropertyOptional({ 
    description: 'Reward enabled status', 
    default: false,
    example: true
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}