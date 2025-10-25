import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './App.css';

// --- Functions ---
function pick_user_options(data: any[], n: number) {
  const grouped: { [source: string]: any[] } = {};

  data.forEach(rawItem => {
    const item = {
      id: rawItem['Element ID'] ?? rawItem['element id'] ?? rawItem['id'],
      name: rawItem['Element Name'] ?? rawItem['element name'] ?? rawItem['name'],
      source: rawItem['Source']?.toLowerCase() ?? rawItem['source']?.toLowerCase() ?? 'unknown',
    };
    if (!item.id) return;

    if (!grouped[item.source]) grouped[item.source] = [];
    grouped[item.source].push(item);
  });

  const result: { [source: string]: { [id: string]: { name: string; source: string } } } = {};
  Object.entries(grouped).forEach(([source, items]) => {
    const shuffled = items.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, n);

    const keyed: { [id: string]: { name: string; source: string } } = {};
    selected.forEach(item => {
      keyed[item.id] = { name: item.name, source };
    });

    result[source] = keyed;
  });

  return result;
}

// --- Components ---
const SelectedStack = ({
  selectedItems,
  handleRemove,
}: {
  selectedItems: { id: string; name: string; source: string }[];
  handleRemove: (id: string) => void;
}) => (
  <div style={{ marginBottom: '20px' }}>
    <h2>Selected Items</h2>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
      {selectedItems.map(item => (
        <div
          key={item.id}
          style={{
            backgroundColor: '#e0f7fa',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #00acc1',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'black',
          }}
        >
          <span>{item.name}</span>
          <button
            onClick={() => handleRemove(item.id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'black',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '16px',
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  </div>
);

const SelectableList = ({
  source,
  items,
  handleSelect,
}: {
  source: string;
  items: { [id: string]: { name: string; source: string } };
  handleSelect: (id: string, source: string) => void;
}) => (
  <ul style={{ listStyle: 'none', padding: 0, flex: 1 }}>
    <h2 style={{ textTransform: 'capitalize' }}>{source}</h2>
    {Object.entries(items).map(([id, item]) => (
      <li key={id} style={{ textAlign: 'left', marginBottom: '8px' }}>
        <button
          onClick={() => handleSelect(id, source)}
          style={{
            background: '#000',
            border: '1px solid #ccc',
            borderRadius: '6px',
            padding: '6px 8px',
            cursor: 'pointer',
            width: '100%',
            textAlign: 'left',
            color: '#fff',
          }}
        >
          {item.name || '(no name)'}
        </button>
      </li>
    ))}
  </ul>
);

// --- App ---
function App() {
  const [allItems, setAllItems] = useState<{ [source: string]: any[] }>({});
  const [groupedItems, setGroupedItems] = useState<{
    [source: string]: { [id: string]: { name: string; source: string } };
  }>({});
  const [selectedItems, setSelectedItems] = useState<{ id: string; name: string; source: string }[]>([]);
  const [user_input_vector, setUserInputVector] = useState<string[]>([]);

  useEffect(() => {
    fetch('/data/user_input_vars.csv')
      .then(res => res.text())
      .then(text => {
        const workbook = XLSX.read(text, { type: 'string' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);

        // Group all items by source
        const all: { [source: string]: any[] } = {};
        jsonData.forEach(rawItem => {
          const item = {
            id: rawItem['Element ID'] ?? rawItem['element id'] ?? rawItem['id'],
            name: rawItem['Element Name'] ?? rawItem['element name'] ?? rawItem['name'],
            source: rawItem['Source']?.toLowerCase() ?? rawItem['source']?.toLowerCase() ?? 'unknown',
          };
          if (!item.id) return;
          if (!all[item.source]) all[item.source] = [];
          all[item.source].push(item);
        });
        setAllItems(all);

        // Pick 10 random items per source
        const user_option: { [source: string]: { [id: string]: { name: string; source: string } } } = {};
        Object.entries(all).forEach(([source, items]) => {
          const shuffled = items.sort(() => 0.5 - Math.random());
          const selected = shuffled.slice(0, 10);
          user_option[source] = {};
          selected.forEach(i => {
            user_option[source][i.id] = { name: i.name, source };
          });
        });

        setGroupedItems(user_option);
      });
  }, []);

  const updateUserInputVector = (newSelectedItems: { id: string; name: string; source: string }[]) => {
    setUserInputVector(newSelectedItems.map(item => item.id));
  };

  const handleSelect = (id: string, source: string) => {
    const selectedItem = groupedItems[source][id];
    const updatedSelected = [...selectedItems, { id, name: selectedItem.name, source }];
    setSelectedItems(updatedSelected);
    updateUserInputVector(updatedSelected);

    const updatedGroup = { ...groupedItems[source] };
    delete updatedGroup[id];

    const usedIds = new Set([
      ...Object.keys(groupedItems[source]),
      ...selectedItems.map(i => i.id),
      id,
    ]);
    const availablePool = allItems[source]?.filter(i => !usedIds.has(i.id)) || [];
    if (availablePool.length > 0) {
      const replacement = availablePool[Math.floor(Math.random() * availablePool.length)];
      updatedGroup[replacement.id] = { name: replacement.name, source };
    }

    setGroupedItems(prev => ({ ...prev, [source]: updatedGroup }));
  };

  const handleRemove = (id: string) => {
    const itemToRemove = selectedItems.find(i => i.id === id);
    if (!itemToRemove) return;

    const updatedSelected = selectedItems.filter(i => i.id !== id);
    setSelectedItems(updatedSelected);
    updateUserInputVector(updatedSelected);

    setGroupedItems(prev => {
      const updated = { ...prev };
      const { source, name } = itemToRemove;
      if (!updated[source]) updated[source] = {};
      if (!updated[source][id]) {
        updated[source][id] = { name, source };
      }
      return updated;
    });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Select Options</h1>

      <SelectedStack selectedItems={selectedItems} handleRemove={handleRemove} />

      <div style={{ display: 'flex', gap: '40px' }}>
        {Object.entries(groupedItems).map(([source, items]) => (
          <SelectableList key={source} source={source} items={items} handleSelect={handleSelect} />
        ))}
      </div>

      <hr style={{ margin: '30px 0' }} />
      <h2>User Input Vector</h2>
      <pre>{JSON.stringify(user_input_vector, null, 2)}</pre>
    </div>
  );
}

export default App;
