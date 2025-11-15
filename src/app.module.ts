import { Module } from '@nestjs/common';
import { CompaniesModule } from './companies/companies.module';
import { BranchesModule } from './branches/branches.module';
import { UsersModule } from './users/users.module';
import { ItemsModule } from './items/items.module';
import { InventoryModule } from './inventory/inventory.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsModule } from './reports/reports.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InvitationsModule } from './invitations/invitations.module';
import configuration from './config/configuration';
import { AuthModule } from './auth/auth.module';

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
      useFactory: (config: ConfigService) => {
        const databaseUrl = process.env.DATABASE_URL;
        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            synchronize: config.get('database.synchronize'),
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            ssl: {
              rejectUnauthorized: false,
            },
          };
        } else {
          return {
            type: 'postgres',
            host: config.get('database.host'),
            port: config.get('database.port'),
            username: config.get('database.db_user'),
            password: config.get('database.password'),
            database: config.get('database.database'),
            synchronize: config.get('database.synchronize'),
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
          };
        }
      },
    }),
    CompaniesModule,
    BranchesModule,
    UsersModule,
    ItemsModule,
    InventoryModule,
    ReportsModule,
    InvitationsModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
