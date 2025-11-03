import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import ListeCours from '../components/cours/ListeCours';
const Accueil = () => {
 
    return(
        <>
        <ListeCours/>
        </>
    )
  
};

export default Accueil;