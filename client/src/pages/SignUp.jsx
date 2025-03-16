import { Label, Button } from 'flowbite-react';
import React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import OAuth from '../components/OAuth';

export default function SignUp() {
  const [formData, setFormData] = useState({});
  const [errorMessage, setErrorMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value.trim()});
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password) {
      return setErrorMessage('Please fill out all fields!');
    }
  
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
  
      const data = await res.json(); 
  
      if (!res.ok) {
        console.log(data.message);
        return setErrorMessage(data.message || 'Something went wrong');
      }
      setLoading(false);
      if(res.ok){
        navigate('/sign-in');
      }
    } 
    catch (error) {
      setLoading(false);
      setErrorMessage(error.message);
    }
  }
  

  return (
    <div className='min-h-screen mt-20 bg-[#0A0A0A] text-white'>
      <div className='flex p-3 max-w-3xl mx-auto flex-col md:flex-row md:items-center gap-5'>

        {/* Left Side */}
        <div className='flex-1'>
          <Link to="/" className='font-bold text-4xl'>
            <span className='px-3 py-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg text-white'>
              TechSphere
            </span>
          </Link>
          <p className='text-sm mt-5 text-gray-400'>
            Join a community where innovation meets collaboration. At TechSphere, 
            we empower tech enthusiasts, developers, and innovators to connect, learn,
            and build the future together. Sign up today and dive into a world of 
            opportunities — whether you’re here to sharpen your skills, explore new 
            technologies, or share your passion with like-minded individuals.
          </p>
        </div>

        {/* Right Side */}
        <div className='flex-1'>
          <form className='flex flex-col gap-6 bg-[#1A1A1A] p-6 rounded-lg shadow-lg border border-gray-800' onSubmit={handleSubmit}>
            <div>
              <Label className='text-lg font-semibold text-gray-300' htmlFor='username'>
                Your Username
              </Label>
              <input
                type='text'
                placeholder='Username'
                id='username'
                className='focus:outline-none w-full border border-gray-700 rounded-lg focus:ring-0 focus:border-purple-500 text-sm px-4 py-3 mt-1 bg-white text-black placeholder-gray-500'
                onChange={handleChange}
              />
            </div>
            <div>
              <Label className='text-lg font-semibold text-gray-300' htmlFor='email'>
                Your Email
              </Label>
              <input
                type='email'
                placeholder='name@company.com'
                id='email'
                className='focus:outline-none w-full border border-gray-700 rounded-lg focus:ring-0 focus:border-purple-500 text-sm px-4 py-3 mt-1 bg-white text-black placeholder-gray-500'
                onChange={handleChange}
              />
            </div>
            <div>
              <Label className='text-lg font-semibold text-gray-300' htmlFor='password'>
                Your Password
              </Label>
              <input
                type='password'
                placeholder='Password'
                id='password'
                className='focus:outline-none w-full border border-gray-700 rounded-lg focus:ring-0 focus:border-purple-500 text-sm px-4 py-3 mt-1 bg-white text-black placeholder-gray-500'
                onChange={handleChange}
              />
            </div>
            <Button
              type='submit'
              className='w-full text-white font-bold py-1 px-2 rounded-lg transition-all bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
              disabled={loading}
            >
              {
              loading ? (
                <>
                <div className="animate-spin h-5 w-5 border-4 border-white border-t-transparent rounded-full"></div>
                <span className='pl-3'>Loading...</span>
                </>
              ) : 'Sign Up' 
            }
            </Button>
            <OAuth/>
          </form>

          <div className='flex gap-2 text-sm mt-5 text-gray-400'>
            <span>
              Have an account?
            </span>
            <Link to='/sign-in' className='text-blue-400 hover:text-blue-300'>
              Sign In
            </Link>
          </div>
          {
            errorMessage && (
              <div className="mt-5 p-4 text-sm text-red-400 bg-red-900 rounded-lg border border-red-700" role="alert">
                {errorMessage}
              </div>
            )
          }

        </div>
      </div>
    </div>
  )
}