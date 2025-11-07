import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
// import ListeCours from '../components/cours/ListeCours';
import DashboardFormateur from './DashboardFormateur';
const Accueil = () => {
 
    return(
        <>
        <DashboardFormateur />
        {/* <ListeCours/> */}
        </>
    )
  
};

export default Accueil;