import { Label, Button } from 'flowbite-react';
import React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signInStart, signInSuccess, signInFailure } from '../features/userSlice';
import OAuth from '../components/OAuth';

export default function SignIn() {
  const [formData, setFormData] = useState({});
  const { loading, error: errorMessage } = useSelector((state) => state.user); // Fixed destructuring
  const dispatch = useDispatch(); 
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value.trim() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || formData.email === '' || formData.password === '') {
      return dispatch(signInFailure('Please fill out all the fields!'));
    }

    try {
      dispatch(signInStart());
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success === false) {
        dispatch(signInFailure(data.message));
      }
      if (res.ok) {
        dispatch(signInSuccess(data));
        navigate('/');
      }
    } catch (error) {
      dispatch(signInFailure(error.message || 'Something went wrong!')); // Added fallback error message
    }
  };

  return (
    <div className='min-h-screen mt-20'>
      <div className='flex p-3 max-w-3xl mx-auto flex-col md:flex-row md:items-center gap-5'>
        {/* Left Side */}
        <div className='flex-1'>
          <Link to="/" className='font-bold dark:text-white text-4xl'>
            <span className='px-3 py-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg text-white'>
              TechSphere
            </span>
          </Link>
          <p className='text-sm mt-5'>
            Welcome back to TechSphere — your hub for innovation and collaboration.
            Sign in with your email and password or use Google for a quicker, seamless experience.
            Reconnect with a community of tech enthusiasts, developers, and innovators.
            Pick up where you left off, explore the latest tech trends, and continue building the
            future alongside like-minded individuals.
          </p>
        </div>

        {/* Right Side */}
        <div className='flex-1'>
          <form className='flex flex-col gap-6 bg-white p-6 rounded-lg shadow-lg' onSubmit={handleSubmit}>
            <div>
              <Label className='text-lg font-semibold text-gray-700' htmlFor='email'>
                Your Email
              </Label>
              <input
                type='email'
                placeholder='name@company.com'
                id='email'
                className='focus:outline-none w-full border border-gray-300 rounded-lg focus:ring-0 focus:border-purple-500 text-sm px-4 py-3 mt-1'
                onChange={handleChange}
              />
            </div>
            <div>
              <Label className='text-lg font-semibold text-gray-700' htmlFor='password'>
                Your Password
              </Label>
              <input
                type='password'
                placeholder='********'
                id='password'
                className='focus:outline-none w-full border border-gray-300 rounded-lg focus:ring-0 focus:border-purple-500 text-sm px-4 py-3 mt-1'
                onChange={handleChange}
              />
            </div>
            <Button
              type='submit'
              className='w-full text-white font-bold py-1 px-2 rounded-lg transition-all bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin h-5 w-5 border-4 border-white border-t-transparent rounded-full"></div>
                  <span className='pl-3'>Loading...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
            <OAuth/>
          </form>

          <div className='flex gap-2 text-sm mt-5'>
            <span>Don't have an account?</span>
            <Link to='/sign-up' className='text-blue-500'>
              Sign Up
            </Link>
          </div>
          {errorMessage && (
            <div className="mt-5 p-4 text-sm text-red-700 bg-red-100 rounded-lg border border-red-400" role="alert">
              {errorMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}