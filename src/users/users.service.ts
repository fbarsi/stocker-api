import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['company', 'role'],
    });
  }

  async findAllInCompany(
    companyId: number,
  ): Promise<Omit<User, 'password_hash'>[]> {
    return this.usersRepository.find({
      where: { company: { company_id: companyId } },
      select: ['user_id', 'full_name', 'email'],
      relations: ['role', 'branch'],
    });
  }
}
