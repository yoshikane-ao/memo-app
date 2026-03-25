import express, { type Router } from "express";

export const buildJsonTestApp = (router: Router) => {
  const app = express();
  app.use(express.json());
  app.use("/", router);
  return app;
};
