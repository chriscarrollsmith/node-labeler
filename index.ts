// src/index.ts

// We assume PapaParse is available globally via the script tag in index.html.
// If you installed Papa Parse via npm, you can import it like:
// import Papa from 'papaparse';

interface CSVRow {
    [key: number]: string;  // index-based property
  }
  
  let parsedData: string[][] = []; // Will hold the CSV data as a 2D array
  
  const csvFileInput = document.getElementById('csvFileInput') as HTMLInputElement;
  const loadCsvBtn = document.getElementById('loadCsvBtn') as HTMLButtonElement;
  const downloadCsvBtn = document.getElementById('downloadCsvBtn') as HTMLButtonElement;
  const tableContainer = document.getElementById('tableContainer') as HTMLDivElement;
  
  loadCsvBtn.addEventListener('click', () => {
    if (!csvFileInput.files || csvFileInput.files.length === 0) {
      alert('Please select a CSV file first.');
      return;
    }
  
    const file = csvFileInput.files[0];
    if (!file) {
      alert('No file selected.');
      return;
    }
  
    Papa.parse(file, {
      complete: (results: Papa.ParseResult<string[]>) => {
        parsedData = results.data;
        // Render the table for annotation
        renderTable(parsedData);
        // Enable the download button once a file has been loaded
        downloadCsvBtn.disabled = false;
      },
      error: (err) => {
        console.error('Error parsing CSV:', err);
        alert('Error parsing CSV file.');
      }
    });
  });
  
  downloadCsvBtn.addEventListener('click', () => {
    // Convert updated table data to CSV
    const csv = Papa.unparse(parsedData);
    // Create a blob of the CSV data
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    // Create a temporary link to download the blob
    const url = URL.createObjectURL(blob);
  
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'annotated.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
  
  /**
   * Renders a table where:
   * - The first column is read-only (text data).
   * - Subsequent columns are editable input fields.
   */
  function renderTable(data: string[][]) {
    // Clear out any previous table
    tableContainer.innerHTML = '';
  
    // Create table element
    const table = document.createElement('table');
    table.border = '1';
    table.style.borderCollapse = 'collapse';
  
    // Generate the table header (optional; this assumes first row is header)
    // If your CSV has a header row, you can consider using it:
    // const headerRow = document.createElement('tr');
    // data[0].forEach((headerVal) => {
    //   const th = document.createElement('th');
    //   th.innerText = headerVal;
    //   headerRow.appendChild(th);
    // });
    // table.appendChild(headerRow);
  
    // If you have a header row, start from row index 1
    // But for simplicity, we'll assume no dedicated header row in this example:
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const row = document.createElement('tr');
  
      for (let colIndex = 0; colIndex < data[rowIndex].length; colIndex++) {
        const cell = document.createElement('td');
        cell.style.padding = '4px';
  
        // The first column is read-only text data:
        if (colIndex === 0) {
          cell.innerText = data[rowIndex][colIndex];
        } else {
          // The other columns can be edited by the user
          const input = document.createElement('input');
          input.type = 'text';
          input.value = data[rowIndex][colIndex];
          input.style.width = '100px';
  
          // Whenever user changes the input, update our parsedData array
          input.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            parsedData[rowIndex][colIndex] = target.value;
          });
  
          cell.appendChild(input);
        }
  
        row.appendChild(cell);
      }
  
      table.appendChild(row);
    }
  
    tableContainer.appendChild(table);
  }
  