import { Sidebar } from 'flowbite-react';
import { HiArrowSmRight, HiUser } from 'react-icons/hi';
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { signoutSuccess } from '../features/userSlice';

export default function DashSidebar() {
  const location = useLocation();
  const [tab, setTab] = useState('');
  const dispatch = useDispatch();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabFromUrl = urlParams.get('tab');
    if (tabFromUrl) {
      setTab(tabFromUrl);
    }
  }, [location.search]);

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
        }
      }
      catch (error) {
        console.log(error.message);
      }
    }
  

  return (
    <Sidebar className="h-full w-full md:w-56 bg-[#121212]">
      <Sidebar.Items>
        <Sidebar.ItemGroup>
          {/* Profile */}
          <Sidebar.Item
            as={Link}
            to="/dashboard?tab=profile"
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

          {/* Sign Out */}
          <Sidebar.Item
            icon={HiArrowSmRight}
            className="cursor-pointer text-white hover:text-gray-300 hover:bg-[#181818] transition-colors"
            onClick={handleSignOut}
          >
            Sign Out
          </Sidebar.Item>
        </Sidebar.ItemGroup>
      </Sidebar.Items>
    </Sidebar>
  );
}
