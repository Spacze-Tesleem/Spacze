import Navbar from './components/navbar'; 
import Hero from './components/Hero';

export default function Home() {
  return (
    <main className="bg-black min-h-screen">
      <Hero />
      {/* Other sections will go here */}
    </main>
  );
}