import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getInitials, getRoleLabel, formatDate } from '@/lib/utils'
import { Building2, User, CreditCard, Shield } from 'lucide-react'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, firms(*, subscriptions(*))')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  const firm = (profile as any).firms
  const subscription = firm?.subscriptions

  const PLAN_FEATURES: Record<string, { label: string; color: string; features: string[] }> = {
    starter: {
      label: 'Starter',
      color: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      features: ['Up to 3 team members', 'Up to 100 clients', 'Basic support'],
    },
    professional: {
      label: 'Professional',
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      features: ['Up to 15 team members', 'Unlimited clients', 'Priority support', 'Advanced analytics'],
    },
    enterprise: {
      label: 'Enterprise',
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      features: ['Unlimited team members', 'Unlimited clients', 'Dedicated support', 'Custom integrations'],
    },
  }

  const currentPlan = PLAN_FEATURES[subscription?.plan ?? 'starter']

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account and firm settings</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile"><User className="mr-1.5 h-3.5 w-3.5" />Profile</TabsTrigger>
          <TabsTrigger value="firm"><Building2 className="mr-1.5 h-3.5 w-3.5" />Firm</TabsTrigger>
          <TabsTrigger value="subscription"><CreditCard className="mr-1.5 h-3.5 w-3.5" />Subscription</TabsTrigger>
          <TabsTrigger value="security"><Shield className="mr-1.5 h-3.5 w-3.5" />Security</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6">
          <div className="rounded-xl border bg-card p-6 space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback className="text-lg bg-primary/10 text-primary">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{profile.full_name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <Badge variant="outline" className="mt-1 text-[10px]">{getRoleLabel(profile.role)}</Badge>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name_setting">Full Name</Label>
                <Input id="full_name_setting" defaultValue={profile.full_name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone_setting">Phone</Label>
                <Input id="phone_setting" defaultValue={profile.phone ?? ''} placeholder="+1 555 000 0000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title_setting">Job Title</Label>
                <Input id="title_setting" defaultValue={profile.title ?? ''} placeholder="Senior Attorney" />
              </div>
            </div>
            <Button id="save-profile-btn">Save Profile</Button>
          </div>
        </TabsContent>

        {/* Firm Tab */}
        <TabsContent value="firm" className="mt-6">
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <h3 className="font-semibold">Firm Profile</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firm_name">Firm Name</Label>
                <Input id="firm_name" defaultValue={firm?.name ?? ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firm_email">Firm Email</Label>
                <Input id="firm_email" type="email" defaultValue={firm?.email ?? ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firm_phone">Phone</Label>
                <Input id="firm_phone" defaultValue={firm?.phone ?? ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firm_website">Website</Label>
                <Input id="firm_website" defaultValue={firm?.website ?? ''} placeholder="https://" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="firm_address">Address</Label>
                <Input id="firm_address" defaultValue={firm?.address ?? ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firm_city">City</Label>
                <Input id="firm_city" defaultValue={firm?.city ?? ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firm_tax_id">Tax ID</Label>
                <Input id="firm_tax_id" defaultValue={firm?.tax_id ?? ''} />
              </div>
            </div>
            <Button id="save-firm-btn">Save Firm Details</Button>
          </div>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="mt-6">
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Current Plan</h3>
              <Badge variant="outline" className={currentPlan.color}>{currentPlan.label}</Badge>
            </div>
            <div className="space-y-2">
              {currentPlan.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-green-400">✓</span>
                  {f}
                </div>
              ))}
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">Upgrade to unlock more features</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {Object.entries(PLAN_FEATURES).map(([key, plan]) => (
                  <div
                    key={key}
                    className={`rounded-xl border p-4 ${subscription?.plan === key ? 'border-primary bg-primary/5' : 'border-border'}`}
                  >
                    <Badge variant="outline" className={`${plan.color} text-[10px] mb-2`}>{plan.label}</Badge>
                    <div className="space-y-1">
                      {plan.features.slice(0, 2).map((f) => (
                        <p key={f} className="text-[10px] text-muted-foreground">{f}</p>
                      ))}
                    </div>
                    {subscription?.plan !== key && (
                      <Button size="sm" variant="outline" className="w-full mt-3 text-xs">
                        Upgrade
                      </Button>
                    )}
                    {subscription?.plan === key && (
                      <p className="text-[10px] text-primary font-medium mt-3">Current plan</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-6">
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <h3 className="font-semibold">Change Password</h3>
            <div className="space-y-3 max-w-sm">
              <div className="space-y-2">
                <Label htmlFor="current_password">Current Password</Label>
                <Input id="current_password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_password">New Password</Label>
                <Input id="new_password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm New Password</Label>
                <Input id="confirm_password" type="password" />
              </div>
              <Button id="change-password-btn">Update Password</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
