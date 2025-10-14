import Footer from "./footer";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 w-full">
        {children}
      </main>
      <Footer />
    </div>
  );
}