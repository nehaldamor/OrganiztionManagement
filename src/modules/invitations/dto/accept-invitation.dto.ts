import { IsHexadecimal, IsString, Length, MinLength } from 'class-validator';

export class AcceptInvitationDto {
  @IsString()
  @IsHexadecimal()
  @Length(64, 64)
  token!: string;

  @IsString()
  @Length(2, 100)
  name!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
