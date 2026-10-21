import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InvitationEmailService } from './services/invitation-email.service';
import { InvitationsController } from './controllers/invitations.controller';
import { InvitationsRepository } from './repositories/invitations.repository';
import { InvitationsService } from './services/invitations.service';

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
