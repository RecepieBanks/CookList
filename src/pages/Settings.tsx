import { 
  Page, 
  PageHeader, 
  PageTitle, 
  PageBody, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Button,
  Avatar,
  AvatarFallback,
  toast
} from '@blinkdotnew/ui'
import { User, Shield, Bell, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function SettingsPage() {
  const { user, logout } = useAuth()

  return (
    <Page>
      <PageHeader>
        <PageTitle>Settings</PageTitle>
      </PageHeader>
      <PageBody>
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-lg">{user?.displayName || 'User'}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => toast.info('Profile editing coming soon!')}>
                Edit Profile
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Manage your account security and password.</p>
              <Button variant="outline" size="sm" onClick={() => toast.info('Password reset coming soon!')}>
                Change Password
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Control how you receive alerts and updates.</p>
              <Button variant="outline" size="sm" onClick={() => toast.info('Notification settings coming soon!')}>
                Manage Notifications
              </Button>
            </CardContent>
          </Card>

          <div className="pt-4">
            <Button variant="destructive" className="w-full" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </PageBody>
    </Page>
  )
}
