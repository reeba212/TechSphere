import { Label, Button } from 'flowbite-react';
import React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import OAuth from '../components/OAuth';
import BrandMark from '../components/BrandMark';

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
    <div className='min-h-screen mt-20 bg-canvas text-ink'>
      <div className='flex p-3 max-w-3xl mx-auto flex-col md:flex-row md:items-center gap-5'>

        {/* Left Side */}
        <div className='flex-1'>
          <Link to="/">
            <BrandMark size='lg' />
          </Link>
          <p className='text-sm mt-5 text-muted'>
            Join a community where innovation meets collaboration. At TechSphere,
            we empower tech enthusiasts, developers, and innovators to connect, learn,
            and build the future together. Sign up today and dive into a world of
            opportunities — whether you’re here to sharpen your skills, explore new
            technologies, or share your passion with like-minded individuals.
          </p>
        </div>

        {/* Right Side */}
        <div className='flex-1'>
          <form className='flex flex-col gap-6 bg-surface p-6 rounded-lg shadow-lg border border-line' onSubmit={handleSubmit}>
            <div>
              <Label className='text-lg font-semibold text-muted' htmlFor='username'>
                Your Username
              </Label>
              <input
                type='text'
                placeholder='Username'
                id='username'
                className='input-field mt-1'
                onChange={handleChange}
              />
            </div>
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
                placeholder='Password'
                id='password'
                className='input-field mt-1'
                onChange={handleChange}
              />
            </div>
            <Button type='submit' className='btn-primary w-full py-1' disabled={loading}>
              {
              loading ? (
                <>
                <div className="animate-spin h-5 w-5 border-4 border-canvas border-t-transparent rounded-full"></div>
                <span className='pl-3'>Loading...</span>
                </>
              ) : 'Sign Up'
            }
            </Button>
            <OAuth/>
          </form>

          <div className='flex gap-2 text-sm mt-5 text-muted'>
            <span>
              Have an account?
            </span>
            <Link to='/sign-in' className='text-ink underline hover:text-accent'>
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