import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateSpecialityDto {
  @IsString()
  @Length(2, 100)
  name!: string;

  @IsString()
  @Length(2, 50)
  code!: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @IsString()
  @Length(1, 100)
  organizationId!: string;
}
