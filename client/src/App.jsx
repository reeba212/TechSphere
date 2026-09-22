import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'
import Dashboard from './pages/Dashboard'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Header from './components/Header';
import Footer from './components/Footer'
import PrivateRoute from './components/PrivateRoute'
import AdminPrivateRoute from './components/AdminPrivateRoute'
import CreatePost from './pages/CreatePost'
import EditPost from './pages/EditPost'
import PostPage from './pages/PostPage'
import Articles from './pages/Articles'
import Series from './pages/Series'
import SeriesPage from './pages/SeriesPage'
import CreateSeries from './pages/CreateSeries'
import EditSeries from './pages/EditSeries'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
    <Header/>
    <div className='flex-1 flex flex-col'>
      <Routes>
        <Route path='/' element={<Home/>} />
        <Route path='/about' element={<About/>} />
        <Route element={<PrivateRoute />}>
          <Route path='/dashboard' element={<Dashboard/>} />
        </Route>
        <Route element={<AdminPrivateRoute />}>
          <Route path='/create-post' element={<CreatePost/>} />
          <Route path='/edit-post/:slug' element={<EditPost/>} />
          <Route path='/create-series' element={<CreateSeries/>} />
          <Route path='/edit-series/:slug' element={<EditSeries/>} />
        </Route>
        <Route path='/sign-in' element={<SignIn/>} />
        <Route path='/sign-up' element={<SignUp/>} />
        <Route path='/search' element={<Articles/>} />
        <Route path='/category/:category' element={<Articles/>} />
        <Route path='/post/:slug' element={<PostPage/>} />
        <Route path='/series' element={<Series/>} />
        <Route path='/series/:slug' element={<SeriesPage/>} />
        <Route path='*' element={<NotFound/>} />
      </Routes>
    </div>
    <Footer/>
    </BrowserRouter>
  )
}
