import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateUserSpecialityDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  specialityId?: string | null;
}
