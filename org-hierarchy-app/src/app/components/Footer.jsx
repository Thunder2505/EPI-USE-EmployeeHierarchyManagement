import { AiOutlineFileText } from 'react-icons/ai';

export default function Footer() {
  return (
    <footer
      className="flex justify-between items-center p-4"
      style={{
        background: 'var(--foreground)',
        color: 'var(--text)',
      }}
    >
      {/* Left side: User manual link with icon */}
      <a
        href="/user-manual"
        className="flex items-center gap-1 text-inherit hover:underline"
      >
        <AiOutlineFileText size={20} />
        User Manual
      </a>

      {/* Center: copyright */}
      <p className="text-center flex-1">
        &copy; {new Date().getFullYear()} Employee Hierarchy Manager.
      </p>
    </footer>
  );
}
