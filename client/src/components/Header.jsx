import React from 'react';
import { Navbar, TextInput, Button } from 'flowbite-react';  
import { Link, useLocation } from 'react-router-dom';
import { AiOutlineSearch } from 'react-icons/ai';
import { FaMoon } from 'react-icons/fa';

export default function Header() {
    const path = useLocation().pathname;

    return (
        <Navbar className='border-b-2 pb-2 pl-2 pr-2 justify-between items-center'>
            <Link to="/" className='self-center whitespace-nowrap text-sm sm:text-xl font-semibold dark:text-white'>
                <span className='px-3 py-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg text-white'>TechSphere</span>
            </Link>

            <form className="relative hidden lg:inline-block">
                <TextInput
                    type='text'
                    placeholder='Search...'
                    className='hidden lg:inline'
                />
                <AiOutlineSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            </form>

            <Button className='w-12 h-10 lg:hidden inline text-gray-500 hover:bg-black hover:text-white transition duration-300 ease-in-out'>
                <AiOutlineSearch />
            </Button>
            
            <Navbar.Collapse className='md:flex inline'>
                <Navbar.Link 
                    className={`mx-3 ${path === "/" ? "bg-indigo-500 text-white px-4 py-2 rounded" : "text-indigo-500 hover:bg-indigo-500 hover:text-white px-4 py-2 rounded transition duration-300 ease-in-out"}`} 
                    as={Link} 
                    to='/'
                >
                    Home
                </Navbar.Link>
                <Navbar.Link 
                    className={`mx-3 ${path === "/about" ? "bg-indigo-500 text-white px-4 py-2 rounded" : "text-indigo-500 hover:bg-indigo-500 hover:text-white px-4 py-2 rounded transition duration-300 ease-in-out"}`} 
                    as={Link} 
                    to='/about'
                >
                    About
                </Navbar.Link>
                <Navbar.Link 
                    className={`mx-3 ${path === "/projects" ? "bg-indigo-500 text-white px-4 py-2 rounded" : "text-indigo-500 hover:bg-indigo-500 hover:text-white px-4 py-2 rounded transition duration-300 ease-in-out"}`} 
                    as={Link} 
                    to='/projects'
                >
                    Projects
                </Navbar.Link>
            </Navbar.Collapse>

            <div className='flex items-center gap-2'> 
                <Button className='w-12 h-10 hidden sm:inline text-gray-500 hover:bg-black hover:text-white transition duration-300 ease-in-out'>
                    <FaMoon />
                </Button>
                <Link to='/sign-in'>
                    <Button className='text-indigo-500 border border-indigo-500 rounded-lg w-20 h-10 justify-center items-center transition duration-300 ease-in-out hover:bg-gradient-to-r hover:from-indigo-500 hover:via-blue-500 hover:to-blue-400 hover:text-white'>
                        Sign In
                    </Button>
                </Link>
            </div>
        </Navbar>
    );
}