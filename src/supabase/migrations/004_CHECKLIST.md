# Migration 004 - Implementation Checklist

Use this checklist to track your migration progress.

---

## ✅ Phase 1: Pre-Migration (30 minutes)

### Preparation
- [ ] Read `004_README.md` overview
- [ ] Read `004_MIGRATION_GUIDE.md` in detail
- [ ] Review `004_SCHEMA_DIAGRAM.md` for architecture understanding
- [ ] Backup production database
  ```bash
  # Supabase backup or:
  pg_dump $DATABASE_URL > analytics_backup_$(date +%Y%m%d).sql
  ```

### Environment Setup
- [ ] Set up staging/test database (if not already)
- [ ] Install Supabase CLI
  ```bash
  npm install -g supabase
  ```
- [ ] Verify database connection
  ```bash
  supabase db ping
  ```

### Baseline Metrics (document current state)
- [ ] Current `analytics_events` table size
  ```sql
  SELECT pg_size_pretty(pg_total_relation_size('analytics_events'));
  ```
- [ ] Current row count
  ```sql
  SELECT COUNT(*) FROM analytics_events;
  ```
- [ ] Current dashboard load time (measure in browser DevTools)
- [ ] Current write volume per day
  ```sql
  SELECT 
    DATE(created_at) as date,
    COUNT(*) as events
  FROM analytics_events
  WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY DATE(created_at)
  ORDER BY date DESC;
  ```

---

## ✅ Phase 2: Apply Migration (15 minutes)

### On Staging/Test First
- [ ] Apply migration to staging database
  ```bash
  # Test environment
  supabase db push --db-url $STAGING_DATABASE_URL
  ```
- [ ] Verify tables created
  ```sql
  SELECT tablename FROM pg_tables 
  WHERE tablename LIKE 'analytics_%'
  ORDER BY tablename;
  ```
- [ ] Verify indexes created
  ```sql
  SELECT tablename, indexname 
  FROM pg_indexes 
  WHERE tablename LIKE 'analytics_%'
  ORDER BY tablename, indexname;
  ```
- [ ] Verify functions created
  ```sql
  SELECT proname, prosrc 
  FROM pg_proc 
  WHERE proname LIKE '%analytics%';
  ```
- [ ] Check for migration errors in logs
- [ ] Test rollback procedure (if migration fails)

### On Production
- [ ] Schedule maintenance window (optional - zero downtime)
- [ ] Apply migration to production
  ```bash
  supabase db push
  # or
  psql $DATABASE_URL < supabase/migrations/004_analytics_scalable_schema.sql
  ```
- [ ] Verify all tables created (same queries as staging)
- [ ] Check table sizes
  ```sql
  SELECT * FROM analytics_table_sizes;
  ```
- [ ] Check summary
  ```sql
  SELECT * FROM analytics_summary;
  ```

### Verification
- [ ] No errors in Supabase logs
- [ ] All 7 tables exist
- [ ] All indexes created (20+)
- [ ] RLS enabled on all tables
  ```sql
  SELECT tablename, rowsecurity 
  FROM pg_tables 
  WHERE tablename LIKE 'analytics_%';
  ```
- [ ] Helper functions work
  ```sql
  SELECT aggregate_analytics_daily()::JSON;
  ```

---

## ✅ Phase 3: Ingestion Server (2-4 hours)

### Development
- [ ] Create ingestion server code (will be provided next)
- [ ] Set up local development environment
  ```bash
  cd analytics-server
  npm install
  ```
- [ ] Configure environment variables
  ```
  SUPABASE_URL=your_supabase_url
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
  PORT=3001
  ```
- [ ] Test locally
  ```bash
  npm run dev
  ```
- [ ] Send test events
  ```bash
  curl -X POST http://localhost:3001/api/analytics/ingest \
    -H "Content-Type: application/json" \
    -d '{"events": [...]}'
  ```
- [ ] Verify data appears in database

### Deployment (choose one)

#### Option A: Railway
- [ ] Create Railway account
- [ ] Connect GitHub repository
- [ ] Deploy server
- [ ] Configure environment variables in Railway dashboard
- [ ] Test production endpoint
- [ ] Note ingestion URL: `https://your-app.railway.app/api/analytics/ingest`

#### Option B: Render
- [ ] Create Render account
- [ ] Create new Web Service
- [ ] Connect repository
- [ ] Configure environment variables
- [ ] Deploy
- [ ] Test production endpoint
- [ ] Note ingestion URL: `https://your-app.onrender.com/api/analytics/ingest`

#### Option C: Fly.io
- [ ] Install Fly CLI
- [ ] Create Fly app
- [ ] Deploy with `fly deploy`
- [ ] Set secrets with `fly secrets set`
- [ ] Test production endpoint
- [ ] Note ingestion URL: `https://your-app.fly.dev/api/analytics/ingest`

