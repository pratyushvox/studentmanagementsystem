
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landingpage from './pages/Landingpage'
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';


function App() {
 
  return (
    <Router>

    
      <Routes>
        {/* auth routes  */}
         <Route path="/" element={<Landingpage />} />
         <Route path="/Login" element={<Login />} />
         <Route path="/Register" element={<Register/>} />



      </Routes>
      </Router>
    
   
     
  
  )
}

export default App
