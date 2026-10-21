-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN "specialityId" TEXT;

-- CreateIndex
CREATE INDEX "Invitation_specialityId_idx" ON "Invitation"("specialityId");

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_specialityId_fkey" FOREIGN KEY ("specialityId") REFERENCES "Speciality"("id") ON DELETE SET NULL ON UPDATE CASCADE;
