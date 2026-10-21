import {
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  @Length(3, 50)
  name?: string;

  @IsString()
  @Length(2, 60)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must contain lowercase letters, numbers, and hyphens',
  })
  slug?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
