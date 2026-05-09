import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import campaignsRouter from "./campaigns";
import charactersRouter from "./characters";
import profilesRouter from "./profiles";
import compendiumRouter from "./compendium";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/campaigns", campaignsRouter);
router.use("/characters", charactersRouter);
router.use("/profiles", profilesRouter);
router.use("/compendium", compendiumRouter);

export default router;
