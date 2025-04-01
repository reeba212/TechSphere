import React, { useState } from 'react';

export default function CreatePost() {
  const [fileName, setFileName] = useState('No file chosen');

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setFileName(file ? file.name : 'No file chosen');
  };

  return (
    <div className='p-3 w-full max-w-6xl mx-auto min-h-screen'>
      <h1 className='text-center text-3xl my-7 font-semibold'>Create a post</h1>
      <form className='flex flex-col gap-4'>
        <div className='flex flex-col sm:flex-row gap-4 w-full'>
          <input 
            type='text' 
            placeholder='Title' 
            required 
            id='title' 
            className='w-full sm:w-1/2 p-2.5 bg-[#121212] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700'
          />
          <select 
            className='w-full sm:w-1/2 p-2.5 bg-[#121212] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700'
          >
            <option value='uncategorized'>Select a category</option>
            <option value='web-development'>Web Development</option>
            <option value='machine-learning'>Machine Learning</option>
            <option value='data-science'>Data Science</option>
            <option value='app-development'>App Development</option>
            <option value='cloud-computing'>Cloud Computing</option>
            <option value='blockchain'>Blockchain</option>
            <option value='cybersecurity'>Cybersecurity</option>
          </select>
        </div>

        <div className='flex flex-col sm:flex-row gap-4 items-center justify-between border-4 border-teal-500 border-dotted p-3'>
          <div className='justify-between'>
          <input 
            type='file' 
            accept='image/*' 
            id='fileUpload' 
            className='hidden' 
            onChange={handleFileChange}
          />

          <label 
            htmlFor='fileUpload' 
            className='cursor-pointer px-4 py-2 bg-[#181818] outline hover:bg-[#303030] text-white font-semibold rounded-md focus:outline-none'
          >
            Choose File
          </label>

          <span className='p-2 bg-transparent text-white'>
            {fileName}
          </span>

          </div>

          <button type='button' className='px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:bg-gradient-to-l text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'>
            Upload Image
          </button>
        </div>
        
      </form>
    </div>
  );
}
