import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom';
import DashProfile from '../components/DashProfile';
import DashSidebar from '../components/DashSidebar';
import DashPosts from '../components/DashPosts';
import DashSeries from '../components/DashSeries';
import DashContinueLearning from '../components/DashContinueLearning';
import DashCompleted from '../components/DashCompleted';
import DashSaved from '../components/DashSaved';
import { useSelector } from 'react-redux';

export default function Dashboard() {
  const location = useLocation();
  const [ tab, setTab] = useState('');
  const { currentUser } = useSelector((state) => state.user);
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabFromUrl = urlParams.get('tab');
    if (tabFromUrl) {
      setTab(tabFromUrl);
    }
  }, [location.search])

  return (
    <div className='min-h-screen flex flex-col md:flex-row'>
      <div className='md:w-56'>
        {/* Sidebar */}
        <DashSidebar />

      </div>
      {/* profile... */}
        {tab === 'profile' && <DashProfile />}
      {/* posts and series (admin only) */}
        {tab === 'posts' && currentUser?.isAdmin && <DashPosts />}
        {tab === 'series' && currentUser?.isAdmin && <DashSeries />}
      {/* reader learning tabs */}
        {tab === 'learning' && <DashContinueLearning />}
        {tab === 'completed' && <DashCompleted />}
        {tab === 'saved' && <DashSaved />}
    </div>
  )
}
