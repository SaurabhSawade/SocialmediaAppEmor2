-- CreateTable
CREATE TABLE "RevokedAccessToken" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevokedAccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RevokedAccessToken_token_key" ON "RevokedAccessToken"("token");

-- CreateIndex
CREATE INDEX "RevokedAccessToken_userId_idx" ON "RevokedAccessToken"("userId");

-- CreateIndex
CREATE INDEX "RevokedAccessToken_token_idx" ON "RevokedAccessToken"("token");

-- CreateIndex
CREATE INDEX "RevokedAccessToken_expiresAt_idx" ON "RevokedAccessToken"("expiresAt");
