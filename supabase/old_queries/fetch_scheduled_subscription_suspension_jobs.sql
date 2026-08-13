SELECT jobid, jobname, schedule, command, active
FROM cron.job
WHERE jobname = 'suspend-expired-subscriptions';
