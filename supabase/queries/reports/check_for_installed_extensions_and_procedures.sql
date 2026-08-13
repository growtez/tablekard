SELECT extname
FROM pg_extension
WHERE extname = 'pg_cron';

SELECT proname
FROM pg_proc
WHERE proname = 'suspend_expired_subscriptions';
