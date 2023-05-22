//! creamos el servidor web
const { configCloudinary } = require("./src/middleware/files.middleware");
const { connect } = require("./src/utils/db");
const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

//! conectamos con la base de datos
connect();
const app = express();
configCloudinary();
const PORT = process.env.PORT;

//! limitaciones en la recepcion y envio de datos en 5mb
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));

//! -----ROUTES-----------
const CharacterRoutes = require("./src/api/routes/Character.routes");
const MovieRoutes = require("./src/api/routes/Movie.routes");

app.use("/api/v1/character/", CharacterRoutes);
app.use("/api/v1/movies/", MovieRoutes);

//! Cuando no se mete ninguna routa
app.use("*", (req, res, next) => {
  const error = new Error("Route not found");
  error.status = 404;
  return next(error);
});

//! ERRO 500 DEL SERVER
app.use((error, req, res) => {
  return res
    .status(error.status || 500)
    .json(error.message || "Unexpected error");
});

//! ----ESCUCHAMOS EN EL PORT LA BASE DE DATOS ------
app.disable("x-powered-by");
app.listen(PORT, () => {
  console.log(`Listening on PORT http://localhost:${PORT}`);
});
