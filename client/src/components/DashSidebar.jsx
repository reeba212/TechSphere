import { Sidebar } from 'flowbite-react';
import { HiArrowSmRight, HiUser } from 'react-icons/hi';
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function DashSidebar() {
  const location = useLocation();
  const [tab, setTab] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabFromUrl = urlParams.get('tab');
    if (tabFromUrl) {
      setTab(tabFromUrl);
    }
  }, [location.search]);

  return (
    <Sidebar className="h-full w-full md:w-56 bg-[#121212]">
      <Sidebar.Items>
        <Sidebar.ItemGroup>
            <Link to='/dashboard?tab=profile'>
                {/* Profile */}
                <Sidebar.Item
                    active={tab === 'profile'}
                    icon={HiUser}
                    label="User"
                    labelColor="dark"
                    className={`cursor-pointer text-white hover:text-gray-300 hover:bg-[#181818] transition-colors ${
                    tab === 'profile' ? 'bg-[#202020]' : ''
                    }`}
                >
                    Profile
                </Sidebar.Item>
            </Link>
          {/* Sign Out */}
          <Sidebar.Item
            icon={HiArrowSmRight}
            className="cursor-pointer text-white hover:text-gray-300 hover:bg-[#181818] transition-colors"
          >
            Sign Out
          </Sidebar.Item>
        </Sidebar.ItemGroup>
      </Sidebar.Items>
    </Sidebar>
  );
}
