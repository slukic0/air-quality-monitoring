export const arrayToCSV = (arrays: any[]): string => {
    // Join each inner array with commas
    const csvRows = arrays.map(row => row.join(','));
  
    // Join rows with newline characters
    const csvString = csvRows.join('\n');
  
    return csvString;
  };