import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from './entities/branch.entity';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private branchesRepository: Repository<Branch>,
  ) {}

  create(createBranchDto: CreateBranchDto, companyId: number): Promise<Branch> {
    const newBranch = this.branchesRepository.create({
      ...createBranchDto,
      company: { companyId: companyId },
    });
    return this.branchesRepository.save(newBranch);
  }

  findAllForCompany(companyId: number): Promise<Branch[]> {
    return this.branchesRepository.find({
      where: { company: { companyId: companyId } },
      order: { branchName: 'ASC' },
    });
  }

  async findOneForCompany(id: number, companyId: number): Promise<Branch> {
    const branch = await this.branchesRepository.findOne({
      where: { branchId: id, company: { companyId: companyId } },
    });

    if (!branch) {
      throw new NotFoundException(
        `Sucursal con ID ${id} no encontrada o no pertenece a tu empresa.`,
      );
    }
    return branch;
  }

  async update(
    id: number,
    updateBranchDto: UpdateBranchDto,
    companyId: number,
  ): Promise<Branch> {
    const branch = await this.findOneForCompany(id, companyId);

    const updatedBranch = this.branchesRepository.merge(
      branch,
      updateBranchDto,
    );
    return this.branchesRepository.save(updatedBranch);
  }

  async remove(id: number, companyId: number): Promise<{ message: string }> {
    const branch = await this.findOneForCompany(id, companyId);
    await this.branchesRepository.remove(branch);
    return {
      message: `Sucursal "${branch.branchName}" eliminada exitosamente.`,
    };
  }
}
