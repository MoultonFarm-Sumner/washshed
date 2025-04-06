import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Mail, Server, Lock } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import ChangePasswordForm from "@/pages/settings/ChangePasswordForm";

// Email settings interface
interface EmailSettings {
  notificationEmail: string;
  notifyOnRetailNotes: boolean;
  smtpServer: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  smtpFromEmail: string;
  useSmtp: boolean;
}

export default function SettingsPage() {
  const { toast } = useToast();

  // Email notification settings
  const [notifyOnRetailNotes, setNotifyOnRetailNotes] = useState(true);
  const [notificationEmail, setNotificationEmail] = useState("");
  const [isTestingSendgrid, setIsTestingSendgrid] = useState(false);
  
  // SMTP settings
  const [useSmtp, setUseSmtp] = useState(false);
  const [smtpServer, setSmtpServer] = useState("");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUsername, setSmtpUsername] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpFromEmail, setSmtpFromEmail] = useState("");

  // Fetch existing settings
  const { data: settings } = useQuery<EmailSettings>({
    queryKey: ['/api/settings/email']
  });

  // Update form state when settings are loaded
  useEffect(() => {
    if (settings) {
      setNotificationEmail(settings.notificationEmail || "");
      setNotifyOnRetailNotes(settings.notifyOnRetailNotes);
      setUseSmtp(settings.useSmtp);
      setSmtpServer(settings.smtpServer || "");
      setSmtpPort(settings.smtpPort || 587);
      setSmtpUsername(settings.smtpUsername || "");
      setSmtpPassword(settings.smtpPassword || "");
      setSmtpFromEmail(settings.smtpFromEmail || "");
    }
  }, [settings]);

  // Mutation for saving email settings
  const { mutate: saveEmailSettings, isPending: isSavingSettings } = useMutation({
    mutationFn: (data: Partial<EmailSettings>) => {
      return apiRequest("POST", "/api/settings/email", data);
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Your notification settings have been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  // Mutation for testing the email
  const { mutate: testEmail, isPending: isTestingEmail } = useMutation({
    mutationFn: (email: string) => {
      return apiRequest("POST", "/api/settings/test-email", { email });
    },
    onSuccess: () => {
      toast({
        title: "Test Email Sent",
        description: "A test email has been sent to your address.",
      });
      setIsTestingSendgrid(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send test email. Please check your SendGrid configuration.",
        variant: "destructive",
      });
      setIsTestingSendgrid(false);
    },
  });

  const handleTestEmail = () => {
    if (notificationEmail && /\S+@\S+\.\S+/.test(notificationEmail)) {
      setIsTestingSendgrid(true);
      testEmail(notificationEmail);
    } else {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
    }
  };

  const handleSaveSettings = () => {
    if (notificationEmail && /\S+@\S+\.\S+/.test(notificationEmail)) {
      // Validate SMTP settings if SMTP is enabled
      if (useSmtp) {
        if (!smtpServer || !smtpFromEmail || !smtpUsername) {
          toast({
            title: "Missing SMTP Settings",
            description: "Please fill in all required SMTP fields.",
            variant: "destructive",
          });
          return;
        }
        
        if (!/\S+@\S+\.\S+/.test(smtpFromEmail)) {
          toast({
            title: "Invalid SMTP From Email",
            description: "Please enter a valid email address for the SMTP From field.",
            variant: "destructive",
          });
          return;
        }
      }
      
      // Save all email settings including SMTP
      saveEmailSettings({
        email: notificationEmail, // Use 'email' to match server-side validation schema
        notifyOnRetailNotes,
        useSmtp,
        smtpServer,
        smtpPort,
        smtpUsername,
        smtpPassword,
        smtpFromEmail
      });
    } else {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-medium text-gray-800 mb-6">Settings</h2>
      
      <Tabs defaultValue="email" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="email">Email Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="general">General Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Configure when and where to receive email notifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notification Preferences</h3>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="retail-notes"
                    checked={notifyOnRetailNotes}
                    onCheckedChange={setNotifyOnRetailNotes}
                  />
                  <Label htmlFor="retail-notes">Notify me when retail notes are added or updated</Label>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Email Address</h3>
                <div className="space-y-2">
                  <Label htmlFor="email">Notification Email</Label>
                  <div className="flex gap-2">
                    <Input
                      id="email"
                      placeholder="your@email.com"
                      type="email"
                      value={notificationEmail}
                      onChange={(e) => setNotificationEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      variant="outline" 
                      onClick={handleTestEmail}
                      disabled={isTestingEmail || isTestingSendgrid || !notificationEmail}
                    >
                      {isTestingEmail ? "Sending..." : "Test Email"}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    This email will receive notifications based on your preferences.
                  </p>
                </div>
              </div>

              <Separator className="my-4" />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Email Server (SMTP) Settings</h3>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="use-smtp"
                      checked={useSmtp}
                      onCheckedChange={setUseSmtp}
                    />
                    <Label htmlFor="use-smtp">Use SMTP Server</Label>
                  </div>
                </div>
                
                {useSmtp && (
                  <div className="space-y-4 p-4 border border-gray-200 rounded-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="smtp-server">SMTP Server</Label>
                        <Input
                          id="smtp-server"
                          placeholder="smtp.example.com"
                          value={smtpServer}
                          onChange={(e) => setSmtpServer(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="smtp-port">SMTP Port</Label>
                        <Input
                          id="smtp-port"
                          type="number"
                          placeholder="587"
                          value={smtpPort}
                          onChange={(e) => setSmtpPort(parseInt(e.target.value) || 587)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="smtp-username">Username</Label>
                        <Input
                          id="smtp-username"
                          placeholder="username"
                          value={smtpUsername}
                          onChange={(e) => setSmtpUsername(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="smtp-password">Password</Label>
                        <Input
                          id="smtp-password"
                          type="password"
                          placeholder="••••••••"
                          value={smtpPassword}
                          onChange={(e) => setSmtpPassword(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="smtp-from">From Email Address</Label>
                        <Input
                          id="smtp-from"
                          type="email"
                          placeholder="farm@example.com"
                          value={smtpFromEmail}
                          onChange={(e) => setSmtpFromEmail(e.target.value)}
                        />
                        <p className="text-sm text-gray-500">
                          This address will appear as the sender of all notifications.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {!useSmtp && (
                  <p className="text-sm text-gray-500 italic">
                    If you enable SMTP, you can use your own email server to send notifications instead of our default service.
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSaveSettings} disabled={isSavingSettings}>
                <Mail className="mr-2 h-4 w-4" />
                Save Email Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your site password and authentication settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Site Password</h3>
                <p className="text-sm text-gray-500">
                  Change the password used to access the farm management system. 
                  The current password protection will remain active for 30 days on this device.
                </p>
                
                <ChangePasswordForm />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure general application settings.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Additional settings will be added here in future updates.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}