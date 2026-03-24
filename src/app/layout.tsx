import type { Metadata } from 'next';
import './globals.css';
import { createClient } from '@/lib/supabase/server';
import SidebarAuth from './components/SidebarAuth';
import ThemeToggle from './components/ThemeToggle';
import NavLink from './components/NavLink';

export const metadata: Metadata = {
  title: 'Prompt Chain Tool',
  description: 'Manage humor flavors and LLM prompt chain steps',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthed = !!user;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply theme before hydration to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('theme');
                  if (stored === 'dark') {
                    document.documentElement.setAttribute('data-theme', 'dark');
                  } else if (stored === 'light') {
                    document.documentElement.setAttribute('data-theme', 'light');
                  } else {
                    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        {isAuthed ? (
          <div className="app-layout">
            <aside className="sidebar">
              <div className="sidebar-logo">
                <div className="sidebar-logo-title">⛓ Prompt Chain</div>
                <div className="sidebar-logo-sub">Humor Flavor Manager</div>
              </div>

              <nav className="sidebar-nav">
                <div className="sidebar-nav-group">
                  <div className="sidebar-nav-label">Content</div>
                  <NavLink href="/flavors" label="Flavors" icon="🌶️" />
                </div>
              </nav>

              <div className="sidebar-footer">
                <ThemeToggle />
                <SidebarAuth />
              </div>
            </aside>

            <main className="main-content">{children}</main>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
