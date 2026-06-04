import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { OutletsModule } from './outlets/outlets.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { MenuItemsModule } from './menu-items/menu-items.module';
import { TablesModule } from './tables/tables.module';
import { OrdersModule } from './orders/orders.module';
import { KotsModule } from './kots/kots.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    PrismaModule,

    AuthModule,
    TenantsModule,
    OutletsModule,
    UsersModule,
    CategoriesModule,
    MenuItemsModule,
    TablesModule,
    OrdersModule,
    KotsModule,
  ],
})
export class AppModule {}
