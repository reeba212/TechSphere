import { Label, Button } from 'flowbite-react';
import React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signInStart, signInSuccess, signInFailure } from '../features/userSlice';
import OAuth from '../components/OAuth';
import BrandMark from '../components/BrandMark';

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
    <div className='min-h-screen mt-20 bg-canvas text-ink'>
      <div className='flex p-3 max-w-3xl mx-auto flex-col md:flex-row md:items-center gap-5'>
        {/* Left Side */}
        <div className='flex-1'>
          <Link to="/">
            <BrandMark size='lg' />
          </Link>
          <p className='text-sm mt-5 text-muted'>
            Welcome back to TechSphere — your hub for innovation and collaboration.
            Sign in with your email and password or use Google for a quicker, seamless experience.
            Reconnect with a community of tech enthusiasts, developers, and innovators.
            Pick up where you left off, explore the latest tech trends, and continue building the
            future alongside like-minded individuals.
          </p>
        </div>

        {/* Right Side */}
        <div className='flex-1'>
          <form className='flex flex-col gap-6 bg-surface p-6 rounded-lg shadow-lg border border-line' onSubmit={handleSubmit}>
            <div>
              <Label className='text-lg font-semibold text-muted' htmlFor='email'>
                Your Email
              </Label>
              <input
                type='email'
                placeholder='name@company.com'
                id='email'
                className='input-field mt-1'
                onChange={handleChange}
              />
            </div>
            <div>
              <Label className='text-lg font-semibold text-muted' htmlFor='password'>
                Your Password
              </Label>
              <input
                type='password'
                placeholder='********'
                id='password'
                className='input-field mt-1'
                onChange={handleChange}
              />
            </div>
            <Button type='submit' className='btn-primary w-full py-1' disabled={loading}>
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin h-5 w-5 border-4 border-canvas border-t-transparent rounded-full"></div>
                  <span className='pl-3'>Loading...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
            <OAuth/>
          </form>

          <div className='flex gap-2 text-sm mt-5 text-muted'>
            <span>Don't have an account?</span>
            <Link to='/sign-up' className='text-ink underline hover:text-accent'>
              Sign Up
            </Link>
          </div>
          {errorMessage && (
            <div className="mt-5 p-4 text-sm text-red-400 bg-red-900 rounded-lg border border-red-700" role="alert">
              {errorMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}