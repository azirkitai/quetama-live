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
    title: "Queue Management",
    url: "/queue",
    icon: ClipboardList,
  },
  {
    title: "Patient Register",
    url: "/register",
    icon: UserPlus,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

const administrationItems = [
  {
    title: "User Management",
    url: "/administration",
    icon: Shield,
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
];

export function AppSidebar() {
  const [location] = useLocation();

  const handleLogout = () => {
    console.log("Logout triggered");
    // TODO: Remove mock functionality - implement real logout
  };

  return (
    <Sidebar className="sidebar-gradient border-r-0">
      {/* Branding Header */}
      <div className="p-6 border-b border-sidebar-border/20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">K</span>
          </div>
          <div>
            <h2 className="text-sidebar-foreground font-bold text-lg">KLINIK</h2>
            <p className="text-sidebar-foreground/60 text-xs uppercase tracking-wide">Calling System</p>
          </div>
        </div>
      </div>

      <SidebarContent className="px-4 py-6">
        {/* Main Navigation Section */}
        <div>
          <div className="sidebar-section-header">MAIN NAVIGATION</div>
          <div className="text-sidebar-foreground/80 text-sm mb-4">Key Your Personal Record Here</div>
          <SidebarMenu className="space-y-1">
            {mainNavigationItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  isActive={location === item.url}
                  data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  className="text-sidebar-foreground hover:bg-sidebar-accent/10 data-[active=true]:bg-sidebar-accent/20"
                >
                  <Link href={item.url}>
                    <item.icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>

        {/* Administration Section */}
        <div className="mt-8">
          <div className="sidebar-section-header">ADMINISTRATION</div>
          <div className="text-sidebar-foreground/80 text-sm mb-4">Key Your Personal Record Here</div>
          <SidebarMenu className="space-y-1">
            {administrationItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  isActive={location === item.url}
                  data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  className="text-sidebar-foreground hover:bg-sidebar-accent/10 data-[active=true]:bg-sidebar-accent/20"
                >
                  <Link href={item.url}>
                    <item.icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>
      </SidebarContent>
      <SidebarFooter className="px-4 py-4 border-t border-sidebar-border/20">
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