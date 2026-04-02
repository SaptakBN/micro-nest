import { Injectable } from '@nestjs/common';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import type { RequestHandler, NextFunction, Response, Request } from 'express';
import { ServerResponse, IncomingMessage } from 'http';

@Injectable()
export class ProxyService {
  private cache = new Map<string, RequestHandler>();

  private getProxy(target: string, stripPath: string): RequestHandler {
    const key = `${target}_${stripPath}`;

    if (this.cache.has(key)) {
      return this.cache.get(key) as RequestHandler;
    }

    const options: Options = {
      target,
      changeOrigin: true,
      pathRewrite: {
        [`^${stripPath}`]: '',
      },
      timeout: 3000,
      proxyTimeout: 3000,

      on: {
        proxyReq(proxyReq, req: IncomingMessage) {
          const expressReq = req as Request;

          if (!expressReq.body) return;
          if (proxyReq.writableEnded) return;

          const contentType = req.headers['content-type'] || '';

          if (contentType?.includes('application/json')) {
            const bodyData = JSON.stringify(expressReq.body);

            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
          }
        },
        error(err, req, res) {
          console.error('Proxy error:', err.message);

          if (res instanceof ServerResponse && !res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'text/plain' });
            res.end('Bad Gateway');
          }
        },
      },
    };

    const proxy = createProxyMiddleware(options);
    this.cache.set(key, proxy);

    return proxy;
  }

  forward(
    req: Request,
    res: Response,
    next: NextFunction,
    target: string,
    stripPath: string,
  ) {
    const proxy = this.getProxy(target, stripPath);
    return proxy(req, res, next);
  }
}
