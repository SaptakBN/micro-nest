import { Controller, UseGuards, Get, Req, Body, Post } from '@nestjs/common';
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
  @Post('/profile/update')
  updateProfile(
    @Req() req: Request & { user: { userId: string } },
    @Body() body: ProfileUpdateDto,
  ) {
    console.log('At controller', body);
    return this.userClient.updateProfile({
      userId: req.user['userId'],
      ...body,
    });
  }
}
