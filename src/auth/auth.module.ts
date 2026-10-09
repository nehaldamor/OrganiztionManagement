import { Module } from '@nestjs/common';
import 'dotenv/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PlatformAdminGuard } from './guards/platform-admin.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;

        if (!secret) {
          throw new Error(
            'JWT_SECRET must be configured before starting the app.',
          );
        }

        return {
          secret,
          signOptions: { expiresIn: '15m' },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    JwtAuthGuard,
    PlatformAdminGuard,
    RolesGuard,
  ],
  exports: [
    JwtModule,
    AuthRepository,
    JwtAuthGuard,
    PlatformAdminGuard,
    RolesGuard,
  ],
})
export class AuthModule {}
