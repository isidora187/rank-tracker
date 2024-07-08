'use client';
import axios from "axios";
import { useState } from "react";

export default function NewKeywordForm({ onNew, domain }) {
  const [keyword, setKeyword] = useState('');
  const [error, setError] = useState(null);

  async function handleSubmit(ev) {
    ev.preventDefault();
    setError(null);  // Clear previous errors

    try {
      await axios.post('/api/keywords', { keyword, domain });
      setKeyword('');
      onNew();
    } catch (error) {
      console.error('Error adding keyword:', error);
      setError('Failed to add keyword. Please try again.');
    }
  }

  return (
    <form className="flex gap-2 my-8" onSubmit={handleSubmit}>
      <input
        value={keyword}
        onChange={ev => setKeyword(ev.target.value)}
        className="bg-white border border-b-4 border-blue-200 px-4 py-2 text-xl rounded-lg grow"
        type="text"
        placeholder="new keyword"
      />
      <button
        type="submit"
        className="bg-indigo-500 text-white px-8 rounded-lg border border-b-4 border-indigo-700"
      >
        Add
      </button>
      {error && <div className="text-red-500">{error}</div>}
    </form>
  );
}
