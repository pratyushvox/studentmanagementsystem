import Navbar from "../components/Landing/LandingpageNavbar.tsx";
import Features from "../components/Landing/Features.tsx";
import EducationHero from "../components/Landing/Hero.tsx";
import Benefits from "../components/Landing/Benefits.tsx";
import Footer from "../components/Landing/Footer.tsx";
// import { useNavigate } from "react-router-dom"; 

function Landingpage(){
    //  const navigate = useNavigate(); 
    return(
        <div className="min-h-screen bg-white">
            <Navbar/>
            <EducationHero/>
            <Features/>
           <Benefits/> 
           <Footer/>

        </div>
    )
}
export default Landingpage