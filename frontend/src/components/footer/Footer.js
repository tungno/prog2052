import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <div>
      <footer>

      <div class="footer-container">

        <div class = "footer-section">
          <h3>Contact Information</h3>
          <ul>
            <li>Email: supportcalendar@ntnu.no</li>
            <li>Phone Number: 99887766</li>
            <li>Address: Kalendervegen 43, 0123 Gjøvik</li>
          </ul>
        </div>

        <div class = "footer-section">
          <h3>Follow Us</h3>
          <ul class = "social-media">
            <li><a href='#'>Instagram</a></li>
            <li><a href='#'>Facebook</a></li>
            <li><a href='#'>LinkedIn</a></li>
          </ul>
        </div>


        {/* Useful Links*/}
        <div class = "footer-section">
          <h3>Misc</h3>
          <ul>
            <li><a href="#">Home</a></li>
            <li><a href="#">About Us</a></li>
            <li><a href="#">FAQ</a></li>
            <li><a href="#">Find Us</a></li>
          </ul>
        </div>
      
  </div>  
    

        {/*Bottom Section with Copyright and Other Information */}
    <div class="footer-bottom">
        <p>© 2024 Calendar Website. All rights reserved.</p>
        <p>Powered by Aayush, Majd, Pau, Phrot.</p>
        <ul>
            <li><a href="#">API Documentation</a></li>
        </ul>
    </div>
   </footer>
    </div>
  );
};

export default Footer;