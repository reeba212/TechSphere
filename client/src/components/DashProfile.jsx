import React from 'react'
import { useSelector } from 'react-redux'

export default function DashProfile() {
  const { currentUser } = useSelector(state => state.user)
  return (
    <div className='max-w-lg mx-auto p-3 w-full'>
      <h1 className='my-7 text-center font-semibold text-3xl'>Profile</h1>
      <form className='flex flex-col gap-4'>
        <div className='w-32 h-32 self-center cursor-pointer shadow-md overflow-hidden rounded-full'>
          <img
            src={currentUser.profilePicture}
            alt='user'
            className='rounded-full w-full h-full border-8 border-[lightgray] object-cover'
          />
        </div>
        <input
          type='text'
          id='username'
          placeholder='username'
          defaultValue={currentUser.username}
          className='mt-3 p-2 bg-[#121212] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500'
        />
        <input
          type='email'
          id='email'
          placeholder='email'
          defaultValue={currentUser.email}
          className='mt-3 p-2 bg-[#121212] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500'
        />
        <input
          type='password'
          id='password'
          placeholder='password'
          className='mt-3 p-2 bg-[#121212] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500'
        />
        <button type="submit" className="btn-gradient bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:bg-gradient-to-l h-10 rounded">
          Update
        </button>
      </form>
      <div className="flex justify-between items-center mt-6 space-x-6">
  <span className="text-red-500 cursor-pointer hover:text-red-700 font-semibold transition-colors duration-200">Delete Account</span>
  <span className="text-red-500 cursor-pointer hover:text-red-700 font-semibold transition-colors duration-200">Sign Out</span>
</div>

    </div>
  )
}
