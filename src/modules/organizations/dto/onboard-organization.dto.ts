
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class OrganizationDetailsDto {
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  officialWebsite?: string;
}

export class OrganizationContactDto {
  @IsString()
  @MinLength(2)
  name?: string;

  @IsEmail()
  email?: string;
}

export class OrganizationContactsDto {
  @ValidateNested()
  @Type(() => OrganizationContactDto)
  organizationAdmin?: OrganizationContactDto;

  @ValidateNested()
  @Type(() => OrganizationContactDto)
  employeeCoordinator?: OrganizationContactDto;
}

export class OnboardOrganizationDto {
  @IsObject()
  @ValidateNested()
  @Type(() => OrganizationDetailsDto)
  organization?: OrganizationDetailsDto;

  @IsObject()
  @ValidateNested()
  @Type(() => OrganizationContactsDto)
  contacts?: OrganizationContactsDto;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsString({ each: true })
  moduleKeys?: string[];

  @IsInt()
  @Min(1)
  licensedUserLimit?: number;
}