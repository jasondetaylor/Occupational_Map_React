import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { Box, Flex, Heading, Button, Text } from "@chakra-ui/react";

// --- Functions ---
function pick_user_options(data: any[], n: number) {
  const grouped: { [source: string]: any[] } = {};

  data.forEach(rawItem => {
    const item = {
      id: rawItem["Element ID"] ?? rawItem["element id"] ?? rawItem["id"],
      name: rawItem["Element Name"] ?? rawItem["element name"] ?? rawItem["name"],
      source: rawItem["Source"]?.toLowerCase() ?? rawItem["source"]?.toLowerCase() ?? "unknown",
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
  <Box mb={6}>
    <Heading size="md" mb={3}>Selected Items</Heading>
    <Flex wrap="wrap" gap={3}>
      {selectedItems.map(item => (
        <Flex
          key={item.id}
          bg="teal.100"
          border="1px solid teal"
          borderRadius="md"
          p={2}
          align="center"
          gap={2}
        >
          <Text>{item.name}</Text>
          <Button size="sm" onClick={() => handleRemove(item.id)}>
            ✕
          </Button>
        </Flex>
      ))}
    </Flex>
  </Box>
);

const SelectableList = ({
  source,
  items,
  handleSelect,
}: {
  source: string;
  items: { [id: string]: { name: string; source: string } };
  handleSelect: (id: string, source: string) => void;
}) => {
  const validEntries = Object.entries(items).filter(([_, item]) => item?.name);

  return (
    <Box flex={1}>
      <Heading size="sm" textTransform="capitalize" mb={2}>{source}</Heading>

      {validEntries.length === 0 ? (
        <Text color="gray.500" fontStyle="italic">No more options</Text>
      ) : (
        validEntries.map(([id, item]) => (
          <Button
            key={id}
            onClick={() => handleSelect(id, source)}
            mb={2}
            w="100%"
            bg="black"
            color="white"
            _hover={{ bg: "gray.800" }}
          >
            {item.name}
          </Button>
        ))
      )}
    </Box>
  );
};

// --- App ---
function App() {
  const [allItems, setAllItems] = useState<{ [source: string]: any[] }>({});
  const [groupedItems, setGroupedItems] = useState<{
    [source: string]: { [id: string]: { name: string; source: string } };
  }>({});
  const [selectedItems, setSelectedItems] = useState<{ id: string; name: string; source: string }[]>([]);
  const [user_input_vector, setUserInputVector] = useState<string[]>([]);

  useEffect(() => {
    fetch("/data/user_input_vars.csv")
      .then(res => res.text())
      .then(text => {
        const workbook = XLSX.read(text, { type: "string" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);

        const all: { [source: string]: any[] } = {};
        jsonData.forEach(rawItem => {
          const item = {
            id: rawItem["Element ID"] ?? rawItem["element id"] ?? rawItem["id"],
            name: rawItem["Element Name"] ?? rawItem["element name"] ?? rawItem["name"],
            source: rawItem["Source"]?.toLowerCase() ?? rawItem["source"]?.toLowerCase() ?? "unknown",
          };
          if (!item.id) return;
          if (!all[item.source]) all[item.source] = [];
          all[item.source].push(item);
        });
        setAllItems(all);

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
    <Box p={5}>
      <Heading mb={5}>Select Options</Heading>

      <SelectedStack selectedItems={selectedItems} handleRemove={handleRemove} />

      <Flex gap={10}>
        {Object.entries(groupedItems).map(([source, items]) => (
          <SelectableList key={source} source={source} items={items} handleSelect={handleSelect} />
        ))}
      </Flex>

      <Box borderBottom="1px solid gray" my={6}></Box>

      <Heading size="md" mb={2}>User Input Vector</Heading>
      <Box as="pre" bg="gray.100" p={3} borderRadius="md">{JSON.stringify(user_input_vector, null, 2)}</Box>
    </Box>
  );
}

export default App;
