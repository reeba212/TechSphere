import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateStart, updateSuccess, updateFailure, deleteUserStart, deleteUserSuccess, deleteUserFailure, signoutSuccess } from '../features/userSlice';
import { Modal } from 'flowbite-react';
import { HiOutlineExclamationCircle } from 'react-icons/hi';
import { Link } from 'react-router-dom'
import ThemeSwitcher from './ThemeSwitcher';

export default function DashProfile() {
  const { currentUser, error } = useSelector((state) => state.user);
  const [formData, setFormData] = useState({});
  const [updateUserSuccess, setUpdateUserSuccess] = useState(null);
  const [updateUserError, setUpdateUserError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const dispatch = useDispatch();

  /* Handle input change */
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

 /* Handle submit button click */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdateUserError(null);
    setUpdateUserSuccess(null);
    setUpdateLoading(true); 

    if (Object.keys(formData).length === 0) {
      setUpdateUserError('No changes made');
      setUpdateLoading(false);
      return;
    }

    try {
      dispatch(updateStart());
      const res = await fetch(`/api/user/update/${currentUser?._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        dispatch(updateFailure(data.message));
        setUpdateUserError(data.message);
      } 
      else {
        dispatch(updateSuccess(data));
        setUpdateUserSuccess('Profile updated successfully!');
      }
    } 
    catch (error) {
      dispatch(updateFailure(error.message));
      setUpdateUserError(error.message);
    } 
    finally {
      setUpdateLoading(false);
    }
  };

  /* Deleting a user */
  const handleDeleteUser = async () => {
    setShowModal(false);
    if (!currentUser) return;

    try {
      dispatch(deleteUserStart());
      const res = await fetch(`/api/user/delete/${currentUser._id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        dispatch(deleteUserFailure(data.message));
      } else {
        dispatch(deleteUserSuccess());
      }
    } catch (error) {
      dispatch(deleteUserFailure(error.message));
    }
  };

  /* Signing out */
  const handleSignOut = async () => {
    try {
      const res = await fetch('/api/user/signout', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        console.log(data.message);
      }
      else {
        dispatch(signoutSuccess());
      }
    }
    catch (error) {
      console.log(error.message);
    }
  }

  return (
    <div className='max-w-lg mx-auto p-3 w-full'>
      <h1 className='my-7 text-center font-semibold text-3xl'>Profile</h1>
      <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
        <div className='w-32 h-32 self-center cursor-pointer shadow-md overflow-hidden rounded-full'>
          <img
            src={currentUser?.profilePicture}
            alt='user'
            className='rounded-full w-full h-full border-8 border-[lightgray] object-cover'
          />
        </div>
        <input
          type='text'
          id='username'
          placeholder='Username'
          defaultValue={currentUser?.username}
          onChange={handleInputChange}
          className='input-field mt-3'
          required
        />
        <input
          type='email'
          id='email'
          placeholder='Email'
          defaultValue={currentUser?.email}
          onChange={handleInputChange}
          className='input-field mt-3'
          required
        />
        <input
          type='password'
          id='password'
          placeholder='Password (optional)'
          onChange={handleInputChange}
          className='input-field mt-3'
        />
        <button type="submit" disabled={updateLoading} className="btn-primary h-10 relative">
          {updateLoading ? (
            <>
              <span className="opacity-0">Update</span>
              <span className="absolute inset-0 flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 text-canvas" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
            </>
          ) : (
            "Update"
          )}
        </button>
        {
          currentUser.isAdmin && (
            <Link to="/create-post">
              <button type="button" className="btn-primary w-full mt-4">
                Create a post
              </button>
            </Link>
          )
        }
      </form>

      <div className="mt-8 border-t border-line pt-6">
        <ThemeSwitcher />
      </div>

      <div className="flex justify-between items-center mt-6 space-x-6">
        <span onClick={() => setShowModal(true)} className="text-red-500 cursor-pointer hover:text-red-700 font-semibold transition-colors duration-200">
          Delete Account
        </span>
        <span onClick={handleSignOut} className="text-red-500 cursor-pointer hover:text-red-700 font-semibold transition-colors duration-200">
          Sign Out
        </span>
      </div>

      {updateUserSuccess && (
        <div className="alert alert-success mt-5 text-green-500 bg-surface-2 p-2 rounded border border-green-500">
          {updateUserSuccess}
        </div>
      )}

      {updateUserError && (
        <div className="alert alert-failure mt-5 text-red-500 bg-surface-2 p-2 rounded border border-red-500">
          {updateUserError}
        </div>
      )}

      {error && error !== 'Unauthorized' && (
        <div className="alert alert-failure mt-5 text-red-500 bg-surface-2 p-2 rounded border border-red-500">
          {error}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showModal && (
        <Modal show={showModal} onClose={() => setShowModal(false)} popup size='md'>
          <div className="bg-surface rounded-lg p-6">
            <Modal.Header />
            <Modal.Body>
              <div className='text-center'>
                <HiOutlineExclamationCircle className='h-14 w-14 text-muted mb-4 mx-auto' />
                <h3 className='mb-5 text-lg text-ink'>
                  Are you sure you want to delete your account?
                </h3>
                <div className='flex justify-center gap-4'>
                  <button 
                    onClick={handleDeleteUser} 
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                  >
                    Yes, I'm sure
                  </button>
                  <button 
                    onClick={() => setShowModal(false)} 
                    className="bg-surface-2 text-ink px-4 py-2 rounded hover:bg-raised transition"
                  >
                    No, cancel
                  </button>
                </div>
              </div>
            </Modal.Body>
          </div>
        </Modal>
      )}
    </div>
  );
}
