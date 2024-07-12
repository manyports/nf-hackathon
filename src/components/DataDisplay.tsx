import React, { useState } from 'react';
import { SheetData } from '@/types/SheetData';

interface Props {
  data: SheetData[];
  onUpdate: (updatedItem: SheetData) => void;
}

const DataDisplay: React.FC<Props> = ({ data, onUpdate }) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedData, setEditedData] = useState<SheetData | null>(null);

  if (data.length === 0) {
    return <div className="text-center text-gray-600 mt-10">No data available</div>;
  }

  const handleEdit = (item: SheetData, index: number) => {
    setEditingId(index);
    setEditedData({...item});
  };

  const handleSave = () => {
    if (editedData) {
      onUpdate(editedData);
      setEditingId(null);
      setEditedData(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof SheetData) => {
    if (editedData) {
      setEditedData({ ...editedData, [field]: e.target.value });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6">Рассмотр заявок</h2>
      <p className="text-xl text-gray-600 mb-8">Здесь находятся заявки кандидатов. Кликните на поле для редактирования.</p>
      <div className="bg-white shadow-xl rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {Object.keys(data[0]).map((key) => (
                  <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {key}
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {Object.entries(item).map(([key, value]) => (
                    <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingId === index ? (
                        <input
                          type="text"
                          value={editedData ? (editedData[key as keyof SheetData] as string) : value}
                          onChange={(e) => handleChange(e, key as keyof SheetData)}
                          className="w-full p-1 border rounded"
                        />
                      ) : (
                        value
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingId === index ? (
                      <button onClick={handleSave} className="text-indigo-600 hover:text-indigo-900">
                        Save
                      </button>
                    ) : (
                      <button onClick={() => handleEdit(item, index)} className="text-indigo-600 hover:text-indigo-900">
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DataDisplay;