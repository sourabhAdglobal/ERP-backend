import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveModules() {
    const modules = await this.prisma.erpModule.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
        baseMonthlyPrice: true,
        perUserMonthlyPrice: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return {
      count: modules.length,
      modules,
    };
  }
}