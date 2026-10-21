import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './database/prisma.module';
import { OrganizationModule } from './modules/organizations/organizations.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { UsermanagementModule } from './modules/users/users.module';
import { TeammanagementModule } from './modules/teammanagement/teammanagement.module';
import { SpecialityModule } from './modules/speciality/speciality.module';
import { ProjectsModule } from './modules/projects/projects.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    OrganizationModule,
    InvitationsModule,
    UsermanagementModule,
    TeammanagementModule,
    SpecialityModule,
    ProjectsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
