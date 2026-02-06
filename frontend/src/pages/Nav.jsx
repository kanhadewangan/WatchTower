import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'

const Nav = () => {
  const navigator = useNavigate()
  return (
    <div className=' max-w-4xl mx-auto px-5 pt-8'>
        <div className='  w-full  flex justify-between items-center pt-4 bg-white shadow-md rounded-2xl px-4 py-2'>
        <h1 className='text-2xl font-semibold'>WatchTower</h1>
        <div className='flex justify-center items-center gap-4'>
            <a href='/' className=' text-center text-md '>Home</a>
            <a href='/features' className=' text-center text-md '>Features</a>
            <a href='/pricing' className=' text-center text-md '>Pricing</a>
            <a href='/contact' className=' text-center text-md '>Contact</a>
                <button onClick={()=>{
                  navigator('/login')
                }} className=' p-1 bg-green-500 text-white rounded-xl'>Start Free Trial</button>
        </div>

</div>

        



    </div>
  )
}

export default Nav