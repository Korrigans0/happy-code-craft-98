import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

const ALLOWED_ORIGINS = (() => {
  const extra = process.env["ALLOWED_ORIGINS"] ?? "";
  const extras = extra ? extra.split(",").map(s => s.trim()).filter(Boolean) : [];
  const devDomain = process.env["REPLIT_DEV_DOMAIN"];
  const base = [
    /^https?:\/\/localhost(:\d+)?$/,
    /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  ];
  if (devDomain) base.push(new RegExp(`^https?://${devDomain.replace(".", "\\.")}$`));
  extras.forEach(o => base.push(new RegExp(`^${o.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`)));
  return base;
})();

app.use(cors({
  credentials: true,
  origin: (origin, cb) => {
    if (!origin) { cb(null, true); return; }
    if (ALLOWED_ORIGINS.some(r => r.test(origin))) { cb(null, true); return; }
    cb(new Error("CORS: origin not allowed"));
  },
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

app.use("/api", router);

export default app;
