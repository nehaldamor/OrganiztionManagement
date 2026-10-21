import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateSpecialityDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  code?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;
}
