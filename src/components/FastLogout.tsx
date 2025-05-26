
import React from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { logoutCurrentUser } from "@/utils/portableIdentityUtils";
import { toast } from "@/components/ui/sonner";

const FastLogout: React.FC = () => {
  const navigate = useNavigate();

  const handleFastLogout = async () => {
    await logoutCurrentUser();
    toast("Logged Out Successfully", {
      description: "You have been logged out. Create a new account or login with existing one."
    });
    navigate("/", { replace: true });
  };

  return (
    <Button
      onClick={handleFastLogout}
      variant="ghost"
      size="sm"
      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
    >
      <LogOut className="h-4 w-4 mr-2" />
      Logout
    </Button>
  );
};

export default FastLogout;
