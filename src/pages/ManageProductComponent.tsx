
// src/pages/ManageProductComponent.tsx
import React from 'react';
import ProductComponentSearch from '../components/ProductComponentSearch';

export default function ManageProductComponent() {
  return (
    <div className="bg-white shadow-md rounded-md mb-4 border border-gray-300">
      {/* Header */}
      <div className="flex items-center justify-between bg-indigo-950 px-4 py-2 rounded-t-md">
        <h2 className="text-white text-lg font-semibold">Product Component Search</h2>
      </div>

      {/* Body */}
      
        
        <div >
        <ProductComponentSearch />
        </div>

    </div>
  );
}
