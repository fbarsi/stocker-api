import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Role } from 'src/roles/role.entity';
import { Branch } from 'src/branches/branch.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Branch])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
