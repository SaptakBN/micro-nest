import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import {
  UserCreateRequest,
  UserCreateResponse,
  UserGetProfileRequest,
  UserProfile,
  UserServiceController,
  UserServiceControllerMethods,
} from '@common/contracts';

@Controller()
@UserServiceControllerMethods()
export class AppController implements UserServiceController {
  constructor(private readonly appService: AppService) {}

  createUser(request: UserCreateRequest): Promise<UserCreateResponse> {
    return this.appService.createUser(request);
  }

  getUserProfile(request: UserGetProfileRequest): Promise<UserProfile> {
    return this.appService.getAuthenticatedUser(request);
  }
}
