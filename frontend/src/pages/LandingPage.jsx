import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import HeroSection from '../components/landing/HeroSection';
import StepsSection from '../components/landing/StepsSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import HowItWorks from '../components/landing/HowItWorks';

const LandingPage = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.state?.scrollTo) {
      const element = document.getElementById(location.state.scrollTo);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800">
      <Header />
      <div id="hero">
        <HeroSection />
      </div>
      <div id="how-it-works">
        <HowItWorks />
      </div>
      <div id="features">
        <FeaturesSection />
      </div>
      <StepsSection />
      <Footer />
    </div>
  );
};

export default LandingPage;
