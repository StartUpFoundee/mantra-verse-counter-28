
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, QrCode, FileText } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { cryptoIdentity } from "@/utils/crypto-identity";

interface IdentityRestoreProps {
  onRestoreComplete: () => void;
  onCancel: () => void;
}

const IdentityRestore: React.FC<IdentityRestoreProps> = ({
  onRestoreComplete,
  onCancel
}) => {
  const [restoreData, setRestoreData] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestore = async () => {
    if (!restoreData.trim()) {
      toast.error("Missing Data", {
        description: "Please provide backup data to restore"
      });
      return;
    }

    setIsRestoring(true);
    try {
      const exportedData = JSON.parse(restoreData.trim());
      await cryptoIdentity.importIdentity(exportedData);
      
      toast.success("Restore Successful", {
        description: "Identity restored successfully!"
      });
      onRestoreComplete();
    } catch (error) {
      console.error("Restore error:", error);
      toast.error("Restore Error", {
        description: "Failed to restore identity. Please check the data format."
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const jsonData = JSON.parse(content);
        setRestoreData(jsonData.data || JSON.stringify(jsonData));
      } catch (error) {
        toast.error("Invalid File", {
          description: "The selected file is not a valid backup file"
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-zinc-800/50 border border-zinc-700 rounded-xl">
      <h2 className="text-2xl font-bold text-amber-400 text-center mb-6">
        Restore Your Identity
      </h2>
      
      <Tabs defaultValue="paste" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="paste">Paste Data</TabsTrigger>
          <TabsTrigger value="file">Upload File</TabsTrigger>
          <TabsTrigger value="qr">QR Code</TabsTrigger>
        </TabsList>
        
        <TabsContent value="paste" className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="backup-data" className="text-amber-400">
              Backup Data
            </Label>
            <textarea
              id="backup-data"
              placeholder="Paste your backup data here..."
              value={restoreData}
              onChange={(e) => setRestoreData(e.target.value)}
              className="w-full h-32 p-3 bg-zinc-900 border border-zinc-700 rounded-md text-white resize-none"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="file" className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-amber-400">Upload Backup File</Label>
            <div className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-amber-400 hover:text-amber-300">
                  Choose backup file
                </span>
                <p className="text-gray-400 text-sm mt-1">
                  Select your .json backup file
                </p>
              </label>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="qr" className="mt-6 space-y-4">
          <div className="text-center py-8">
            <QrCode className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-400">
              QR code scanning will be available soon
            </p>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex gap-3 mt-6">
        <Button
          onClick={handleRestore}
          disabled={!restoreData.trim() || isRestoring}
          className="flex-1 bg-amber-600 hover:bg-amber-700"
        >
          {isRestoring ? "Restoring..." : "Restore Identity"}
        </Button>
        <Button
          onClick={onCancel}
          variant="ghost"
          className="flex-1 text-gray-400 hover:text-gray-300"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default IdentityRestore;
