-- // Initialize Database - create a file called init.sql
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -- Enable Row Level Security
-- ALTER TABLE "Users" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Enrollment" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;

-- -- Create policies
-- CREATE POLICY "Users can only see their own data" ON "Users"
--   FOR ALL
--   USING (id = current_user_id());

-- CREATE POLICY "Users can only see their own enrollments" ON "Enrollment"
--   FOR ALL
--   USING (userId = current_user_id());

-- CREATE POLICY "Users can only see their own payments" ON "Payment"
--   FOR ALL
--   USING (enrollmentId IN (
--     SELECT id FROM "Enrollment" WHERE userId = current_user_id()
--   ));

-- -- Create function to get current user ID
-- CREATE OR REPLACE FUNCTION current_user_id()
-- RETURNS TEXT AS $$
-- BEGIN
--   RETURN current_setting('app.user_id', TRUE);
-- END;
-- $$ LANGUAGE plpgsql;

-- -- Create indexes for better performance
-- CREATE INDEX IF NOT EXISTS "User_email_idx" ON "Users"(email);
-- CREATE INDEX IF NOT EXISTS "Enrollment_userId_idx" ON "Enrollment"(userId);
-- CREATE INDEX IF NOT EXISTS "Payment_enrollmentId_idx" ON "Payment"(enrollmentId);
