import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsString,
  Min,
} from "class-validator";

export class CalculateSubscriptionDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsString({ each: true })
  moduleKeys?: string[];

  @IsInt()
  @Min(1)
  licensedUserLimit?: number;
}