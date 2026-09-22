import React from 'react';
import { Link } from 'react-router-dom';
import { Footer } from 'flowbite-react';
import { FaGithub, FaLinkedin, FaTwitter, FaCode } from 'react-icons/fa';
import BrandMark from './BrandMark';

export default function FooterCom() {
  return (
    <Footer container className='border border-t border-line bg-surface text-ink'>
        <div className='w-full max-w-7xl mx-auto'>
            <div className='grid w-full justify-between sm:flex md:grid-cols-1'>
                <div className='mt-5'>
                    <Link to="/" className='self-center whitespace-nowrap'>
                        <BrandMark size='lg' />
                    </Link>
                </div>
                <div className='grid grid-cols-2 gap-8 mt-4 sm:grid-cols-3 sm:gap-6'>
                    <div>
                        <Footer.Title title='About' className='text-ink'/>
                        <Footer.LinkGroup col>
                            <Footer.Link
                                href='https://reeba-portfolio.vercel.app/'
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-muted hover:text-accent transition'>
                                Personal Portfolio
                            </Footer.Link>
                            <Footer.Link
                                href='/about'
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-muted hover:text-accent transition'>
                                TechSphere
                            </Footer.Link>
                        </Footer.LinkGroup>
                    </div>
                    <div>
                        <Footer.Title title='Follow Us' className='text-ink'/>
                        <Footer.LinkGroup col>
                            <Footer.Link
                                href='https://github.com/reeba212'
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-muted hover:text-accent transition'>
                                GitHub
                            </Footer.Link>
                            <Footer.Link
                                href='https://www.linkedin.com/in/reeba-qureshi-ab50821a8/'
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-muted hover:text-accent transition'>
                                LinkedIn
                            </Footer.Link>
                        </Footer.LinkGroup>
                    </div>
                    <div>
                        <Footer.Title title='Legal' className='text-ink'/>
                        <Footer.LinkGroup col>
                            <Footer.Link
                                href='#'
                                className='text-muted hover:text-accent transition'>
                                Privacy Policy
                            </Footer.Link>
                            <Footer.Link
                                href='#'
                                className='text-muted hover:text-accent transition'>
                                Terms & Conditions
                            </Footer.Link>
                        </Footer.LinkGroup>
                    </div>
                </div>
            </div>
            <Footer.Divider className='border-line p-2 mt-3'/>
            <div className='w-full sm:flex sm:items-center sm:justify-between'>
                <Footer.Copyright
                    href='#'
                    by="TechSphere"
                    year={new Date().getFullYear()}
                    className='text-muted'
                />
                <div className='flex gap-6 sm:mt-0 mt-4 sm:justify-center'>
                    <Footer.Icon
                        href='https://github.com/reeba212'
                        icon={FaGithub}
                        className='text-muted hover:text-accent transition'
                    />
                    <Footer.Icon
                        href='https://www.linkedin.com/in/reeba-qureshi-ab50821a8/'
                        icon={FaLinkedin}
                        className='text-muted hover:text-accent transition'
                    />
                    <Footer.Icon
                        href='https://x.com/ReebaQureshi212'
                        icon={FaTwitter}
                        className='text-muted hover:text-accent transition'
                    />
                    <Footer.Icon
                        href='https://leetcode.com/u/reebaq2/'
                        icon={FaCode}
                        className='text-muted hover:text-accent transition'
                    />
                </div>
            </div>
        </div>
    </Footer>
  );
}