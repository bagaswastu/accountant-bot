-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Detail" (
    "name" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    CONSTRAINT "Detail_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "detailName" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    CONSTRAINT "Expense_detailName_fkey" FOREIGN KEY ("detailName") REFERENCES "Detail" ("name") ON DELETE RESTRICT ON UPDATE CASCADE
);
