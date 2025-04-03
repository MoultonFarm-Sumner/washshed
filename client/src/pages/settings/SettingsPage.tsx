import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail } from "lucide-react";

export default function SettingsPage() {
  const { toast } = useToast();

  // Email notification settings
  const [notifyOnRetailNotes, setNotifyOnRetailNotes] = useState(true);
  const [notificationEmail, setNotificationEmail] = useState("");
  const [isTestingSendgrid, setIsTestingSendgrid] = useState(false);

  // Mutation for saving email settings
  const { mutate: saveEmailSettings, isPending: isSavingSettings } = useMutation({
    mutationFn: (data: { email: string; notifyOnRetailNotes: boolean }) => {
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
      saveEmailSettings({
        email: notificationEmail,
        notifyOnRetailNotes: notifyOnRetailNotes,
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
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSaveSettings} disabled={isSavingSettings}>
                <Mail className="mr-2 h-4 w-4" />
                Save Notification Settings
              </Button>
            </CardFooter>
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