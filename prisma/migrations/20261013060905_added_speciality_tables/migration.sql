-- CreateTable
CREATE TABLE "Speciality" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Speciality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSpeciality" (
    "userId" TEXT NOT NULL,
    "specialityId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSpeciality_pkey" PRIMARY KEY ("userId","specialityId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Speciality_code_key" ON "Speciality"("code");

-- CreateIndex
CREATE INDEX "UserSpeciality_specialityId_idx" ON "UserSpeciality"("specialityId");

-- AddForeignKey
ALTER TABLE "Speciality" ADD CONSTRAINT "Speciality_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSpeciality" ADD CONSTRAINT "UserSpeciality_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSpeciality" ADD CONSTRAINT "UserSpeciality_specialityId_fkey" FOREIGN KEY ("specialityId") REFERENCES "Speciality"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSpeciality" ADD CONSTRAINT "UserSpeciality_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
