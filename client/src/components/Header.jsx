import React, { useState } from 'react';
import { Navbar, Button, Dropdown, Avatar } from 'flowbite-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AiOutlineSearch, AiOutlineMenu, AiOutlineClose } from 'react-icons/ai';
import { useSelector, useDispatch } from 'react-redux';
import { signoutSuccess } from '../features/userSlice';

const NAV_LINKS = [
    { to: '/', label: 'Home' },
    { to: '/search', label: 'Articles' },
    { to: '/about', label: 'About' },
];

export default function Header() {
    const path = useLocation().pathname;
    const { currentUser } = useSelector(state => state.user);
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const toggleMenu = () => setMenuOpen(!menuOpen);

    const handleSearch = (e) => {
        e.preventDefault();
        const q = searchTerm.trim();
        navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
        setSearchTerm('');
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
            navigate('/sign-in');
          }
        }
        catch (error) {
          console.log(error.message);
        }
      }
    
    return (
        <Navbar className='border-b border-gray-800 px-6 py-4 flex justify-between items-center bg-[#121212] text-white'>
            {/* Logo */}
            <Link to="/" className='text-xl font-semibold'>
                <span className='px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white'>
                    TechSphere
                </span>
            </Link>

            {/* Desktop Menu */}
            <div className='hidden md:flex items-center space-x-10'>
                {NAV_LINKS.map(({ to, label }) => (
                    <Link
                        key={to}
                        to={to}
                        className={`text-lg transition duration-300 ${
                            path === to ? 'text-white border-b-2 border-white' : 'text-gray-300 hover:text-white'
                        }`}
                    >
                        {label}
                    </Link>
                ))}
            </div>

            {/* Right Side */}
            <div className='flex items-center gap-4'>
                {/* Search (Desktop) */}
                <form onSubmit={handleSearch} className="hidden lg:flex items-center border border-slate-700 rounded-lg px-3 py-2 focus-within:border-white">
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent text-white placeholder-gray-400 focus:outline-none text-sm"
                    />
                    <button type="submit" aria-label="Search">
                        <AiOutlineSearch className="text-gray-400 hover:text-white cursor-pointer ml-2" />
                    </button>
                </form>

                {/* Mobile Search */}
                <Button onClick={() => navigate('/search')} className='lg:hidden text-gray-400 hover:text-white hover:border-white border border-slate-700 transition w-12 h-12 flex items-center justify-center'>
                    <AiOutlineSearch className="w-6 h-6" />
                </Button>

                {/* User Options */}
                {currentUser ? (
                    <Dropdown
                        arrowIcon={false}
                        inline
                        label={
                            <Avatar
                                alt='user'
                                img={currentUser.profilePicture || '/default-avatar.png'}
                                rounded
                                className='w-12 h-12 object-cover cursor-pointer hover:shadow-lg transition'
                            />
                        }
                        className="bg-[#181818] border border-gray-700 rounded-lg shadow-lg w-48"
                    >
                        <Dropdown.Header className="px-4 py-3 bg-gray-700">
                            <span className='block text-sm font-semibold text-white'>
                                @{currentUser.username}
                            </span>
                            <span className='block text-sm text-gray-400 truncate'>
                                {currentUser.email}
                            </span>
                        </Dropdown.Header>
                        <Link to={'/dashboard?tab=profile'}>
                            <Dropdown.Item className="px-4 py-2 hover:bg-indigo-600 transition">Profile</Dropdown.Item>
                        </Link>
                        <Link to={'/dashboard?tab=posts'} className={currentUser.isAdmin ? '' : 'hidden'}>
                            <Dropdown.Item className="px-4 py-2 hover:bg-indigo-600 transition">Manage Posts</Dropdown.Item>
                        </Link>
                        <Dropdown.Divider />
                        <Dropdown.Item onClick={handleSignOut} className="px-4 py-2 hover:bg-red-600 transition">Sign Out</Dropdown.Item>
                    </Dropdown>
                ) : (
                    <Link to='/sign-in'>
                        <Button className='border border-slate-700 text-white px-5 py-2 rounded-lg font-semibold transition hover:bg-purple-500 w-30 h-12 flex items-center justify-center'>
                            Sign In
                        </Button>
                    </Link>
                )}

                {/* Mobile Menu Button */}
                <Button
                    className='w-12 h-12 md:hidden text-gray-400 hover:text-white hover:border-white border border-slate-700 transition flex items-center justify-center'
                    onClick={toggleMenu}
                >
                    {menuOpen ? <AiOutlineClose className="w-6 h-6" /> : <AiOutlineMenu className="w-6 h-6" />}
                </Button>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className='fixed top-16 right-2 bg-[#181818] bg-opacity-90 flex flex-col items-center p-4 rounded-lg z-50 space-y-4 border border-gray-700 shadow-lg'>
                    {NAV_LINKS.map(({ to, label }) => (
                        <Link
                            key={to}
                            to={to}
                            className='text-white text-lg py-1 hover:text-indigo-300 transition'
                            onClick={toggleMenu}
                        >
                            {label}
                        </Link>
                    ))}
                </div>
            )}
        </Navbar>
    );
}