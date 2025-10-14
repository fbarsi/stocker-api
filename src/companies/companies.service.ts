import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Company } from './entities/company.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class CompaniesService {
  constructor(
    private dataSource: DataSource,
    private jwtService: JwtService,
  ) {}

  async createAndAssignManager(
    createCompanyDto: CreateCompanyDto,
    tokenUser: any,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOneBy(User, {
        user_id: tokenUser.user_id,
      });
      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }
      if (user.company) {
        throw new BadRequestException('Ya perteneces a una compañía.');
      }

      const companyExists = await queryRunner.manager.findOneBy(Company, {
        company_name: createCompanyDto.company_name,
      });
      if (companyExists) {
        throw new ConflictException('Ya existe una compañía con ese nombre.');
      }

      const newCompany = queryRunner.manager.create(Company, createCompanyDto);
      await queryRunner.manager.save(newCompany);

      let managerRole = await queryRunner.manager.findOneBy(Role, {
        role_name: 'Manager',
      });
      if (!managerRole) {
        managerRole = queryRunner.manager.create(Role, {
          role_name: 'Manager',
        });
        await queryRunner.manager.save(managerRole);
      }

      user.company = newCompany;
      user.role = managerRole;
      await queryRunner.manager.save(user);

      const payload = {
        email: user.email,
        sub: user.user_id,
        role: managerRole.role_name,
        companyId: newCompany.company_id,
      };
      const newAccessToken = this.jwtService.sign(payload);

      await queryRunner.commitTransaction();

      return {
        company: newCompany,
        access_token: newAccessToken,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
