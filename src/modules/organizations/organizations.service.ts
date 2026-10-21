
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateOrganizationDto } from "./dto/create-organization.dto";

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrganizationDto) {
    if (dto.name === undefined) {
      throw new BadRequestException("Organization name is required");
    }

    if (dto.slug === undefined) {
      throw new BadRequestException("Organization slug is required");
    }

    try {
      return await this.prisma.organization.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          ...(dto.isActive !== undefined && {
            isActive: dto.isActive,
          }),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException(
          "An organization with this slug already exists",
        );
      }

      throw error;
    }
  }

  async findAll() {
    return this.prisma.organization.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findOne(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      throw new NotFoundException("Organization not found");
    }

    return organization;
  }
}