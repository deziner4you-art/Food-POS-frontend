import { IsString, IsNotEmpty } from 'class-validator';

export class SelectFacebookPageDto {
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @IsString()
  @IsNotEmpty()
  pageId: string;

  @IsString()
  @IsNotEmpty()
  pageName: string;

  @IsString()
  @IsNotEmpty()
  token: string;
}
