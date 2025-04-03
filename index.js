const express = require("express");
const { default: middlewares } = require("./src/middlewares");
const { config } = require("dotenv");
const router = require("./src/router");


const app = express();
config();
middlewares(app);


const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send({
    api: "handyGo",
    status: "Online",
  });
})
app.use('/api',router)

app.all("*", (req, res) => {
  res.status(404).json({ error: "Route Not Found" });
});


app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
