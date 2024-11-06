const printLabel = require("express").Router();
const { error } = require("winston");
const { misQuery, setupQuery, misQueryMod, mchQueryMod, productionQueryMod,mchQueryMod1} = require('../../helpers/dbconn');
const { logger } = require('../../helpers/logger')
var bodyParser = require('body-parser')
const moment = require('moment')

// create application/json parser
var jsonParser = bodyParser.json();

printLabel.post ('/getTabledata',jsonParser, async (req, res, next) => {
    // console.log("printlabel",req.body);
    try {
  
        mchQueryMod(`SELECT * FROM magodmis.ncprogram_partslist n, magodmis.ncprograms n1
      WHERE n1.Ncid=n.NCId  AND n.NcProgramNo='${req.body.NcProgramNo}'`, (err, data) => {
        if (err) logger.error(err);
        //console.log(data)
        res.send(data)
      })
    } catch (error) {
      next(error)
    }
  });


  module.exports = printLabel;