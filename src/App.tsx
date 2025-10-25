import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx';
import './App.css'

// --- Functions ---
function pick_user_options(data: any[], n: number) {
  const grouped: { [source: string]: any[] } = {};

  // Group items by Source
  data.forEach(item => {
    const source = item.Source;
    if (!grouped[source]) grouped[source] = [];
    grouped[source].push(item);
  });

  // Pick n random items per group and key by Element ID
  const result: { [source: string]: { [id: string]: { name: string; source: string } } } = {};
  Object.entries(grouped).forEach(([source, items]) => {
    const shuffled = items.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, n);

    const keyed: { [id: string]: { name: string; source: string } } = {};
    selected.forEach(item => {
      const id = item['Element ID'];
      if (id) {
        keyed[id] = {
          name: item['Element Name'],
          source: source
        };
      }
    });

    result[source] = keyed;
  });

  return result;
}

function App() {
  const [groupedItems, setGroupedItems] = useState<{ [source: string]: { [id: string]: { name: string; source: string } } }>({});
  const [checkedItems, setCheckedItems] = useState<{ [id: string]: boolean }>({});
  const [user_input_vector, setUserInputVector] = useState<string[]>([]);

  useEffect(() => {
    fetch('/data/user_input_vars.csv')
      .then(res => res.text())
      .then(text => {
        const workbook = XLSX.read(text, { type: 'string' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);

        // Pick 10 random items per Source, now keyed by Element ID
        const user_option = pick_user_options(jsonData, 10);
        setGroupedItems(user_option);

        // Initialize checkbox states
        const initialChecked: { [key: string]: boolean } = {};
        Object.values(user_option).forEach(sourceGroup =>
          Object.keys(sourceGroup).forEach(id => {
            initialChecked[id] = false;
          })
        );
        setCheckedItems(initialChecked);
      });
  }, []);

  const handleCheckboxChange = (id: string) => {
    setCheckedItems(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      const selected = Object.keys(updated).filter(key => updated[key]);
      setUserInputVector(selected);
      return updated;
    });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Select Options</h1>
      <div style={{ display: 'flex', gap: '40px' }}>
        {/* Left column: Knowledge */}
        <ul style={{ listStyle: 'none', padding: 0, flex: 1 }}>
          <h2>Knowledge</h2>
          {Object.entries(groupedItems['knowledge'] || {}).map(([id, item]) => (
            <li key={id} style={{ textAlign: 'left', marginBottom: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input
                  type="checkbox"
                  checked={checkedItems[id] || false}
                  onChange={() => handleCheckboxChange(id)}
                />
                {item.name}
              </label>
            </li>
          ))}
        </ul>

        {/* Right column: Skills */}
        <ul style={{ listStyle: 'none', padding: 0, flex: 1 }}>
          <h2>Skills</h2>
          {Object.entries(groupedItems['skills'] || {}).map(([id, item]) => (
            <li key={id} style={{ textAlign: 'left', marginBottom: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input
                  type="checkbox"
                  checked={checkedItems[id] || false}
                  onChange={() => handleCheckboxChange(id)}
                />
                {item.name}
              </label>
            </li>
          ))}
        </ul>
      </div>

      <hr style={{ margin: '30px 0' }} />
      <h2>User Input Vector</h2>
      <pre>{JSON.stringify(user_input_vector, null, 2)}</pre>
    </div>
  );
}

export default App;
