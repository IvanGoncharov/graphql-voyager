import { Request, Response } from 'express';
import renderVoyagerPage, { MiddlewareOptions } from './render-voyager-page';

const { version } = require('../package.json');

interface ExpressVoyagerMiddleware {
  (_req: Request, res: Response, next: () => void): void;
}

interface Register {
  (options): ExpressVoyagerMiddleware;
}

const express: Register = function voyagerExpress(options) {
  const middlewareOptions: MiddlewareOptions = {
    ...options,
    version,
  };

  return (_req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.write(renderVoyagerPage(middlewareOptions));
    res.end();
  };
};

export default express;
