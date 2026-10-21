
import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [PrismaModule, OrganizationsModule, DepartmentsModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}