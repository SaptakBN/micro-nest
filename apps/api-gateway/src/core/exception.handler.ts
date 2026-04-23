import {
  ExceptionFilter,
  Catch,
  HttpException,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ArgumentsHost,
} from '@nestjs/common';
import { status } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';

@Catch(RpcException)
export class GrpcToHttpExceptionFilter implements ExceptionFilter {
  catch(
    exception: { code: number; details?: string; message?: string },
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    // gRPC error structure
    const code = exception.code;
    const message = exception.details || exception.message;

    let httpException: HttpException;

    switch (code) {
      case status.ALREADY_EXISTS:
        httpException = new ConflictException(message);
        break;

      case status.UNAUTHENTICATED:
        httpException = new UnauthorizedException(message);
        break;

      case status.PERMISSION_DENIED:
        httpException = new ForbiddenException(message);
        break;

      case status.NOT_FOUND:
        httpException = new NotFoundException(message);
        break;

      case status.INVALID_ARGUMENT:
        httpException = new BadRequestException(message);
        break;

      default:
        httpException = new InternalServerErrorException(message);
    }

    const statusCode = httpException.getStatus();
    const resBody = httpException.getResponse();

    response.status(statusCode).json(resBody);
  }
}
