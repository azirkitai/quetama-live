import {
  LayoutDashboard,
  Settings,
  UserPlus,
  Users,
  ClipboardList,
  UserCog,
  Shield,
  LogOut,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import logoImage from "@assets/PANEL KLINIK UTAMA (8)_1759061809470.png";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

const mainNavigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Patient Register",
    url: "/register",
    icon: UserPlus,
  },
  {
    title: "Queue Management",
    url: "/queue",
    icon: ClipboardList,
  },
];

const administrationItems = [
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
  {
    title: "Account Settings",
    url: "/account",
    icon: UserCog,
  },
  {
    title: "System Management",
    url: "/management",
    icon: Users,
  },
  {
    title: "User Management",
    url: "/administration",
    icon: Shield,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  const handleLogout = () => {
    console.log("Logout triggered");
    // TODO: Remove mock functionality - implement real logout
  };

  return (
    <Sidebar 
      className="border-r-0" 
      style={{ 
        background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 50%, #020617 100%) !important',
        backgroundImage: 'linear-gradient(180deg, #1e293b 0%, #0f172a 50%, #020617 100%) !important'
      }}
    >
      {/* Branding Header */}
      <div 
        className="p-8 border-b border-sidebar-border/20"
        style={{
          background: 'transparent',
          backgroundColor: 'transparent'
        }}
      >
        <div className="flex justify-center items-center">
          <img 
            src={logoImage} 
            alt="QueTAMA System" 
            className="h-32 w-auto object-contain max-w-full"
            style={{ filter: 'brightness(1.1)' }}
          />
        </div>
      </div>

      <SidebarContent 
        className="px-4 py-6"
        style={{ 
          background: 'transparent' 
        }}
      >
        {/* Main Navigation Section */}
        <div>
          <div className="sidebar-section-header">MAIN NAVIGATION</div>
          <SidebarMenu className="space-y-1">
            {mainNavigationItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  isActive={location === item.url}
                  data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  className="sidebar-nav-item"
                  data-active={location === item.url}
                >
                  <Link href={item.url}>
                    <item.icon className="w-5 h-5" />
                    <span className="sidebar-nav-text">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>

        {/* Administration Section */}
        <div className="mt-8">
          <div className="sidebar-section-header">ADMINISTRATION</div>
          <SidebarMenu className="space-y-1">
            {administrationItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  isActive={location === item.url}
                  data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  className="sidebar-nav-item"
                  data-active={location === item.url}
                >
                  <Link href={item.url}>
                    <item.icon className="w-5 h-5" />
                    <span className="sidebar-nav-text">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>
      </SidebarContent>
      <SidebarFooter 
        className="px-4 py-4 border-t border-sidebar-border/20"
        style={{
          background: 'transparent',
          backgroundColor: 'transparent'
        }}
      >
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              data-testid="button-logout"
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        {/* Footer Branding */}
        <div className="mt-4 text-center">
          <p className="text-sidebar-foreground/40 text-xs">
            KlinikHR Designed by Sir.S
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}