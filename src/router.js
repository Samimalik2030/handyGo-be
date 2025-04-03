const express = require("express");
const authRouter = require("./router/authRouter");
const workshopRouter = require("./router/workshopRouter");

const router = express.Router();

router.use("/auth",authRouter);
router.use("/workshops",workshopRouter);



module.exports = router;
