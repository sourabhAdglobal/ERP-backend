
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { DepartmentsService } from "./departments.service";
import { CreateDepartmentDto } from "./dto/create-department.dto";
import { UpdateDepartmentDto } from "./dto/update-department.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OrganizationAccessGuard } from "../auth/guards/organization-access.guard";

@Controller("organizations/:organizationId/departments")
@UseGuards(JwtAuthGuard, OrganizationAccessGuard)
export class DepartmentsController {
  constructor(
    private readonly departmentsService: DepartmentsService,
  ) {}

  @Post()
  create(
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Body() dto: CreateDepartmentDto,
  ) {
    return this.departmentsService.create(organizationId, dto);
  }

  @Get()
  findAll(
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
  ) {
    return this.departmentsService.findAll(organizationId);
  }

  @Get(":id")
  findOne(
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.departmentsService.findOne(organizationId, id);
  }

  @Patch(":id")
  update(
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(
      organizationId,
      id,
      dto,
    );
  }

  @Delete(":id")
  remove(
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.departmentsService.remove(organizationId, id);
  }
}