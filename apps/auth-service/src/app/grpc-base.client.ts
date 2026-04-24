import { ClientGrpc } from '@nestjs/microservices';
import { Observable, lastValueFrom, throwError } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';

export abstract class BaseGrpcClient<T extends object> {
  protected service: T;

  constructor(client: ClientGrpc, serviceName: string) {
    this.service = client.getService<T>(serviceName);
  }

  protected get client(): T {
    return this.service;
  }

  protected async call<R>(
    obs: Observable<R>,
    options?: { timeoutMs?: number },
  ): Promise<R> {
    return lastValueFrom(
      obs.pipe(
        timeout(options?.timeoutMs || 5000),
        retry(2),
        catchError((err) => {
          // normalize here
          return throwError(() => ({
            message: err?.details || err?.message || 'gRPC error',
            code: err?.code,
          }));
        }),
      ),
    );
  }
}
