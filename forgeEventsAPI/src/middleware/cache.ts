import NodeCache from 'node-cache';
import { queryEventsForMap } from '../database/queries';
import { EventInformation } from '../utils/eventType';
import sha1 from 'sha1';

interface IEventsAndHash {
  eventsHashString: string;
  events: EventInformation[];
};

const initialEventCacheValue: IEventsAndHash = {
  eventsHashString: '',
  events: [],
};

// We update this about every 15 minutes
const mapEventsTimeToLive = 900;

const eventMapCache = new NodeCache( { stdTTL: mapEventsTimeToLive } );
eventMapCache.set('qseekMapEvents',
                  initialEventCacheValue,
                  mapEventsTimeToLive);

function getMapEventsAndEventsHashFromCache() {
  const result : any = eventMapCache.get('qseekMapEvents');
  if (result  === null) {
    return [];
  }
  return result;
}

function getMapEventsHashFromCache() : string {
  const result : any = eventMapCache.get('qseekMapEvents');
  if (result === null) {
    return '';
  }
  return result.eventsHashString;
}

async function updateMapEventsCache() {
  try {
    console.debug("Performing database query in cache update...");
    const events = await queryEventsForMap();
    const eventsString : string = JSON.stringify(events);
    const eventsHashString : string = sha1(eventsString);
    console.debug(`Updating with ${events.length} events and hash string ${eventsHashString}`);
    const updateCacheValue : IEventsAndHash = {
      eventsHashString: eventsHashString,
      events: events,
    };
    const wasWritten
       = eventMapCache.set('qseekMapEvents',
                           updateCacheValue,
                           mapEventsTimeToLive);
    if (!wasWritten) {
      console.warn('Events not written to cache');
    }   
    return true;
  }
  catch (error) {
    console.error(error);
  }
  return false;
}

export { getMapEventsAndEventsHashFromCache, getMapEventsHashFromCache, updateMapEventsCache };
