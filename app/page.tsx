import Hero from './components/Hero';
import Services from './components/Services';
import Process from './components/Process';
import About from './components/About';
import MissionVision from './components/MissionVision';
import WhyChooseUs from './components/Choose';
import Portfolio from './components/Portfolio';
import Testimonials from './components/Testimonials';
import CallToAction from './components/CTA';
import ContactPage from './components/Contact';

export default function Home() {
  return (
    <main className="bg-black min-h-screen">
      <Hero />
      <About />
      <Services />
      <Process />
      <MissionVision />
      <WhyChooseUs />
      <Portfolio />
      <Testimonials />
      <CallToAction />
      <ContactPage />
    </main>
  );
}