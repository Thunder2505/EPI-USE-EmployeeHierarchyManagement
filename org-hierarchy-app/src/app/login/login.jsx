// src/app/login/page.jsx

export default function LoginPage() {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{
        background: 'var(--background)',
        color: 'var(--foreground)',
      }}
    >
      <div
        className="w-full max-w-md p-8 rounded-2xl shadow-lg border"
        style={{
          background: 'var(--background)',
          color: 'var(--foreground)',
          borderColor: 'rgba(0, 0, 0, 0.1)', // Light border
        }}
      >
        <h2 className="text-2xl font-bold text-center mb-6">
          Login to your account
        </h2>

        <form className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="w-full px-4 py-2 border rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                borderColor: 'rgba(0, 0, 0, 0.2)',
                color: 'var(--foreground)',
              }}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2 border rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                borderColor: 'rgba(0, 0, 0, 0.2)',
                color: 'var(--foreground)',
              }}
              required
            />
          </div>

          <div className="flex justify-between text-sm">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              Remember me
            </label>
            <a href="#" className="text-blue-500 hover:underline">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded-lg font-medium transition-colors"
            style={{
              background: '#2563eb', // blue-600
              color: '#fff',
            }}
          >
            Login
          </button>
        </form>

        <p className="mt-6 text-sm text-center">
          Don’t have an account?{' '}
          <a href="#" className="text-blue-500 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
