-- Prevent a user from belonging to more than one team.
-- Keep the earliest membership when legacy data contains duplicates.
DELETE FROM "TeamMember" older
USING "TeamMember" newer
WHERE older."userId" = newer."userId"
  AND (older."joinedAt" > newer."joinedAt"
    OR (older."joinedAt" = newer."joinedAt" AND older."teamId" > newer."teamId"));

CREATE UNIQUE INDEX "TeamMember_userId_key" ON "TeamMember"("userId");
