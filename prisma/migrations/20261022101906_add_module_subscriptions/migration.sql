-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY');

-- CreateTable
CREATE TABLE "erp_modules" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "base_monthly_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "per_user_monthly_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "erp_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "billing_interval" "BillingInterval" NOT NULL DEFAULT 'MONTHLY',
    "licensed_user_limit" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "per_user_monthly_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "starts_at" TIMESTAMP(3),
    "current_period_start" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_modules" (
    "id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "base_monthly_price" DECIMAL(12,2) NOT NULL,
    "per_user_monthly_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_modules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "erp_modules_key_key" ON "erp_modules"("key");

-- CreateIndex
CREATE INDEX "subscriptions_organization_id_status_idx" ON "subscriptions"("organization_id", "status");

-- CreateIndex
CREATE INDEX "subscriptions_current_period_end_idx" ON "subscriptions"("current_period_end");

-- CreateIndex
CREATE INDEX "subscription_modules_module_id_idx" ON "subscription_modules"("module_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_modules_subscription_id_module_id_key" ON "subscription_modules"("subscription_id", "module_id");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_modules" ADD CONSTRAINT "subscription_modules_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_modules" ADD CONSTRAINT "subscription_modules_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "erp_modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
