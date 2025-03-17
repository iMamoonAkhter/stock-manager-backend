require("dotenv").config();

const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
const config = require("config");
const connectDB = require("./db/db");

const indexRouter = require("./routes/index");
const productsRouter = require("./routes/API/products");
const usersRouter = require("./routes/API/users");
const adminRouter = require("./routes/API/admin");
const cartRouter = require("./routes/API/cart");
const categoryRouter = require("./routes/API/categories");
const feedbackRouter = require("./routes/API/feedback");
const orderRouter = require("./routes/API/orders");
const ManualOrderRouter = require("./routes/API/manualOrder");
const expenseRouter = require("./routes/API/expense");
const tenantRouter = require("./routes/API/tenants");

const app = express();
app.use(cors());

// Middleware
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/", indexRouter);
app.use("/API/users", usersRouter);
app.use("/API/admin", adminRouter);
app.use("/API/products", productsRouter);
app.use("/API/cart", cartRouter);
app.use("/API/categories", categoryRouter);
app.use("/API/feedback", feedbackRouter);
app.use("/API/orders", orderRouter);
app.use("/API/ManualOrders", ManualOrderRouter);
app.use("/API/expense", expenseRouter);
app.use("/API/tenant", tenantRouter);

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// Error handler
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500).json({ error: err.message });
});

// Connect to the database and start the server
connectDB()
  .then(() => {
    const port = process.env.PORT || 8000;
    app.listen(port, () => {
      console.log(`Server is running at port: ${port}`);
    });
  })
  .catch((err) => {
    console.log("Error connecting to the database:", err);
  });

module.exports = app;