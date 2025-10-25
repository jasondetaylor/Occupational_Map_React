import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx';
import './App.css'

// Funtions
function pick_user_options(data: any[], n: number) {
  const grouped: { [key: string]: any[] } = {};

  // Group items by Source
  data.forEach(item => {
    const source = item.Source;
    if (!grouped[source]) grouped[source] = [];
    grouped[source].push(item);
  });

  // Pick n random items per group
  const result: { [key: string]: any[] } = {};
  Object.entries(grouped).forEach(([source, items]) => {
    const shuffled = items.sort(() => 0.5 - Math.random());
    result[source] = shuffled.slice(0, n);
  });

  return result;
}


function App() {
  const [groupedItems, setGroupedItems] = useState<{ [key: string]: any[] }>({});
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetch('/data/user_input_vars.csv')
      .then(res => res.text())
      .then(text => {
        const workbook = XLSX.read(text, { type: 'string' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);

        // Pick 10 random items per Source
        const user_option = pick_user_options(jsonData, 10);
        setGroupedItems(user_option);

        // Initialize checkbox states
        const initialChecked: { [key: string]: boolean } = {};
        Object.values(user_option).forEach(items =>
          items.forEach(item => (initialChecked[item['Element ID']] = false))
        );
        setCheckedItems(initialChecked);
      });
  }, []);

  const handleCheckboxChange = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
    <h1>Select Options</h1>
    <div style={{ display: 'flex', gap: '40px' }}>
      {/* Left column: Knowledge */}
      <ul style={{ listStyle: 'none', padding: 0, flex: 1 }}>
        <h2>Knowledge</h2>
        {groupedItems['knowledge']?.slice(0, 10).map(item => (
          <li key={item['Element ID']} style={{ textAlign: 'left', marginBottom: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="checkbox"
                checked={checkedItems[item['Element ID']] || false}
                onChange={() => handleCheckboxChange(item['Element ID'])}
              />
              {item['Element Name']}
            </label>
          </li>
        ))}
      </ul>

      {/* Right column: Skills */}
      <ul style={{ listStyle: 'none', padding: 0, flex: 1 }}>
        <h2>Skills</h2>
        {groupedItems['skills']?.slice(0, 10).map(item => (
          <li key={item['Element ID']} style={{ textAlign: 'left', marginBottom: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="checkbox"
                checked={checkedItems[item['Element ID']] || false}
                onChange={() => handleCheckboxChange(item['Element ID'])}
              />
              {item['Element Name']}
            </label>
          </li>
        ))}
      </ul>
    </div>
  </div>

  );
}

export default App;