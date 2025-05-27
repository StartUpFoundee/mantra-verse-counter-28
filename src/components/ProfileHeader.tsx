
import React, { useState, useEffect } from "react";
import { webAuthnIdentity, UserIdentity } from "@/utils/webauthn-identity";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, LogOut } from "lucide-react";

const ProfileHeader: React.FC = () => {
  const [currentIdentity, setCurrentIdentity] = useState<UserIdentity | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  useEffect(() => {
    const loadIdentity = async () => {
      const identity = await webAuthnIdentity.getCurrentIdentity();
      setCurrentIdentity(identity);
    };
    loadIdentity();
  }, []);

  const handleLogout = () => {
    webAuthnIdentity.logout();
    setCurrentIdentity(null);
    window.location.reload();
  };

  if (!currentIdentity) return null;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        className="flex items-center gap-2 p-1 hover:bg-zinc-800 rounded-full"
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        <Avatar className="h-14 w-14 md:h-16 md:w-16 border-2 border-amber-600/30">
          <AvatarFallback className="bg-amber-500/20 text-amber-400 text-xl md:text-2xl">
            🕉️
          </AvatarFallback>
        </Avatar>
        <span className="text-amber-400 text-sm hidden sm:inline-block">
          {currentIdentity.name}
        </span>
      </Button>

      {dropdownOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-zinc-700">
            <p className="text-white font-medium">{currentIdentity.name}</p>
            <p className="text-xs text-gray-400">ID: {currentIdentity.id.substring(0, 12)}...</p>
          </div>
          <div className="p-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-400 hover:bg-red-500/10"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileHeader;
