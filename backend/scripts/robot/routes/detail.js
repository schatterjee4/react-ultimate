// IMPORTS =========================================================================================
let CommonValidators = require("shared/common/validators");
let Middlewares = require("backend/common/middlewares");
let robotsDB = require("backend/robot/common/db");
let router = require("backend/robot/common/router");

// ROUTES ==========================================================================================
router.get("/robots/:id",
  Middlewares.createParseParams(CommonValidators.id),
  Middlewares.createParseQuery({}),
  function handler(req, res, cb) {
    let robot = robotsDB.get(req.params.id);
    if (robot) {
      let response = {
        data: robot,
      }
      return res.status(200).send(response); // Status: ok
    } else {
      return cb();
    }
  }
);