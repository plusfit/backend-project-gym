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

  @ApiPropertyOptional({
    description: 'Reward image URL from Firebase Storage',
    example: 'https://firebasestorage.googleapis.com/v0/b/gym-app.appspot.com/o/rewards%2Fabc123.jpg?alt=media'
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Reward image path in Firebase Storage',
    example: 'rewards/abc123.jpg'
  })
  @IsOptional()
  @IsString()
  imagePath?: string;

  @ApiPropertyOptional({
    description: 'Media type of the reward image',
    enum: ['image', 'video'],
    example: 'image'
  })
  @IsOptional()
  @IsString()
  mediaType?: 'image' | 'video';
}