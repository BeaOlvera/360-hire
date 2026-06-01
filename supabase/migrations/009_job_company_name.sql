-- Migration 009: add an optional company_name to jobs so invitation emails
-- can show "For ACME Corp" alongside the Zephyron Hire wordmark.
--
-- Surfaced by an independent code review after partner feedback round 2:
-- emailLogoHtml(company) was wired but every call site passed null because
-- the data model had no place to store the hiring company's name.

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS company_name TEXT;
