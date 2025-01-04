// src/index.ts

// We assume PapaParse is available globally via the script tag in index.html.
// If you installed Papa Parse via npm, you can import it like:
// import Papa from 'papaparse';

interface CSVRow {
    [key: number]: string;  // index-based property
  }
  
  let parsedData: string[][] = []; // Will hold the CSV data as a 2D array
  
  interface ColumnConfig {
    categorical: boolean;
    values?: string[];
  }
  
  let columnConfigs: ColumnConfig[] = [];
  let currentEditingColumn: number = -1;
  
  // Wrap DOM interactions in DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    const csvFileInput = document.getElementById('csvFileInput') as HTMLInputElement;
    const loadCsvBtn = document.getElementById('loadCsvBtn') as HTMLButtonElement;
    const downloadCsvBtn = document.getElementById('downloadCsvBtn') as HTMLButtonElement;
    const tableContainer = document.getElementById('tableContainer') as HTMLDivElement;
    const categoryModal = document.getElementById('categoryModal') as HTMLDialogElement;
    const categoryValues = document.getElementById('categoryValues') as HTMLTextAreaElement;
    const saveCategoryBtn = document.getElementById('saveCategoryBtn') as HTMLButtonElement;
    const cancelCategoryBtn = document.getElementById('cancelCategoryBtn') as HTMLButtonElement;
  
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
          // Initialize columnConfigs only if it's empty (first load)
          if (columnConfigs.length === 0) {
            columnConfigs = Array(results.data[0]?.length || 0).fill(null).map(() => ({ categorical: false }));
          }
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
      tableContainer.innerHTML = '';
    
      const table = document.createElement('table');
      table.border = '1';
      table.style.borderCollapse = 'collapse';
    
      // Add header row using the first row of data
      const headerRow = document.createElement('tr');
      data[0].forEach((headerText, colIndex) => {
        const th = document.createElement('th');
        th.className = 'column-header';
        
        // Don't add categorical option for the first column
        if (colIndex > 0) {
          const headerSpan = document.createElement('span');
          headerSpan.textContent = headerText; // Use actual header text from CSV
          th.appendChild(headerSpan);
  
          const categoryBtn = document.createElement('button');
          categoryBtn.className = 'make-categorical';
          categoryBtn.textContent = columnConfigs[colIndex].categorical ? 'Edit Categories' : 'Make Categorical';
          categoryBtn.onclick = () => configureCategoricalField(colIndex);
          th.appendChild(categoryBtn);
        } else {
          th.textContent = headerText; // Use actual header text from CSV
        }
        
        headerRow.appendChild(th);
      });
      table.appendChild(headerRow);
    
      // Render data rows, starting from index 1 to skip header row
      for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
        const row = document.createElement('tr');
    
        for (let colIndex = 0; colIndex < data[rowIndex].length; colIndex++) {
          const cell = document.createElement('td');
          cell.style.padding = '4px';
    
          if (colIndex === 0) {
            cell.innerText = data[rowIndex][colIndex];
          } else {
            if (columnConfigs[colIndex].categorical) {
              const select = document.createElement('select');
              select.style.width = '100px';
              
              // Add empty option
              const emptyOption = document.createElement('option');
              emptyOption.value = '';
              emptyOption.text = '-- Select --';
              select.appendChild(emptyOption);
              
              // Add categorical options
              columnConfigs[colIndex].values?.forEach(value => {
                const option = document.createElement('option');
                option.value = value;
                option.text = value;
                select.appendChild(option);
              });
  
              select.value = data[rowIndex][colIndex];
              select.addEventListener('change', (e) => {
                const target = e.target as HTMLSelectElement;
                parsedData[rowIndex][colIndex] = target.value;
              });
  
              cell.appendChild(select);
            } else {
              const input = document.createElement('input');
              input.type = 'text';
              input.value = data[rowIndex][colIndex];
              input.style.width = '100px';
  
              input.addEventListener('input', (e) => {
                const target = e.target as HTMLInputElement;
                parsedData[rowIndex][colIndex] = target.value;
              });
  
              cell.appendChild(input);
            }
          }
    
          row.appendChild(cell);
        }
    
        table.appendChild(row);
      }
    
      tableContainer.appendChild(table);
    }
    
    function configureCategoricalField(colIndex: number) {
      currentEditingColumn = colIndex;
      categoryValues.value = columnConfigs[colIndex].values?.join('\n') || '';
      categoryModal.showModal();
    }
    
    saveCategoryBtn.addEventListener('click', () => {
      const values = categoryValues.value.split('\n')
        .map(v => v.trim())
        .filter(v => v.length > 0);
    
      if (values.length === 0) {
        alert('Please enter at least one category value');
        return;
      }
    
      columnConfigs[currentEditingColumn] = {
        categorical: true,
        values: values
      };
    
      categoryModal.close();
      renderTable(parsedData);
    });
    
    cancelCategoryBtn.addEventListener('click', () => {
      categoryModal.close();
    });
  });
  