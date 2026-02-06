import Nav from "./Nav";
import Footer from "./Footer";
import { useNavigate } from "react-router-dom";
const Hero = () => {
  const navigate = useNavigate();
  if(!localStorage.getItem("token")){
    return navigate("/login")
  }
  
 
  return (
    <div className="w-screen h-full"  >
    <div className="h-full w-screen  " style={{
        background:
          "linear-gradient(135deg, #F8FAFC 0%, #DBE6E1 50%, #E6FFFA 100%)",
      }}>
      <Nav />
      <div className="max-w-4xl mx-auto px-5 pt-20 flex flex-col gap-10 mt-4">
        <h1 className="text-4xl font-bold text-gray-800 text-center tracking-tight">
          Monitor Your Website.
          <span className="text-green-500"> Stay Ahead </span>of Downtime.
        </h1>
        <p className="text-lg text-gray-600 text-center">
          Track Uptime, response time, and errors in real-time. Get instant
          alerts before your users notice a problem.
        </p>
        <div className=" flex justify-center items-center gap-6">
          <button 
          onClick={()=>{
            navigate('/signup')
          }}
          className="px-3 py-2 bg-green-500 rounded-xl text-white">
            Get Started
          </button>
          <button className="px-3 py-2 bg-green-300 rounded-xl">
            Contact Us
          </button>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-5 mt-10">
        <div className="relative overflow-hidden rounded-2xl">
          <img className="w-full" src="/image.png" alt="" />
          <div className=" absolute mask-b-from-black to-white"></div>
        </div>
      </div>
      <div className="text-center max-w-4xl mx-auto px-5 mt-10">
        <h1 className=" text-3xl m-4">Everything You Need to Keep Your Website Reliable</h1>
        <p className="text-lg">Monitor performance, detect issues instantly, and stay ahead of outages — all from one simple dashboard.</p>
      </div>
      <div >
        <div className="max-w-6xl mx-auto px-5 mt-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Real-Time Monitoring</h2>
              <h3 className="mb-2 text-xl font-semibold" > Never miss a critical issue</h3>
              <p>Track uptime, response time, and errors continuously. Get notified the moment something goes wrong — before your users notice.</p>
            </div>
            <div className="bg-white rounded-2xl shadow-md p-6 ">
              <h2 className="text-xl font-semibold mb-4">Instant Alerts</h2>
              <h3 className="mb-2 text-xl font-semibold">Know instantly, act faster</h3>
              <p>Receive alerts via email (and more coming soon) when your site goes down or performance degrades.</p>
            </div>
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Global Status Tracking</h2>
              <h3 className="mb-2 text-xl ">Monitor your website’s availability across multiple regions to ensure global reliability.</h3>
              <p>Identify and troubleshoot errors quickly with detailed logs and insights into what’s going wrong.</p>
            </div>
          </div>
          <div className="text-center mt-30">
              <h1 className="text-3xl font-semibold text-center mb-5 ">Simple, Transparent Pricing</h1>
              <p className="text-lg">Start monitoring for free. Upgrade only when you need more power.</p>
              <div className=" grid grid-cols-3">
                <div className="bg-white rounded-2xl shadow-md p-6 m-4">
                    <h2 className="text-xl font-semibold mb-4">Free</h2>
                    <p className="text-2xl font-bold mb-4">$0</p>
                    <ul>
                      <li>Monitor 1 website</li>
                      <li>Basic uptime checks</li>
                      <li>Email alerts</li>
                    </ul>
                        <button 
                        onClick={()=>
                        {
                          navigate("/login")
                        }
                        }
                         className=" px-2 py-1 mt-4 bg-green-500 rounded-xl text-white">Start Free Trial</button>

                </div>
                <div className="bg-white rounded-2xl shadow-md p-6 m-4 ">
                    <h2 className="text-xl font-semibold mb-4">Pro</h2>
                    <p className="text-2xl font-bold mb-4">$9/month</p>
                    <ul>
                      <li>Monitor up to 5 websites</li>
                      <li>Advanced checks, instant alerts, and detailed logs</li>
                    </ul>
                        <button onClick={()=>                        {
                          navigate("/signup")
                        }
                        } className=" px-2 py-1 mt-4 bg-green-500 rounded-xl text-white">Start Your Pro Trial</button>
                </div>
                <div className="bg-white rounded-2xl shadow-md p-6 m-4">
                    <h2 className="text-xl font-semibold mb-4">Enterprise</h2>
                    <p className="text-2xl font-bold mb-4"> $20/month</p>
                    <ul>
                      <li>Custom solutions for large businesses with high monitoring needs and dedicated support.</li>
                    </ul>
                        <button className=" px-2 py-1 mt-4 bg-green-500 rounded-xl text-white">Contact Sales</button>
                </div>
              </div>
          </div>
          <Footer />
        </div>
      </div>
    </div>
    </div>
  );
};

export default Hero;
