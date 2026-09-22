import { Sidebar } from 'flowbite-react';
import { HiArrowSmRight, HiUser, HiDocumentText, HiCollection, HiAcademicCap, HiCheckCircle, HiBookmark } from 'react-icons/hi';
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signoutSuccess } from '../features/userSlice';

export default function DashSidebar() {
  const location = useLocation();
  const [tab, setTab] = useState('');
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);

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
    <Sidebar className="h-full w-full md:w-56 bg-surface">
      <Sidebar.Items>
        <Sidebar.ItemGroup>
          {/* Profile */}
          <Sidebar.Item
            as={Link}
            to="/dashboard?tab=profile"
            active={tab === 'profile'}
            icon={HiUser}
            className={`cursor-pointer text-ink hover:text-accent hover:bg-surface-2 transition-colors ${
              tab === 'profile' ? 'bg-raised' : ''
            }`}
          >
            Profile
          </Sidebar.Item>

          {/* Posts and series (admin only) */}
          {currentUser?.isAdmin && (
            <Sidebar.Item
              as={Link}
              to="/dashboard?tab=posts"
              active={tab === 'posts'}
              icon={HiDocumentText}
              className={`cursor-pointer text-ink hover:text-accent hover:bg-surface-2 transition-colors ${
                tab === 'posts' ? 'bg-raised' : ''
              }`}
            >
              Posts
            </Sidebar.Item>
          )}
          {currentUser?.isAdmin && (
            <Sidebar.Item
              as={Link}
              to="/dashboard?tab=series"
              active={tab === 'series'}
              icon={HiCollection}
              className={`cursor-pointer text-ink hover:text-accent hover:bg-surface-2 transition-colors ${
                tab === 'series' ? 'bg-raised' : ''
              }`}
            >
              Series
            </Sidebar.Item>
          )}

          {/* Continue learning */}
          <Sidebar.Item
            as={Link}
            to="/dashboard?tab=learning"
            active={tab === 'learning'}
            icon={HiAcademicCap}
            className={`cursor-pointer text-ink hover:text-accent hover:bg-surface-2 transition-colors ${
              tab === 'learning' ? 'bg-raised' : ''
            }`}
          >
            Continue Learning
          </Sidebar.Item>

          {/* Completed */}
          <Sidebar.Item
            as={Link}
            to="/dashboard?tab=completed"
            active={tab === 'completed'}
            icon={HiCheckCircle}
            className={`cursor-pointer text-ink hover:text-accent hover:bg-surface-2 transition-colors ${
              tab === 'completed' ? 'bg-raised' : ''
            }`}
          >
            Completed
          </Sidebar.Item>

          {/* Saved */}
          <Sidebar.Item
            as={Link}
            to="/dashboard?tab=saved"
            active={tab === 'saved'}
            icon={HiBookmark}
            className={`cursor-pointer text-ink hover:text-accent hover:bg-surface-2 transition-colors ${
              tab === 'saved' ? 'bg-raised' : ''
            }`}
          >
            Saved
          </Sidebar.Item>

          {/* Sign Out */}
          <Sidebar.Item
            icon={HiArrowSmRight}
            className="cursor-pointer text-ink hover:text-accent hover:bg-surface-2 transition-colors"
            onClick={handleSignOut}
          >
            Sign Out
          </Sidebar.Item>
        </Sidebar.ItemGroup>
      </Sidebar.Items>
    </Sidebar>
  );
}
