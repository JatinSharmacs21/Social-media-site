import Navbar from "./Navbar";

function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <main className="min-h-screen pt-[76px] md:pt-0 md:pl-[210px] pb-20 md:pb-0 transition-all duration-300">
        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  );
}

export default MainLayout;
