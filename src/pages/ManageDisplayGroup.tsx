import React from 'react';
import DisplayGroupSearch from '../components/DisplayGroupSearch';
import DisplayCategorySearch from '../components/DisplayCategorySearch';

export default function ManageDisplayGroup() {
 return (
    <div className="bg-white shadow-md rounded-md mb-4 border border-gray-300">
      <div className="flex items-center justify-between bg-indigo-950 px-4 py-2 rounded-t-md">
        <h2 className="text-white text-lg font-semibold">Display Group Search</h2>
      </div>
      <DisplayGroupSearch />
    </div>
  );
}