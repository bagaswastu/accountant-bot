-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Detail" (
    "name" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT,
    CONSTRAINT "Detail_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Detail" ("categoryId", "name") SELECT "categoryId", "name" FROM "Detail";
DROP TABLE "Detail";
ALTER TABLE "new_Detail" RENAME TO "Detail";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
