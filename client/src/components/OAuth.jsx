import React from 'react';
import { AiFillGoogleCircle } from 'react-icons/ai';
import { GoogleAuthProvider, signInWithPopup, getAuth } from 'firebase/auth';
import { app } from '../firebase';
import { useDispatch } from 'react-redux';
import { signInSuccess } from '../features/userSlice';
import { useNavigate } from 'react-router-dom';

export default function OAuth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleGoogleClick = async () => {
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const resultsFromGoogle = await signInWithPopup(auth, provider);
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: resultsFromGoogle.user.displayName,
            email: resultsFromGoogle.user.email,
            googlePhotoUrl: resultsFromGoogle.user.photoURL,
        }),
      })
      const data = await res.json();
      if (res.ok) {
        dispatch(signInSuccess(data));
        navigate('/');
      }
    } 
    catch (error) {
      console.error('Google sign-in failed:', error.message);
      alert('Failed to sign in with Google. Please try again.');
    }
  };

  return (
    <button
      type='button'
      className='w-full flex items-center justify-center font-bold py-2 px-4 rounded-lg transition-all bg-[#1A1A1A] hover:border-white hover:bg-gradient-to-r hover:from-pink-600 hover:to-orange-600 text-white'
      style={{
        boxShadow: '0 0 0 , 0 0 0 3px #ec4899', 
      }}
      onClick={handleGoogleClick}
    >
      <AiFillGoogleCircle className='w-6 h-6 mr-2 text-white' />
      Continue with Google
    </button>
  );
}