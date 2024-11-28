const ShiftOperator = require("express").Router();
const { error } = require("winston");
const {
  misQuery,
  setupQuery,
  misQueryMod,
  mchQueryMod,
  productionQueryMod,
  mchQueryMod1,
} = require("../../helpers/dbconn");
const { logger } = require("../../helpers/logger");
var bodyParser = require("body-parser");
const moment = require("moment");
const nodemailer = require("nodemailer");
const { response } = require("express");
const { Console } = require("winston/lib/winston/transports");

// create application/json parser
var jsonParser = bodyParser.json();

// Machine List For Shift Operator
ShiftOperator.get("/getallMachines", async (req, res, next) => {
  try {
    misQueryMod(
      `Select machine_data.machine_list.refName from machine_data.machine_list where activeMachine=1 and Working=1`,
      (err, data) => {
        if (err) logger.error(err);
        //console.log(data)
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

// ShiftOperator.post("/getCurrentShiftDetails", async (req, res, next) => {
//   try {
//     const now = new Date();
//     // Get current date and time
//     const currentDate = new Date().toISOString().slice(0, 10); // Format as 'YYYY-MM-DD'
//     const currentDateTime = `${now.toISOString().slice(0, 10)} ${now.toTimeString().split(' ')[0]}`;

//     // Define the SQL query to get shifts for the current date
//     const query = `
//       SELECT *
//       FROM magodmis.day_shiftregister
//       WHERE ShiftDate = '${currentDate}';
//     `;

//     // Execute the query
//     misQueryMod(query, (err, data) => {
//       if (err) {
//         logger.error(err);
//         return res.status(500).send("Internal Server Error");
//       }

//       if (!data || data.length === 0) {
//         // If no data is found for the current date, return a message
//         return res.send("No shift data available for the current date.");
//       }

//       // Filter data to find entries where the current time is within fromtime and totime
//       const currentShiftData = data.filter((shift) => {
//         const fromTime = shift.FromTime;
//         const toTime = shift.ToTime;

//         // console.log("fromTime is",fromTime);
//         // console.log("toTime  is",toTime);
//         // Check if the current time falls within fromtime and totime range
//         return currentDateTime >= fromTime && currentDateTime <= toTime;
//       });

//       // Send the resulting data or a message if no matching shift is found
//       if (currentShiftData.length > 0) {
//         res.send(currentShiftData);
//       } else {
//         res.send("No current shift matches the time range.");
//       }
//     });
//   } catch (error) {
//     next(error);
//   }
// });

//get Shift Details
// ShiftOperator.post("/getShiftDetails", jsonParser, async (req, res, next) => {
//   try {
//     const { refName, ShiftDate, Shift } = req.body;
//     misQueryMod(
//       `Select *
//         from magodmis.shiftregister where Machine='${req.body.refName}' and ShiftDate='${req.body.ShiftDate}' and (Shift='${Shift}' OR Shift='General' OR Shift='Special')`,
//       (err, data) => {
//         if (err) logger.error(err);
//         // console.log(data)
//         res.send(data);
//       }
//     );
//   } catch (error) {
//     next(error);
//   }
//   // res.send(res)
// });

ShiftOperator.post("/getShiftDetails", jsonParser, async (req, res, next) => {
  try {
    const { refName, ShiftDate, Shift } = req.body;

    // Query to fetch data from the database
    misQueryMod(
      `Select *   
        from magodmis.shiftregister where Machine='${req.body.refName}' and ShiftDate='${req.body.ShiftDate}' and (Shift='${Shift}' OR Shift='General' OR Shift='Special')`,
      (err, data) => {
        if (err) {
          logger.error(err);
          return res.status(500).send({ error: "Database query failed" });
        }

        // Format FromTime and ToTime in the desired format
        const formattedData = data.map((item) => {
          item.FromTime = formatDateTime(item.FromTime); // Format FromTime
          item.ToTime = formatDateTime(item.ToTime); // Format ToTime
          return item;
        });

        // Send the formatted response
        res.send(formattedData);
      }
    );
  } catch (error) {
    next(error);
  }
});

// Function to format date and time in dd/mm/yyyy hh:mm:ss
const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return ""; // Handle undefined or null input

  // Create a Date object from the string
  const date = new Date(dateTimeString);
  if (isNaN(date)) return "Invalid Date"; // Handle invalid date strings

  // Extract day, month, year, hour, minute, and second
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  // Return the formatted string in the desired format
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

ShiftOperator.post("/getProcessDetails", jsonParser, async (req, res, next) => {
  // console.log(req.body);
  try {
    misQueryMod(
      `Select * from  magodmis.ncprograms where Machine='${req.body.refName}'`,
      (err, data) => {
        if (err) logger.error(err);
        //console.log(data)
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }

  // res.send(res)
});

//get ShiftIncharge List
ShiftOperator.get("/getShiftIncharge", async (req, res, next) => {
  try {
    const shiftInchargeNames = [];
    productionQueryMod(
      `SELECT * FROM magod_production.operator_list where Active='1'`,
      (err, data) => {
        if (err) logger.error(err);
        for (let i = 0; i < data.length; i++) {
          shiftInchargeNames[i] = data[i].Name;
        }
        res.send(shiftInchargeNames);
      }
    );
  } catch (error) {
    next(error);
  }
});

//GET Program For Firts Modal
ShiftOperator.post("/getProgram", jsonParser, async (req, res, next) => {
  // console.log("machine required",req.body.MachineName)
  try {
    mchQueryMod(
      `select * from  machine_data.machinestatus where MachineName='${req.body.MachineName}'`,
      (err, data) => {
        if (err) logger.error(err);
        // console.log(data.length)
        res.send(data);
        // console.log("required program data",data)
      }
    );
  } catch (error) {
    next(error);
  }
});

//ProcessTaskStatus
ShiftOperator.post("/ProcessTaskStatus", jsonParser, async (req, res, next) => {
  // console.log('required date is', req.body);
  try {
    mchQueryMod(
      `SELECT sum(timestampdiff(minute, s.FromTime, s.toTime)) as machineTime, n.TaskNo, n.ScheduleID,
      s.Machine, n.Cust_Code, n.Mtrl_Code, n.MTRL, n.Thickness, n.Operation, s1.ShiftDate
      FROM magodmis.shiftlogbook s,magodmis.shiftregister s1,magodmis.nc_task_list n 
      WHERE s1.ShiftDate='${req.body.ShiftDate}' AND s1.ShiftID=s.ShiftID AND  not s.TaskNo like '100'
       AND n.TaskNo=s.TaskNo GROUP BY s.TaskNo, s.Machine`,
      (err, data) => {
        if (err) logger.error(err);
        // console.log(data.length)
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

// //Insert Error
// const transporter = nodemailer.createTransport({
//   host: 'smtp.gmail.com',
//   port: 587,
//   secure: false, // true for 465, false for other ports
//   auth: {
//     user: 'veerannab97@gmail.com',
//     pass: 'csyutorcceoevmdl'
//   }
// });

ShiftOperator.post("/errorForm", jsonParser, async (req, res, next) => {
  // console.log(req.body,"/error form");
  try {
    // Fetch the last row based on the condition
    const selectResult = await mchQueryMod1(`
      SELECT * FROM magodmis.shiftlogbook 
      WHERE Machine='${req.body.formValues.machine}' 
      ORDER BY ShiftLogId DESC 
      LIMIT 1;
    `);

    if (selectResult.length === 0) {
      return res.status(404).send("No matching record found");
    }

    const lastRow = selectResult[0];
    // Update the ToTime of the last row
    await mchQueryMod1(`
      UPDATE magodmis.shiftlogbook 
      SET ToTime=NOW() 
      WHERE ShiftLogId='${lastRow.ShiftLogId}';
    `);

    // Count the number of rows and calculate the next count
    const countResult = await mchQueryMod1(`
      SELECT IFNULL(MAX(Srl), 0) + 1 AS count 
      FROM magodmis.shiftlogbook 
      WHERE ShiftID = '${req.body.selectshifttable.ShiftID}';
    `);
    const count = countResult[0].count;

    // Update machine_data.machinestatus
    await mchQueryMod1(`
      UPDATE machine_data.machinestatus m 
      SET m.NCProgarmNo='${req.body.formValues.errorNo}', 
          m.TaskNo='${req.body.formValues.errorNo}', 
          m.ProgramStartTime=NOW(),
          m.mtrl_Code='',
          m.mtrlid='',
          m.mprocess='${req.body.formValues.errorDescription}',
          m.Operation='${req.body.formValues.errorDescription}',
          m.stopid='${req.body.formValues.errorNo}',
          m.SheetStartTime=NOW(),
          m.ProgMachineTime=0,
          m.SheetMachineTime=0
      WHERE m.MachineName='${req.body.formValues.machine}';
    `);

    // Insert new row into magodmis.shiftlogbook
    const insertResult = await mchQueryMod1(`
      INSERT INTO magodmis.shiftlogbook (ShiftId, Machine, MProcess, TaskNo, Program, Operator, StoppageID, FromTime, ToTime, Srl,Remarks,actiontaken)
      VALUES ('${req.body.selectshifttable.ShiftID}','${req.body.formValues.machine}', '${req.body.formValues.errorDescription}', '${req.body.formValues.errorNo}', '${req.body.formValues.errorNo}', '${req.body.formValues.operator}','${req.body.formValues.errorNo}', NOW(), NOW(), ${count},'${req.body.formValues.errorDescription}','${req.body.formValues.actionTaken}');
    `);

    // Insert into machine_errorlog
    const errorInsertResult = await mchQueryMod1(`
      INSERT INTO magodmis.machine_errorlog(MachineID, ErrorTime, ErrorID, ErrorDiscription, OperatorAction, Operator)
      VALUES ('${req.body.formValues.machine}', now(), '${req.body.formValues.errorNo}', '${req.body.formValues.errorDescription}', '${req.body.formValues.actionTaken}', '${req.body.formValues.operator}');
    `);

    // // Send email
    // const mailOptions = {
    //   from: '"Prakz" <veerannab97@gmail.com>',
    //   to: 'prakruthiholla1999@gmail.com', // Add your recipient emails here
    //   subject: 'Error Report',
    //   text: `Hi,\n\nError No: ${req.body.formValues.errorNo}\nError Description: ${req.body.formValues.errorDescription}\nAction Taken: ${req.body.formValues.actionTaken}`
    // };

    // await transporter.sendMail(mailOptions);

    res.send(insertResult);
  } catch (error) {
    next(error);
  }
});

///SHIFT SUMMARY
ShiftOperator.post("/ShiftSummary", jsonParser, async (req, res, next) => {
  // console.log('required shiftid is', req.body.selectshifttable.ShiftID);
  try {
    mchQueryMod(
      `SELECT n.Operation as Head, SUM(TIMESTAMPDIFF(MINUTE, s.FromTime, s.ToTime)) as TimeinMin
    FROM magodmis.shiftlogbook s, magodmis.ncprograms n
    WHERE s.ShiftID='${req.body.selectshifttable.ShiftID}' AND s.TaskNo NOT LIKE '100' AND n.NCProgramNo = s.Program
    GROUP BY s.ShiftID, n.Operation
    UNION
    SELECT s.StoppageReason as Head, SUM(TIMESTAMPDIFF(MINUTE, s.FromTime, s.ToTime)) as TimeinMin
    FROM magodmis.shiftstoppagelist s, magod_production.stoppagereasonlist s1
    WHERE s.ShiftID='${req.body.selectshifttable.ShiftID}' AND s1.StoppageID = s.StoppageID
    GROUP BY s.StoppageReason`,
      (err, data) => {
        if (err) logger.error(err);
        // console.log(data.length)
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

//Stoppage Reason List
ShiftOperator.get("/stoppageList", jsonParser, async (req, res, next) => {
  try {
    mchQueryMod(
      `SELECT * FROM magod_production.stoppage_category where Active='1'`,
      (err, data) => {
        if (err) logger.error(err);
        // console.log(data.length)
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

ShiftOperator.post(
  "/stoppageReasonList",
  jsonParser,
  async (req, res, next) => {
    // console.log('required stoppageID is', req.body);
    try {
      mchQueryMod(
        `SELECT * FROM magod_production.stoppagereasonlist WHERE StoppageGpId = '${req.body.stoppageID}' and \`Use\`=1`,
        (err, data) => {
          if (err) {
            logger.error(err);
            res.status(500).send("Internal Server Error");
          } else {
            res.send(data);
          }
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

//ADD STOPAGE LIST
ShiftOperator.post("/addStoppage", jsonParser, async (req, res, next) => {
  const updateQuery = `
    UPDATE machine_data.machinestatus
    SET NCProgarmNo = '${req.body.selectedStoppage}',
        TaskNo = '100',
        ProgramStartTime = NOW(),
        mtrl_Code = ' ',
        mtrlid = '',
        mprocess = '',
        stopid = '${req.body.selectedStoppageID}',
        SheetStartTime = NOW(),
        ProgMachineTime = 0,
        SheetMachineTime = 0,
        Operation='Not Defined'
    WHERE MachineName = '${req.body.selectshifttable.Machine}'`;

  try {
    // Update machine_data.machinestatus
    mchQueryMod1(updateQuery);

    // Fetch the last row based on the condition
    const selectResult = await mchQueryMod1(`
      SELECT * FROM magodmis.shiftlogbook 
      WHERE Machine='${req.body.selectshifttable.Machine}' 
      ORDER BY ShiftLogId DESC 
      LIMIT 1;
    `);

    if (selectResult.length === 0) {
      return res.status(404).send("No matching record found");
    }

    const lastRow = selectResult[0];
    // console.log("ShiftLogId is", lastRow.ShiftLogId);

    // Update the ToTime of the last row in magodmis.shiftstoppagelist
    await mchQueryMod1(`
      UPDATE magodmis.shiftlogbook 
      SET ToTime=now() 
      WHERE ShiftLogId='${lastRow.ShiftLogId}';
    `);

    // Continue with the rest of the code for inserting new data

    // Fetch count
    const countResult = await mchQueryMod1(`
  SELECT IFNULL(MAX(Srl), 0) + 1 AS nextCount 
  FROM magodmis.shiftlogbook 
  WHERE ShiftID = '${req.body.selectshifttable.ShiftID}';
`);
    const nextCount = countResult[0].nextCount;

    // Update machine_data.machinestatus
    await mchQueryMod1(`
      UPDATE machine_data.machinestatus m 
      SET m.NCProgarmNo='${req.body.selectedStoppage}', 
          m.TaskNo='100', 
          m.ProgramStartTime=NOW(),
          m.mtrl_Code=' ',
          Operation="Not Defined",
          m.mtrlid='',
          m.mprocess='',
          m.stopid='${req.body.selectedStoppageID}',
          m.SheetStartTime=NOW(),
          m.ProgMachineTime=0,
          m.SheetMachineTime=0,
          Operation='Not Defined'
      WHERE m.MachineName='${req.body.selectshifttable.Machine}';
    `);

    // Insert into shiftlogbook
    const insertLogbookResult = await mchQueryMod1(`
      INSERT INTO magodmis.shiftlogbook (ShiftId, Machine, MProcess, TaskNo, Program, Operator, StoppageID, FromTime, ToTime, Srl)
      VALUES ('${req.body.selectshifttable.ShiftID}', '${req.body.selectshifttable.Machine}', '', '100', '${req.body.selectedStoppage}', '${req.body.selectshifttable.Operator}', '${req.body.selectedStoppageID}', NOW(), NOW(), ${nextCount});
    `);

    // Additional Step: Update magodmis.ncprograms
    await mchQueryMod1(`
      UPDATE magodmis.ncprograms n
      JOIN (
        SELECT n.Ncid, SUM(TIMESTAMPDIFF(MINUTE, s.FromTime, s.ToTime)) AS MachineTime 
        FROM magodmis.ncprograms n
        JOIN magodmis.shiftlogbook s ON n.Machine='laser 11' 
          AND n.PStatus='Cutting' 
          AND s.StoppageID=n.Ncid 
        GROUP BY n.Ncid
      ) AS A  
      ON A.Ncid = n.Ncid
      SET n.ActualTime = A.MachineTime
      WHERE A.ncid = n.Ncid;
    `);

    // Insert into shiftstoppagelist
    const insertStoppageListResult = await mchQueryMod1(`
      INSERT INTO magodmis.shiftstoppagelist (shiftlogid, ShiftID, StoppageID, StoppageReason, StoppageHead, Machine, FromTime, ToTime, Remarks, Locked, Operator)
      VALUES ('${insertLogbookResult.insertId}', '${req.body.selectshifttable.ShiftID}', '${req.body.selectedStoppageID}', '${req.body.selectedStoppage}', '${req.body.selectedStoppageID}', '${req.body.selectshifttable.Machine}', NOW(), NOW(), '', '0', '${req.body.selectshifttable.Operator}')
      ON DUPLICATE KEY UPDATE ToTime = NOW();
    `);
    // All queries executed successfully
    res.send("Successfully added stoppage");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

//ADD stoppage with Task No for Internal Production
ShiftOperator.post("/addStoppageTaskNo", jsonParser, async (req, res, next) => {
  // console.log("req.body", req.body);
  const updateQuery = `
    UPDATE machine_data.machinestatus
    SET NCProgarmNo = '${req.body.selectedStoppage}',
        TaskNo = '${req.body.concatenatedString}',
        ProgramStartTime = NOW(),
        mtrl_Code = ' ',
        mtrlid = '',
        mprocess = '',
        stopid = '${req.body.selectedStoppageID}',
        SheetStartTime = NOW(),
        ProgMachineTime = 0,
        SheetMachineTime = 0
    WHERE MachineName = '${req.body.selectshifttable.Machine}'`;

  try {
    // Update machine_data.machinestatus
    mchQueryMod1(updateQuery);

    // Fetch the last row based on the condition
    const selectResult = await mchQueryMod1(`
      SELECT * FROM magodmis.shiftlogbook 
      WHERE Machine='${req.body.selectshifttable.Machine}' 
      ORDER BY ShiftLogId DESC 
      LIMIT 1;
    `);

    if (selectResult.length === 0) {
      return res.status(404).send("No matching record found");
    }

    const lastRow = selectResult[0];
    // console.log("ShiftLogId is", lastRow.ShiftLogId);

    // Update the ToTime of the last row in magodmis.shiftstoppagelist
    await mchQueryMod1(`
      UPDATE magodmis.shiftlogbook 
      SET ToTime=now() 
      WHERE ShiftLogId='${lastRow.ShiftLogId}';
    `);

    // Continue with the rest of the code for inserting new data

    // Fetch count
    const countResult = await mchQueryMod1(`
  SELECT IFNULL(MAX(Srl), 0) + 1 AS nextCount 
  FROM magodmis.shiftlogbook 
  WHERE ShiftID = '${req.body.selectshifttable.ShiftID}';
`);
    const nextCount = countResult[0].nextCount;

    // Update machine_data.machinestatus
    await mchQueryMod1(`
      UPDATE machine_data.machinestatus m 
      SET m.NCProgarmNo='${req.body.selectedStoppage}', 
          m.TaskNo='${req.body.concatenatedString}', 
          m.ProgramStartTime=NOW(),
          m.mtrl_Code=' ',
          Operation="Not Defined",
          m.mtrlid='',
          m.mprocess='',
          m.stopid='${req.body.selectedStoppageID}',
          m.SheetStartTime=NOW(),
          m.ProgMachineTime=0,
          m.SheetMachineTime=0
      WHERE m.MachineName='${req.body.selectshifttable.Machine}';
    `);

    // Insert into shiftlogbook
    const insertLogbookResult = await mchQueryMod1(`
      INSERT INTO magodmis.shiftlogbook (ShiftId, Machine, MProcess, TaskNo, Program, Operator, StoppageID, FromTime, ToTime, Srl)
      VALUES ('${req.body.selectshifttable.ShiftID}', '${req.body.selectshifttable.Machine}', '', '${req.body.concatenatedString}', '${req.body.selectedStoppage}', '${req.body.selectshifttable.Operator}', '${req.body.selectedStoppageID}', NOW(), NOW(), ${nextCount});
    `);

    // Additional Step: Update magodmis.ncprograms
    await mchQueryMod1(`
      UPDATE magodmis.ncprograms n
      JOIN (
        SELECT n.Ncid, SUM(TIMESTAMPDIFF(MINUTE, s.FromTime, s.ToTime)) AS MachineTime 
        FROM magodmis.ncprograms n
        JOIN magodmis.shiftlogbook s ON n.Machine='laser 11' 
          AND n.PStatus='Cutting' 
          AND s.StoppageID=n.Ncid 
        GROUP BY n.Ncid
      ) AS A  
      ON A.Ncid = n.Ncid
      SET n.ActualTime = A.MachineTime
      WHERE A.ncid = n.Ncid;
    `);

    // Insert into shiftstoppagelist
    const insertStoppageListResult = await mchQueryMod1(`
      INSERT INTO magodmis.shiftstoppagelist (shiftlogid, ShiftID, StoppageID, StoppageReason, StoppageHead, Machine, FromTime, ToTime, Remarks, Locked, Operator)
      VALUES ('${insertLogbookResult.insertId}', '${req.body.selectshifttable.ShiftID}', '${req.body.selectedStoppageID}', '${req.body.selectedStoppage}', '${req.body.selectedStoppageID}', '${req.body.selectshifttable.Machine}', NOW(), NOW(), '', '0', '${req.body.selectshifttable.Operator}')
      ON DUPLICATE KEY UPDATE ToTime = NOW();
    `);
    // All queries executed successfully
    res.send("Successfully added stoppage");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

//GET SHIFT DETAILS
ShiftOperator.post("/getShiftLog", jsonParser, async (req, res, next) => {
  // console.log('required ShiftId is ',req.body.selectshifttable.ShiftID);
  try {
    mchQueryMod(
      `SELECT  s.*,(TIMESTAMPDIFF(MINUTE,s.FromTime,s.ToTime)) as SrlTime FROM magodmis.shiftlogbook s WHERE s.ShiftID='${req.body.selectshifttable.ShiftID}' and Machine='${req.body.selectshifttable.Machine}'`,
      (err, data) => {
        if (err) {
          logger.error(err);
          // res.status(500).send('Internal Server Error');
          console.log(error);
        } else {
          res.send(data);
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

///get Machine Tasks Table Data
ShiftOperator.post("/MachineTasksData", jsonParser, async (req, res, next) => {
  // console.log('MachineTasksData', req.body);
  try {
    mchQueryMod(
      `SELECT n.*, c.cust_name FROM magodmis.ncprograms n,magodmis.prioritytable p,magodmis.cust_data c 
    WHERE n.Machine ='${req.body.MachineName}' AND (n.PStatus='Cutting' or n.PStatus='Processing')
    AND p.Priority=n.Priority And n.cust_code= c.cust_code 
    ORDER BY p.Seniority`,
      (err, data) => {
        if (err) {
          logger.error(err);
          // res.status(500).send('Internal Server Error');
          console.log(error);
        } else {
          res.send(data);
          // console.log("result is",data);
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

///DownTable Data Profile
ShiftOperator.post(
  "/MachineTasksProfile",
  jsonParser,
  async (req, res, next) => {
    // console.log('MachineTasksProfile', req.body);
    try {
      mchQueryMod(
        `Select * From magodmis.ncprogrammtrlallotmentlist n WHERE n.NCId='${req.body.NCId}' ORDER BY n.ncpgmmtrlid`,
        (err, data) => {
          if (err) {
            logger.error(err);
            // res.status(500).send('Internal Server Error');
            console.log(error);
          } else {
            res.send(data);
          }
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

//MachineTask DownTableData Service
// ShiftOperator.post(
//   "/MachineTasksService",
//   jsonParser,
//   async (req, res, next) => {
//     // Step 1: Execute the first query
//     const firstQuery = `
//     SELECT *
//     FROM magodmis.shopfloor_part_issueregister
//     WHERE magodmis.shopfloor_part_issueregister.NcId = '${req.body.NCId}' AND  magodmis.shopfloor_part_issueregister.Status = 'Created';
//   `;

//     try {
//       mchQueryMod(firstQuery, async (err, firstQueryResult) => {
//         if (err) {
//           console.error("Error in first query:", err);
//           res.status(500).send("Internal Server Error");
//         } else {
//           if (
//             firstQueryResult &&
//             firstQueryResult.length > 0 &&
//             firstQueryResult[0].IssueID
//           ) {
//             // Extract IssueID from the first query result
//             const issueId = firstQueryResult[0].IssueID;

//             // Step 2: Execute the third query using the extracted IssueID directly
//             const thirdQuery = `
//             SELECT s.*, m.Customer, m.RV_No, m.RV_Date, m1.PartId, m1.CustBOM_Id
//             FROM magodmis.shopfloor_bom_issuedetails s
//             JOIN magodmis.material_receipt_register m ON m.RvID = s.RV_Id
//             JOIN magodmis.mtrl_part_receipt_details m1 ON m1.Id = s.PartReceipt_DetailsID
//             WHERE s.IV_ID = '${issueId}';
//           `;

//             try {
//               mchQueryMod(thirdQuery, async (err, thirdQueryResult) => {
//                 if (err) {
//                   console.error("Error in third query:", err);
//                   res.status(500).send("Internal Server Error");
//                 } else {
//                   res.send(thirdQueryResult);
//                 }
//               });
//             } catch (error) {
//               console.error("Error in third query:", error);
//               next(error);
//             }
//           } else {
//             // Handle the case where IssueID is not found in the first query result
//             res.status(404).send("IssueID not found in the first query result");
//           }
//         }
//       });
//     } catch (error) {
//       console.error("Error outside callback:", error);
//       next(error);
//     }
//   }
// );

ShiftOperator.post(
  "/MachineTasksService",
  jsonParser,
  async (req, res, next) => {
    const combinedQuery = `
      SELECT 
        s.*, 
        m.Customer, 
        m.RV_No, 
        m.RV_Date, 
        m1.PartId, 
        m1.CustBOM_Id
      FROM magodmis.shopfloor_part_issueregister r
      JOIN magodmis.shopfloor_bom_issuedetails s ON r.IssueID = s.IV_ID
      JOIN magodmis.material_receipt_register m ON m.RvID = s.RV_Id
      JOIN magodmis.mtrl_part_receipt_details m1 ON m1.Id = s.PartReceipt_DetailsID
      WHERE r.NcId = '${req.body.NCId}' 
        AND r.Status = 'Created';
    `;

    try {
      mchQueryMod(combinedQuery, (err, result) => {
        if (err) {
          console.error("Error in query:", err);
          res.status(500).send("Internal Server Error");
        } else if (!result || result.length === 0) {
          res.status(404).send("Data not found");
        } else {
          res.send(result);
          // console.log(result); 
        }
      });
    } catch (error) {
      console.error("Error in processing request:", error);
      next(error);
    }
  }
);

//MARK AS USED PROGRAM MATERIAL
ShiftOperator.post(
  "/markAsUsedProgramMaterial",
  jsonParser,
  async (req, res, next) => {
    try {
      const { selectedMtrlTable, selectedMachine, formdata } = req.body;

      // Determine if the operation contains "Tube Cutting"
      const isTubeCutting = formdata.Operation.toLowerCase().includes(
        "tube cutting".toLowerCase()
      );

      // Iterate over each row in selectedMtrlTable
      for (const row of selectedMtrlTable) {
        // First Query
        const updateQuery1 = `
          UPDATE magodmis.ncprogrammtrlallotmentlist n
          SET n.Used = true
          WHERE n.NcPgmMtrlId = '${row.NcPgmMtrlId}';
        `;

        // Second Query (Moved inside the loop)
        const updateQuery2 = `
          UPDATE magodmis.ncprograms
          SET Qtycut = Qtycut + 1
          WHERE Ncid = ${row.NcID};
        `;

        // Execute the first two queries in a loop for each row
        for (const updateQuery of [updateQuery1, updateQuery2]) {
          await executeQuery(updateQuery);
        }

        // Third Query
        const updateQuery3 = `
          UPDATE magodmis.shiftlogbook s
          SET s.QtyProcessed = s.QtyProcessed + 1
          WHERE s.ShiftLogId = (
            SELECT ShiftLogId FROM (
              SELECT ShiftLogId
              FROM magodmis.shiftlogbook
              WHERE Machine='${selectedMachine}'
              ORDER BY ShiftLogId DESC
              LIMIT 1
            ) AS subquery
          );
        `;

        // Execute the third query for each row
        await executeQuery(updateQuery3);

        // Fourth Query (New Query) - Execute only if not Tube Cutting
        if (!isTubeCutting) {
          const updateQuery4 = `
            UPDATE magodmis.ncprogram_partslist n, magodmis.ncprograms n1
            SET n.QtyCut = n1.qtycut * n.QtyNested
            WHERE n.Ncid = n1.Ncid AND n1.NCId = ${row.NcID};
          `;
          // Execute the fourth query for each row
          await executeQuery(updateQuery4);
        }
      }
      res.send("All queries executed successfully.");
    } catch (error) {
      logger.error(error);
      console.log(error); // Log the error
      res.status(500).send("Internal Server Error");
    }
  }
);

//MARK AS REJECTED PROGRAM MATERIAL
ShiftOperator.post(
  "/markAsRejectedProgramMaterial",
  jsonParser,
  async (req, res, next) => {
    try {
      const { RejectedReason, selectedMtrlTable } = req.body;

      // Iterate over each row in selectedMtrlTable
      for (const row of selectedMtrlTable) {
        const { ShapeMtrlID, NcPgmMtrlId } = row;

        // Check if the ShapeMtrlID exists in RejectedReason
        if (RejectedReason) {
          const updateQuery = `
          UPDATE magodmis.ncprogrammtrlallotmentlist n
          SET n.Rejected = 1, n.RejectionReason = '${RejectedReason}'
          WHERE n.NcPgmMtrlId = '${NcPgmMtrlId}';
        `;

          // Execute the query for each row
          await executeQuery(updateQuery);
        }
      }

      res.send("All queries executed successfully.");
    } catch (error) {
      logger.error(error);
      console.log(error); // Log the error
      res.status(500).send("Internal Server Error");
    }
  }
);

//LoadMaterial Profile
ShiftOperator.post("/loadMaterial", jsonParser, async (req, res, next) => {
  try {
    // Update machine_data.machinestatus
    mchQueryMod1(`
      UPDATE machine_data.machinestatus m
      SET m.MtrlId='${req.body.selectedMtrlTable[0].ShapeMtrlID}', m.SheetStartTime=NOW()
      WHERE m.MachineName='${req.body.MachineName}';
    `);

    // Additional Step: Update magodmis.ncprograms
    const updateNcProgramsQuery = `
      UPDATE magodmis.ncprograms n
      JOIN (
        SELECT n.Ncid, SUM(TIMESTAMPDIFF(MINUTE, s.FromTime, s.ToTime)) AS MachineTime 
        FROM magodmis.ncprograms n
        JOIN magodmis.shiftlogbook s ON n.Machine='laser 11' 
          AND n.PStatus='Cutting' 
          AND s.StoppageID=n.Ncid 
        GROUP BY n.Ncid
      ) AS A  
      ON A.Ncid = n.Ncid
      SET n.ActualTime = A.MachineTime
      WHERE A.ncid = n.Ncid;`;

    mchQueryMod1(updateNcProgramsQuery);

    res.send("Successfully updated material and program details");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

//load program
ShiftOperator.post("/loadProgram", jsonParser, async (req, res, next) => {
  // console.log("req.body loadProgram", req.body);
  try {
    // Fetch the last row based on the condition
    const selectResult = await mchQueryMod1(`
      SELECT * FROM magodmis.shiftlogbook 
      WHERE Machine='${req.body.selectshifttable.Machine}' 
      ORDER BY ShiftLogId DESC 
      LIMIT 1;
    `);

    if (selectResult.length === 0) {
      return res.status(404).send("No matching record found");
    }

    const lastRow = selectResult[0];
    // console.log("ShiftLogId is", lastRow.ShiftLogId);

    // Update the ToTime of the last row
    await mchQueryMod1(`
      UPDATE magodmis.shiftlogbook 
      SET ToTime=NOW() 
      WHERE ShiftLogId='${lastRow.ShiftLogId}';
    `);

    // Continue with the rest of the code for inserting new data

    // Fetch count
    const countResult = await mchQueryMod1(`
  SELECT IFNULL(MAX(Srl), 0) + 1 AS count 
  FROM magodmis.shiftlogbook 
  WHERE ShiftID = '${req.body.selectshifttable.ShiftID}';
`);
    const count = countResult[0].count;

    // Update machine_data.machinestatus
    await mchQueryMod1(`
      UPDATE machine_data.machinestatus m 
      SET m.NCProgarmNo='${req.body.selectedProgram.NCProgramNo}', 
          m.TaskNo='${req.body.selectedProgram.TaskNo}', 
          m.ProgramStartTime=NOW(),
          m.mtrl_Code='${req.body.selectedProgram.Mtrl_Code}',
          m.mtrlid='',
          m.mprocess='${req.body.selectedProgram.MProcess}',
          m.Operation='${req.body.selectedProgram.Operation}',
          m.stopid='${req.body.selectedProgram.Ncid}',
          m.SheetStartTime=NOW(),
          m.ProgMachineTime=0,
          m.SheetMachineTime=0
      WHERE m.MachineName='${req.body.selectedProgram.Machine}';
    `);

    // Insert into shiftlogbook
    const insertResult = await mchQueryMod1(`
      INSERT INTO magodmis.shiftlogbook (ShiftId, Machine, MProcess, TaskNo, Program, Operator, StoppageID, FromTime, ToTime, Srl)
      VALUES ('${req.body.selectshifttable.ShiftID}', '${
      req.body.selectshifttable.Machine
    }', '${req.body.selectedProgram.MProcess}', '${
      req.body.selectedProgram.TaskNo
    }', '${req.body.selectedProgram.NCProgramNo}', '${
      req.body.selectshifttable.Operator
    }', '${req.body.selectedProgram.Ncid}', NOW(), NOW(), ${count + 1});
    `);

    // Additional Step: Update magodmis.ncprograms
    await mchQueryMod1(`
      UPDATE magodmis.ncprograms n
      JOIN (
        SELECT n.Ncid, SUM(TIMESTAMPDIFF(MINUTE, s.FromTime, s.ToTime)) AS MachineTime 
        FROM magodmis.ncprograms n
        JOIN magodmis.shiftlogbook s ON n.Machine='laser 11' 
          AND n.PStatus='Cutting' 
          AND s.StoppageID=n.Ncid 
        GROUP BY n.Ncid
      ) AS A  
      ON A.Ncid = n.Ncid
      SET n.ActualTime = A.MachineTime
      WHERE A.ncid = n.Ncid;
    `);

    // Send the response
    res.send(insertResult);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

///Used Production Report
ShiftOperator.post(
  "/markAsUsedProductionReport",
  jsonParser,
  async (req, res, next) => {
    try {
      // Start a database transaction
      await executeQuery("START TRANSACTION");
      const { selectdefaultRow, selectedMachine, selectProductionReport } =
        req.body;

      // Check if 'Operation' contains 'Tube Cutting'
      const isTubeCutting =
        selectProductionReport.Operation?.toLowerCase().includes(
          "tube cutting"
        );

      // Ensure selectdefaultRow is an array
      if (!Array.isArray(selectdefaultRow) || selectdefaultRow.length === 0) {
        throw new Error("selectdefaultRow is empty or not an array.");
      }

      for (const selectedRow of selectdefaultRow) {
        const { NcPgmMtrlId, NcID } = selectedRow;

        // Check if essential values are defined
        if (!NcPgmMtrlId || !NcID) {
          throw new Error(
            `Missing NcPgmMtrlId or NcID in row: ${JSON.stringify(selectedRow)}`
          );
        }

        // First Query
        const updateQuery1 = `
          UPDATE magodmis.ncprogrammtrlallotmentlist n
          SET n.Used = true
          WHERE n.NcPgmMtrlId = '${NcPgmMtrlId}';
        `;
        console.log("Executing Query 1:", updateQuery1);
        await executeQuery(updateQuery1);

        // Second Query
        const updateQuery2 = `
          UPDATE magodmis.ncprograms
          SET Qtycut = Qtycut + 1
          WHERE Ncid = ${NcID};
        `;
        console.log("Executing Query 2:", updateQuery2);
        await executeQuery(updateQuery2);

        // Additional Query for non-Tube Cutting
        if (!isTubeCutting) {
          const updateQueryAdditional = `
            UPDATE magodmis.ncprogram_partslist n, magodmis.ncprograms n1
            SET n.QtyCut = n1.qtycut * n.QtyNested
            WHERE n.Ncid = n1.Ncid AND n1.NCId = ${NcID};
          `;
          console.log("Executing Additional Query:", updateQueryAdditional);
          await executeQuery(updateQueryAdditional);
        }
      }

      // Commit the transaction if all queries succeed
      await executeQuery("COMMIT");
      res.send("All queries executed successfully.");
    } catch (error) {
      // Rollback the transaction if there's an error
      await executeQuery("ROLLBACK");

      console.error("Error executing queries:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

// ////Reject Production Report
ShiftOperator.post(
  "/markAsRejectedProductionReport",
  jsonParser,
  async (req, res, next) => {
    try {
      const { RejectedReason, selectdefaultRow } = req.body;

      // Start a database transaction
      await executeQuery("START TRANSACTION");

      if (Array.isArray(selectdefaultRow)) {
        for (const selectedRow of selectdefaultRow) {
          const { NcPgmMtrlId } = selectedRow;

          // Check if the NcPgmMtrlId exists in RejectedReason
          if (RejectedReason) {
            const updateQuery = `
            UPDATE magodmis.ncprogrammtrlallotmentlist n
            SET n.Rejected = 1, n.RejectionReason = '${RejectedReason}'
            WHERE n.NcPgmMtrlId = '${NcPgmMtrlId}';
          `;

            // Execute the query for each row
            await executeQuery(updateQuery);
          }
        }
      }

      // Commit the transaction if all queries succeed
      await executeQuery("COMMIT");

      res.send("All queries executed successfully.");
    } catch (error) {
      // Rollback the transaction if there's an error
      await executeQuery("ROLLBACK");

      logger.error(error);
      console.log(error); // Log the error
      res.status(500).send("Internal Server Error");
    }
  }
);

// Function to execute a SQL query and return a Promise
function executeQuery(query) {
  return new Promise((resolve, reject) => {
    mchQueryMod(query, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

//Production Reports Parts Details
ShiftOperator.post("/getpartDetails", jsonParser, async (req, res, next) => {
  // console.log("req.body",req.body);

  try {
    mchQueryMod(
      `SELECT n1.nc_pgme_part_id, n1.DwgName, n1.QtyNested, n1.Sheets, n1.TotQtyNested, 
    n1.QtyCut, n1.QtyRejected, n1.Remarks, n1.NcProgramNo
    FROM magodmis.ncprogram_partslist n1,magodmis.ncprograms n 
    WHERE  n.NcId=n1.NcId AND n.NcId='${req.body.selectProductionReport.Ncid}';
    `,
      (err, data) => {
        if (err) {
          logger.error(err);
          // res.status(500).send('Internal Server Error');
          console.log(error);
        } else {
          res.send(data);
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

//Proram Parts(MiddleSection)
ShiftOperator.post("/getprogramParts", jsonParser, async (req, res, next) => {
  // console.log('MachineTasksProfile', req.body);
  try {
    mchQueryMod(
      `SELECT * FROM magodmis.ncprogram_partslist n WHERE n.NCId='${req.body.NcId}';
    `,
      (err, data) => {
        if (err) {
          logger.error(err);
          // res.status(500).send('Internal Server Error');
          console.log(error);
        } else {
          res.send(data);
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

////Proram Parts(MiddleSection)
ShiftOperator.post("/SaveprogramParts", jsonParser, async (req, res, next) => {
  try {
    const programPartsData = req.body.programPartsData;
    const responses = [];

    for (const part of programPartsData) {
      const { NC_Pgme_Part_ID, QtyRejected, Remarks, processnow, QtyCut } =
        part;

      // Skip execution if processnow is 0 or undefined
      if (!processnow || processnow === 0) {
        // console.log(`Skipping NC_Pgme_Part_ID: ${NC_Pgme_Part_ID} as processnow is 0 or undefined`);
        continue;
      }

      // Build and log the query if processnow is valid
      const query = `
        UPDATE magodmis.ncprogram_partslist
        SET QtyRejected = '${QtyRejected}', Remarks = '${Remarks}', QtyCut = '${QtyCut}'
        WHERE NC_Pgme_part_Id = '${NC_Pgme_Part_ID}';
      `;

      // Execute the query
      mchQueryMod(query, (err, data) => {
        if (err) {
          logger.error(err);
          responses.push({ error: err });
        } else {
          responses.push({ success: data });
        }

        // Check if all queries have been handled
        if (
          responses.length ===
          programPartsData.filter((p) => p.processnow && p.processnow !== 0)
            .length
        ) {
          res.send(responses);
        }
      });
    }
  } catch (error) {
    next(error);
  }
});

//Program  Reports Part Details Save Button
ShiftOperator.post(
  "/SaveprogramDetails",
  jsonParser,
  async (req, res, next) => {
    // console.log("SaveprogramDetails is",req.body);
    try {
      const partDetailsData = req.body.partDetailsData;

      // Iterate over each element in partDetailsData
      for (const part of partDetailsData) {
        const NC_Pgme_part_ID = part.nc_pgme_part_id;
        const QtyRejected = part.QtyRejected;
        const Remarks = part.Remarks;

        // Update Magodmis.Ncprogram_partslist for each element
        await mchQueryMod1(`
        UPDATE Magodmis.Ncprogram_partslist
        SET QtyRejected = '${QtyRejected}',
            Remarks='${Remarks}'
        WHERE NC_Pgme_part_Id='${NC_Pgme_part_ID}';
      `);
      }

      // Additional Step: Update magodmis.ncprograms
      const updateNcProgramsQuery = `
      UPDATE magodmis.ncprograms n
      JOIN (
        SELECT n.Ncid, SUM(TIMESTAMPDIFF(MINUTE, s.FromTime, s.ToTime)) AS MachineTime 
        FROM magodmis.ncprograms n
        JOIN magodmis.shiftlogbook s ON n.Machine='laser 11' 
          AND n.PStatus='Cutting' 
          AND s.StoppageID=n.Ncid 
        GROUP BY n.Ncid
      ) AS A  
      ON A.Ncid = n.Ncid
      SET n.ActualTime = A.MachineTime
      WHERE A.ncid = n.Ncid;`;

      // Execute the updateNcProgramsQuery
      await mchQueryMod1(updateNcProgramsQuery);

      res.send("Successfully updated program details");
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

/////Mark as Completed
ShiftOperator.post("/programCompleted", jsonParser, async (req, res, next) => {
  // console.log('update completed', req.body.selectProductionReport);
  try {
    mchQueryMod(
      `Update magodmis.ncprograms Set  PStatus='Completed'
    Where  NCId='${req.body.selectProductionReport.Ncid}'`,
      (err, data) => {
        if (err) {
          logger.error(err);
          // res.status(500).send('Internal Server Error');
          console.log(error);
        } else {
          res.send(data);
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

ShiftOperator.post("/onClickYes", jsonParser, async (req, res, next) => {
  // console.log("req.body.selectshifttable is",req.body.selectshifttable);
  try {
    // New mchQueryMod block to perform SELECT operation
    mchQueryMod(
      `
      SELECT * FROM magodmis.shiftlogbook 
      WHERE Machine='${req.body.selectshifttable.Machine}' 
      ORDER BY ShiftLogId DESC 
      LIMIT 1;
    `,
      (selectErr, selectResult) => {
        if (selectErr) {
          logger.error(selectErr);
          return res.status(500).send("Internal Server Error");
        }

        if (selectResult.length === 0) {
          return res.status(404).send("No matching record found");
        }

        const lastRow = selectResult[0];
        // console.log("ShiftLogId is", lastRow.ShiftLogId);

        // Update the ToTime of the last row in magodmis.shiftlogbook
        mchQueryMod(
          `
        UPDATE magodmis.shiftlogbook 
        SET ToTime='${req.body.selectshifttable.FromTime}'
        WHERE ShiftLogId='${lastRow.ShiftLogId}';
      `,
          (updateToTimeErr, updateToTimeResult) => {
            if (updateToTimeErr) {
              logger.error(updateToTimeErr);
              return res.status(500).send("Internal Server Error");
            }

            // Continue with the existing mchQueryMod block for INSERT operation
            mchQueryMod(
              `SELECT COUNT(*) FROM magodmis.shiftlogbook WHERE ShiftID='${req.body.selectshifttable.ShiftID}'`,
              (err, countResult) => {
                if (err) {
                  logger.error(err);
                  res.status(500).send("Internal Server Error");
                } else {
                  const count = countResult[0]["COUNT(*)"];

                  mchQueryMod(
                    `INSERT INTO magodmis.shiftlogbook (ShiftID, Machine, MProcess, TaskNo, Program, Operator, StoppageID, FromTime, ToTime, Srl) VALUES ('${
                      req.body.selectshifttable.ShiftID
                    }', '${req.body.selectshifttable.Machine}', '${
                      req.body.requiredProgram[0].MProcess
                    }', '${req.body.requiredProgram[0].TaskNo}', '${
                      req.body.requiredProgram[0].NCProgarmNo
                    }', '${req.body.selectshifttable.Operator}', '${
                      req.body.requiredProgram[0].StopID
                    }','${req.body.selectshifttable.FromTime}', now(), ${
                      count + 1
                    })`,
                    (insertErr, data) => {
                      if (insertErr) {
                        logger.error(insertErr);
                        res.status(500).send("Internal Server Error");
                      } else {
                        // Now, perform the update operation
                        mchQueryMod(
                          `UPDATE machine_data.machinestatus SET Operator='${req.body.selectshifttable.Operator}', ShiftStartTime='${req.body.selectshifttable.FromTime}', ShiftFinishTime='${req.body.selectshifttable.ToTime}',ShiftID='${req.body.selectshifttable.ShiftID}' WHERE MachineName='${req.body.selectshifttable.Machine}'`,
                          (updateErr, updateData) => {
                            if (updateErr) {
                              logger.error(updateErr);
                              res.status(500).send("Internal Server Error");
                            } else {
                              res.send({ insertData: data, updateData });
                            }
                          }
                        );
                      }
                    }
                  );
                }
              }
            );
          }
        );
      }
    );
  } catch (error) {
    next(error);
  }
});

//for Stoppage
ShiftOperator.post(
  "/onClickYesStoppage",
  jsonParser,
  async (req, res, next) => {
    try {
      mchQueryMod(
        `
          SELECT * FROM magodmis.shiftlogbook 
          WHERE Machine='${req.body.selectshifttable.Machine}' 
          ORDER BY ShiftLogId DESC 
          LIMIT 1;
          `,
        (selectErr, selectResult) => {
          if (selectErr) {
            logger.error(selectErr);
            return res.status(500).send("Internal Server Error");
          }

          if (selectResult.length === 0) {
            return res.status(404).send("No matching record found");
          }

          const lastRow = selectResult[0];
          // console.log("ShiftLogId is", lastRow.ShiftLogId);

          // Update the ToTime of the last row in magodmis.shiftlogbook
          mchQueryMod(
            `
                  UPDATE magodmis.shiftlogbook 
                  SET ToTime='${req.body.selectshifttable.FromTime}' 
                  WHERE ShiftLogId='${lastRow.ShiftLogId}';
                  `,
            (updateToTimeErr, updateToTimeResult) => {
              if (updateToTimeErr) {
                logger.error(updateToTimeErr);
                return res.status(500).send("Internal Server Error");
              }

              // Continue with the existing mchQueryMod block for INSERT operation
              mchQueryMod(
                `SELECT COUNT(*) FROM magodmis.shiftlogbook WHERE ShiftID='${req.body.selectshifttable.ShiftID}'`,
                (err, countResult) => {
                  if (err) {
                    logger.error(err);
                    res.status(500).send("Internal Server Error");
                  } else {
                    const count = countResult[0]["COUNT(*)"];

                    mchQueryMod(
                      `INSERT INTO magodmis.shiftlogbook (ShiftID, Machine, MProcess, TaskNo, Program, Operator, StoppageID, FromTime, ToTime, Srl) VALUES ('${
                        req.body.selectshifttable.ShiftID
                      }', '${req.body.selectshifttable.Machine}', '${
                        req.body.requiredProgram[0].MProcess
                      }', '${req.body.requiredProgram[0].TaskNo}', '${
                        req.body.requiredProgram[0].NCProgarmNo
                      }', '${req.body.selectshifttable.Operator}', '${
                        req.body.requiredProgram[0].StopID
                      }','${req.body.selectshifttable.FromTime}', now(), ${
                        count + 1
                      })`,
                      (insertErr, data) => {
                        if (insertErr) {
                          logger.error(insertErr);
                          res.status(500).send("Internal Server Error");
                        } else {
                          // Now, perform the update operation
                          mchQueryMod(
                            `UPDATE machine_data.machinestatus SET Operator='${req.body.selectshifttable.Operator}', ShiftStartTime='${req.body.selectshifttable.FromTime}', ShiftFinishTime='${req.body.selectshifttable.ToTime}',ShiftID='${req.body.selectshifttable.ShiftID}' WHERE MachineName='${req.body.selectshifttable.Machine}'`,
                            (updateErr, updateData) => {
                              if (updateErr) {
                                logger.error(updateErr);
                                res.status(500).send("Internal Server Error");
                              } else {
                                // Continue with the insertion operation for shiftstoppagelist
                                mchQueryMod(
                                  `INSERT INTO magodmis.shiftstoppagelist (ShiftID,Operator,Srl, StoppageID, StoppageReason, StoppageHead, Machine, FromTime, ToTime, Remarks, Locked,ShiftLogId) VALUES('${req.body.selectshifttable.ShiftID}', '${req.body.selectshifttable.Operator}', '0', '${lastRow.StoppageID}', '${req.body.requiredProgram[0].NCProgarmNo}','${lastRow.StoppageID}', '${req.body.selectshifttable.Machine}', '${req.body.selectshifttable.FromTime}', NOW(), '', '0', '${req.body.selectshifttable.ShiftID}')`,
                                  (stoppageInsertErr, stoppageData) => {
                                    if (stoppageInsertErr) {
                                      logger.error(stoppageInsertErr);
                                      res
                                        .status(500)
                                        .send("Internal Server Error");
                                    } else {
                                      res.send({
                                        insertData: data,
                                        updateData,
                                      });
                                    }
                                  }
                                );
                              }
                            }
                          );
                        }
                      }
                    );
                  }
                }
              );
            }
          );
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

ShiftOperator.post("/onClickNo", jsonParser, async (req, res, next) => {
  // console.log("req.body.selectshifttable is",req.body.selectshifttable);
  try {
    // New mchQueryMod block to select the last row and update ToTime
    mchQueryMod(
      `
      SELECT * FROM magodmis.shiftlogbook 
      WHERE Machine='${req.body.selectshifttable.Machine}' 
      ORDER BY ShiftLogId DESC 
      LIMIT 1;
    `,
      (selectErr, selectResult) => {
        if (selectErr) {
          logger.error(selectErr);
          return res.status(500).send("Internal Server Error");
        }

        if (selectResult.length === 0) {
          return res.status(404).send("No matching record found");
        }

        const lastRow = selectResult[0];
        // console.log("ShiftLogId is", lastRow.ShiftLogId);

        // Update the ToTime of the last row in magodmis.shiftlogbook
        mchQueryMod(
          `
        UPDATE magodmis.shiftlogbook 
        SET ToTime='${req.body.selectshifttable.FromTime}'
        WHERE ShiftLogId='${lastRow.ShiftLogId}';
      `,
          (updateToTimeErr, updateToTimeResult) => {
            if (updateToTimeErr) {
              logger.error(updateToTimeErr);
              // Handle the error if necessary
              return res.status(500).send("Internal Server Error");
            }

            // Continue with the existing code (INSERT and UPDATE operations)
            mchQueryMod(
              `SELECT COUNT(*) FROM magodmis.shiftlogbook WHERE ShiftID='${req.body.selectshifttable.ShiftID}'`,
              (err, countResult) => {
                if (err) {
                  logger.error(err);
                  res.status(500).send("Internal Server Error");
                } else {
                  const count = countResult[0]["COUNT(*)"];

                  mchQueryMod(
                    `INSERT INTO magodmis.shiftlogbook (ShiftID, Machine, MProcess, TaskNo, Program, Operator, StoppageID, FromTime, ToTime, Srl) VALUES ('${
                      req.body.selectshifttable.ShiftID
                    }', '${req.body.selectshifttable.Machine}', '${
                      req.body.requiredProgram[0].MProcess
                    }', '${req.body.requiredProgram[0].TaskNo}', '${
                      req.body.requiredProgram[0].NCProgarmNo
                    }', '${req.body.selectshifttable.Operator}', '${
                      req.body.requiredProgram[0].StopID
                    }',now(), now(), ${count + 1})`,
                    (insertErr, data) => {
                      if (insertErr) {
                        logger.error(insertErr);
                        res.status(500).send("Internal Server Error");
                      } else {
                        // Now, perform the update operation
                        mchQueryMod(
                          `UPDATE machine_data.machinestatus SET Operator='${req.body.selectshifttable.Operator}', ShiftStartTime='${req.body.selectshifttable.FromTime}', ShiftFinishTime='${req.body.selectshifttable.ToTime}',ShiftID='${req.body.selectshifttable.ShiftID}' WHERE MachineName='${req.body.selectshifttable.Machine}'`,
                          (updateErr, updateData) => {
                            if (updateErr) {
                              logger.error(updateErr);
                              res.status(500).send("Internal Server Error");
                            } else {
                              res.send({ insertData: data, updateData });
                            }
                          }
                        );
                      }
                    }
                  );
                }
              }
            );
          }
        );
      }
    );
  } catch (error) {
    next(error);
  }
});

//No with Stoppage
ShiftOperator.post("/onClickNoStoppage", jsonParser, async (req, res, next) => {
  try {
    // Select the last row and update ToTime in magodmis.shiftlogbook
    mchQueryMod(
      `
          SELECT * FROM magodmis.shiftlogbook 
          WHERE Machine='${req.body.selectshifttable.Machine}' 
          ORDER BY ShiftLogId DESC 
          LIMIT 1;
          `,
      (selectErr, selectResult) => {
        if (selectErr) {
          logger.error(selectErr);
          return res.status(500).send("Internal Server Error");
        }

        if (selectResult.length === 0) {
          return res.status(404).send("No matching record found");
        }

        const lastRow = selectResult[0];

        // Update the ToTime of the last row in magodmis.shiftlogbook
        mchQueryMod(
          `
                  UPDATE magodmis.shiftlogbook 
                  SET ToTime='${req.body.selectshifttable.FromTime}'
                  WHERE ShiftLogId='${lastRow.ShiftLogId}';
                  `,
          (updateToTimeErr, updateToTimeResult) => {
            if (updateToTimeErr) {
              logger.error(updateToTimeErr);
              return res.status(500).send("Internal Server Error");
            }

            // Continue with the existing code (INSERT and UPDATE operations)
            mchQueryMod(
              `SELECT COUNT(*) FROM magodmis.shiftlogbook WHERE ShiftID='${req.body.selectshifttable.ShiftID}'`,
              (err, countResult) => {
                if (err) {
                  logger.error(err);
                  res.status(500).send("Internal Server Error");
                } else {
                  const count = countResult[0]["COUNT(*)"];

                  mchQueryMod(
                    `INSERT INTO magodmis.shiftlogbook (ShiftID, Machine, MProcess, TaskNo, Program, Operator, StoppageID, FromTime, ToTime, Srl) VALUES ('${
                      req.body.selectshifttable.ShiftID
                    }', '${req.body.selectshifttable.Machine}', '${
                      req.body.requiredProgram[0].MProcess
                    }', '${req.body.requiredProgram[0].TaskNo}', '${
                      req.body.requiredProgram[0].NCProgarmNo
                    }', '${req.body.selectshifttable.Operator}', '${
                      req.body.requiredProgram[0].StopID
                    }', now(), now(), ${count + 1})`,
                    (insertErr, data) => {
                      if (insertErr) {
                        logger.error(insertErr);
                        res.status(500).send("Internal Server Error");
                      } else {
                        // Now, perform the update operation
                        mchQueryMod(
                          `UPDATE machine_data.machinestatus SET Operator='${req.body.selectshifttable.Operator}', ShiftStartTime='${req.body.selectshifttable.FromTime}', ShiftFinishTime='${req.body.selectshifttable.ToTime}',ShiftID='${req.body.selectshifttable.ShiftID}' WHERE MachineName='${req.body.selectshifttable.Machine}'`,
                          (updateErr, updateData) => {
                            if (updateErr) {
                              logger.error(updateErr);
                              res.status(500).send("Internal Server Error");
                            } else {
                              // Insert data into magodmis.shiftstoppagelist
                              mchQueryMod(
                                `INSERT INTO magodmis.shiftstoppagelist (ShiftID,Operator,Srl, StoppageID, StoppageReason, StoppageHead, Machine, FromTime, ToTime, Remarks, Locked,ShiftLogId) VALUES('${req.body.selectshifttable.ShiftID}', '${req.body.selectshifttable.Operator}', '0', '${lastRow.StoppageID}', '${req.body.requiredProgram[0].NCProgarmNo}','${lastRow.StoppageID}', '${req.body.selectshifttable.Machine}', NOW(), NOW(), '', '0', '${req.body.selectshifttable.ShiftID}')`,
                                (stoppageInsertErr, stoppageData) => {
                                  if (stoppageInsertErr) {
                                    logger.error(stoppageInsertErr);
                                    res
                                      .status(500)
                                      .send("Internal Server Error");
                                  } else {
                                    res.send({ insertData: data, updateData });
                                  }
                                }
                              );
                            }
                          }
                        );
                      }
                    }
                  );
                }
              }
            );
          }
        );
      }
    );
  } catch (error) {
    next(error);
  }
});

// Save ShiftLog
ShiftOperator.post("/saveShiftLog", jsonParser, async (req, res, next) => {
  // console.log('saveShiftLog', req.body);

  try {
    // Assuming req.body.shiftLogDetails is an array of objects
    const shiftLogDetails = req.body.shiftLogDetails;

    if (shiftLogDetails && Array.isArray(shiftLogDetails)) {
      for (const shiftLogDetail of shiftLogDetails) {
        const ToTime = shiftLogDetail.ToTime;
        const FromTime = shiftLogDetail.FromTime;

        let dateSplit1 = FromTime.split(" ");
        let date1 = dateSplit1[0].split("/");
        let year1 = date1[2];
        let month1 = date1[1];
        let day1 = date1[0];
        let FromTime1 = year1 + "-" + month1 + "-" + day1 + " " + dateSplit1[1];
        shiftLogDetail.FromTime = FromTime1;

        // Convert the 'ToTime' format
        let dateSplit2 = ToTime.split(" ");
        let date2 = dateSplit2[0].split("/");
        let year2 = date2[2];
        let month2 = date2[1];
        let day2 = date2[0];
        let ToTime1 = year2 + "-" + month2 + "-" + day2 + " " + dateSplit2[1];

        // Update the 'ToTime' property in the object with the converted format
        shiftLogDetail.ToTime = ToTime1;

        mchQueryMod(
          `UPDATE magodmis.shiftlogbook s SET s.Remarks = '${shiftLogDetail.Remarks}',s.FromTime='${shiftLogDetail.FromTime}', s.Srl = '${shiftLogDetail.Srl}', s.ToTime = '${shiftLogDetail.ToTime}', s.Locked = '${shiftLogDetail.Locked}', s.QtyProcessed = '${shiftLogDetail.QtyProcessed}' WHERE s.ShiftLogId = '${shiftLogDetail.ShiftLogId}'`,
          (err, data) => {
            if (err) {
              logger.error(err);
              // Handle the error in a way that suits your application
            }
          }
        );
      }
      res.send("Update successful"); // Sending a response after all updates are completed
      // console.log("Successfully updated");
    } else {
      res.status(400).send("Invalid request body"); // Handle the case where the request body is not as expected
    }
  } catch (error) {
    next(error);
  }
});

//get machineShiftStatus
ShiftOperator.post(
  "/getmachineShiftStatus",
  jsonParser,
  async (req, res, next) => {
    // console.log("Reason",req.body.RejectedReason)
    // console.log("row is",req.body.selectdefaultRow)
    try {
      mchQueryMod(
        `select * from  machine_data.machinestatus where MachineName='${req.body.selectshifttable.Machine}'
    `,
        (err, data) => {
          if (err) {
            logger.error(err);
            // res.status(500).send('Internal Server Error');
            console.log(error);
          } else {
            res.send(data);
          }
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

ShiftOperator.post("/updateOperator", jsonParser, async (req, res, next) => {
  try {
    // Update machine_data.machinestatus
    mchQueryMod(
      `UPDATE machine_data.machinestatus SET Operator='${req.body.Operator}' WHERE MachineName='${req.body.selectshifttable.Machine}'`,
      (err, data) => {
        if (err) {
          logger.error(err);
          return res.status(500).send("Internal Server Error");
        } else {
          // Update magodmis.shiftlogbook
          mchQueryMod(
            `UPDATE magodmis.shiftlogbook SET Operator='${req.body.Operator}' WHERE ShiftID='${req.body.selectshifttable.ShiftID}'`,
            (err, data) => {
              if (err) {
                logger.error(err);
                return res.status(500).send("Internal Server Error");
              } else {
                // Update magodmis.shiftregister
                mchQueryMod(
                  `UPDATE magodmis.shiftregister SET Operator='${req.body.Operator}' WHERE ShiftID='${req.body.selectshifttable.ShiftID}'`,
                  (err, data) => {
                    if (err) {
                      logger.error(err);
                      return res.status(500).send("Internal Server Error");
                    } else {
                      res.send(data);
                    }
                  }
                );
              }
            }
          );
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

//openShiftLog Modal
ShiftOperator.post("/getRowCounts", jsonParser, async (req, res, next) => {
  // console.log(req.body);
  try {
    mchQueryMod(
      `
      SELECT COUNT(*) AS rowCount 
      FROM magodmis.shiftlogbook 
      WHERE ShiftID='${req.body.selectshifttable.ShiftID}' and Machine='${req.body.selectshifttable.Machine}';
    `,
      (err, data) => {
        // console.log(data,"data")
        if (err) {
          logger.error(err);
          res.status(500).send("Internal Server Error");
        } else {
          // Check if the count is 0
          const countIsZero = data[0].rowCount === 0;
          // console.log("countIsZero is ",countIsZero);

          if (countIsZero) {
            // If count is zero, execute additional query
            mchQueryMod(
              `
              SELECT * FROM machine_data.machinestatus WHERE MachineName='${req.body.selectshifttable.Machine}';
              `,
              (err, machineData) => {
                if (err) {
                  logger.error(err);
                  res.status(500).send("Internal Server Error");
                } else {
                  res.send(machineData);
                }
              }
            );
          } else {
            // If count is not zero, send false
            res.send([]);
          }
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

//Preapre Shift
ShiftOperator.post("/prepareShift", jsonParser, async (req, res, next) => {
  try {
    // Step 1: Execute SELECT query with RunningTime calculation
    const data = await mchQueryMod1(`
      SELECT 
        s.*, 
        TIMESTAMPDIFF(MINUTE, s.FromTime, s.ToTime) AS RunningTime 
      FROM magodmis.shiftlogbook s 
      WHERE s.ShiftID=${req.body.selectshifttable.ShiftID} 
        AND s.Machine='${req.body.selectshifttable.Machine}'
    `);
    // console.log("data result is", data);

    // Step 3-5: Check conditions and execute DELETE or UPDATE query for shiftlogbook
    for (let i = 0; i < data.length - 1; i++) {
      const row = data[i];

      if (
        row.RunningTime < 1 &&
        row.QtyProcessed === 0 &&
        row.Remarks === null
      ) {
        // Step 3: DELETE rows that meet the conditions
        await mchQueryMod1(
          `DELETE FROM magodmis.shiftlogbook WHERE ShiftLogId=${row.ShiftLogId}`
        );
        // console.log("executed Delete Operation");
      } else {
        // console.log("executed Update Operation");
        // Step 4: UPDATE rows that do not meet the conditions
        await mchQueryMod1(
          `UPDATE magodmis.shiftlogbook SET Locked=1 WHERE ShiftLogId=${row.ShiftLogId}`
        );
      }
    }

    // Additional Step: Update magodmis.ncprograms
    const updateNcProgramsQuery = `
      UPDATE magodmis.ncprograms n
      JOIN (
        SELECT n.Ncid, SUM(TIMESTAMPDIFF(MINUTE, s.FromTime, s.ToTime)) AS MachineTime 
        FROM magodmis.ncprograms n
        JOIN magodmis.shiftlogbook s ON n.Machine='${req.body.selectshifttable.Machine}' 
          AND n.PStatus='Cutting' 
          AND s.StoppageID=n.Ncid 
        GROUP BY n.Ncid
      ) AS A  
      ON A.Ncid = n.Ncid
      SET n.ActualTime = A.MachineTime`;

    await mchQueryMod1(updateNcProgramsQuery);

    // Step 6: Send response
    res.send("successfully added");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  } finally {
    // mchConn.end(); // Close the connection after all queries are executed
  }
});

///////////////////////////
//CloseShift in ShiftLogBook
ShiftOperator.post("/closeShift", jsonParser, async (req, res, next) => {
  try {
    // Step 1: Execute SELECT query with RunningTime calculation
    const data = await mchQueryMod1(`
      SELECT 
        s.*, 
        TIMESTAMPDIFF(MINUTE, s.FromTime, s.ToTime) AS RunningTime 
      FROM magodmis.shiftlogbook s 
      WHERE s.ShiftID=${req.body.selectshifttable.ShiftID} 
        AND s.Machine='${req.body.selectshifttable.Machine}'
    `);

    // Step 3-5: Check conditions and execute DELETE or UPDATE query for shiftlogbook
    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      if (i < data.length - 1) {
        // For rows other than the last one
        if (
          row.RunningTime < 1 &&
          row.QtyProcessed === 0 &&
          row.Remarks === null
        ) {
          // Step 3: DELETE rows that meet the conditions
          await mchQueryMod1(
            `DELETE FROM magodmis.shiftlogbook WHERE ShiftLogId=${row.ShiftLogId}`
          );
          // console.log("executed Delete Operation");
        } else {
          await mchQueryMod1(
            `UPDATE magodmis.shiftlogbook SET Locked=1 WHERE ShiftLogId=${row.ShiftLogId}`
          );
          // console.log("executed Update Operation");
        }
      } else {
        // For the last row
        await mchQueryMod1(
          `UPDATE magodmis.shiftlogbook SET Locked=1 WHERE ShiftLogId=${row.ShiftLogId}`
        );
        // console.log("Additional condition for the last row");
      }
    }

    // Additional Step: Update magodmis.ncprograms
    const updateNcProgramsQuery = `
      UPDATE magodmis.ncprograms n
      JOIN (
        SELECT n.Ncid, SUM(TIMESTAMPDIFF(MINUTE, s.FromTime, s.ToTime)) AS MachineTime 
        FROM magodmis.ncprograms n
        JOIN magodmis.shiftlogbook s ON n.Machine='${req.body.selectshifttable.Machine}'
          AND n.PStatus='Cutting' 
          AND s.StoppageID=n.Ncid 
        GROUP BY n.Ncid
      ) AS A  
      ON A.Ncid = n.Ncid
      SET n.ActualTime = A.MachineTime`;

    await mchQueryMod1(updateNcProgramsQuery);

    // Step 6: Send response
    res.send("successfully added");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  } finally {
    // mchConn.end(); // Close the connection after all queries are executed
  }
});

// Function to calculate RunningTime
function calculateRunningTime(toTime, fromTime) {
  // Implement your logic to calculate the RunningTime here
  // For example: return the difference between toTime and fromTime
}

//Middle table(Program Material) DataRefresh Data
ShiftOperator.post(
  "/ProgramMaterialAfterRefresh",
  jsonParser,
  async (req, res, next) => {
    // console.log("test request",req.body)
    try {
      const machineName = req.body.selectshifttable.Machine;

      // First Query to retrieve machine status
      const machineStatusQuery = `SELECT * FROM machine_data.machinestatus WHERE MachineName='${machineName}'`;
      mchQueryMod(machineStatusQuery, async (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Internal Server Error");
        }

        // Log the result of the first query
        // console.log("First Query Result:", result);

        if (result && result.length > 0) {
          const ncProgramNo = result[0].NCProgarmNo;

          // Log NCProgarmNo to verify its value
          // console.log("Program No is", ncProgramNo);

          if (isNaN(ncProgramNo) || isNaN(parseFloat(ncProgramNo))) {
            // If NCProgarmNo is not a numeric value, send an empty array as response
            res.send([]);
          } else {
            // If NCProgarmNo is a numeric value, execute the second query
            const complexQuery1 = `
            SELECT * FROM magodmis.ncprogrammtrlallotmentlist n WHERE n.NCProgramNo='${ncProgramNo}' ORDER BY n.ncpgmmtrlid`;

            // Log the second query for verification
            // console.log("Second Query 1:", complexQuery1);

            mchQueryMod(complexQuery1, async (complexErr1, complexData1) => {
              // Log the response of the second query
              // console.log("Second Query 1 Response:", complexData1);

              if (complexErr1) {
                console.error(complexErr1);
                return res.status(500).send("Internal Server Error");
              }

              // Execute the third query
              const complexQuery2 = `
              SELECT n.*, c.cust_name
              FROM magodmis.ncprograms n, magodmis.prioritytable p, magodmis.cust_data c
              WHERE n.Machine ='${machineName}' and n.NCProgramNo='${ncProgramNo}' AND (n.PStatus='Cutting' or n.PStatus='Processing')
                AND p.Priority=n.Priority AND n.cust_code= c.cust_code
              ORDER BY p.Seniority`;

              // Log the third query for verification
              // console.log("Third Query:", complexQuery2);

              mchQueryMod(complexQuery2, (complexErr2, complexData2) => {
                // Log the response of the third query
                // console.log("Third Query Response:", complexData2);

                if (complexErr2) {
                  console.error(complexErr2);
                  return res.status(500).send("Internal Server Error");
                }

                // Send the combined response of the second and third queries
                res.send({ complexData1, complexData2 });
              });
            });
          }
        } else {
          res.send([]);
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

//get Shift Details
ShiftOperator.post(
  "/getdatafatermarkasUsedorRejected",
  jsonParser,
  async (req, res, next) => {
    // console.log("NCProgramNo",req.body);
    try {
      misQueryMod(
        `SELECT * FROM magodmis.ncprogrammtrlallotmentlist n WHERE n.NCProgramNo='${req.body.NCProgramNo}' ORDER BY n.ncpgmmtrlid`,
        (err, data) => {
          if (err) logger.error(err);
          //console.log(data)
          res.send(data);
          // console.log("response is",data)
        }
      );
    } catch (error) {
      next(error);
    }

    // res.send(res)
  }
);

//Differenciating Profile and Service based  on BOM
ShiftOperator.post("/checkhasBOM", jsonParser, async (req, res, next) => {
  // console.log("req.body",req.body)
  try {
    misQueryMod(
      `SELECT * FROM magodmis.ncprograms n WHERE n.Ncid='${req.body.NCId}'`,
      (err, data) => {
        if (err) {
          logger.error(err);
          return res.status(500).send({ error: "Internal Server Error" });
        }

        // Assuming data is an array of results from the database
        // console.log(data)
        if (data.length > 0 && data[0].HasBOM === 1) {
          res.send(true);
        } else {
          res.send(false);
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

//getNC_pgroam_part_Id
ShiftOperator.post("/getNcProgramId", jsonParser, async (req, res, next) => {
  // console.log("ncid getting from request",req.body);
  try {
    misQueryMod(
      `SELECT * FROM magodmis.ncprogram_partslist WHERE NCId='${req.body.NcId}'`,
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

ShiftOperator.post("/ServicemarkasUsed", jsonParser, async (req, res, next) => {
  try {
    const { sendobject } = req.body;

    // Initialize a variable to store the total issuesetsNumber for updateQuery4
    let totalIssuesetsNumber = 0;

    // Use a Promise to execute the updates sequentially for each object
    const updatePromises = sendobject.map(async (obj) => {
      const updateQuery1 = `UPDATE magodmis.shopfloor_bom_issuedetails s, magodmis.mtrl_part_receipt_details m
                            SET m.QtyUsed=m.QtyUsed+${obj.useNow}, s.QtyUsed=s.QtyUsed+${obj.useNow}
                            WHERE m.Id=s.PartReceipt_DetailsID AND s.Id=${obj.Id};`;

      // Execute the first query
      await executeUpdateQuery(updateQuery1);

      // Aggregate the total issuesetsNumber for later use in updateQuery4
      totalIssuesetsNumber += Number(obj.issuesets);
    });

    // Wait for all the queries in the loop to complete
    await Promise.all(updatePromises);

    // Now execute updateQuery2 and updateQuery3 only once
    const updateQuery2 = `UPDATE magodmis.ncprogram_partslist n
                          SET n.QtyCut=n.QtyCut + ${sendobject[0].issuesets}
                          WHERE n.NC_Pgme_Part_ID=${sendobject[0].NC_Pgme_Part_ID};`;

    const updateQuery3 = `UPDATE magodmis.ncprograms n
                          SET n.QtyCut=n.QtyCut + ${sendobject[0].issuesets}
                          WHERE n.Ncid='${sendobject[0].NcId}'`;

    // Execute the second and third queries
    await executeUpdateQuery(updateQuery2);
    await executeUpdateQuery(updateQuery3);

    // Now execute updateQuery4 once using the aggregated issuesetsNumber
    let updateQuery4 = `UPDATE magodmis.shopfloor_part_issueregister s
                        SET s.QtyUsed=s.QtyUsed+${sendobject[0].issuesets}`;

    console.log("updateQuery4 is", updateQuery4);

    // Check if any of the objects have QtyIssued === QtyUsed and update the status
    if (sendobject.some((obj) => obj.QtyIssued === obj.QtyUsed)) {
      updateQuery4 += `, s.Status='Closed'`;
    }

    updateQuery4 += ` WHERE s.IssueID=${sendobject[0].IV_ID};`;

    // Execute the fourth query
    await executeUpdateQuery(updateQuery4);

    // Send response back to the client
    res.send(true);
  } catch (error) {
    console.error("Error in /ServicemarkasUsed route:", error);
    next(error);
  }
});

// Function to execute an update query
function executeUpdateQuery(query) {
  return new Promise((resolve, reject) => {
    misQueryMod(query, (err, result) => {
      if (err) {
        logger.error(err);
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

//mark as Rejected Production Report
ShiftOperator.post("/markasReturned", jsonParser, async (req, res, next) => {
  try {
    const { sendobject } = req.body;
    console.log("sendobject", sendobject);

    // Disable safe updates for the current session
    await executeUpdateQuery("SET SQL_SAFE_UPDATES = 0");

    // Initialize a variable to store the total issuesetsNumber for updateQuery4
    let totalIssuesetsNumber = 0;
    let issueID = null;

    // Use a Promise to execute the updates sequentially for each object
    const updatePromises = sendobject.map(async (obj) => {
      // First update query
      const updateQuery1 = `UPDATE magodmis.shopfloor_bom_issuedetails s, magodmis.mtrl_part_receipt_details m
                            SET s.QtyReturned=s.QtyReturned+${obj.ReturnNow}
                            WHERE m.Id=s.PartReceipt_DetailsID AND s.Id=${obj.Id};`;

      // Execute the first query
      await executeUpdateQuery(updateQuery1);
      console.log("updateQuery1 is", updateQuery1);

      // Aggregate issuesetsNumber and store IV_ID for later use
      totalIssuesetsNumber += Number(obj.issuesets);
      issueID = obj.IV_ID;

      // Check if the additional query is needed (close status)
      // if (obj.QtyIssued === obj.QtyUsed + obj.QtyReturned) {
      //   let closeQuery = `UPDATE magodmis.shopfloor_part_issueregister s
      //                     SET s.Status='Closed'
      //                     WHERE s.IssueID=${obj.IV_ID};`;
      //   await executeUpdateQuery(closeQuery);
      // }
    });
    // console.log("updatecloseQueryQuery1 is",closeQuery);

    // Wait for all the queries in the loop to complete
    await Promise.all(updatePromises);

    // Now execute updateQuery4 once using the aggregated issuesetsNumber
    if (issueID !== null) {
      let updateQuery4 = `UPDATE magodmis.shopfloor_part_issueregister s 
                          SET s.QtyReturned=s.QtyReturned+${sendobject[0].ReturnNow} 
                          WHERE s.IssueID=${sendobject[0].IV_ID};`;

      // Execute the fourth query outside the loop
      await executeUpdateQuery(updateQuery4);
    }

    // Re-enable safe updates for the current session
    await executeUpdateQuery("SET SQL_SAFE_UPDATES = 1");

    res.send(true);
  } catch (error) {
    console.error("Error in /markasReturned route:", error);
    next(error);
  }
});

// Function to execute an update query
function executeUpdateQuery(query) {
  return new Promise((resolve, reject) => {
    misQueryMod(query, (err, result) => {
      if (err) {
        console.error("Query execution error:", err);
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

//middletable data after yes/no
ShiftOperator.post(
  "/ServiceAfterpageOpen",
  jsonParser,
  async (req, res, next) => {
    try {
      const machineName = req.body.selectshifttable.Machine;

      // First Query to retrieve machine status
      const machineStatusQuery = `SELECT * FROM machine_data.machinestatus WHERE MachineName='${machineName}'`;
      mchQueryMod(machineStatusQuery, async (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Internal Server Error");
        }

        // Log the result of the first query
        // console.log("First Query Result:", result);

        if (result && result.length > 0) {
          const ncProgramNo = result[0].NCProgarmNo;

          // Log NCProgarmNo to verify its value
          // console.log("Program No is", ncProgramNo);

          if (isNaN(ncProgramNo) || isNaN(parseFloat(ncProgramNo))) {
            // If NCProgarmNo is not a numeric value, send an empty array as response
            res.send([]);
          } else {
            // If NCProgarmNo is a numeric value, execute the second query
            const firstQuery = `
            SELECT *
            FROM magodmis.shopfloor_part_issueregister
            WHERE magodmis.shopfloor_part_issueregister.NC_ProgramNo = '${ncProgramNo}'
          `;

            try {
              mchQueryMod(firstQuery, async (err, firstQueryResult) => {
                if (err) {
                  console.error("Error in first query:", err);
                  res.status(500).send("Internal Server Error");
                } else {
                  if (
                    firstQueryResult &&
                    firstQueryResult.length > 0 &&
                    firstQueryResult[0].IssueID
                  ) {
                    const issueId = firstQueryResult[0].IssueID;

                    const secondQuery = `
                    SELECT *
                    FROM magodmis.shopfloor_bom_issuedetails s
                    WHERE s.IV_ID = '${issueId}'
                  `;

                    try {
                      mchQueryMod(
                        secondQuery,
                        async (err, secondQueryResult) => {
                          if (err) {
                            console.error("Error in second query:", err);
                            res.status(500).send("Internal Server Error");
                          } else {
                            if (
                              secondQueryResult &&
                              secondQueryResult[0] &&
                              secondQueryResult[0].IV_ID
                            ) {
                              const ivId = secondQueryResult[0].IV_ID;

                              const thirdQuery = `
                            SELECT s.*, m.Customer, m.RV_No, m.RV_Date, m1.PartId, m1.CustBOM_Id
                            FROM magodmis.shopfloor_bom_issuedetails s, magodmis.material_receipt_register m, magodmis.mtrl_part_receipt_details m1
                            WHERE s.IV_ID = '${ivId}' AND m.RvID = s.RV_Id AND m1.Id = s.PartReceipt_DetailsID
                          `;

                              try {
                                mchQueryMod(
                                  thirdQuery,
                                  async (err, thirdQueryResult) => {
                                    if (err) {
                                      console.error(
                                        "Error in third query:",
                                        err
                                      );
                                      res
                                        .status(500)
                                        .send("Internal Server Error");
                                    } else {
                                      // Send the third query result as the final response
                                      res.send(thirdQueryResult);
                                      // console.log("final result is",thirdQueryResult)
                                    }
                                  }
                                );
                              } catch (error) {
                                console.error("Error in third query:", error);
                                next(error);
                              }
                            } else {
                              res
                                .status(404)
                                .send(
                                  "IV_ID not found in the second query result"
                                );
                            }
                          }
                        }
                      );
                    } catch (error) {
                      console.error("Error in second query:", error);
                      res.status(500).send("Internal Server Error");
                    }
                  } else {
                    res
                      .status(404)
                      .send("IssueID not found in the first query result");
                  }
                }
              });
            } catch (error) {
              console.error("Error in first query:", error);
              next(error);
            }
          }
        } else {
          res.send([]);
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

//Onchnage inputField service
ShiftOperator.post(
  "/onChangeInputField",
  jsonParser,
  async (req, res, next) => {
    try {
      const responseData = [];

      for (let i = 0; i < req.body.afterloadService.length; i++) {
        const currentObject = req.body.afterloadService[i];
        const CustBOM_Id = currentObject.CustBOM_Id;
        // console.log("CustBOM_Id", CustBOM_Id);

        // Perform the database query for each CustBOM_Id using async/await
        const query = `SELECT * FROM magodmis.cust_assy_bom_list WHERE Cust_BOM_ListId='${CustBOM_Id}'`;

        try {
          const data = await new Promise((resolve, reject) => {
            misQueryMod(query, (err, result) => {
              if (err) {
                console.error("Error in misQueryMod:", err);
                reject(err);
              } else {
                // console.log("Query result", JSON.stringify(result, null, 2));
                resolve(result);
              }
            });
          });

          // Add the query result to the responseData array
          responseData.push(data);
          // console.log("responseData", JSON.stringify(responseData, null, 2));

          // Check if this is the last iteration and send the response
          if (i === req.body.afterloadService.length - 1) {
            // console.log("Final response sent:", JSON.stringify(responseData, null, 2));
            res.send(responseData);
          }
        } catch (error) {
          console.error("Error in async operation:", error);
          return res.status(500).send("Internal Server Error");
        }
      }

      // console.log("End of the route handler");
    } catch (error) {
      console.error("Error outside the loop:", error);
      next(error);
    }
  }
);

//getNCID for validation
ShiftOperator.post("/getNCId", jsonParser, async (req, res, next) => {
  // console.log("req.body",req.body);
  try {
    // First query to get NCProgramNo
    misQueryMod(
      `SELECT * FROM machine_data.machinestatus WHERE MachineName='${req.body.shiftSelected.Machine}';`,
      (err, result) => {
        if (err) {
          logger.error(err);
          return next(err);
        }

        if (result && result.length > 0) {
          const ncProgramNo = result[0].NCProgarmNo;
          // console.log("ncProgramNo",ncProgramNo)

          // Check if ncProgramNo is a number
          if (!isNaN(ncProgramNo)) {
            // Second query to get Ncid based on NCProgramNo
            misQueryMod(
              `SELECT Ncid FROM magodmis.ncprograms WHERE NCProgramNo='${ncProgramNo}';`,
              (secondErr, secondResult) => {
                if (secondErr) {
                  logger.error(secondErr);
                  return next(secondErr);
                }

                // Send the result of the second query as the response
                res.send(secondResult);
                // console.log("response is", secondResult);
              }
            );
          } else {
            // If ncProgramNo is not a number, send an empty array as response
            res.send([]);
          }
        } else {
          // If no result from the first query, send an empty array as response
          res.send([]);
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

//get service table top Deatails
ShiftOperator.post(
  "/getTableTopDeatails",
  jsonParser,
  async (req, res, next) => {
    // console.log("req.body",req.body);
    try {
      misQueryMod(
        `SELECT * FROM magodmis.shopfloor_part_issueregister WHERE NcId='${req.body.NCId}'`,
        (err, data) => {
          if (err) logger.error(err);
          res.send(data);
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

//get service table top Deatails AFter Page Refresh
ShiftOperator.post(
  "/getTableTopDeatailsAfterPageRefresh",
  jsonParser,
  async (req, res, next) => {
    // console.log("req.body", req.body);

    // Assuming machineName is available in req.body
    const machineName = req.body.selectshifttable.Machine;

    try {
      // First query to get NCProgarmNo from machine_data.machinestatus
      misQueryMod(
        `SELECT * FROM machine_data.machinestatus WHERE MachineName='${machineName}'`,
        (err, result) => {
          if (err) {
            console.error(err);
            return res.status(500).send("Internal Server Error");
          }

          // Log the result of the first query
          // console.log("First Query Result:", result);

          if (result && result.length > 0) {
            const ncProgramNo = result[0].NCProgarmNo;

            // Log NCProgarmNo to verify its value
            // console.log("Program No is", ncProgramNo);

            if (isNaN(ncProgramNo) || isNaN(parseFloat(ncProgramNo))) {
              // If NCProgarmNo is not a numeric value, send an empty array as response
              res.send([]);
            } else {
              // Second query to get details from magodmis.shopfloor_part_issueregister
              misQueryMod(
                `SELECT * FROM magodmis.shopfloor_part_issueregister WHERE NC_ProgramNo='${ncProgramNo}'`,
                (err, data) => {
                  if (err) {
                    console.error(err);
                    return res.status(500).send("Internal Server Error");
                  }

                  // Log the result of the second query
                  // console.log("Second Query Result:", data);

                  res.send(data);
                  // console.log("response")
                }
              );
            }
          } else {
            res.send([]);
          }
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

//update Machine Time
ShiftOperator.post("/updateMachineTime", jsonParser, async (req, res, next) => {
  const machineName = req.body.Machine;

  // console.log("req.body",req.body.Machine);
  try {
    misQueryMod(
      `UPDATE magodmis.ncprograms n
      JOIN (
          SELECT n.Ncid, n.NcTaskId, SUM(TIMESTAMPDIFF(MINUTE, s.FromTime, s.ToTime)) AS MachineTime
          FROM magodmis.ncprograms n
          JOIN magodmis.shiftlogbook s ON s.StoppageID = n.Ncid
          WHERE n.Machine = '${machineName}' 
            AND n.PStatus = 'Cutting'
          GROUP BY n.Ncid, n.NcTaskId
      ) AS A ON n.Ncid = A.Ncid
      JOIN magodmis.nc_task_list t ON t.NcTaskId = n.NcTaskId
      SET n.ActualTime = A.MachineTime, 
          t.TaskProcessTime = A.MachineTime
      WHERE n.Machine = '${machineName}' 
        AND n.PStatus = 'Cutting';`,
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

//update form after mark as used
ShiftOperator.post(
  "/updateformafterMarkasUsed",
  jsonParser,
  async (req, res, next) => {
    const machineName = req.body.Machine;

    // console.log("req.body",req.body.Machine);
    try {
      misQueryMod(
        `SELECT * FROM magodmis.ncprograms where Ncid='${req.body.NcId}';
        `,
        (err, data) => {
          if (err) logger.error(err);
          res.send(data);
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

//update Opeartor
ShiftOperator.post(
  "/updateOpertaorafterChange",
  jsonParser,
  async (req, res, next) => {
    // console.log("req.body", req.body.selectshifttable);
    try {
      misQueryMod(
        `UPDATE machine_data.machinestatus SET Operator='${req.body.selectshifttable.Operator}' WHERE MachineName='${req.body.selectshifttable.Machine}'`,
        (err, data) => {
          if (err) {
            logger.error(err);
            return res.status(500).send("Error updating operator");
          }
          res.send(data);
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

//check QtyCut for Mark as completed
ShiftOperator.post("/getQtydata", jsonParser, async (req, res, next) => {
  // console.log('getqty', req.body);
  try {
    const sqlQuery = `SELECT * FROM magodmis.ncprogram_partslist n WHERE n.NCId='${req.body.NCId}'`;
    // console.log("SQL Query:", sqlQuery); // Log the SQL query

    mchQueryMod(sqlQuery, (err, data) => {
      if (err) {
        logger.error(err);
        return res.status(500).send("Internal Server Error");
      } else {
        // console.log("Query executed successfully.");
        // console.log("Returned data is", data);
        res.send(data);
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = ShiftOperator;
