
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateDepartmentDto } from "./dto/create-department.dto";
import { UpdateDepartmentDto } from "./dto/update-department.dto";

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private get department(): any {
    return (this.prisma as any).department;
  }

  private async ensureOrganizationExists(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, isActive: true },
    });

    if (!organization || !organization.isActive) {
      throw new NotFoundException("Organization not found or inactive");
    }
  }

  private handlePrismaError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictException(
        "A department with this name or code already exists in this organization",
      );
    }

    throw error;
  }

  async create(
    organizationId: string,
    dto: CreateDepartmentDto,
  ) {
    await this.ensureOrganizationExists(organizationId);

    try {
      return await this.department.create({
        data: {
          organizationId,
          name: dto.name.trim(),
          code: dto.code.trim().toUpperCase(),
          description: dto.description?.trim() || null,
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async findAll(organizationId: string) {
    await this.ensureOrganizationExists(organizationId);

    return this.department.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
    });
  }

  async findOne(organizationId: string, id: string) {
    const department = await this.department.findFirst({
      where: { id, organizationId },
    });

    if (!department) {
      throw new NotFoundException("Department not found");
    }

    return department;
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateDepartmentDto,
  ) {
    await this.findOne(organizationId, id);

    try {
      return await this.department.update({
        where: {
          id_organizationId: { id, organizationId },
        },
        data: {
          ...(dto.name !== undefined && {
            name: dto.name.trim(),
          }),
          ...(dto.description !== undefined && {
            description: dto.description.trim() || null,
          }),
          ...(dto.isActive !== undefined && {
            isActive: dto.isActive,
          }),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundException("Department not found");
      }

      this.handlePrismaError(error);
    }
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);

    return this.department.update({
      where: {
        id_organizationId: { id, organizationId },
      },
      data: { isActive: false },
    });
  }
}