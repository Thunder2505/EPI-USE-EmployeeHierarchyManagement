export default function LoginPage() {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{
        background: 'var(--background)', // likely white (#fff)
        color: 'var(--foreground)', // your default text color
      }}
    >
      <div
        className="w-full max-w-md p-8 rounded-2xl shadow-md border"
        style={{
          background: 'rgba(34, 33, 33, 1)', // keep white
          color: 'var(--foreground)',
          borderColor: 'rgba(0, 75, 172, 1)', // lighter border
          boxShadow: '0 2px 8px rgba(245, 235, 96, 0.41)', // lighter shadow
        }}
      >
        <h2 className="text-2xl font-bold text-center mb-6">
          Login to your account
        </h2>

        <form className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-200">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="w-full px-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{
                borderColor: 'rgba(0, 0, 0, 0.15)', // lighter border
                color: '#222', // darker text inside input
              }}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1 text-gray-200">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{
                borderColor: 'rgba(0, 0, 0, 0.15)',
                color: '#222',
              }}
              required
            />
          </div>

          <div className="flex justify-between text-sm text-gray-400">
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
              background: '#3b82f6', // blue-500, lighter than before
              color: '#fff',
            }}
          >
            Login
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-gray-400">
          Don’t have an account?{' '}
          <a href="#" className="text-blue-500 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
