/*
  Warnings:

  - You are about to drop the column `teacherId` on the `Task` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_teacherId_fkey";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "teacherId";
