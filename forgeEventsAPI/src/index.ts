/* global process */
import express from 'express';
import { Response } from 'express';
import { Request } from 'express';
import http from 'http';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import cors from'cors';
import dotenv from 'dotenv';
import router from './routes/router';
import { rateLimit } from 'express-rate-limit'
import { updateMapEventsCache } from './middleware/cache';

// Setup the .env variables for app usage
dotenv.config();

// Update this every 10 minutes - cache will die after 15 minutes 
// becaus that's about as often as the cron goes off
const refreshRateSeconds = Number(process.env.REFRESH_RATE ?? 600 ); 
const port = process.env.PORT ?? '8090';
const host = process.env.HOST ?? 'localhost';
const rateTimeLimitSeconds = Number(process.env.RATE_TIME_LIMIT_SECONDS ?? 60);
const rateRequestLimit = Number(process.env.RATE_REQUEST_LIMIT ?? 15);

// Perform initial queries
updateMapEventsCache().then( () => {
    console.debug("Initial cache set");
  }
).catch( (e) => {
    console.error(`Failed to fill cache because ${e}`);
  }
);

/// Initialize the express app
console.debug('Initializing express app...');
const app = express();
app.use(express.json()); // Body parser
app.get('env');
app.set('port', port);
app.set('host', host);
//app.set('query parser', 'simple');
app.set('trust proxy', host); //'127.0.0.1');

app.use(express.json());
app.use(cors()); // Enable CORS
app.use(morgan('dev')); // Logging
app.use(helmet()); // Security headers
app.use(hpp()); // Protect against HTTP param polution attacks 

// Limit rate of requests
// Alternatively, you can pass through specific routes for different limits based on route
app.use(
  rateLimit({
    windowMs: rateTimeLimitSeconds*1000,
    max: rateRequestLimit,
  }),
);

/// Enable routing
app.use('/api', router); // Setup routing

/// Default case of unmatched routes
app.use( (_req : Request, res : Response) => {
  res.status(404);
  res.json({
            message: 'Invalid Request'
           });
});

/// Create a server with the request handler
const server = http.createServer(app);

/// Start listening for incoming requests on the port
server.listen(port, app.get('host') ?? host, () => {
  //console.debug('Performing initial queries...');
  //updateMapEventsCache();
  console.debug(`Server running at http://${host}:${String(port)}`);
  /// Handle queries
  setInterval(updateMapEventsCache, refreshRateSeconds*1000);
});


