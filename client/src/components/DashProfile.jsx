import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateStart, updateSuccess, updateFailure } from '../features/userSlice';

export default function DashProfile() {
  const { currentUser  } = useSelector(state => state.user);
  const [formData, setFormData] = useState({});
  const [updateUserSuccess, setUpdateUserSuccess] = useState(null);
  const [updateUserError, setUpdateUserError] = useState(null);
  const dispatch = useDispatch();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdateUserError(null);
    setUpdateUserSuccess(null);
    if (Object.keys(formData).length === 0) {
      setUpdateUserError('No changes made');
      return;
    }
    try {
      dispatch(updateStart());
      const res = await fetch(`/api/user/update/${currentUser._id}`,{
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        dispatch(updateFailure(data.message));
        setUpdateUserError(data.message);
      }
      else {
        dispatch(updateSuccess(data));
        setUpdateUserSuccess('Profile updated successfully!')
      }
    }
    catch (error) {
      dispatch(updateFailure(data.message));
      setUpdateUserError(data.message);
    }
  };
    

  return (
    <div className='max-w-lg mx-auto p-3 w-full'>
      <h1 className='my-7 text-center font-semibold text-3xl'>Profile</h1>
      <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
        <div className='w-32 h-32 self-center cursor-pointer shadow-md overflow-hidden rounded-full'>
          <img
            src={currentUser .profilePicture}
            alt='user'
            className='rounded-full w-full h-full border-8 border-[lightgray] object-cover'
          />
        </div>
        <input
          type='text'
          id='username'
          placeholder='Username'
          defaultValue={currentUser.username}
          onChange={handleInputChange}
          className='mt-3 p-2 bg-[#121212] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500'
          required
        />
        <input
          type='email'
          id='email'
          placeholder='Email'
          defaultValue={currentUser.email}
          onChange={handleInputChange}
          className='mt-3 p-2 bg-[#121212] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500'
          required
        />
        <input
          type='password'
          id='password'
          placeholder='Password (optional)'
          defaultValue={currentUser.password}
          onChange={handleInputChange}
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
      {updateUserSuccess && (
        <div
          className="alert alert-success mt-5"
          style={{
            color: 'green',
            backgroundColor: '#181818',
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid green',
          }}
        >
          {updateUserSuccess}
        </div>
      )}

      {updateUserError && (
        <div
          className="alert alert-failure mt-5"
          style={{
            color: 'red',
            backgroundColor: '#181818',
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid red',
          }}
        >
          {updateUserError}
        </div>
      )}

    </div>
  );
}