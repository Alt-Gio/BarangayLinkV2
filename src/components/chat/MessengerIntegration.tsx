"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { 
  Facebook, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Settings,
  Bell,
  BellOff,
  Loader2,
  AlertCircle
} from "lucide-react";

interface MessengerIntegrationProps {
  className?: string;
}

export function MessengerIntegration({ className = "" }: MessengerIntegrationProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const facebookConnection = useQuery(api.facebook.getFacebookConnection);
  const disconnectFacebook = useMutation(api.facebook.disconnectFacebook);
  const updateSettings = useMutation(api.facebook.updateMessengerSettings);

  const handleConnectFacebook = () => {
    setIsConnecting(true);
    setError(null);
    
    // Facebook OAuth flow
    const fbAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    const redirectUri = `${window.location.origin}/api/auth/facebook/callback`;
    
    const scope = "pages_messaging,pages_manage_metadata,pages_read_engagement";
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${fbAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;
    
    // Open Facebook OAuth in popup
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    const popup = window.open(
      authUrl,
      "Facebook Login",
      `width=${width},height=${height},left=${left},top=${top}`
    );
    
    // Listen for OAuth callback
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === "FACEBOOK_AUTH_SUCCESS") {
        setIsConnecting(false);
        window.removeEventListener("message", handleMessage);
        popup?.close();
      } else if (event.data.type === "FACEBOOK_AUTH_ERROR") {
        setError(event.data.error || "Failed to connect Facebook");
        setIsConnecting(false);
        window.removeEventListener("message", handleMessage);
        popup?.close();
      }
    };
    
    window.addEventListener("message", handleMessage);
    
    // Fallback if popup is blocked
    setTimeout(() => {
      if (popup === null) {
        setError("Popup blocked. Please allow popups for this site.");
        setIsConnecting(false);
      }
    }, 1000);
  };

  const handleDisconnect = async () => {
    try {
      await disconnectFacebook();
    } catch (err) {
      setError("Failed to disconnect Facebook");
    }
  };

  const handleToggleMessenger = async (enabled: boolean) => {
    try {
      await updateSettings({
        messengerEnabled: enabled,
        notificationsEnabled: facebookConnection?.notificationsEnabled ?? true,
      });
    } catch (err) {
      setError("Failed to update settings");
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    try {
      await updateSettings({
        messengerEnabled: facebookConnection?.messengerEnabled ?? true,
        notificationsEnabled: enabled,
      });
    } catch (err) {
      setError("Failed to update settings");
    }
  };

  const getSyncStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "text-green-400 bg-green-900/20 border-green-500";
      case "error":
        return "text-red-400 bg-red-900/20 border-red-500";
      case "disconnected":
        return "text-gray-400 bg-gray-900/20 border-gray-500";
      default:
        return "text-gray-400 bg-gray-900/20 border-gray-500";
    }
  };

  const getSyncStatusIcon = (status?: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="w-4 h-4" />;
      case "error":
        return <XCircle className="w-4 h-4" />;
      default:
        return <RefreshCw className="w-4 h-4" />;
    }
  };

  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <Facebook className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Facebook Messenger</h3>
            <p className="text-sm text-gray-400">Connect your Facebook account</p>
          </div>
        </div>
        
        {facebookConnection && (
          <Badge variant="outline" className={getSyncStatusColor(facebookConnection.syncStatus)}>
            {getSyncStatusIcon(facebookConnection.syncStatus)}
            <span className="ml-1 capitalize">{facebookConnection.syncStatus}</span>
          </Badge>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {!facebookConnection || !facebookConnection.isActive ? (
        <div className="space-y-4">
          <p className="text-gray-300">
            Connect your Facebook account to sync messages between your internal chat and Facebook Messenger.
          </p>
          <Button
            onClick={handleConnectFacebook}
            disabled={isConnecting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Facebook className="w-4 h-4 mr-2" />
                Connect Facebook
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Connection Info */}
          <div className="flex items-center space-x-4 p-4 bg-gray-700/50 rounded-lg">
            <Avatar className="w-12 h-12">
              <AvatarImage src={facebookConnection.facebookProfilePic} />
              <AvatarFallback className="bg-blue-600 text-white">
                {facebookConnection.facebookName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-white font-medium">{facebookConnection.facebookName}</p>
              <p className="text-sm text-gray-400">
                Connected {new Date(facebookConnection.connectedAt).toLocaleDateString()}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisconnect}
              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
            >
              Disconnect
            </Button>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <Settings className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-white font-medium">Messenger Sync</p>
                  <p className="text-sm text-gray-400">
                    Sync messages between internal chat and Messenger
                  </p>
                </div>
              </div>
              <Switch
                checked={facebookConnection.messengerEnabled}
                onCheckedChange={handleToggleMessenger}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
              <div className="flex items-center space-x-3">
                {facebookConnection.notificationsEnabled ? (
                  <Bell className="w-5 h-5 text-gray-400" />
                ) : (
                  <BellOff className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <p className="text-white font-medium">Messenger Notifications</p>
                  <p className="text-sm text-gray-400">
                    Receive notifications for Messenger messages
                  </p>
                </div>
              </div>
              <Switch
                checked={facebookConnection.notificationsEnabled}
                onCheckedChange={handleToggleNotifications}
              />
            </div>
          </div>

          {/* Sync Status */}
          {facebookConnection.lastSyncedAt && (
            <div className="p-4 bg-gray-700/30 rounded-lg">
              <p className="text-sm text-gray-400">
                Last synced: {new Date(facebookConnection.lastSyncedAt).toLocaleString()}
              </p>
              {facebookConnection.lastError && (
                <p className="text-sm text-red-400 mt-2">
                  Error: {facebookConnection.lastError}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
