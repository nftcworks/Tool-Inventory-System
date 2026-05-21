/**
 * 
 * Instructions PREEEEEEEEEEEEEEEEEEEEEEE:
 * 1. Open your Google Sheet.
 * 2. Click Extensions > Apps Script.
 * 3. Delete any existing code and paste this entire script.
 * 4. Click "Deploy" (top right) > "New deployment".
 * 5. Select type: "Web app".
 * 6. Execute as: "Me".
 * 7. Who has access: "Anyone".
 * 8. Click Deploy. Authorize the script if asked.
 * 9. Copy the generated "Web app URL" and paste it into the Tool Inventory System settings.
 */

// ========== GET: Look up a user or a tool ==========
function doGet(e) {
  try {
    const action = e.parameter.action || 'lookup';
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'lookup') {
      const studentId = (e.parameter.studentId || '').trim().toUpperCase();
      if (!studentId) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Missing studentId parameter" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      // Check if "Users" tab exists
      let usersSheet = ss.getSheetByName("Users");
      if (!usersSheet) {
        // No Users tab yet — user is new
        return ContentService.createTextOutput(JSON.stringify({ status: "not_found" }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const data = usersSheet.getDataRange().getValues();
      // Header row is index 0; student number is column 0
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim().toUpperCase() === studentId) {
          return ContentService.createTextOutput(JSON.stringify({
            status: "found",
            user: {
              studentNumber: data[i][0],
              name: data[i][1],
              course: data[i][2],
              section: data[i][3],
              instructor: data[i][4],
              subject: data[i][5]
            }
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }

      // Not found
      return ContentService.createTextOutput(JSON.stringify({ status: "not_found" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'toolLookup') {
      const barcode = (e.parameter.barcode || '').trim().toLowerCase();
      if (!barcode) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Missing barcode parameter" }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      let invSheet = ss.getSheetByName("Inventory");
      if (!invSheet) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Inventory sheet tab not found" }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const data = invSheet.getDataRange().getValues();
      if (data.length < 2) {
        return ContentService.createTextOutput(JSON.stringify({ status: "not_found" }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const headers = data[0].map(h => String(h).trim().toLowerCase());
      const idIdx = headers.indexOf('id');
      const nameIdx = headers.indexOf('name');
      const barcodeIdx = headers.indexOf('barcode');
      const categoryIdx = headers.indexOf('category');
      const iconIdx = headers.indexOf('icon');
      const descIdx = headers.indexOf('description');
      const specsIdx = headers.indexOf('specs');

      if (barcodeIdx === -1) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Barcode column not found in Inventory sheet" }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (String(row[barcodeIdx]).trim().toLowerCase() === barcode) {
          const tool = {
            id: idIdx !== -1 ? String(row[idIdx]).trim() : "",
            name: nameIdx !== -1 ? String(row[nameIdx]).trim() : "",
            barcode: String(row[barcodeIdx]).trim(),
            category: categoryIdx !== -1 ? String(row[categoryIdx]).trim() : "General",
            icon: iconIdx !== -1 ? String(row[iconIdx]).trim() : "🔧",
            description: descIdx !== -1 ? String(row[descIdx]).trim() : "",
            specs: specsIdx !== -1 ? String(row[specsIdx]).trim() : ""
          };
          return ContentService.createTextOutput(JSON.stringify({
            status: "found",
            tool: tool
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }

      return ContentService.createTextOutput(JSON.stringify({ status: "not_found" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Invalid request" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ========== POST: Record transaction + save/update user profile ==========
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // --- 1. Save or update user in "Users" tab ---
    let usersSheet = ss.getSheetByName("Users");
    if (!usersSheet) {
      usersSheet = ss.insertSheet("Users");
      const userHeaders = ["Student Number", "Name", "Course", "Section", "Instructor", "Subject", "Last Active"];
      usersSheet.appendRow(userHeaders);
      const headerRange = usersSheet.getRange(1, 1, 1, userHeaders.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#f3f3f3");
      usersSheet.setFrozenRows(1);
    }

    // Check if user already exists and update, or add new row
    const studentId = (data.studentNumber || '').trim().toUpperCase();
    const usersData = usersSheet.getDataRange().getValues();
    let userRowIndex = -1;
    for (let i = 1; i < usersData.length; i++) {
      if (String(usersData[i][0]).trim().toUpperCase() === studentId) {
        userRowIndex = i + 1; // Sheets are 1-indexed
        break;
      }
    }

    const userRow = [
      data.studentNumber || "",
      data.studentName || "",
      data.course || "",
      data.section || "",
      data.professor || "",
      data.subject || "",
      new Date().toISOString()
    ];

    if (userRowIndex > 0) {
      // Update existing user row
      usersSheet.getRange(userRowIndex, 1, 1, userRow.length).setValues([userRow]);
    } else {
      // New user — append
      usersSheet.appendRow(userRow);
    }

    // --- 2. Record the transaction in "Transactions" tab ---
    let txnSheet = ss.getSheetByName("Transactions");
    if (!txnSheet) {
      txnSheet = ss.insertSheet("Transactions");
      const headers = [
        "Timestamp", "Transaction ID", "Student Number", "Student Name",
        "Course", "Section", "Professor", "Subject", "Borrowed Tools", "Status"
      ];
      txnSheet.appendRow(headers);
      const headerRange = txnSheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#f3f3f3");
      txnSheet.setFrozenRows(1);
    }

    // Format cart items
    let toolsString = "";
    if (data.cart && data.cart.length > 0) {
      toolsString = data.cart.map(item => `${item.quantity}x ${item.tool.name} (${item.tool.id})`).join("\n");
    }

    txnSheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.transactionId || "",
      data.studentNumber || "",
      data.studentName || "",
      data.course || "",
      data.section || "",
      data.professor || "",
      data.subject || "",
      toolsString,
      "Active"
    ]);

    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Transaction recorded and user profile saved." }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
