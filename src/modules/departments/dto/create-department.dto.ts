
import {
  IsOptional,
  IsString,
  Length,
  Matches,
} from "class-validator";

export class CreateDepartmentDto {
  @IsString()
  @Length(2, 100)
  name!: string;

  @IsString()
  @Length(2, 30)
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message: "Code may contain letters, numbers, hyphens, and underscores only",
  })
  code!: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;
}