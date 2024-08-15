import express, { Express, Request, Response } from 'express';

const app: Express = express();
const port = 3000;

app.get('/', (req: Request, res: Response) => {
  res.send('hello !');
});

app.listen(port, () => {
  console.log(`Starting.`);
});
