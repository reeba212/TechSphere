import React from 'react';
import { Link } from 'react-router-dom';
import { Footer } from 'flowbite-react';
import { FaGithub, FaLinkedin, FaTwitter, FaCode } from 'react-icons/fa';

export default function FooterCom() {
  return (
    <Footer container className='border border-t-8 border-purple-500 bg-[#0A0A0A] text-white'>
        <div className='w-full max-w-7xl mx-auto'>
            <div className='grid w-full justify-between sm:flex md:grid-cols-1'>
                <div className='mt-5'>
                    <Link to="/" className='self-center whitespace-nowrap text-lg sm:text-xl font-semibold'>
                        <span className='px-3 py-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg text-white text-3xl'>TechSphere</span>
                    </Link>
                </div>
                <div className='grid grid-cols-2 gap-8 mt-4 sm:grid-cols-3 sm:gap-6'>
                    <div>
                        <Footer.Title title='About' className='text-white'/>
                        <Footer.LinkGroup col>
                            <Footer.Link
                                href='https://reeba-portfolio.vercel.app/'
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-gray-400 hover:text-white transition'>
                                Personal Portfolio
                            </Footer.Link>
                            <Footer.Link
                                href='/about'
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-gray-400 hover:text-white transition'>
                                TechSphere
                            </Footer.Link>
                        </Footer.LinkGroup>
                    </div>
                    <div>
                        <Footer.Title title='Follow Us' className='text-white'/>
                        <Footer.LinkGroup col>
                            <Footer.Link
                                href='https://github.com/reeba212'
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-gray-400 hover:text-white transition'>
                                GitHub
                            </Footer.Link>
                            <Footer.Link
                                href='https://www.linkedin.com/in/reeba-qureshi-ab50821a8/'
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-gray-400 hover:text-white transition'>
                                LinkedIn
                            </Footer.Link>
                        </Footer.LinkGroup>
                    </div>
                    <div>
                        <Footer.Title title='Legal' className='text-white'/>
                        <Footer.LinkGroup col>
                            <Footer.Link
                                href='#'
                                className='text-gray-400 hover:text-white transition'>
                                Privacy Policy
                            </Footer.Link>
                            <Footer.Link
                                href='#'
                                className='text-gray-400 hover:text-white transition'>
                                Terms & Conditions
                            </Footer.Link>
                        </Footer.LinkGroup>
                    </div>
                </div>
            </div>
            <Footer.Divider className='border-gray-700 p-2 mt-3'/>
            <div className='w-full sm:flex sm:items-center sm:justify-between'>
                <Footer.Copyright 
                    href='#' 
                    by="TechSphere" 
                    year={new Date().getFullYear()}
                    className='text-gray-400'
                />
                <div className='flex gap-6 sm:mt-0 mt-4 sm:justify-center'>
                    <Footer.Icon 
                        href='https://github.com/reeba212' 
                        icon={FaGithub} 
                        className='text-gray-400 hover:text-white transition'
                    />
                    <Footer.Icon 
                        href='https://www.linkedin.com/in/reeba-qureshi-ab50821a8/' 
                        icon={FaLinkedin} 
                        className='text-gray-400 hover:text-white transition'
                    />
                    <Footer.Icon 
                        href='https://x.com/ReebaQureshi212' 
                        icon={FaTwitter} 
                        className='text-gray-400 hover:text-white transition'
                    />
                    <Footer.Icon 
                        href='https://leetcode.com/u/reebaq2/' 
                        icon={FaCode} 
                        className='text-gray-400 hover:text-white transition'
                    />
                </div>
            </div>
        </div>
    </Footer>
  );
}