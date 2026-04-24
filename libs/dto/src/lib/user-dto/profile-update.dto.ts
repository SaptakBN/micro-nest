import {
  IsDate,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';
import { Gender } from '@common/contracts';

export class ProfileUpdateDto {
  @IsOptional()
  full_name?: string | null | undefined;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender | null | undefined;

  @IsOptional()
  @IsDate()
  dob?: Date | null | undefined;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string | null | undefined;

  @IsOptional()
  @IsString()
  city?: string | null | undefined;

  @IsOptional()
  @IsString()
  country?: string | null | undefined;
}
