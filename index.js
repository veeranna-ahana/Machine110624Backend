const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const { logger } = require('./helpers/logger');
var mysql = require('mysql2');

const app = express();
app.use(cors());

// Set a larger payload limit for JSON and URL-encoded requests
app.use(bodyParser.json({ limit: '50mb' })); 
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true })); 
app.get('/', (req, res) => {
    res.send("hello");
});

const ShiftOperator = require('./routes/machine/ShiftOperator');
app.use("/ShiftOperator", ShiftOperator);

const printLabel = require('./routes/machine/PrintLabel');
app.use("/printLabel", printLabel);

const userRouter = require('./routes/machine/user');
app.use("/user", userRouter);

app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.send({
        error: {
            status: err.status || 500,
            message: err.message,
        }
    });
    logger.error(`Status Code : ${err.status}  - Error : ${err.message}`);
});

// starting the server
app.listen(process.env.PORT, () => {
    console.log('listening on port ' + process.env.PORT);
    logger.info('listening on port ' + process.env.PORT);
});
