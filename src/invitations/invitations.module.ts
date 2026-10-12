import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InvitationEmailService } from './invitation-email.service';
import { InvitationsController } from './invitations.controller';
import { InvitationsRepository } from './invitations.repository';
import { InvitationsService } from './invitations.service';

@Module({
  imports: [AuthModule],
  controllers: [InvitationsController],
  providers: [
    InvitationsService,
    InvitationsRepository,
    InvitationEmailService,
  ],
})
export class InvitationsModule {}
