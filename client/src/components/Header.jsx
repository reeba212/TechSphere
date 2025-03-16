import React, { useState } from 'react';
import { Navbar, TextInput, Button, Dropdown, Avatar } from 'flowbite-react';
import { Link, useLocation } from 'react-router-dom';
import { AiOutlineSearch, AiOutlineMenu, AiOutlineClose } from 'react-icons/ai';
import { FaMoon } from 'react-icons/fa';
import { useSelector } from 'react-redux';

export default function Header() {
    const path = useLocation().pathname;
    const { currentUser } = useSelector(state => state.user);
    const [menuOpen, setMenuOpen] = useState(false);

    const toggleMenu = () => setMenuOpen(!menuOpen);

    return (
        <Navbar className='border-b-2 pb-2 pl-2 pr-2 justify-between items-center relative'>
            <Link to="/" className='self-center whitespace-nowrap text-sm sm:text-xl font-semibold dark:text-white'>
                <span className='px-3 py-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg text-white'>TechSphere</span>
            </Link>

            <form className="relative hidden lg:inline-block lg:ml-4">
                <input
                    type='text'
                    placeholder='Search...'
                    className='hidden lg:inline w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-purple-500 text-sm px-4 py-2'
                />
                <AiOutlineSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            </form>

            <Button className='w-12 h-10 lg:hidden inline text-gray-500 hover:bg-black hover:text-white transition duration-300 ease-in-out'>
                <AiOutlineSearch />
            </Button>

            <Navbar.Collapse className='hidden md:flex items-start pb-3'>
                {['/', '/about', '/projects'].map((route, index) => (
                    <Navbar.Link
                        key={index}
                        className={`mx-3 ${path === route ? "bg-indigo-500 text-white px-4 py-2 rounded" : "text-indigo-500 hover:bg-indigo-500 hover:text-white px-4 py-2 rounded transition duration-300 ease-in-out"}`}
                        as={Link}
                        to={route}
                    >
                        {route === '/' ? 'Home' : route.slice(1).charAt(0).toUpperCase() + route.slice(2)}
                    </Navbar.Link>
                ))}
            </Navbar.Collapse>

            <div className='flex items-center gap-2 md:order-2'>
                <Button className='w-12 h-10 hidden sm:inline text-gray-500 hover:bg-black hover:text-white transition duration-300 ease-in-out'>
                    <FaMoon />
                </Button>
                {currentUser ? (
                    <Dropdown
                        arrowIcon={false}
                        inline
                        label={
                            <Avatar
                                alt='user'
                                img={currentUser.profilePicture || '/default-avatar.png'}
                                rounded
                                className='w-10 h-10 object-cover aspect-square cursor-pointer hover:shadow-lg transition duration-300 ease-in-out'
                            />
                        }
                        className="bg-white border border-gray-200 rounded-lg shadow-lg w-48 dark:bg-gray-800 dark:border-gray-700"
                    >
                        <Dropdown.Header className="px-4 py-3 bg-gray-100 dark:bg-gray-700">
                            <span className='block text-sm font-semibold text-gray-700 dark:text-gray-200'>
                                @{currentUser.username}
                            </span>
                            <span className='block text-sm text-gray-500 dark:text-gray-400 truncate'>
                                @{currentUser.email}
                            </span>
                        </Dropdown.Header>
                        <Link to={'/dashboard?tab=profile'}>
                            <Dropdown.Item className="px-4 py-2 hover:bg-indigo-100 dark:hover:bg-indigo-600 transition duration-300">Profile</Dropdown.Item>
                        </Link>
                        <Dropdown.Divider />
                        <Dropdown.Item className="px-4 py-2 hover:bg-indigo-100 dark:hover:bg-indigo-600 transition duration-300">Sign Out</Dropdown.Item>
                    </Dropdown>
                ) : (
                    <Link to='/sign-in'>
                        <Button className='text-indigo-500 border border-indigo-500 rounded-lg w-20 h-10 justify-center items-center transition duration-300 ease-in-out hover:bg-gradient-to-r hover:from-indigo-500 hover:via-blue-500 hover:to-blue-400 hover:text-white'>
                            Sign In
                        </Button>
                    </Link>
                )}

                <Button
                    className='w-12 h-10 md:hidden inline text-gray-500 hover:bg-black hover:text-white transition duration-300 ease-in-out'
                    onClick={toggleMenu}
                >
                    {menuOpen ? <AiOutlineClose /> : <AiOutlineMenu />}
                </Button>
            </div>

            {menuOpen && (
                <div className='fixed top-16 right-2 bg-black bg-opacity-80 flex flex-col items-center p-4 rounded-lg z-50'>
                    {['/', '/about', '/projects'].map((route, index) => (
                        <Link
                            key={index}
                            to={route}
                            className='text-white text-lg py-1 hover:text-indigo-300'
                            onClick={toggleMenu}
                        >
                            {route === '/' ? 'Home' : route.slice(1).charAt(0).toUpperCase() + route.slice(2)}
                        </Link>
                    ))}
                </div>
            )}
        </Navbar>
    );
}
