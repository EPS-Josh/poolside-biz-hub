import { Header } from "@/components/Header";
import { Pool360CsvImport } from "@/components/Pool360CsvImport";

export default function Pool360Import() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Pool360 Catalog Import</h1>
          <p className="text-muted-foreground mt-2">
            Import Pool360 catalog data from CSV. Export your 167MB Excel file to smaller CSV chunks.
          </p>
        </div>
        <Pool360CsvImport />
      </div>
    </div>
  );
}