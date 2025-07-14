import { Router } from 'express';
import { Response } from 'express';
import { Request } from 'express';
import { queryEventsInTimeRange } from '../database/queries';
import { getMapEventsHashFromCache, getMapEventsAndEventsHashFromCache } from '../middleware/cache';

const router = Router();

// This should teach you how to get events
router.get('/', (_req: Request, res: Response) => {
  res.status(200);
  res.json({
            status: 200,
            message: 'QSeek Event API',
            routes: [{
                      route: '/api/mapEvents',
                      description: 'The QSeek events collected over the previous week to plot on the UUSS FORGE map.'
                     },
                     {
                      route: '/api/mapEventsHash',
                      description: 'A lightweight SHA1 representation of the mapEvents.  This endpoint should be used for polling.'
                     },
                     {
                      route: '/api/query/v1/datetime/start=:startTime/end=:endTime',
                      description: 'Returns the events from the given time frame.  The start and end times are formatted YYYY-MM-DDTHH:MM:SS and are specified in UTC time.'
                     },
                   ]
           });
});

// Map events
router.get('/mapEvents', (_req: Request, res: Response) => {
  try {
    const eventsAndHash = getMapEventsAndEventsHashFromCache();
    res.status(200);
    res.json({
              status: 200,
              message: 'Events from the previous week',
              data: eventsAndHash,
             });
  }
  catch (error) {
    console.warn(error);
    res.status(500);
    res.json({
              status: 500,
              message: 'Internal error occurred while querying events',
              data: null,
             });
  }
});

// Map events hash
router.get('/mapEventsHash', (__req: Request, res: Response) => {
  try {
    const eventsHash = getMapEventsHashFromCache();
    res.status(200);
    res.json({
              status: 200,
              message: 'Hash of events from previous week',
              data: eventsHash,
             }); 
  }
  catch (error) {
    console.warn(error);
    res.status(500);
    res.json({
              status: 500,
              message: 'Internal error occurred while querying events',
              data: null,
             });
  }
});

// Time range query: https://forbeslindesay.github.io/express-route-tester/
router.get(/^\/query\/v1\/datetime\/start=(?:([^\/]+?))\/end=(?:([^\/]+?))\/?$/i,
           //query/v1/datetime/:startTime/:endTime',
           //(\\d{4})-:startMonth(\\d{2})-:startDay(\\d{2})/:endYear(\\d{4})-:endMonth(\\d{2})-:endDay(\\d{2})',
           async (req: Request, res: Response) => {
  //console.info(req.params[0]); 
  //console.info(req.params[1]);
  let startTime = Date.now();
  let endTime = Date.now();
  let message = '';
  let is404Error = false;
  try {
    startTime = Date.parse(req.params[0].toUpperCase() + 'Z');
    endTime = Date.parse(req.params[1].toUpperCase() + 'Z');
    startTime = startTime/1000.0;
    endTime = endTime/1000.0;
    if (isNaN(startTime)) {
      message = `Start time ${req.params[0]} likely has invalid format; try YYYY-MM-DDTHH:MM:SS`;
      is404Error = true;
    } 
    if (isNaN(endTime)) {
      message = `End time ${req.params[1]} likely has invalid format; try YYYY-MM-DDTHH:MM:SS`;
      is404Error = true;
    }   
    if (startTime >= endTime) {
      message = `Start time ${req.params[0]} must be less than end time ${req.params[1]}`;
      is404Error = true;
    }
  }
  catch (error) {
    console.error(error);
    message = 'Start time and end time must be of form HHHH-MM-DDTHH:MM:SS';
    is404Error = true;
  }
  if (!is404Error) {
    console.debug(`Querying from ${startTime} to ${endTime} (${req.params[0]} to ${req.params[1]})`);
    //const startTimeInput = req.params.startTime;
    //const endTimeInput = req.params.endTime;
    try {
      const events = await queryEventsInTimeRange(startTime, endTime);
      res.status(200);
      res.json({
                status: 200,
                message: `Successfully queried events from ${startTime} to ${endTime}`,
                data: {events : events},
               }); 
    }
    catch (error) {
      console.warn(`Server side error deteced; problem is ${error}`);
      res.status(500);
      res.json({
                status: 500,
                message: 'Server query error',
                data: null,
               });
    }
  }
  else {
    console.debug("400 error");
    res.status(400);
    res.json({
              status: 400, 
              message: message, 
              data: null,
             });
  } 
});

/*
/// Handle a default route
router.get('/',
           (__req : Request, res : Response ) => {
   res.redirect('/options');
});
*/

router.use((_req : Request, _res : Response, next : any) => {
  next({
    status: 404,
    message: 'Not Found',
  }); 
});

/*
router.use((err : any, _req : Request, res : Response, next : any) => {
  if (err.status === 404) {
    return res.status(400).send('404');
  }

  if (err.status === 500) {
    return res.status(500).send('500');
  }

  next();
});
*/

export default router;
