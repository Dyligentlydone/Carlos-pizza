'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Inbox, MessageSquare, PhoneCall, Plus } from 'lucide-react'

export default function CommunicationsPage() {
  const mockChannels = [
    {
      label: 'SMS Inbox',
      description: 'Live text conversations with customers',
      badge: 'Active',
      icon: MessageSquare,
    },
    {
      label: 'Broadcasts',
      description: 'Send promos or updates to your contact list',
      badge: 'Draft',
      icon: Inbox,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">Communications</h1>
        <p className="text-muted-foreground">
          Centralize phone calls, SMS, and announcements in one place.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {mockChannels.map((channel) => {
          const Icon = channel.icon
          return (
            <Card key={channel.label} className="shadow-sm hover:shadow-md transition">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted p-2">
                    <Icon className="w-5 h-5" />
                  </div>
                  <CardTitle>{channel.label}</CardTitle>
                </div>
                <Badge>{channel.badge}</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{channel.description}</p>
                <Button variant="outline" className="w-full justify-between">
                  Manage
                  <Plus className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
