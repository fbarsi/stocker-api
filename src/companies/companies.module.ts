import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './company.entity';
import { User } from 'src/users/user.entity';
import { Role } from 'src/roles/role.entity';

@Module({
  imports: [
    JwtModule,
    TypeOrmModule.forFeature([Company, User, Role])
  ],
  controllers: [CompaniesController],
  providers: [CompaniesService],
})
export class CompaniesModule {}