### Verification
- [ ] Server responds to health check: `GET /health`
- [ ] Server accepts POST requests
- [ ] Events written to database
- [ ] No errors in server logs
- [ ] Measure ingestion latency (should be <100ms)

---

## ✅ Phase 4: Client Code Update (2-3 hours)

### Create Batcher
- [ ] Create `/utils/analytics-batcher.ts` (will be provided next)
- [ ] Configure ingestion URL in environment variables
  ```
  VITE_ANALYTICS_INGESTION_URL=https://your-server.com/api/analytics/ingest
  ```

### Update Analytics Utils
- [ ] Update `/utils/analytics.ts`
  - [ ] Import batcher
  - [ ] Replace `api.analytics.track()` with `analyticsBatcher.trackSession()`
  - [ ] Replace page view tracking
  - [ ] Replace click tracking
- [ ] Update `/hooks/useAnalytics.ts`
  - [ ] Use new batcher methods
  - [ ] Keep session management logic

### Testing
- [ ] Test session tracking in dev
- [ ] Test page view tracking
- [ ] Test click tracking
- [ ] Check network tab for batched requests
- [ ] Verify events arrive in database
- [ ] Test batch timeout (10 seconds)
- [ ] Test batch size limit (20 events)

### Deployment
- [ ] Deploy client code to staging
- [ ] Test end-to-end on staging
- [ ] Fix any bugs
- [ ] Deploy to production
- [ ] Monitor for errors

---

## ✅ Phase 5: Aggregation Setup (30 minutes)

### Option A: pg_cron (if available)
- [ ] Check if pg_cron was scheduled
  ```sql
  SELECT * FROM cron.job WHERE jobname = 'aggregate-analytics-daily';
  ```
- [ ] If not scheduled, run:
  ```sql
  SELECT cron.schedule(
    'aggregate-analytics-daily',
    '0 2 * * *',
    $$SELECT aggregate_analytics_daily()$$
  );
  ```
- [ ] Verify schedule
- [ ] Wait for first run (or trigger manually)
- [ ] Check run history
  ```sql
  SELECT * FROM cron.job_run_details 
  WHERE jobname = 'aggregate-analytics-daily'
  ORDER BY start_time DESC;
  ```

### Option B: GitHub Actions (if pg_cron not available)
- [ ] Create `.github/workflows/aggregate-analytics.yml`
  ```yaml
  name: Aggregate Analytics
  on:
    schedule:
      - cron: '0 2 * * *'
    workflow_dispatch:
  jobs:
    aggregate:
      runs-on: ubuntu-latest
      steps:
        - name: Run aggregation
          run: |
            psql ${{ secrets.DATABASE_URL }} \
              -c "SELECT aggregate_analytics_daily();"
  ```
- [ ] Add `DATABASE_URL` secret to GitHub
- [ ] Test with manual trigger (workflow_dispatch)
- [ ] Verify aggregation ran successfully
- [ ] Check data in aggregated tables

### Option C: Vercel Cron
- [ ] Create `/api/cron/aggregate-analytics.ts`
- [ ] Add cron config to `vercel.json`
- [ ] Deploy
- [ ] Test endpoint
- [ ] Verify aggregation works

### Verification
- [ ] Aggregation function runs without errors
- [ ] Data appears in aggregated tables
  ```sql
  SELECT * FROM analytics_daily_user_stats 
  ORDER BY date DESC LIMIT 10;
  ```
- [ ] Backfill historical data (if needed)
  ```sql
  SELECT backfill_aggregates(
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE - INTERVAL '1 day'
  );
  ```

---

## ✅ Phase 6: Dashboard Updates (2-3 hours)

### Create New API Layer
- [ ] Create `/lib/api-analytics.ts` (will be provided next)
- [ ] Implement fast queries using aggregated tables
- [ ] Test all query functions

### Update Dashboard Hook
- [ ] Update `/hooks/useAnalyticsDashboard.ts`
- [ ] Replace old queries with new API
- [ ] Maintain same data structure for components
- [ ] Test with different filters (period, group, contact)

### Update Dashboard Component (minimal changes)
- [ ] Verify `/components/cms/AnalyticsDashboard.tsx` still works
- [ ] May need minor adjustments for new data structure
- [ ] Test all features:
  - [ ] Overall metrics tiles
  - [ ] Page breakdown cards
  - [ ] Top contact methods
  - [ ] Filter by period
  - [ ] Filter by group
  - [ ] Filter by contact

### Testing
- [ ] Load dashboard - measure time (should be <100ms)
- [ ] Test all date ranges (7d, 30d, 90d, all)
- [ ] Test group filtering
- [ ] Test contact filtering
- [ ] Compare metrics with old system
- [ ] Verify accuracy

---

