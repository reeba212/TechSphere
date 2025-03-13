import { Label, Button } from 'flowbite-react';
import React from 'react';
import { Link } from 'react-router-dom';

export default function SignUp() {
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
            Join a community where innovation meets collaboration. At TechSphere, 
            we empower tech enthusiasts, developers, and innovators to connect, learn,
            and build the future together. Sign up today and dive into a world of 
            opportunities — whether you’re here to sharpen your skills, explore new 
            technologies, or share your passion with like-minded individuals.
          </p>
        </div>

        {/* Right Side */}
        <div className='flex-1'>
          <form className='flex flex-col gap-6 bg-white p-6 rounded-lg shadow-lg'>
            <div>
              <Label className='text-lg font-semibold text-gray-700' htmlFor='username'>
                Your Username
              </Label>
              <input
                type='text'
                placeholder='Username'
                id='username'
                className='focus:outline-none w-full border border-gray-300 rounded-lg focus:ring-0 focus:border-purple-500 text-sm px-4 py-3 mt-1'
              />
            </div>
            <div>
              <Label className='text-lg font-semibold text-gray-700' htmlFor='email'>
                Your Email
              </Label>
              <input
                type='email'
                placeholder='name@company.com'
                id='email'
                className='focus:outline-none w-full border border-gray-300 rounded-lg focus:ring-0 focus:border-purple-500 text-sm px-4 py-3 mt-1'
              />
            </div>
            <div>
              <Label className='text-lg font-semibold text-gray-700' htmlFor='password'>
                Your Password
              </Label>
              <input
                type='password'
                placeholder='Password'
                id='password'
                className='focus:outline-none w-full border border-gray-300 rounded-lg focus:ring-0 focus:border-purple-500 text-sm px-4 py-3 mt-1'
              />
            </div>
            <Button
              type='submit'
              className='w-full text-white font-bold py-1 px-2 rounded-lg transition-all bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
            >
              Sign Up
            </Button>
          </form>

          <div className='flex gap-2 text-sm mt-5'>
            <span>
              Have an account?
            </span>
            <Link to='/sign-in' className='text-blue-500'>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
