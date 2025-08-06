// app/components/Footer.jsx
export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white text-center p-4 mt-8">
      <p>&copy; {new Date().getFullYear()} Employee Hierarchy Manager.</p>
    </footer>
  );
}