## ✅ Phase 7: Parallel Testing (1-2 weeks)

### Run Both Systems
- [ ] Keep old `analytics_events` table (read-only)
- [ ] New system writes to new tables
- [ ] Dashboard can query both for comparison

### Daily Checks
- [ ] Compare total views (old vs new)
- [ ] Compare total clicks (old vs new)
- [ ] Compare session counts
- [ ] Check for discrepancies
- [ ] Monitor ingestion server logs
- [ ] Monitor aggregation success
- [ ] Check database load/performance

### Metrics to Track
- [ ] Dashboard load time improvement
- [ ] Database write reduction
- [ ] Storage usage
- [ ] Query performance
- [ ] Error rates
- [ ] User complaints (should be zero!)

---

## ✅ Phase 8: Cleanup & Finalization (1 hour)

### After Successful Testing
- [ ] Archive old `analytics_events` data
  ```sql
  CREATE TABLE analytics_events_archive AS 
  SELECT * FROM analytics_events;
  ```
- [ ] Stop writes to old table (already done if client updated)
- [ ] Remove old analytics code from codebase
- [ ] Drop old table (after 100% confidence)
  ```sql
  DROP TABLE analytics_events;
  ```

### Documentation
- [ ] Update project README
- [ ] Document new analytics architecture
- [ ] Create runbook for ops team
- [ ] Document aggregation schedule
- [ ] Document ingestion server deployment

### Monitoring Setup
- [ ] Set up alerts for aggregation failures
- [ ] Set up alerts for ingestion server downtime
- [ ] Monitor dashboard performance
- [ ] Track storage growth

---

## ✅ Phase 9: Optimization (Ongoing)

### Performance Tuning
- [ ] Monitor slow queries
- [ ] Add indexes if needed
- [ ] Adjust batch sizes if needed
- [ ] Tune aggregation schedule if needed

### Data Retention
- [ ] Set up automated cleanup
  ```sql
  -- Schedule weekly cleanup (if using pg_cron)
  SELECT cron.schedule(
    'cleanup-old-analytics',
    '0 3 * * 0', -- Sunday 3 AM
    $$SELECT cleanup_old_raw_events(90)$$
  );
  ```
- [ ] Monitor storage usage
- [ ] Adjust retention period if needed (currently 90 days)

### Scaling Preparation
- [ ] Consider table partitioning if traffic grows 10x
- [ ] Consider read replicas for analytics queries
- [ ] Monitor ingestion server capacity
- [ ] Plan for horizontal scaling if needed

---

## 🎉 Success Criteria

Mark complete when ALL of these are true:

- [ ] Dashboard loads in <100ms ✨
- [ ] Database writes reduced by 90%+ ✨
- [ ] All dashboard features work ✨
- [ ] Data accuracy verified ✨
- [ ] No errors in logs ✨
- [ ] Team trained on new system ✨
- [ ] Documentation complete ✨
- [ ] Monitoring in place ✨

---

## 📊 Metrics Before/After

Record your improvements:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Dashboard Load Time | ___ms | ___ms | ___x faster |
| DB Writes per Day | _____ | _____ | ___% reduction |
| Storage Size (30d) | ___MB | ___MB | ___% smaller |
| Query Row Count | _____ | _____ | ___x fewer |

---

## 🆘 Rollback Procedure

If critical issues occur:

1. [ ] Stop ingestion server
2. [ ] Revert client code to previous version
3. [ ] Point dashboard back to `analytics_events`
4. [ ] Investigate issues
5. [ ] Fix problems
6. [ ] Retry migration when ready

Optional - Remove new tables:
```sql
DROP TABLE IF EXISTS analytics_sessions CASCADE;
DROP TABLE IF EXISTS analytics_page_views CASCADE;
DROP TABLE IF EXISTS analytics_clicks CASCADE;
DROP TABLE IF EXISTS analytics_daily_user_stats CASCADE;
DROP TABLE IF EXISTS analytics_daily_group_stats CASCADE;
DROP TABLE IF EXISTS analytics_daily_click_targets CASCADE;
DROP TABLE IF EXISTS analytics_daily_page_stats CASCADE;
```

---

## 📝 Notes

Use this space to track issues, decisions, and learnings:

```
Date: _______________
Issue: _______________________________________________
Resolution: __________________________________________

Date: _______________
Issue: _______________________________________________
Resolution: __________________________________________

Date: _______________
Issue: _______________________________________________
Resolution: __________________________________________
```

---

**Start Date:** _______________
**Target Completion:** _______________
**Actual Completion:** _______________

**Team Members:**
- Migration Lead: _______________
- Backend Dev: _______________
- Frontend Dev: _______________
- DevOps: _______________

**Status:** [ ] Not Started [ ] In Progress [ ] Testing [ ] Complete

---

Good luck with your migration! 🚀
