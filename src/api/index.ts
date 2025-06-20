// api/index.ts
import { createServer, proxy } from 'aws-serverless-express';
import { Handler, Context, Callback } from 'aws-lambda';
import { bootstrapServer } from 'src/main';

let cachedServer: any;

export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback
) => {
  if (!cachedServer) {
    const app = await bootstrapServer(); // Create Nest app
    const expressApp = app.getHttpAdapter().getInstance();
    cachedServer = createServer(expressApp);
  }
  return proxy(cachedServer, event, context, 'PROMISE').promise;
};
