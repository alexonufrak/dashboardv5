export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "xFoundry Hub",
  description: "Empowering education through technology",
  navItems: [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Programs",
      href: "/programs",
    },
    {
      label: "Profile",
      href: "/profile",
    },
  ],
  navMenuItems: [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Programs",
      href: "/programs",
    },
    {
      label: "Profile",
      href: "/profile",
    },
    {
      label: "Team",
      href: "/team",
    },
    {
      label: "Settings",
      href: "/settings",
    },
    {
      label: "Help & Support",
      href: "/help",
    },
    {
      label: "Logout",
      href: "/api/auth/logout",
    },
  ],
  links: {
    github: "https://github.com/xfoundry",
    twitter: "https://twitter.com/xfoundry",
    website: "https://xfoundry.org",
    community: "https://connexions.xfoundry.org",
    discord: "https://discord.gg/xfoundry",
  },
};
