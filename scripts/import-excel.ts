import { PrismaClient, DocumentType, VatType, DocumentStatus } from "@prisma/client";
import * as XLSX from "xlsx";
import * as path from "path";

const prisma = new PrismaClient();

const EXCEL_DIR = "/Users/hearhui/Documents/KPI's2019/ขายส่งอุปกรณ์กีฬา/ระบบ มีดี สปอร์ต";
const STOCK_FILE = path.join(EXCEL_DIR, "Stock อุปกรณ์กีฬา_18022026.xlsx");
const VAT_FILE = path.join(EXCEL_DIR, "Vat มีดี สปอร์ต - 2026.xlsx");

function readSheet(filePath: string, sheetName: string): any[][] {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Sheet "${sheetName}" not found in ${filePath}`);
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
}

// ═══════════════════════════════════════════
// 1. IMPORT COMPANY INFO
// ═══════════════════════════════════════════
async function importCompanyInfo() {
  console.log("📦 Importing company info...");
  const rows = readSheet(VAT_FILE, "MY_INFO");

  const info: Record<string, string> = {};
  for (const row of rows) {
    if (row[0] && row[1]) info[String(row[0])] = String(row[1]);
  }

  await prisma.companyInfo.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: info["ENTITY_NAME"] || "บริษัท มีดี สปอร์ต จำกัด (สำนักงานใหญ่)",
      nameEn: "MEDE SPORT CO.,LTD (Head Office)",
      address1: info["ADDRESS_LINE1"] || "339/303 ซอยเพชรเกษม 69 แยก 5",
      address2: info["ADDRESS_LINE2"] || "",
      subdistrict: info["AREA_SUBDISTRICT"] || "แขวงหลักสอง",
      district: info["CITY_DISTRICT"] || "เขตบางแค",
      province: info["STATE_PROVINCE"] || "กรุงเทพมหานคร",
      postalCode: info["POSTAL_CODE"] || "10160",
      taxId: info["LAST_NAME"] || "0105563110337",
      phone: info["PHONE"] || "087-0356821",
    },
  });
  console.log("  ✅ Company info imported");
}

// ═══════════════════════════════════════════
// 2. IMPORT CUSTOMERS
// ═══════════════════════════════════════════
async function importCustomers() {
  console.log("👥 Importing customers...");
  const rows = readSheet(VAT_FILE, "CUSTOMERS");

  let count = 0;
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const code = String(row[0] || "").trim();
    const name = String(row[1] || "").trim();
    if (!code || !name) continue;

    await prisma.customer.upsert({
      where: { customerCode: code },
      update: {
        name,
        addressLine1: String(row[2] || "") || null,
        addressLine2: String(row[3] || "") || null,
        subdistrict: String(row[4] || "") || null,
        district: String(row[5] || "") || null,
        province: String(row[6] || "") || null,
        country: String(row[7] || "") || "ประเทศไทย",
        postalCode: String(row[8] || "") || null,
        taxId: String(row[9] || "") || null,
        phone: String(row[10] || "") || null,
        fax: String(row[11] || "") || null,
      },
      create: {
        customerCode: code,
        name,
        addressLine1: String(row[2] || "") || null,
        addressLine2: String(row[3] || "") || null,
        subdistrict: String(row[4] || "") || null,
        district: String(row[5] || "") || null,
        province: String(row[6] || "") || null,
        country: String(row[7] || "") || "ประเทศไทย",
        postalCode: String(row[8] || "") || null,
        taxId: String(row[9] || "") || null,
        phone: String(row[10] || "") || null,
        fax: String(row[11] || "") || null,
      },
    });
    count++;
  }
  console.log(`  ✅ ${count} customers imported`);
}

// ═══════════════════════════════════════════
// 3. IMPORT PRODUCTS & INVENTORY (from Stock file)
// ═══════════════════════════════════════════
async function importProductsAndInventory() {
  console.log("📦 Importing products & inventory...");
  const rows = readSheet(STOCK_FILE, "Inventory 2026 ok");

  // Collect unique locations
  const locationSet = new Set<string>();
  // Collect products (dedup by name since product_code is generated)
  const productMap = new Map<
    string,
    {
      name: string;
      unit: string;
      sellingPrice: number;
      costPrice: number;
      locations: { code: string; quantity: number; updatedAt: string }[];
    }
  >();

  for (let i = 4; i < rows.length; i++) {
    const row = rows[i];
    const name = String(row[1] || "").trim();
    if (!name) continue;

    const unit = String(row[3] || "อัน").trim();
    const sellingPrice = parseFloat(row[4]) || 0;
    const costPrice = parseFloat(row[8]) || 0;
    const quantity = parseInt(row[7]) || 0;
    const updatedAt = String(row[9] || "");
    const location = String(row[10] || "").trim() || "ไม่ระบุ";

    if (location) locationSet.add(location);

    if (!productMap.has(name)) {
      productMap.set(name, {
        name,
        unit,
        sellingPrice,
        costPrice,
        locations: [],
      });
    }

    const product = productMap.get(name)!;
    // Update price to latest
    if (sellingPrice > 0) product.sellingPrice = sellingPrice;
    if (costPrice > 0) product.costPrice = costPrice;

    product.locations.push({ code: location, quantity, updatedAt });
  }

  // Create locations
  console.log(`  📍 Creating ${locationSet.size} locations...`);
  for (const code of locationSet) {
    await prisma.location.upsert({
      where: { code },
      update: {},
      create: { code, name: code },
    });
  }

  // Create products & inventory
  let productCount = 0;
  let inventoryCount = 0;
  let idx = 0;

  for (const [, prod] of productMap) {
    idx++;
    const productCode = `PRD${String(idx).padStart(6, "0")}`;

    const dbProduct = await prisma.product.upsert({
      where: { productCode },
      update: {
        name: prod.name,
        unit: prod.unit,
        sellingPrice: prod.sellingPrice,
        costPrice: prod.costPrice,
      },
      create: {
        productCode,
        name: prod.name,
        unit: prod.unit,
        sellingPrice: prod.sellingPrice,
        costPrice: prod.costPrice,
      },
    });
    productCount++;

    // Create inventory per location
    for (const loc of prod.locations) {
      const location = await prisma.location.findUnique({
        where: { code: loc.code },
      });
      if (!location) continue;

      await prisma.inventory.upsert({
        where: {
          productId_locationId: {
            productId: dbProduct.id,
            locationId: location.id,
          },
        },
        update: { quantity: loc.quantity },
        create: {
          productId: dbProduct.id,
          locationId: location.id,
          quantity: loc.quantity,
        },
      });
      inventoryCount++;
    }
  }

  console.log(`  ✅ ${productCount} products imported`);
  console.log(`  ✅ ${inventoryCount} inventory records imported`);
}

// ═══════════════════════════════════════════
// 4. IMPORT DOCUMENTS (Quotations & Invoices)
// ═══════════════════════════════════════════
async function importDocuments() {
  console.log("📄 Importing documents...");

  // Import Quotation headers
  const qtHeaders = readSheet(VAT_FILE, "DOC_H เสนอราคา");
  let qtCount = 0;

  for (let i = 7; i < qtHeaders.length; i++) {
    const row = qtHeaders[i];
    const docNo = String(row[0] || "").trim();
    if (!docNo || !docNo.startsWith("QT")) continue;

    const customerCode = String(row[2] || "").trim();
    if (!customerCode) continue;

    const customer = await prisma.customer.findUnique({
      where: { customerCode },
    });
    if (!customer) continue;

    const dateVal = row[1];
    let docDate: Date;
    if (dateVal instanceof Date) {
      docDate = dateVal;
    } else if (typeof dateVal === "number") {
      docDate = XLSX.SSF.parse_date_code(dateVal) as unknown as Date;
      const parsed = XLSX.SSF.parse_date_code(dateVal);
      docDate = new Date(parsed.y, parsed.m - 1, parsed.d);
    } else {
      docDate = new Date(String(dateVal));
    }
    if (isNaN(docDate.getTime())) docDate = new Date();

    let validUntil: Date | null = null;
    if (row[3]) {
      if (typeof row[3] === "number") {
        const parsed = XLSX.SSF.parse_date_code(row[3]);
        validUntil = new Date(parsed.y, parsed.m - 1, parsed.d);
      } else {
        validUntil = new Date(String(row[3]));
      }
      if (isNaN(validUntil.getTime())) validUntil = null;
    }

    const paymentTerm = String(row[4] || "Cash").trim() || "Cash";

    // Determine VAT type from document number pattern
    let vatType: VatType = VatType.IN_VAT;
    const referenceNo = String(row[4] || "").trim() || null;

    try {
      await prisma.document.upsert({
        where: { documentNo: docNo },
        update: {},
        create: {
          documentNo: docNo,
          documentType: DocumentType.QUOTATION,
          customerId: customer.id,
          date: docDate,
          validUntil,
          paymentTerm,
          vatType,
          status: DocumentStatus.SENT,
          referenceNo,
        },
      });
      qtCount++;
    } catch (e) {
      // Skip duplicates or errors
    }
  }
  console.log(`  ✅ ${qtCount} quotations imported`);

  // Import Invoice headers
  const invHeaders = readSheet(VAT_FILE, "DOC_H Invoice");
  let invCount = 0;

  for (let i = 7; i < invHeaders.length; i++) {
    const row = invHeaders[i];
    const docNo = String(row[0] || "").trim();
    if (!docNo || !docNo.startsWith("INV")) continue;

    const customerCode = String(row[2] || "").trim();
    if (!customerCode) continue;

    const customer = await prisma.customer.findUnique({
      where: { customerCode },
    });
    if (!customer) continue;

    const dateVal = row[1];
    let docDate: Date;
    if (typeof dateVal === "number") {
      const parsed = XLSX.SSF.parse_date_code(dateVal);
      docDate = new Date(parsed.y, parsed.m - 1, parsed.d);
    } else {
      docDate = new Date(String(dateVal));
    }
    if (isNaN(docDate.getTime())) docDate = new Date();

    const referenceNo = String(row[4] || "").trim() || null;

    // Link to parent quotation if reference exists
    let parentDocumentId: number | null = null;
    if (referenceNo) {
      const parentDoc = await prisma.document.findUnique({
        where: { documentNo: referenceNo },
      });
      if (parentDoc) parentDocumentId = parentDoc.id;
    }

    let vatType: VatType = VatType.IN_VAT;
    const paymentTerm = String(row[4] || "Cash").trim() || "Cash";

    try {
      await prisma.document.upsert({
        where: { documentNo: docNo },
        update: {},
        create: {
          documentNo: docNo,
          documentType: DocumentType.INVOICE,
          parentDocumentId,
          customerId: customer.id,
          date: docDate,
          paymentTerm,
          vatType,
          status: DocumentStatus.SENT,
          referenceNo,
        },
      });
      invCount++;
    } catch (e) {
      // Skip
    }
  }
  console.log(`  ✅ ${invCount} invoices imported`);

  // Import Document Items (DOC_D)
  const docItems = readSheet(VAT_FILE, "DOC_D");
  let itemCount = 0;

  for (let i = 1; i < docItems.length; i++) {
    const row = docItems[i];
    const docNo = String(row[1] || "").trim();
    if (!docNo) continue;

    const document = await prisma.document.findUnique({
      where: { documentNo: docNo },
    });
    if (!document) continue;

    const itemNo = parseInt(row[2]) || 1;
    const description = String(row[3] || "").trim();
    if (!description) continue;

    const unitPrice = parseFloat(row[4]) || 0;
    const quantity = parseFloat(row[5]) || 0;
    const amount = parseFloat(row[6]) || 0;

    try {
      await prisma.documentItem.create({
        data: {
          documentId: document.id,
          itemNo,
          description,
          unitPrice,
          quantity,
          amount,
        },
      });
      itemCount++;
    } catch (e) {
      // Skip
    }
  }
  console.log(`  ✅ ${itemCount} document items imported`);

  // Update document totals
  const docs = await prisma.document.findMany({
    include: { items: true },
  });
  for (const doc of docs) {
    const subtotal = doc.items.reduce(
      (sum, item) => sum + Number(item.amount),
      0
    );
    const vatAmount =
      doc.vatType === "EX_VAT"
        ? subtotal * (Number(doc.vatRate) / 100)
        : doc.vatType === "IN_VAT"
          ? subtotal - subtotal / (1 + Number(doc.vatRate) / 100)
          : 0;
    const total =
      doc.vatType === "EX_VAT" ? subtotal + vatAmount : subtotal;

    await prisma.document.update({
      where: { id: doc.id },
      data: { subtotal, vatAmount, total },
    });
  }
  console.log("  ✅ Document totals updated");
}

// ═══════════════════════════════════════════
// 5. IMPORT BILLING NOTES
// ═══════════════════════════════════════════
async function importBillingNotes() {
  console.log("📋 Importing billing notes...");
  const rows = readSheet(VAT_FILE, "เลขที่ใบวางบิล");

  let count = 0;
  for (let i = 7; i < rows.length; i++) {
    const row = rows[i];
    const billingNo = String(row[0] || "").trim();
    if (!billingNo || !billingNo.startsWith("BN")) continue;

    const customerCode = String(row[2] || "").trim();
    if (!customerCode) continue;

    const customer = await prisma.customer.findUnique({
      where: { customerCode },
    });
    if (!customer) continue;

    const dateVal = row[1];
    let docDate: Date;
    if (typeof dateVal === "number") {
      const parsed = XLSX.SSF.parse_date_code(dateVal);
      docDate = new Date(parsed.y, parsed.m - 1, parsed.d);
    } else {
      docDate = new Date(String(dateVal));
    }
    if (isNaN(docDate.getTime())) docDate = new Date();

    let dueDate: Date | null = null;
    if (row[3]) {
      if (typeof row[3] === "number") {
        const parsed = XLSX.SSF.parse_date_code(row[3]);
        dueDate = new Date(parsed.y, parsed.m - 1, parsed.d);
      } else {
        dueDate = new Date(String(row[3]));
      }
      if (isNaN(dueDate.getTime())) dueDate = null;
    }

    // Reference is the Invoice number
    const invoiceNo = String(row[4] || "").trim();

    try {
      const billingNote = await prisma.billingNote.upsert({
        where: { billingNo },
        update: {},
        create: {
          billingNo,
          customerId: customer.id,
          date: docDate,
          dueDate,
        },
      });

      // Link to invoice
      if (invoiceNo) {
        const invoice = await prisma.document.findUnique({
          where: { documentNo: invoiceNo },
        });
        if (invoice) {
          const existing = await prisma.billingNoteItem.findFirst({
            where: {
              billingNoteId: billingNote.id,
              documentId: invoice.id,
            },
          });
          if (!existing) {
            await prisma.billingNoteItem.create({
              data: {
                billingNoteId: billingNote.id,
                documentId: invoice.id,
              },
            });
          }
        }
      }
      count++;
    } catch (e) {
      // Skip
    }
  }
  console.log(`  ✅ ${count} billing notes imported`);
}

// ═══════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════
async function main() {
  console.log("🚀 Starting MEDE SPORT data import...");
  console.log(`📁 Stock file: ${STOCK_FILE}`);
  console.log(`📁 Vat file: ${VAT_FILE}`);
  console.log("");

  await importCompanyInfo();
  await importCustomers();
  await importProductsAndInventory();
  await importDocuments();
  await importBillingNotes();

  console.log("\n🎉 Import completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Import failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
