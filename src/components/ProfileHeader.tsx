
import React, { useState, useEffect } from "react";
import { getCurrentSimpleUserIdentity } from "@/utils/simpleIdentityUtils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ProfileDropdown from "./ProfileDropdown";

const ProfileHeader: React.FC = () => {
  const [userData, setUserData] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  useEffect(() => {
    // Get user identity from the new system
    const identity = getCurrentSimpleUserIdentity();
    if (identity) {
      setUserData(identity);
    }
  }, []);

  if (!userData) return null;

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
          {userData.name}
        </span>
      </Button>

      {dropdownOpen && (
        <ProfileDropdown 
          onClose={() => setDropdownOpen(false)} 
        />
      )}
    </div>
  );
};

export default ProfileHeader;
