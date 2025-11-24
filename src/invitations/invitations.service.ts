import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Invitation, InvitationStatus } from './entities/invitation.entity';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import type { AuthenticatedUser } from 'src/interfaces';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(Invitation)
    private invitationsRepository: Repository<Invitation>,
    private dataSource: DataSource,
  ) {}

  async create(dto: CreateInvitationDto, manager: AuthenticatedUser) {
    const userToInvite = await this.dataSource
      .getRepository(User)
      .findOneBy({ email: dto.employeeEmail });
    if (userToInvite && userToInvite.company) {
      throw new ConflictException('Este usuario ya pertenece a una compañía.');
    }

    const invitationExists = await this.invitationsRepository.findOneBy({
      employeeEmail: dto.employeeEmail,
      company: { companyId: manager.companyId },
      status: InvitationStatus.PENDING,
    });
    if (invitationExists) {
      throw new ConflictException(
        'Ya existe una invitación pendiente para este email en su empresa.',
      );
    }

    const newInvitation = this.invitationsRepository.create({
      employeeEmail: dto.employeeEmail,
      company: { companyId: manager.companyId },
      branch: { branchId: dto.branchId },
      manager: { userId: manager.userId },
    });

    return this.invitationsRepository.save(newInvitation);
  }

  async findForUser(email: string) {
    return this.invitationsRepository.find({
      where: {
        employeeEmail: email,
        status: InvitationStatus.PENDING,
      },
      relations: {
        company: true,
        branch: true,
        manager: true,
      },
      select: {
        invitationId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        company: {
          companyName: true,
        },
        branch: {
          branchName: true,
        },
        manager: {
          name: true,
          lastname: true,
        },
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async accept(invitationId: number, employee: AuthenticatedUser) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const invitation = await queryRunner.manager.findOne(Invitation, {
        where: {
          invitationId: invitationId,
          employeeEmail: employee.email,
          status: InvitationStatus.PENDING,
        },
        relations: ['company', 'branch'],
      });
      if (!invitation)
        throw new NotFoundException('Invitación no encontrada o no válida.');

      const user = await queryRunner.manager.findOneBy(User, {
        userId: employee.userId,
      });
      if (!user) {
        throw new NotFoundException(
          'El usuario que acepta la invitación no fue encontrado.',
        );
      }
      if (user.company) {
        throw new BadRequestException('Ya perteneces a una compañía.');
      }

      let employeeRole = await queryRunner.manager.findOneBy(Role, {
        role_name: 'Employee',
      });
      if (!employeeRole) {
        employeeRole = queryRunner.manager.create(Role, {
          role_name: 'Employee',
        });
        await queryRunner.manager.save(employeeRole);
      }

      user.company = invitation.company;
      user.branch = invitation.branch;
      user.role = employeeRole;
      await queryRunner.manager.save(user);

      invitation.status = InvitationStatus.ACCEPTED;
      await queryRunner.manager.save(invitation);

      await queryRunner.commitTransaction();
      return { message: 'Te has unido a la compañía exitosamente.' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async decline(invitationId: number, employee: AuthenticatedUser) {
    const invitation = await this.invitationsRepository.findOneBy({
      invitationId: invitationId,
      employeeEmail: employee.email,
    });
    if (!invitation) throw new NotFoundException('Invitación no encontrada.');

    invitation.status = InvitationStatus.DECLINED;
    await this.invitationsRepository.save(invitation);
    return { message: 'Invitación rechazada.' };
  }
}
