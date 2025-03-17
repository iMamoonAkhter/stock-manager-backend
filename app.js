require('dotenv').config()

var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

var indexRouter = require("./routes/index");
var productsRouter = require("./routes/API/products");
var usersRouter = require("./routes/API/users");
var adminRouter = require("./routes/API/admin");
var cartRouter = require("./routes/API/cart");
var categoryRouter = require("./routes/API/categories");
var feedbackRouter = require("./routes/API/feedback");
var orderRouter = require("./routes/API/orders");
var ManualOrderRouter = require("./routes/API/manualOrder");
var expenseRouter = require("./routes/API/expense");
var tenantRouter = require("./routes/API/tenants");

var cors = require("cors");
var app = express();
app.use(cors());
var config = require("config");
const connectDB = require("./db/db");
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
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

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

// mongoose
//   .connect(config.get("db"), {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => {
//     console.log("connected to mongo");
//   })
//   .catch((err) => {
//     console.log("error connecting");
//     console.log(err);
//   });

connectDB().then(() => {
  app.listen(process.env.port || 8000, ()=>{
    console.log(`Server is running at port : ${process.env.PORT || 8000}`)
})
}
).catch((err) => {
  console.log("error connecting");
  console.log(err);
});

module.exports = app;
