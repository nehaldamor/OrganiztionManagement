import { IsEnum } from 'class-validator';
import { TeamStatus } from '../../../generated/prisma/enums';
export class UpdateTeamStatusDto { @IsEnum(TeamStatus) status!: TeamStatus; }
