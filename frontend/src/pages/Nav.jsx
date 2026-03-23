import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

const Nav = () => {
  const navigator = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className='max-w-4xl mx-auto px-5 pt-8'>
      <div className='w-full flex justify-between items-center pt-4 bg-white shadow-md rounded-2xl px-4 py-2'>
        <h1 className='text-2xl font-semibold'>WatchTower</h1>
        {/* Desktop Menu */}
        <div className='hidden md:flex justify-center items-center gap-4'>
          <a href='/dashboard' className='text-center text-md'>Dashboard</a>
          <a href='/features' className='text-center text-md'>Features</a>
          <a href='/pricing' className='text-center text-md'>Pricing</a>
          <a href='/contact' className='text-center text-md'>Contact</a>
          <button
            onClick={() => { navigator('/login') }}
            className='p-1 bg-green-500 text-white rounded-xl'
          >
            Start Free Trial
          </button>
        </div>
        {/* Hamburger Icon */}
        <button
          className='md:hidden flex flex-col justify-center items-center'
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className='block w-6 h-0.5 bg-black mb-1'></span>
          <span className='block w-6 h-0.5 bg-black mb-1'></span>
          <span className='block w-6 h-0.5 bg-black'></span>
        </button>
      </div>
      {/* Mobile Menu */}
      {menuOpen && (
        <div className='md:hidden flex flex-col gap-2 mt-2 bg-white shadow rounded-2xl px-4 py-2'>
          <a href='/dashboard' className='text-center text-md'>Dashboard</a>
          <a href='/features' className='text-center text-md'>Features</a>
          <a href='/pricing' className='text-center text-md'>Pricing</a>
          <a href='/contact' className='text-center text-md'>Contact</a>
          <button
            onClick={() => { navigator('/login') }}
            className='p-1 bg-green-500 text-white rounded-xl'
          >
            Start Free Trial
          </button>
        </div>
      )}
    </div>
  )
}

export default Nav