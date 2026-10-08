import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { OrganizationModule } from './organization/organization.module';
import { InvitationsModule } from './invitations/invitations.module';

@Module({
  imports: [PrismaModule, AuthModule, OrganizationModule, InvitationsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
