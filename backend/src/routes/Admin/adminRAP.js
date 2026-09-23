const express = require("express");
const router = express.Router();

const verificarAdmin = require("../../middleware/admin");

const {
  obtenerRAP
} = require("../../controllers/admin/adminRAPController");


router.get(
  "/RAP",
  verificarAdmin,
  obtenerRAP
);


module.exports = router;
