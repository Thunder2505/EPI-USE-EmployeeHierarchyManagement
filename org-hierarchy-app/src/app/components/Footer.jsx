// app/components/Footer.jsx
export default function Footer() {
  return (
    <footer className="text-center p-4"
      style={{
        background: 'var(--foreground)',
        color: 'var(--text)',
      }}
    >
      <p>&copy; {new Date().getFullYear()} Employee Hierarchy Manager.</p>
    </footer>
  );
}
