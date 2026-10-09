import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '../generated/prisma/client';

type DatabaseTransaction = Prisma.TransactionClient;
type TransactionWork<T> = (transaction: DatabaseTransaction) => Promise<T>;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        'DATABASE_URL must be configured before starting the app.',
      );
    }

    super({
      adapter: new PrismaPg({ connectionString }),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  withTenantContext<T>(
    organizationId: string,
    work: TransactionWork<T>,
  ): Promise<T> {
    return this.withSecurityContext(
      { tenantId: organizationId },
      work,
    );
  }

  withPlatformAdminContext<T>(work: TransactionWork<T>): Promise<T> {
    return this.withSecurityContext({ platformAdmin: true }, work);
  }

  withAuthLookupContext<T>(work: TransactionWork<T>): Promise<T> {
    return this.withSecurityContext({ authLookup: true }, work);
  }

  private withSecurityContext<T>(
    context: {
      tenantId?: string;
      platformAdmin?: boolean;
      authLookup?: boolean;
    },
    work: TransactionWork<T>,
  ): Promise<T> {
    return this.$transaction(async (transaction) => {
      await transaction.$queryRaw`
        SELECT
          set_config('app.tenant_id', ${context.tenantId ?? ''}, true),
          set_config('app.platform_admin', ${String(context.platformAdmin ?? false)}, true),
          set_config('app.auth_lookup', ${String(context.authLookup ?? false)}, true)
      `;

      return work(transaction);
    });
  }
}
