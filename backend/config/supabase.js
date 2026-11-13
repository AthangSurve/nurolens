const { createClient } = require('@supabase/supabase-js');
const localDb = require('./localDb');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if we should use local database
const isDummyUrl = !supabaseUrl || 
  supabaseUrl.includes('xxxx') || 
  supabaseUrl.includes('mcehegnvafqtvsqmzgtb');
const forceLocalDb = process.env.USE_LOCAL_DB === 'true';

let realClient = null;
let useLocal = forceLocalDb || isDummyUrl;

if (!useLocal && supabaseUrl && supabaseServiceKey) {
  try {
    realClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    console.log(`[Database] 🌐 Connected to Supabase: ${supabaseUrl}`);
  } catch (err) {
    console.warn('[Database] ⚠️ Failed to create Supabase client, falling back to local DB:', err.message);
    useLocal = true;
  }
} else {
  console.log('[Database] 🟢 Using Local Persistent Database (data/local_db.json)');
}

const supabaseWrapper = {
  from(tableName) {
    if (useLocal || !realClient) {
      return localDb.from(tableName);
    }

    const realQuery = realClient.from(tableName);
    // Wrap to catch DNS/network fetch errors and fallback to localDb
    return new Proxy(realQuery, {
      get(target, prop, receiver) {
        if (prop === 'then') {
          return (resolve, reject) => {
            return target
              .then((result) => {
                if (
                  result?.error &&
                  (result.error.message?.includes('fetch failed') ||
                    result.error.details?.includes('ENOTFOUND') ||
                    result.status === 0)
                ) {
                  console.warn(
                    `[Database] ⚠️ Supabase remote fetch failed (${result.error.message}). Automatically falling back to local persistent database.`
                  );
                  useLocal = true;
                  return localDb.from(tableName).select().then(resolve, reject);
                }
                return resolve(result);
              })
              .catch((err) => {
                console.warn(
                  `[Database] ⚠️ Supabase connection error: ${err.message}. Automatically falling back to local persistent database.`
                );
                useLocal = true;
                return localDb.from(tableName).select().then(resolve, reject);
              });
          };
        }
        const val = Reflect.get(target, prop, receiver);
        if (typeof val === 'function') {
          return val.bind(target);
        }
        return val;
      },
    });
  },
};

module.exports = supabaseWrapper;
