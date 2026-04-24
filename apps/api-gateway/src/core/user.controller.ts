import { Controller, UseGuards, Get, Req, Body } from '@nestjs/common';
import { JwtAuthGuard } from './jwt/jwt.guard';
import { UserClient } from './user.client.service';
import { ProfileUpdateDto } from '@micro-nest/dto';

@Controller('user')
export class UserController {
  constructor(private readonly userClient: UserClient) {}

  @UseGuards(JwtAuthGuard)
  @Get('/profile')
  profile(@Req() req: Request & { user: { userId: string } }) {
    return this.userClient.getProfile({ user_id: req.user['userId'] });
  }

  @UseGuards(JwtAuthGuard)
  @Get('/profile/update')
  updateProfile(
    @Req() req: Request & { user: { userId: string } },
    @Body() body: ProfileUpdateDto,
  ) {
    return this.userClient.updateProfile({
      userId: req.user['userId'],
      ...body,
    });
  }
}
