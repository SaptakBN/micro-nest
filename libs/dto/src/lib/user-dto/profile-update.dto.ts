import { IsEnum, IsOptional, IsPhoneNumber, IsString } from 'class-validator';
import { Gender } from '@common/contracts';
import { Transform } from 'class-transformer';

export class ProfileUpdateDto {
  @IsOptional()
  full_name?: string | null | undefined;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender | null | undefined;

  @IsOptional()
  @Transform(({ value }) => (value ? toTimestamp(new Date(value)) : value))
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

function toTimestamp(date: Date) {
  const ms = date.getTime();

  return {
    seconds: Math.floor(ms / 1000),
    nanos: (ms % 1000) * 1_000_000,
  };
}
