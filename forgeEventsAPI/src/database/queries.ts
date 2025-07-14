import { Pool } from 'pg';
import dotenv from 'dotenv';
import { EventInformation } from '../utils/eventType';

dotenv.config();

interface IEventRow {
  identifier : number;
  time : number;
  latitude : number;
  longitude : number;
  depth : number;
  review_flag : string;
  magnitude : number;
  magnitude_type : string;
};

// Create pool
const pgPort = process.env.QSEEK_DATABASE_PORT ?? '5432';
const pool = new Pool({
  user: process.env.QSEEK_DATABASE_READ_ONLY_USER,
  password: process.env.QSEEK_DATABASE_READ_ONLY_PASSWORD,
  database: process.env.QSEEK_DATABASE_NAME,
  host: process.env.QSEEK_DATABASE_HOST ?? 'localhost',
  port: Number(pgPort),
  connectionTimeoutMillis: 1000,
  maxLifetimeSeconds: 60,
  max: 25,
});

async function queryEventsInTimeRange(startTime : number, endTime : number) {
  let events : EventInformation[] = []; 
  try {
    const client = await pool.connect();
    const queryText = "SELECT event.identifier as identifier, time, latitude, longitude, depth, review_flag, COALESCE(network_magnitude.value, -10) as magnitude, COALESCE(network_magnitude.type, '') as magnitude_type FROM forge.event INNER JOIN forge.network_magnitude ON network_magnitude.identifier = event.magnitude_identifier WHERE time >= $1 AND time <= $2";
    const queryValues = [startTime, endTime];
    const queryResult = await client.query(queryText, queryValues);
    // Pack the events
    const initialEvents = queryResult.rows.map( (event : IEventRow) => {
      try {
        const eventDetails : EventInformation = { 
              identifier : `qseek-${event.identifier}`,
              originTimeUTC : Number(event.time),
              latitudeDeg : Number(event.latitude),
              longitudeDeg : Number(event.longitude),
              depthKM : Number(event.depth),
              eventType : 'eq',
              isReviewed : event.review_flag === 'A' ? true : false,
              authority : 'UU',
              //magnitude : event.magnitude > -10 ? event.magnitude : null,
              //magnitudeType : event.magnitude > -10 ? event.magnitude_type : null,
        };
        if (event.magnitude > -10) {
          eventDetails.magnitude = event.magnitude;
          eventDetails.magnitudeType = event.magnitude_type;
        }
        return eventDetails;
      }   
      catch (error) {
        console.warn(`Failed to unpack event; failed with ${error}`);
      }   
      //return null;
    }); 
    client.release();
    // Purge any nulls
    events = initialEvents.filter( (e) => {return e != null;} );
  }
  catch (error) {
    console.warn(`Failed to query events from ${startTime} to ${endTime}; failed with ${error}`);
    throw new Error("Internal query error");
  }
  return events;
}

async function queryEventsForMap() {
  const startTime = Date.now()/1000 - 7*86400;
  const endTime = Date.now();
  // Additionally we require magnitudes be >-1
  const initialMagnitudes = await queryEventsInTimeRange(startTime, endTime);
  return initialMagnitudes.filter( (e) => { 
                                           if (Object.hasOwn(e, 'magnitude')) {
                                             return e.magnitude != undefined && e.magnitude > -1;
                                           }
                                          } );
}

export { queryEventsInTimeRange, queryEventsForMap };
