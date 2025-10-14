import { Module } from '@nestjs/common';
import { CompaniesModule } from './companies/companies.module';
import { BranchesModule } from './branches/branches.module';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';
import { ItemsModule } from './items/items.module';
import { InventoryModule } from './inventory/inventory.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsModule } from './reports/reports.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InvitationsModule } from './invitations/invitations.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: false,
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('database.host'),
        port: config.get('database.port'),
        username: config.get('database.db_user'),
        password: config.get('database.password'),
        database: config.get('database.database'),
        synchronize: config.get('database.synchronize'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
      }),
    }),
    CompaniesModule,
    BranchesModule,
    RolesModule,
    UsersModule,
    ItemsModule,
    InventoryModule,
    ReportsModule,
    InvitationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
