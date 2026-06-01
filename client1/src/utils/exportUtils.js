import * as XLSX from 'xlsx';

/**
 * Export an array of objects to an Excel (.xlsx) file.
 * @param {Array} data - Array of objects to export
 * @param {string} filename - The name of the file (without .xlsx)
 */
export const exportToExcel = (data, filename) => {
    if (!data || (Array.isArray(data) && data.length === 0) || (typeof data === 'object' && Object.keys(data).length === 0)) {
        console.warn('No data to export');
        return;
    }

    const workbook = XLSX.utils.book_new();

    if (Array.isArray(data)) {
        // Single sheet
        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    } else {
        // Multiple sheets: data is an object { "Sheet1": [...], "Sheet2": [...] }
        for (const sheetName in data) {
            if (Array.isArray(data[sheetName]) && data[sheetName].length > 0) {
                const worksheet = XLSX.utils.json_to_sheet(data[sheetName]);
                XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31)); // Max sheet name length is 31
            }
        }
    }

    // Generate the Excel file and trigger download
    XLSX.writeFile(workbook, `${filename}.xlsx`);
};
