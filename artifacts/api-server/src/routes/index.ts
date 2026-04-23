import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import userRouter from "./user";
import foodRouter from "./food";
import scanFoodRouter from "./scanFood";
import mealPlanRouter from "./mealPlan";
import recipeRouter from "./recipe";
import chatRouter from "./chat";
import healthGuideRouter from "./healthGuide";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(userRouter);
router.use(foodRouter);
router.use(scanFoodRouter);
router.use(mealPlanRouter);
router.use(recipeRouter);
router.use(chatRouter);
router.use(healthGuideRouter);

export default router;
