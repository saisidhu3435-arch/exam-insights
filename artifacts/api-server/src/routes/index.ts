import { Router, type IRouter } from "express";
import healthRouter from "./health";
import newsRouter from "./news";
import aiRouter from "./ai";
import newsRefreshRouter from "./news-refresh";

const router: IRouter = Router();

router.use(healthRouter);
router.use(newsRouter);
router.use(aiRouter);
router.use(newsRefreshRouter);

export default router;
