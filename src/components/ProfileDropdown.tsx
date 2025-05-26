
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentSimpleUserIdentity, logoutSimpleUser } from "@/utils/simpleIdentityUtils";
import { UserRound, Copy, Download, LogOut, QrCode, RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface ProfileDropdownProps {
  onClose: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ onClose }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [userData, setUserData] = useState<any>(null);
  const navigate = useNavigate();
  const [showIdCopy, setShowIdCopy] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    // Get user identity
    const identity = getCurrentSimpleUserIdentity();
    setUserData(identity);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleLogout = async () => {
    logoutSimpleUser();
    onClose();
    toast("Logged Out Successfully", {
      description: "You have been logged out. Create a new account or login with existing one."
    });
    
    // Fast redirect to homepage
    navigate("/", { replace: true });
    
    // Force immediate reload for fast response
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const handleCopyId = () => {
    if (!userData?.uniqueId) return;
    
    navigator.clipboard.writeText(userData.uniqueId)
      .then(() => {
        toast("Unique ID Copied", {
          description: "Your unique spiritual ID has been copied to clipboard"
        });
      })
      .catch(err => {
        toast("Copy Failed", {
          description: "Could not copy to clipboard"
        });
      });
  };

  const handleExportIdentity = () => {
    if (!userData) return;
    
    const dataStr = JSON.stringify(userData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `spiritual-identity-${userData.uniqueId}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast("Identity Exported", {
      description: "Your spiritual identity data has been downloaded."
    });
    
    onClose();
  };

  const handleViewExportId = () => {
    onClose();
    navigate('/export-id');
  };

  const toggleIdCopy = () => {
    setShowIdCopy(!showIdCopy);
  };

  if (!userData) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute top-full right-0 mt-2 w-64 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg py-1 z-50"
    >
      <div className="px-4 py-3 border-b border-zinc-700">
        <p className="text-sm font-medium text-amber-400">{userData.name}</p>
        <p className="text-xs text-gray-400 mt-1">Email: {userData.email}</p>
        <p className="text-xs text-gray-400">ID: {userData.uniqueId}</p>
      </div>
      
      <ul>
        <li>
          <button 
            className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-zinc-700"
            onClick={handleViewExportId}
          >
            <QrCode size={16} className="mr-2 text-gray-400" />
            Export ID & QR Code
          </button>
        </li>
        <li>
          {showIdCopy ? (
            <div className="px-4 py-2 flex items-center justify-between">
              <p className="text-sm text-amber-400 truncate">{userData?.uniqueId}</p>
              <button 
                className="ml-2 p-1 rounded-full hover:bg-zinc-700"
                onClick={handleCopyId}
              >
                <Copy size={16} className="text-gray-400" />
              </button>
            </div>
          ) : (
            <button 
              className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-zinc-700"
              onClick={toggleIdCopy}
            >
              <UserRound size={16} className="mr-2 text-gray-400" />
              Copy Unique ID
            </button>
          )}
        </li>
        <li>
          <button 
            className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-zinc-700"
            onClick={handleExportIdentity}
          >
            <Download size={16} className="mr-2 text-gray-400" />
            Export Identity Data
          </button>
        </li>
        <li className="border-t border-zinc-700 mt-1">
          <button 
            className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300"
            onClick={handleLogout}
          >
            <LogOut size={16} className="mr-2" />
            Logout / लॉगआउट
          </button>
        </li>
      </ul>
    </div>
  );
};

export default ProfileDropdown;
