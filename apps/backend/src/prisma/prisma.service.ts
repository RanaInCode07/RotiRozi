import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Prisma connected to PostgreSQL');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Prisma disconnected from PostgreSQL');
  }

  /**
   * Soft-delete helper — sets deletedAt = now() on any model that supports it.
   * Usage: await this.prisma.softDelete('user', { id: userId })
   */
  async softDelete(
    model: string,
    where: Record<string, unknown>,
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (this as any)[model].update({
      where,
      data: { deletedAt: new Date() },
    });
  }
}
