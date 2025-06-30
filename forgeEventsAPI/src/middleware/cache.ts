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

const mapEventsTimeToLive = 0; // Unlimited

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
  if (Object.hasOwn(result, 'eventsHashString')) {
     return result.eventsHashString;
  }
  console.warn(`Cache appears improperly created ${result}`);
  return ''; 
}

async function updateMapEventsCache() {
  try {
    console.debug("Performing database query in cache update...");
    const currentHash = getMapEventsHashFromCache();
    const events = await queryEventsForMap();
    const eventsString : string = JSON.stringify(events);
    const eventsHashString : string = sha1(eventsString);
    if (currentHash != eventsHashString) {
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
    }
    else {
      console.debug('Events have not appeared to change');
    }
    return true;
  }
  catch (error) {
    console.error(error);
  }
  return false;
}

export { getMapEventsAndEventsHashFromCache, getMapEventsHashFromCache, updateMapEventsCache };
