import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { UserStatus } from '../../generated/prisma/enums';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()
  @IsIn(['ORGANIZATION_ADMIN', 'MANAGER', 'EMPLOYEE'])
  role?: 'ORGANIZATION_ADMIN' | 'MANAGER' | 'EMPLOYEE';

  @IsOptional()
  @IsIn(['ACTIVE', 'SUSPENDED', 'INACTIVE'])
  status?: UserStatus;
}
