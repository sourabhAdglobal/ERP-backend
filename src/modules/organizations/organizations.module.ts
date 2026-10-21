import { Module } from '@nestjs/common';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  imports: [PrismaModule]
})
export class OrganizationsModule {}
